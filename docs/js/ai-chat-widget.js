/**
 * ESN Cyprus AI Documentation Assistant - Web Widget
 * Lightweight, streaming chat widget for Zensical / Material for MkDocs.
 */

/**
 * Executes a function when the DOM is fully loaded and parsed.
 * @param {function} fn - The function to execute.
 */
function docReady(fn) {
  "use strict";
  if (document.readyState === "complete") {
    fn();
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
}

docReady(() => {
  "use strict";

  const config = initialise();
  renderElements(config.maxCharacters);

  const buttonElement = document.getElementById("chatButton");
  const windowElement = document.getElementById("chatWindow");

  const messageContainer = windowElement.querySelector("#ai-chat-msg-container");
  const textarea = windowElement.querySelector(".ai-chat-textarea");
  const sendButton = windowElement.querySelector(".ai-chat-send-btn");
  const charCountElement = windowElement.querySelector(".ai-chat-char-count");
  const closeButton = windowElement.querySelector(".btn-close");
  const resetButton = windowElement.querySelector(".btn-reset");

  function saveChatState() {
    sessionStorage.setItem("stateAI", JSON.stringify({
      chatHistory: messageContainer.innerHTML,
      isOpen: windowElement.classList.contains("open")
    }));
  }

  let isGenerating = false;

  try {
    const state = JSON.parse(sessionStorage.getItem("stateAI") ?? "{}");
    if (state.chatHistory) {
      messageContainer.innerHTML = state.chatHistory;
    }
    if (state.isOpen) {
      toggleChat(true);
    }
  } catch {}

  function toggleChat(forceOpen) {
    const isOpen =
        forceOpen !== undefined ? forceOpen : !windowElement.classList.contains("open");
    windowElement.classList.toggle("open", isOpen);
    buttonElement.classList.toggle("open", isOpen);

    if (isOpen) {
      setTimeout(() => textarea.focus(), 150);
    }
    saveChatState();
  }

  buttonElement.addEventListener("click", () => toggleChat());
  closeButton.addEventListener("click", () => {
    toggleChat(false);
    try {
      sessionStorage.setItem("esn_chat_open", "0");
    } catch {}
  });

  resetButton.addEventListener("click", () => {
    messageContainer.innerHTML = `
        <div class="ai-chat-msg assistant">
          <p><strong>👋 Welcome!</strong> Conversation cleared. How can I help you navigate the official ESN Cyprus regulations today?</p>
        </div>
      `;
    textarea.value = "";
    updateInputState();
    try {
      const state = JSON.parse(sessionStorage.getItem("stateAI") ?? "{}");
      state.chatHistory = undefined;

      sessionStorage.setItem("stateAI", JSON.stringify(state));
    } catch {}
  });

  function updateInputState() {
    const len = textarea.value.length;
    charCountElement.textContent = `${len}/${config.maxCharacters}`;
    charCountElement.classList.toggle("warning", len >= config.maxCharacters - 50);
    sendButton.disabled = len < 3 || len > config.maxCharacters || isGenerating;

    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 90) + "px";
  }

  textarea.addEventListener("input", updateInputState);

  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const text = textarea.value.trim();
      if (text && !sendButton.disabled) {
        sendQuestion(text).then();
      }
    }
  });

  sendButton.addEventListener("click", () => {
    const text = textarea.value.trim();
    if (text && !sendButton.disabled) {
      sendQuestion(text).then();
    }
  });

  async function sendQuestion(text) {
    if (isGenerating) return;
    isGenerating = true;

    // Append User Message
    const userBubble = document.createElement("div");
    userBubble.className = "ai-chat-msg user";
    userBubble.textContent = text;
    messageContainer.appendChild(userBubble);

    // Clear input
    textarea.value = "";
    updateInputState();
    messageContainer.scrollTop = messageContainer.scrollHeight;

    // Create Assistant Message with live cursor
    const botBubble = document.createElement("div");
    botBubble.className = "ai-chat-msg assistant";
    botBubble.innerHTML = `<span class="ai-chat-cursor"></span>`;
    messageContainer.appendChild(botBubble);
    messageContainer.scrollTop = messageContainer.scrollHeight;

    let fullResponse = "";

    try {
      const response = await fetch(config.apiURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;

          const jsonStr = trimmed.replace(/^data:\s*/, "");
          if (jsonStr === "[DONE]") continue;

          try {
            const data = JSON.parse(jsonStr);
            const chunkText =
                data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

            if (chunkText) {
              fullResponse += chunkText;
              botBubble.innerHTML =
                  renderMarkdown(fullResponse) +
                  `<span class="ai-chat-cursor"></span>`;
              messageContainer.scrollTop = messageContainer.scrollHeight;
            }
          } catch {
          }
        }
      }

      botBubble.innerHTML = renderMarkdown(fullResponse);
    } catch (err) {
      botBubble.innerHTML = `
          <p style="color: var(--esn-magenta);">
            <strong>Error:</strong> ${err.message || "Failed to reach AI Assistant."}
          </p>
        `;
    } finally {
      isGenerating = false;
      updateInputState();
      messageContainer.scrollTop = messageContainer.scrollHeight;
      saveChatState();
    }
  }
});

