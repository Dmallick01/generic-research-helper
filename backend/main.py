"""
Research Helper — FastAPI Backend
RAG pipeline over research documents using ChromaDB + Claude API
"""

import os
import re
import json
from pathlib import Path
from typing import Optional

import chromadb
import anthropic
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Research Helper RAG API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Clients ──────────────────────────────────────────────────────────────────

anthropic_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(
    name="research_documents",
    metadata={"hnsw:space": "cosine"},
)

# ── Models ───────────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    question: str
    n_results: int = 6
    mode: str = "synthesis"  # synthesis | gaps | connections | mechanisms

class IngestResponse(BaseModel):
    paper_id: str
    chunks_added: int
    sections_found: list[str]

# ── Chunking ─────────────────────────────────────────────────────────────────

SECTION_HEADERS = [
    "ABSTRACT", "INTRODUCTION", "MECHANISMS", "METHODS", "RESULTS",
    "DISCUSSION", "CONCLUSION", "GAPS", "SPM TRIAD", "CLINICAL CORRELATES",
    "PROPOSED MECHANISM", "MATHEMATICAL FRAMEWORK", "SYNTHESIS",
    "UNIFIED MECHANISTIC MODEL", "PROPOSED CLINICAL PROTOCOL",
    "CRITICAL EXPERIMENTAL GAPS", "CROSS-SERIES CONNECTIONS",
    "ACETAMINOPHEN MECHANISMS", "SPM DEPLETION HYPOTHESIS",
    "LOGARITHMIC AMPLIFICATION", "OMEGA-3 LOADING", "ASPIRIN CO-TREATMENT",
    "DESCENDING INHIBITION", "CONNECTION TO SIMPLEX",
]

def extract_paper_id(filename: str) -> str:
    """Extract 'simplex1' from 'simplex1.txt'"""
    return Path(filename).stem.lower()

def extract_title(text: str) -> str:
    for line in text.splitlines():
        if line.startswith("TITLE:"):
            return line.replace("TITLE:", "").strip()
    return "Untitled"

def chunk_by_section(text: str, paper_id: str, filename: str) -> list[dict]:
    """
    Split paper into semantic chunks by section header.
    Each chunk carries metadata: paper_id, section, title, paper_number.
    """
    title = extract_title(text)
    paper_number = re.search(r'simplex(\d)', paper_id)
    paper_num = int(paper_number.group(1)) if paper_number else 0

    # Build section split pattern from known headers
    header_pattern = r'\n(' + '|'.join(re.escape(h) for h in SECTION_HEADERS) + r')[:\s]'
    parts = re.split(header_pattern, text, flags=re.IGNORECASE)

    chunks = []
    # parts = [pre_text, header1, content1, header2, content2, ...]
    # First element is everything before first header (title block)
    if parts[0].strip():
        chunks.append({
            "text": parts[0].strip(),
            "section": "TITLE_BLOCK",
            "paper_id": paper_id,
            "paper_number": paper_num,
            "title": title,
            "filename": filename,
        })

    i = 1
    while i < len(parts) - 1:
        section_name = parts[i].strip().upper()
        content = parts[i + 1].strip() if i + 1 < len(parts) else ""
        if content:
            # Further split long sections into ~500 word sub-chunks
            words = content.split()
            if len(words) > 500:
                sub_chunks = []
                for j in range(0, len(words), 400):
                    sub_chunks.append(" ".join(words[j:j+400]))
                for k, sub in enumerate(sub_chunks):
                    chunks.append({
                        "text": f"[{section_name}]\n{sub}",
                        "section": section_name,
                        "paper_id": paper_id,
                        "paper_number": paper_num,
                        "title": title,
                        "filename": filename,
                        "sub_chunk": k,
                    })
            else:
                chunks.append({
                    "text": f"[{section_name}]\n{content}",
                    "section": section_name,
                    "paper_id": paper_id,
                    "paper_number": paper_num,
                    "title": title,
                    "filename": filename,
                })
        i += 2

    return chunks

def embed_text(text: str) -> list[float]:
    """
    Use Claude's embedding endpoint.
    NOTE: Anthropic doesn't yet expose a public embeddings API,
    so we use ChromaDB's default embedding function (sentence-transformers).
    This works locally without any API key.
    """
    # ChromaDB handles embedding automatically when we don't pass embeddings
    return None

# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "Research Helper RAG API running", "papers_in_db": collection.count()}


@app.get("/status")
def status():
    count = collection.count()
    papers = set()
    if count > 0:
        results = collection.get(include=["metadatas"])
        for meta in results["metadatas"]:
            papers.add(meta.get("paper_id", "unknown"))
    return {
        "total_chunks": count,
        "papers_indexed": sorted(list(papers)),
        "ready": count > 0,
    }


@app.post("/ingest/file")
async def ingest_file(file: UploadFile = File(...)):
    """Upload a .txt paper file and ingest into ChromaDB."""
    content = await file.read()
    text = content.decode("utf-8")
    paper_id = extract_paper_id(file.filename)

    # Remove existing chunks for this paper (re-ingest)
    try:
        existing = collection.get(where={"paper_id": paper_id})
        if existing["ids"]:
            collection.delete(ids=existing["ids"])
    except Exception:
        pass

    chunks = chunk_by_section(text, paper_id, file.filename)
    if not chunks:
        raise HTTPException(status_code=400, detail="No content could be extracted from file.")

    ids = [f"{paper_id}_chunk_{i}" for i in range(len(chunks))]
    documents = [c["text"] for c in chunks]
    metadatas = [{k: v for k, v in c.items() if k != "text"} for c in chunks]

    collection.add(ids=ids, documents=documents, metadatas=metadatas)

    sections = list({c["section"] for c in chunks})
    return IngestResponse(
        paper_id=paper_id,
        chunks_added=len(chunks),
        sections_found=sections,
    )


@app.post("/ingest/folder")
def ingest_folder(folder_path: str = "./sample_documents"):
    """Ingest all .txt files from a local folder. For CLI use."""
    folder = Path(folder_path)
    if not folder.exists():
        raise HTTPException(status_code=404, detail=f"Folder not found: {folder_path}")

    results = []
    for txt_file in sorted(folder.glob("*.txt")):
        text = txt_file.read_text(encoding="utf-8")
        paper_id = extract_paper_id(txt_file.name)

        try:
            existing = collection.get(where={"paper_id": paper_id})
            if existing["ids"]:
                collection.delete(ids=existing["ids"])
        except Exception:
            pass

        chunks = chunk_by_section(text, paper_id, txt_file.name)
        if not chunks:
            continue

        ids = [f"{paper_id}_chunk_{i}" for i in range(len(chunks))]
        documents = [c["text"] for c in chunks]
        metadatas = [{k: v for k, v in c.items() if k != "text"} for c in chunks]

        collection.add(ids=ids, documents=documents, metadatas=metadatas)
        results.append({"file": txt_file.name, "chunks": len(chunks)})

    return {"ingested": results, "total_chunks": collection.count()}


@app.delete("/papers/{paper_id}")
def delete_paper(paper_id: str):
    """Remove all chunks for a specific paper."""
    existing = collection.get(where={"paper_id": paper_id})
    if not existing["ids"]:
        raise HTTPException(status_code=404, detail=f"No paper found with id: {paper_id}")
    collection.delete(ids=existing["ids"])
    return {"deleted": paper_id, "chunks_removed": len(existing["ids"])}


