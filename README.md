# Generic Research Helper

A local-first, domain-agnostic research orchestrator — scrape literature, refine evidence, run multi-agent synthesis pipelines, and export to a markdown vault. No cloud lock-in; configure any research field via JSON.

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌────────────┐
│   Scraper   │───▶│   Refiner    │───▶│  Pipeline   │───▶│ Vault UI   │
│  (PubMed)   │    │ (TF-IDF/NLP) │    │ (6 agents)  │    │ (export)   │
└─────────────┘    └──────────────┘    └─────────────┘    └────────────┘
                                              │
                                              ▼
                                    ┌──────────────────┐
                                    │ Optional RAG API │
                                    │ ChromaDB + Claude│
                                    └──────────────────┘
```

## Features

- **Evidence scraper** — parallel PubMed queries with zero API cost
- **Statistical refiner** — TF-IDF clustering and bullet extraction (offline)
- **Agent pipeline** — BASE → R1 → REGULATOR → R2 → CRITIC → FINAL with checkpoint gates
- **Vault export** — LocalStorage + markdown handoff for session resume
- **Optional RAG backend** — semantic search over `.txt` research documents

## Quick start

### Vault UI (no backend)

```bash
open vault-ui/index.html
```

Edit `config/domains.json` (or `vault-ui/config/domains.json`) to define your research protocols.

### RAG backend (optional)

```bash
cp backend/.env.example backend/.env   # add ANTHROPIC_API_KEY
chmod +x run.sh && ./run.sh
```

API docs: http://localhost:8000/docs

## Configure your domain

```json
{
  "defaultContext": "Your research scope and pillars...",
  "protocols": {
    "1": { "name": "Literature Review", "q": "search terms", "desc": "..." }
  }
}
```

## Project structure

```
generic-research-helper/
├── vault-ui/           # Pipeline + scraper + vault (HTML/JS)
├── config/domains.json # Domain configuration
├── backend/            # Optional FastAPI RAG API
├── sample_documents/   # Example .txt corpus
└── run.sh
```

## Tech stack

Python (FastAPI, ChromaDB) · Vanilla JS · LocalStorage · PubMed E-Utilities

## License

MIT
