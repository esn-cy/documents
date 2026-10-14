---
icon: lucide/bot
title: AI Assistant
description: Instead of reading through dozens of documents, you can use our official AI assistant.
hide:
  - footer
---

# ESN Cyprus AI Assistant (`esncy-docs-assistant`)

To help board members, board supporters, and volunteers navigate our legal framework, ESN Cyprus provides an official AI
assistant: **`esncy-docs-assistant`**.

Unlike a regular chatbot that might guess or reference outdated information, this assistant has direct, real-time
access to our approved regulations.

---

## ✨ What the Assistant Does

* 📖 **Always Up to Date:** Directly references the latest regulations compiled automatically from our master branch.

* 🚫 **Zero Guesswork / Hallucinations:** Strict instructions prevent the AI from inventing rules. If a policy is not
  documented, it will tell you.

* 🔗 **Clickable Citations & Deep-Links:** Every answer cites the exact statutory chapter, article, and section link on
  `documents.esncy.org`, navigating directly to the relevant heading.

---

## 📥 How to Access & Use It

Pick the setup that fits your workflow:

### Option A: Built-in Web Assistant (Recommended)

*Zero setup, accounts, or copy-pasting required — available directly on this website.*

1. Click the **floating chat bubble** (💬) in the bottom-right corner of any page on
   **[documents.esncy.org](https://documents.esncy.org/)**.

2. Type your question in natural language.

3. The assistant will answer with structured bullet points and clickable links that jump straight to the relevant
   article while keeping the conversation open beside you.

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

## 💬 Example Questions

Once ready, you don't need to learn any special commands. Simply ask questions as you normally would:

* **Elections & Voting:** "What majority is required to approve an amendment to the Standing Orders?"
* **Deadlines:** "How many days before the National Assembly must sections submit candidacies for the National Board?"
* **Responsibilities**: "What are the defined responsibilities of the Communication Manager versus the Webmaster?"
* **Finances**: "What are the reimbursement procedures for weekly events?"

## ⚠️ Verification Notice

While the assistant is strictly instructed to cite only official documents, official statutory interpretation remains
the prerogative of the National Assembly and the National Board of ESN Cyprus. Always refer to the provided article
links for official legal matters.