@app.post("/query")
def query(req: QueryRequest):
    """
    Main RAG query endpoint.
    Retrieves relevant chunks → builds context → calls Claude → returns answer.
    """
    if collection.count() == 0:
        raise HTTPException(status_code=400, detail="No papers indexed yet. Use /ingest/folder first.")

    # Retrieve semantically relevant chunks
    results = collection.query(
        query_texts=[req.question],
        n_results=min(req.n_results, collection.count()),
        include=["documents", "metadatas", "distances"],
    )

    docs = results["documents"][0]
    metas = results["metadatas"][0]
    distances = results["distances"][0]

    # Build context block with source attribution
    context_parts = []
    sources_used = []
    for doc, meta, dist in zip(docs, metas, distances):
        paper_id = meta.get("paper_id", "unknown")
        section = meta.get("section", "unknown")
        title = meta.get("title", "")
        relevance = round((1 - dist) * 100, 1)
        context_parts.append(
            f"--- SOURCE: {paper_id.upper()} | Section: {section} | Relevance: {relevance}% ---\n{doc}"
        )
        sources_used.append({
            "paper_id": paper_id,
            "section": section,
            "title": title,
            "relevance": relevance,
        })

    context = "\n\n".join(context_parts)

    # Mode-specific system instructions
    mode_instructions = {
        "synthesis": "Synthesize findings across all cited documents. Identify convergent themes and build a unified answer. Always note which document each claim comes from.",
        "gaps": "Focus on unanswered questions, limitations, and experimental gaps. Organize gaps by priority and source document.",
        "connections": "Identify and explain connections BETWEEN different documents. How do findings in one source support, extend, or tension with another?",
        "mechanisms": "Extract and explain every mechanism mentioned in the retrieved passages. Format as a structured list with precise terminology.",
    }

    system_prompt = f"""You are Research Helper — a domain-agnostic AI research assistant.

Your task: {mode_instructions.get(req.mode, mode_instructions['synthesis'])}

Rules:
- Always cite which document (e.g., "As established in doc_1...") when making a claim
- Distinguish between what is established in the sources vs. what you are inferring
- Use precise domain terminology appropriate to the research field
- Flag when a question cannot be answered from the available context
- Keep responses structured: use headers for complex multi-part answers"""

    user_prompt = f"""RESEARCH CONTEXT (retrieved from indexed documents):

{context}

---

QUESTION: {req.question}

Answer based on the research context above. Mode: {req.mode.upper()}."""

    message = anthropic_client.messages.create(
        model="claude-opus-4-5",
        max_tokens=2000,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )

    answer = message.content[0].text

    return {
        "answer": answer,
        "sources": sources_used,
        "mode": req.mode,
        "chunks_retrieved": len(docs),
    }


@app.post("/query/stream")
async def query_stream(req: QueryRequest):
    """Streaming version of /query — returns tokens as they're generated."""
    if collection.count() == 0:
        raise HTTPException(status_code=400, detail="No papers indexed yet.")

    results = collection.query(
        query_texts=[req.question],
        n_results=min(req.n_results, collection.count()),
        include=["documents", "metadatas", "distances"],
    )

    docs = results["documents"][0]
    metas = results["metadatas"][0]
    distances = results["distances"][0]

    context_parts = []
    sources = []
    for doc, meta, dist in zip(docs, metas, distances):
        paper_id = meta.get("paper_id", "unknown")
        section = meta.get("section", "unknown")
        context_parts.append(f"--- {paper_id.upper()} | {section} ---\n{doc}")
        sources.append({"paper_id": paper_id, "section": section, "relevance": round((1 - dist) * 100, 1)})

    context = "\n\n".join(context_parts)

    mode_instructions = {
        "synthesis": "Synthesize findings across cited documents with source attribution.",
        "gaps": "Identify and prioritize experimental gaps across documents.",
        "connections": "Explain connections and bridges between indexed documents.",
        "mechanisms": "Extract and explain every mechanism mentioned in the sources.",
    }

    system_prompt = f"""You are Research Helper — a domain-agnostic AI research assistant.

Task: {mode_instructions.get(req.mode, mode_instructions['synthesis'])}
Always cite which document when making claims. Use precise domain terminology."""

    user_prompt = f"""CONTEXT:\n{context}\n\nQUESTION: {req.question}\nMode: {req.mode.upper()}"""

    # Stream sources first as JSON header, then stream tokens
    async def generate():
        # Send sources metadata first
        yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"

        with anthropic_client.messages.stream(
            model="claude-opus-4-5",
            max_tokens=2000,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        ) as stream:
            for text in stream.text_stream:
                yield f"data: {json.dumps({'type': 'token', 'text': text})}\n\n"

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.get("/suggest-questions")
def suggest_questions():
    """Return pre-built cross-paper questions to get users started."""
    return {
        "questions": [
            {"q": "What are the main themes across all indexed documents?", "mode": "synthesis"},
            {"q": "What mechanisms appear most frequently in the corpus?", "mode": "mechanisms"},
            {"q": "What are the highest-priority research gaps?", "mode": "gaps"},
            {"q": "How do findings in different documents connect?", "mode": "connections"},
            {"q": "Which claims lack experimental validation?", "mode": "gaps"},
            {"q": "Summarize the unified framework across documents.", "mode": "synthesis"},
        ]
    }
