export interface Env {
    GEMINI_API_KEY: string;
    MODEL_NAME?: string;
    DOCS_URL?: string;
    MAX_CHARS_PER_PROMPT?: string;
    RATE_LIMIT_PER_MINUTE?: string;
    RATE_LIMIT_PER_HOUR?: string;
}

interface ChatMessage {
    role: "user" | "model";
    content: string;
}

interface ChatRequest {
    message: string;
    history?: ChatMessage[];
    stream?: boolean;
}

const ALLOWED_ORIGINS = [
    "https://documents.esncy.org",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
];

interface RateLimitEntry {
    minuteWindowStart: number;
    minuteCount: number;
    hourWindowStart: number;
    hourCount: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

function isRateLimited(
    ip: string,
    limitPerMinute: number,
    limitPerHour: number
): { limited: boolean; reason?: string } {
    const now = Date.now();
    let entry = rateLimitMap.get(ip);

    if (!entry) {
        entry = {
            minuteWindowStart: now,
            minuteCount: 1,
            hourWindowStart: now,
            hourCount: 1,
        };
        rateLimitMap.set(ip, entry);
        return {limited: false};
    }

    if (now - entry.minuteWindowStart > 60_000) {
        entry.minuteWindowStart = now;
        entry.minuteCount = 1;
    } else {
        entry.minuteCount++;
        if (entry.minuteCount > limitPerMinute) {
            return {
                limited: true,
                reason: `Rate limit exceeded. Maximum ${limitPerMinute} questions per minute. Please wait a moment.`,
            };
        }
    }

    if (now - entry.hourWindowStart > 3_600_000) {
        entry.hourWindowStart = now;
        entry.hourCount = 1;
    } else {
        entry.hourCount++;
        if (entry.hourCount > limitPerHour) {
            return {
                limited: true,
                reason: `Hourly limit reached (${limitPerHour} questions/hour). Please try again later.`,
            };
        }
    }

    if (rateLimitMap.size > 5000) {
        for (const [key, val] of rateLimitMap.entries()) {
            if (now - val.hourWindowStart > 3_600_000) {
                rateLimitMap.delete(key);
            }
        }
    }

    return {limited: false};
}

let cachedDocs: { content: string; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour TTL

async function getDocumentation(docsUrl: string): Promise<string> {
    const now = Date.now();
    if (cachedDocs && now - cachedDocs.fetchedAt < CACHE_TTL_MS) {
        return cachedDocs.content;
    }

    try {
        const res = await fetch(docsUrl, {
            headers: {
                "User-Agent": "ESNCyprusDocsWorker/1.0 (Cloudflare Worker; wpa@esncy.org)",
                Accept: "text/markdown, text/plain, */*",
            },
        });
        if (!res.ok) {
            throw new Error(`Failed to fetch docs: ${res.status} ${res.statusText}`);
        }
        const text = await res.text();
        cachedDocs = {content: text, fetchedAt: now};
        return text;
    } catch (err) {
        if (cachedDocs) {
            return cachedDocs.content;
        }
        throw err;
    }
}

function getCorsHeaders(request: Request): Record<string, string> {
    const origin = request.headers.get("Origin") || "";
    const isAllowed =
        ALLOWED_ORIGINS.includes(origin) ||
        origin.endsWith(".esncy.org") ||
        origin === "";

    const allowedOrigin = isAllowed ? (origin || "*") : "https://documents.esncy.org";

    return {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
    };
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const corsHeaders = getCorsHeaders(request);
        const url = new URL(request.url);

        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: corsHeaders,
            });
        }

        if (request.method === "GET" && (url.pathname === "/health" || url.pathname === "/api/health")) {
            return new Response(
                JSON.stringify({status: "ok", service: "esncy-docs-assistant"}),
                {
                    headers: {...corsHeaders, "Content-Type": "application/json"},
                }
            );
        }

        if (request.method !== "POST" || (url.pathname !== "/api/chat" && url.pathname !== "/chat")) {
            return new Response(JSON.stringify({error: "Not Found"}), {
                status: 404,
                headers: {...corsHeaders, "Content-Type": "application/json"},
            });
        }

        const origin = request.headers.get("Origin");
        if (origin) {
            const isAllowed =
                ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".esncy.org");
            if (!isAllowed) {
                return new Response(
                    JSON.stringify({error: "Forbidden: Unauthorized origin"}),
                    {
                        status: 403,
                        headers: {...corsHeaders, "Content-Type": "application/json"},
                    }
                );
            }
        }

        const clientIp =
            request.headers.get("cf-connecting-ip") ||
            request.headers.get("x-real-ip") ||
            "unknown-client";

        const limitPerMinute = parseInt(env.RATE_LIMIT_PER_MINUTE || "5", 10);
        const limitPerHour = parseInt(env.RATE_LIMIT_PER_HOUR || "30", 10);

        const rateCheck = isRateLimited(clientIp, limitPerMinute, limitPerHour);
        if (rateCheck.limited) {
            return new Response(
                JSON.stringify({error: rateCheck.reason}),
                {
                    status: 429,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                        "Retry-After": "60",
                    },
                }
            );
        }

        if (!env.GEMINI_API_KEY) {
            return new Response(
                JSON.stringify({
                    error: "GEMINI_API_KEY is not configured on the worker.",
                }),
                {
                    status: 500,
                    headers: {...corsHeaders, "Content-Type": "application/json"},
                }
            );
        }

        let body: ChatRequest;
        try {
            body = await request.json();
        } catch {
            return new Response(
                JSON.stringify({error: "Invalid JSON payload"}),
                {
                    status: 400,
                    headers: {...corsHeaders, "Content-Type": "application/json"},
                }
            );
        }

        const message = (body.message || "").trim();
        const maxChars = parseInt(env.MAX_CHARS_PER_PROMPT || "500", 10);

        if (message.length < 3) {
            return new Response(
                JSON.stringify({error: "Question is too short (min 3 characters)."}),
                {
                    status: 400,
                    headers: {...corsHeaders, "Content-Type": "application/json"},
                }
            );
        }

        if (message.length > maxChars) {
            return new Response(
                JSON.stringify({
                    error: `Question exceeds the maximum allowed length of ${maxChars} characters.`,
                }),
                {
                    status: 400,
                    headers: {...corsHeaders, "Content-Type": "application/json"},
                }
            );
        }

        const docsUrl =
            env.DOCS_URL || "https://documents.esncy.org/skills/all_docs.md";
        let docsText = "";
        try {
            docsText = await getDocumentation(docsUrl);
        } catch (err: any) {
            return new Response(
                JSON.stringify({
                    error: "Failed to load official documentation bundle.",
                    details: err.message,
                }),
                {
                    status: 502,
                    headers: {...corsHeaders, "Content-Type": "application/json"},
                }
            );
        }

        const systemPrompt = `
        You are the official ESN Cyprus Documentation Assistant.
        You assist Erasmus Student Network Cyprus (ESN Cyprus) volunteers, board members, and local sections by providing thorough, helpful, and legally accurate guidance based on the compiled official documentation below.
        
        Core Guidelines:
        1. Practical Scenario Application: Volunteers often describe real-world situations. Analyze their situation and apply the relevant official rules, policies, and procedural workflows from the documentation (e.g. Communication Policy, Code of Conduct, Standing Orders, Reimbursements/Finances).
        2. Differentiate Contexts: Clearly distinguish critical boundaries (e.g., publishing on official ESN channels vs. personal social media accounts; informal group chat messages vs. official 24/7 photography preference forms; mandatory deadlines vs. discretionary decisions).
        3. Thorough & Well-Structured Answers: Provide comprehensive, easy-to-follow explanations rather than brief one-liners. Use bold text, clear headings, and bullet points to outline rules, caveats, and practical next steps.
        4. Exact Citations & Clickable Deep-Links:
           - Always cite the exact source document, chapter, article, or section.
           - Base Path: Each document file is marked by a header like "# FILE: path/to/page.md". Map this path to a web URL starting with "https://documents.esncy.org/" and always STRIP the ".md" extension. For example, "# FILE: standing-orders/chapter-6.md" maps to "https://documents.esncy.org/standing-orders/chapter-6/". Never leave ".md" in your links.
           - Deep-Linking to Heading Anchors: The documentation headings contain explicit anchor tags like "## Article 18: Transitional Period {#transitional-period}" or "## 15. Executive Board {#executive-board}". ALWAYS append this anchor tag (e.g. "#transitional-period" or "#executive-board") to your link so the user jumps directly to the relevant section.
             Example: [Article 18 (Transitional Period)](https://documents.esncy.org/standing-orders/chapter-6/#transitional-period).
           - Clean Link Formatting: Do NOT output raw icon shortcodes (such as ":lucide-...:" or ":material-...:"). Write clean, human-readable link titles.
        5. Uncovered Topics: Only state that a procedure is not outlined if the underlying subject is genuinely absent from all ESN Cyprus regulations. If general statutory principles or relevant policies apply to the situation, explain them clearly while highlighting any specific procedural gaps.
        
        ==================================================
        OFFICIAL COMPILED ESN CYPRUS DOCUMENTATION:
        ==================================================
        ${docsText}
        `;

        const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

        if (Array.isArray(body.history)) {
            const sanitizedHistory = body.history.slice(-4);
            for (const item of sanitizedHistory) {
                if (
                    (item.role === "user" || item.role === "model") &&
                    typeof item.content === "string"
                ) {
                    contents.push({
                        role: item.role,
                        parts: [{text: item.content.slice(0, maxChars)}],
                    });
                }
            }
        }

        contents.push({
            role: "user",
            parts: [{text: message}],
        });

        const primaryModel = env.MODEL_NAME || "gemini-3.5-flash-lite";
        const candidateModels = Array.from(
            new Set([
                primaryModel,
                "gemini-3.5-flash-lite",
                "gemini-3.5-flash",
            ])
        );

        const wantsStream = body.stream !== false;

        const geminiPayload = {
            system_instruction: {
                parts: [{text: systemPrompt}],
            },
            contents,
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 1500,
            },
        };

        let lastError: { status: number; text: string } | null = null;

        for (const model of candidateModels) {
            if (wantsStream) {
                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${env.GEMINI_API_KEY}`;

                const geminiResponse = await fetch(geminiUrl, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(geminiPayload),
                });

                if (geminiResponse.ok) {
                    return new Response(geminiResponse.body, {
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "text/event-stream",
                            "Cache-Control": "no-cache",
                            Connection: "keep-alive",
                        },
                    });
                }

                const errorText = await geminiResponse.text();
                lastError = {status: geminiResponse.status, text: errorText};

                if (geminiResponse.status === 503 || geminiResponse.status === 404) {
                    continue;
                }

                break;
            } else {
                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

                const geminiResponse = await fetch(geminiUrl, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(geminiPayload),
                });

                if (geminiResponse.ok) {
                    const geminiData = (await geminiResponse.json()) as any;
                    const text =
                        geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
                        "No response generated.";

                    return new Response(JSON.stringify({text}), {
                        headers: {...corsHeaders, "Content-Type": "application/json"},
                    });
                }

                const errorText = await geminiResponse.text();
                lastError = {status: geminiResponse.status, text: errorText};

                if (geminiResponse.status === 503 || geminiResponse.status === 404) {
                    continue;
                }

                break;
            }
        }

        return new Response(
            JSON.stringify({
                error: "Gemini API error (all candidate models exhausted)",
                status: lastError?.status || 502,
                details: lastError?.text || "Unknown error",
            }),
            {
                status: 502,
                headers: {...corsHeaders, "Content-Type": "application/json"},
            }
        );
    },
};
