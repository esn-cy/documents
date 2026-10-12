# ESN Cyprus Legal Documents Repository

[![Deployment](https://github.com/esn-cy/documents/actions/workflows/site-deploy.yml/badge.svg)](https://github.com/esn-cy/documents/actions/workflows/site-deploy.yml)
[![Live Site](https://img.shields.io/badge/docs-documents.esncy.org-blue?style=flat&logo=safari)](https://documents.esncy.org/)

A centralised, searchable, and version-controlled repository containing all official legal and regulatory documents of **Erasmus Student Network Cyprus (ESN Cyprus)**.

Published online at **[documents.esncy.org](https://documents.esncy.org/)**.

---

## Overview

The primary objective of this project is to eliminate fragmented document storage and provide a single source of truth for all statutory regulations.

### Key Goals:
- **Centralised Access:** One canonical location for members, local sections, board members, and external stakeholders.
- **Full-Text Search:** Instant querying across all chapters, articles, and clauses via static search indexing.
- **Precise Citation:** Permanent section-level anchors allowing easy cross-referencing in meeting minutes and formal resolutions.
- **Transparent Version Control:** Every statutory change is traceable through Git commits and pull requests.

---

## Document Roadmap

The repository is rolling out in consecutive phases according to regulatory hierarchy:

| Document            | Description                                                                                         | Status       |
|:--------------------|:----------------------------------------------------------------------------------------------------|:-------------|
| **Statutes**        | The core constitutional charter of ESN Cyprus registered under Cypriot law.                         | **Live**     |
| **Code of Conduct** | Ethical standards, volunteer expectations, safety, and disciplinary guidelines.                     | **Upcoming** |
| **Standing Orders** | Procedural rules for National Assemblies, voting rules, and day-to-day governance.                  | **Upcoming** |
| **Policy Papers**   | Operational guidelines and standard procedures governing internal workflows and section operations. | **Upcoming** |

---

## Tech Stack

- **Static Site Engine:** [Zensical](https://github.com/zensical/zensical) (Modern static documentation engine based on Material for MkDocs)
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