function initialise() {
  if (sessionStorage.getItem("configAI")) {
    return JSON.parse(sessionStorage.getItem("configAI"));
  }

  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

  const apiURL = isLocal
      ? "http://localhost:8787/api/chat"
      : "https://documents.esncy.org/api/chat";

  const maxCharacters = 500;

  const config = {
    apiURL: apiURL,
    maxCharacters: maxCharacters
  };

  sessionStorage.setItem("configAI", JSON.stringify(config));

  return config;
}

function renderElements(maxCharacters) {
  const chatButton = document.createElement("button");
  chatButton.className = "ai-chat-fab";
  chatButton.id = "chatButton";
  chatButton.setAttribute("aria-label", "Ask ESN Cyprus AI Assistant");
  chatButton.innerHTML = `
      <svg class="icon-chat" viewBox="0 0 24 24">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        <circle cx="8" cy="10" r="1.5"/>
        <circle cx="12" cy="10" r="1.5"/>
        <circle cx="16" cy="10" r="1.5"/>
      </svg>
      <svg class="icon-close" viewBox="0 0 24 24">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    `;

  const chatWindow = document.createElement("div");
  chatWindow.className = "ai-chat-window";
  chatWindow.id = "chatWindow";
  chatWindow.innerHTML = `
      <div class="ai-chat-header">
        <div class="ai-chat-header-info">
          <div class="ai-chat-header-icon">
            <svg viewBox="0 0 24 24">
              <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.38-1 1.72V7h2a5 5 0 0 1 5 5v1h1a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-1v1a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-1H3a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h1v-1a5 5 0 0 1 5-5h2V5.72A2 2 0 0 1 12 2zm5 7H7a3 3 0 0 0-3 3v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a3 3 0 0 0-3-3zm-9 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm8 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/>
            </svg>
          </div>
          <div>
            <div class="ai-chat-header-title">ESN Cyprus Documents AI</div>
          </div>
        </div>
        <div class="ai-chat-header-actions">
          <button class="ai-chat-header-btn btn-reset" title="Clear conversation" aria-label="Clear conversation">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </button>
          <button class="ai-chat-header-btn btn-close" title="Close" aria-label="Close">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="ai-chat-messages" id="ai-chat-msg-container">
        <div class="ai-chat-msg assistant">
          <p><strong>👋 Welcome!</strong> How can I help you navigate the official ESN Cyprus documents today?</p>
          <p style="margin-top: 6px; font-size: 13px; color: var(--esn-widget-text-muted);">
            Ask any question about our Statutes, Standing Orders, Code of Conduct, or Policy Papers.
          </p>
        </div>
      </div>

      <div class="ai-chat-footer">
        <div class="ai-chat-input-row">
          <textarea
            class="ai-chat-textarea"
            placeholder="Ask about statutes, policies, deadlines..."
            rows="1"
            maxlength="${maxCharacters}"
          ></textarea>
          <button class="ai-chat-send-btn" disabled aria-label="Send question">
            <svg viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
        <div class="ai-chat-footer-meta">
          <span class="ai-chat-disclaimer">Answers cite official documents</span>
          <span class="ai-chat-char-count">0/${maxCharacters}</span>
        </div>
      </div>
    `;

  document.body.appendChild(chatButton);
  document.body.appendChild(chatWindow);
}

