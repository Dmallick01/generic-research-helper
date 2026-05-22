# Architecture — Generic Research Helper

Framework-only repository: no bundled research hypotheses. Configure your domain in `config/domains.json`.

## System flow

```mermaid
flowchart TB
  subgraph ingest [Ingest]
    CFG[domains.json]
    PUB[PubMed E-Utilities]
    DOC[Local .txt corpus]
  end

  subgraph offline [Offline — no API key]
    SCR[Scraper: query permutations]
    REF[TF-IDF refiner]
    SYN[Statistical synthesis]
  end

  subgraph agents [Agent pipeline — Anthropic optional]
    BASE[BASE scope]
    R1[R1 synthesis]
    REG[REGULATOR gates]
    R2[R2 annotation]
    CRT[CRITIC]
    FIN[FINAL]
  end

  subgraph store [Persistence]
    VAULT[Vault UI + LocalStorage]
    RAG[(ChromaDB RAG API)]
  end

  CFG --> SCR
  CFG --> BASE
  PUB --> SCR
  SCR --> REF
  SCR --> SYN
  DOC --> RAG
  BASE --> R1 --> REG --> R2 --> REG --> CRT --> FIN
  FIN --> VAULT
  SYN --> VAULT
  RAG --> agents
```

## Modules

| Module | Path | Role |
|--------|------|------|
| Vault UI | `vault-ui/` | Tabs: Pipeline, Continue, Scraper, Vault, Settings |
| Domain config | `config/domains.json` | Protocols, regulator gates, default context |
| Scraper engine | `vault-ui/js/search_engine.js` | Builds queries from protocol `q` + suffixes |
| Refiner | `vault-ui/js/refiner.js`, `synth_local.js` | TF-IDF clustering on abstracts |
| Agent prompts | `vault-ui/js/prompts.js` | BASE → FINAL prompt templates |
| RAG API | `backend/main.py` | Optional ChromaDB + Claude over uploaded docs |

## Protocol configuration

Each protocol entry supports:

- `name` — UI label
- `q` — base PubMed search string
- `desc` — injected into agent context
- `queryVariants` (optional) — explicit list of search queries (overrides auto suffix expansion)

## Extension: OpenCLAW Research

[openclaw-research](https://github.com/YOUR_USER/openclaw-research) runs the same DAG against **local Ollama** models and can consume vault exports from this framework.
