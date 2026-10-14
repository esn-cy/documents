# ESN Cyprus Legal Documents Repository

[![Deployment](https://github.com/esn-cy/documents/actions/workflows/site-deploy.yml/badge.svg)](https://github.com/esn-cy/documents/actions/workflows/site-deploy.yml)
[![Live Site](https://img.shields.io/badge/docs-documents.esncy.org-blue?style=flat&logo=safari)](https://documents.esncy.org/)

A centralised, searchable, and version-controlled repository containing all official legal and regulatory documents of
**Erasmus Student Network Cyprus (ESN Cyprus)**.

Published online at **[documents.esncy.org](https://documents.esncy.org/)**.

---

## Overview

The primary objective of this project is to eliminate fragmented document storage and provide a single source of truth
for all statutory regulations.

### Key Goals:

* **Centralised Access:** One canonical location for members, local sections, board members, and external stakeholders.

* **Full-Text Search:** Instant querying across all chapters, articles, and clauses via static search indexing.

* **Precise Citation:** Permanent section-level anchors allowing easy cross-referencing in meeting minutes and formal
  resolutions.

* **Transparent Version Control:** Every statutory change is traceable through Git commits and pull requests.

* **AI Agent Integration:** Automated compilation of the entire repository into a single markdown file for live AI
  knowledge retrieval.

---

## AI & LLM API Endpoint

Alongside the static HTML website, the CI/CD pipeline automatically parses `zensical.toml` and compiles the documents in
canonical order into a single, clean Markdown file. This serves as a live, stateless knowledge base for the
**esncy-docs-assistant** AI skill.

* **Endpoint:** `https://documents.esncy.org/skills/all_docs.md`
* **Format:** Raw Markdown (UTF-8)
* **Refresh Rate:** Updates automatically on every merge to `master`.

---

## Document Roadmap

The repository is rolling out in consecutive phases according to regulatory hierarchy:

| Document             | Description                                                                                            | Status   |
|:---------------------|:-------------------------------------------------------------------------------------------------------|:---------|
| **Statutes**         | The core constitutional charter of ESN Cyprus registered under Cypriot law.                            | **Live** |
| **Code of Conduct**  | Behavioural expectations, anti-discrimination standards, reporting procedures, and sanctions.          | **Live** |
| **Standing Orders**  | Operational rules, General Assembly calendar, Board Supporters, OCs, and administrative workflows.     | **Live** |
| **Policy Papers**    | Standard operating procedures for internal workflows (*Finances*, *Human Resources*, *Communication*). | **Live** |
| **Public Documents** | Terms of service, trip conditions, and GDPR privacy policies for participants and passholders.         | **Live** |

---

## Tech Stack

- **Static Site Engine:** [Zensical](https://github.com/zensical/zensical) (Modern static documentation engine based on
  Material for MkDocs)

- **Environment & Packaging:** [uv](https://docs.astral.sh/uv/) / Python 3.11+

- **Hosting & CI/CD:** GitHub Actions deploying to GitHub Pages

---

## Local Development

### Prerequisites

- [uv](https://docs.astral.sh/uv/) installed (recommended) or Python 3.11+

### Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/esn-cy/documents.git
   cd documents