function renderMarkdown(rawText) {
  if (!rawText) return "";

  // 1. Escape HTML
  let text = rawText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  // 2. Bold & Italic
  text = text.replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>");
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // 3. Inline code
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");

  // 4. Headers (###, ##)
  text = text.replace(/^### (.*$)/gim, "<h4>$1</h4>");
  text = text.replace(/^## (.*$)/gim, "<h3>$1</h3>");

  // 5. Horizontal rules
  text = text.replace(/^---$/gim, "<hr>");

  // 6. Icon shortcodes clean-up & format (e.g. :lucide-circle-arrow-right: -> ➜)
  text = text.replace(/:lucide-(circle-)?arrow-(right|forward):/gi, "➜ ");
  text = text.replace(/:[a-z0-9_-]+:/gi, "");

  // 7. Links: [text](url) -> <a> (handles full URLs, relative paths, .md files, and #anchors)
  text = text.replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      (match, rawLabel, rawUrl) => {
        const label = rawLabel.replace(/:[a-z0-9_-]+:/gi, "").trim();

        // Check if external link (external domain)
        const isExternalHttp = rawUrl.startsWith("http://") || rawUrl.startsWith("https://");
        if (isExternalHttp && !rawUrl.includes("documents.esncy.org") && !rawUrl.includes("localhost") && !rawUrl.includes("127.0.0.1")) {
          return `<a href="${rawUrl}" target="_blank" rel="noopener noreferrer">${label}</a>`;
        }

        // Normalise internal link: strip domain, strip .md, format /path/#anchor
        let urlWithoutDomain = rawUrl.replace(/^https?:\/\/(documents\.esncy\.org|localhost(:\d+)?|127\.0\.0\.1(:\d+)?)/, "");
        const [pathPart, ...hashParts] = urlWithoutDomain.split("#");
        const hash = hashParts.length ? "#" + hashParts.join("#") : "";

        let cleanPath = pathPart.replace(/\.md$/, "").replace(/\/+$/, "");
        if (!cleanPath.startsWith("/")) {
          cleanPath = "/" + cleanPath;
        }
        if (!cleanPath.endsWith("/")) {
          cleanPath += "/";
        }

        const internalHref = cleanPath + hash;
        return `<a href="${internalHref}" class="ai-internal-link">${label}</a>`;
      }
  );

  // 7. Unordered Lists (* or -)
  const lines = text.split("\n");
  let inList = false;
  let formattedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const listMatch = line.match(/^[\*\-]\s+(.*)/);

    if (listMatch) {
      if (!inList) {
        formattedLines.push("<ul>");
        inList = true;
      }
      formattedLines.push(`<li>${listMatch[1]}</li>`);
    } else {
      if (inList) {
        formattedLines.push("</ul>");
        inList = false;
      }
      formattedLines.push(line);
    }
  }
  if (inList) formattedLines.push("</ul>");

  text = formattedLines.join("\n");

  // 8. Paragraphs / Linebreaks
  text = text
      .split(/\n\n+/)
      .map((para) => {
        if (
            para.startsWith("<ul") ||
            para.startsWith("<h3") ||
            para.startsWith("<h4") ||
            para.startsWith("<hr")
        ) {
          return para;
        }
        return `<p>${para.replace(/\n/g, "<br>")}</p>`;
      })
      .join("");

  return text;
}