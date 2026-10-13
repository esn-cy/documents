---
icon: lucide/bot
title: AI Assistant
description: Instead of reading through dozens of documents, you can use our official AI skill.
---

# ESN Cyprus AI Assistant (`esncy-docs-assistant`)

To help board members, board supporters, and volunteers navigate our legal framework, ESN Cyprus provides an official AI
skill: **`esncy-docs-assistant`**.

Unlike a regular chatbot that might guess or reference outdated information, this skill gives your AI assistant direct,
real-time access to our approved regulations.

---

## ✨ What the Skill Does

* 📖 **Always Up to Date:** Directly references the latest regulations compiled automatically from our master branch.

* 🚫 **Zero Guesswork / Hallucinations:** Strict instructions prevent the AI from inventing rules. If a policy is not
  documented, it will tell you.

* 🔗 **Clickable Citations:** Every answer cites the exact statutory chapter, article, and section link on
  `documents.esncy.org`.

---

## 📥 How to Install the Skill

The skill is built using the open **Agent Skill specification** (`SKILL.md`), making it compatible with any AI
assistant. Pick the setup you use:

### Option A: Web Chatbots (ChatGPT, Claude.ai, Microsoft Copilot, Gemini)

*No terminal or coding needed - perfect for everyday volunteers.*

1. Open our skill instructions: [**View SKILL.md**](https://documents.esncy.org/skills/SKILL.md).
2. Select all the text on the page and **Copy** it.
3. In your chatbot:

    * **ChatGPT:** Go to **Explore GPTs** ➔ **Create a GPT** ➔ Paste the text into the **Instructions** tab.
    * **Claude.ai:** Go to **Projects** ➔ **New Project** ➔ Paste the text into **Project Instructions**.
    * **Gemini:** Go to **Settings** ➔ **Skills** ➔ **Create Manually** ➔ Paste the text into **Instructions**
    * **General Custom Instructions:** Paste the text into your account's "Custom Instructions" / "System Prompt" field.

4. Name it **"ESN Cyprus Policy Assistant"** and start chatting!

---

### Option B: Terminal & AI Coding Agents (Claude Code, Antigravity, OpenAgents)

*Run one command to install the skill permanently on your machine.*

#### 1. Claude Code / Claude Desktop:

```bash
mkdir -p ~/.claude/skills/esncy-docs-assistant && curl -sSL https://documents.esncy.org/skills/SKILL.md -o ~/.claude/skills/esncy-docs-assistant/SKILL.md
```

#### 2. Antigravity / Gemini CLI:

```bash
mkdir -p ~/.gemini/config/skills/esncy-docs-assistant && curl -sSL https://documents.esncy.org/skills/SKILL.md -o ~/.gemini/config/skills/esncy-docs-assistant/SKILL.md
```

#### 3. Open Agent Specification:

```bash
mkdir -p ~/.agents/skills/esncy-docs-assistant && curl -sSL https://documents.esncy.org/skills/SKILL.md -o ~/.agents/skills/esncy-docs-assistant/SKILL.md
```

### Option C: Project Workspace / IDE (Cursor, Windsurf, VS Code)

*Best for sharing with everyone working on an ESN project repository.*

1. In the root of your project repository, run:

    ```bash
    mkdir -p .agents/skills/esncy-docs-assistant && curl -sSL https://raw.githubusercontent.com/esn-cy/documents/master/skills/SKILL.md -o .agents/skills/esncy-docs-assistant/SKILL.md
    ```

    *(For Cursor, you can also save it as .cursor/rules/esncy-docs.md).*

2. Commit the file to your repository so every team member's assistant automatically inherits it.

That's it! Your AI assistant now permanently knows how to look up ESN Cyprus policies.

## 💬 How to Use It

Once installed, you don't need to learn any special commands. Simply ask questions as you normally would:

* **Elections & Voting:** "What majority is required to approve an amendment to the Standing Orders?"
* **Deadlines:** "How many days before the National Assembly must sections submit candidacies for the National Board?"
* **Responsibilities**: "What are the defined responsibilities of the Communication Manager versus the Webmaster?"
* **Finances**: "What are the reimbursement procedures for weekly events?"

## ⚠️ Verification Notice

While the assistant is strictly instructed to cite only official documents, official statutory interpretation remains
the prerogative of the National Assembly and the National Board of ESN Cyprus. Always refer to the provided article
links for official legal matters.