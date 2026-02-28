"""
Moteur RAG : chunking + scoring TF-IDF léger.
En production, remplacez par sentence-transformers + index vectoriel MongoDB Atlas.
"""

import re
import math
from typing import List, Tuple
from collections import Counter


# ── Chunking ───────────────────────────────────────────────────────────────────
def chunk_text(text: str, chunk_size: int = 600, overlap: int = 100) -> List[str]:
    """
    Découpe le texte en chunks avec overlap.
    Essaie de couper sur des paragraphes/phrases pour préserver le contexte.
    """
    if not text or len(text) < chunk_size:
        return [text.strip()] if text.strip() else []

    # Normalise les espaces
    text = re.sub(r"\n{3,}", "\n\n", text).strip()

    # Coupe d'abord sur les paragraphes
    paragraphs = re.split(r"\n\n+", text)
    chunks = []
    current = ""

    for para in paragraphs:
        if len(current) + len(para) < chunk_size:
            current += "\n\n" + para if current else para
        else:
            if current:
                chunks.append(current.strip())
                # Overlap : garde les N derniers chars du chunk précédent
                current = current[-overlap:] + "\n\n" + para if overlap else para
            else:
                # Paragraphe trop long → coupe par phrase
                sentences = re.split(r"(?<=[.!?؟])\s+", para)
                for sent in sentences:
                    if len(current) + len(sent) < chunk_size:
                        current += " " + sent if current else sent
                    else:
                        if current:
                            chunks.append(current.strip())
                            current = current[-overlap:] + " " + sent if overlap else sent
                        else:
                            chunks.append(sent.strip())

    if current.strip():
        chunks.append(current.strip())

    return [c for c in chunks if len(c) > 30]


def count_chunks(text: str) -> int:
    return len(chunk_text(text))


# ── Tokenisation simple ────────────────────────────────────────────────────────
STOPWORDS_FR = {
    "le", "la", "les", "de", "du", "des", "un", "une", "et", "en",
    "à", "au", "aux", "est", "sont", "il", "elle", "ils", "elles",
    "je", "tu", "nous", "vous", "que", "qui", "quoi", "dont", "ou",
    "si", "car", "mais", "donc", "or", "ni", "ce", "se", "sa", "son",
    "ses", "mon", "ma", "mes", "ton", "ta", "tes", "sur", "dans",
    "par", "pour", "avec", "sans", "sous", "entre", "vers", "plus",
    "pas", "ne", "non", "très", "tout", "tous", "cette", "cet", "ces",
}


def tokenize(text: str) -> List[str]:
    tokens = re.findall(r"[a-zA-ZÀ-ÿ]{3,}", text.lower())
    return [t for t in tokens if t not in STOPWORDS_FR]


# ── TF-IDF léger ───────────────────────────────────────────────────────────────
def bm25_score(query_tokens: List[str], chunk: str, k1: float = 1.5, b: float = 0.75, avg_len: float = 400) -> float:
    """
    Scoring BM25 simplifié pour le ranking des chunks.
    """
    chunk_tokens = tokenize(chunk)
    chunk_len = len(chunk_tokens)
    tf_counts = Counter(chunk_tokens)
    score = 0.0

    for token in query_tokens:
        tf = tf_counts.get(token, 0)
        if tf == 0:
            continue
        norm_tf = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * chunk_len / max(avg_len, 1)))
        # IDF simplifié (on n'a pas le corpus complet ici)
        idf = math.log(2 + 1)
        score += idf * norm_tf

    return score


# ── Retrieval principal ────────────────────────────────────────────────────────
def retrieve_chunks(
    documents: List[dict],
    query: str,
    top_k: int = 8,
) -> List[dict]:
    """
    Récupère les top_k chunks les plus pertinents depuis la liste de documents.

    Retourne:
        list of { text, source, score, doc_id }
    """
    if not documents or not query.strip():
        return []

    query_tokens = tokenize(query)
    if not query_tokens:
        return []

    all_chunks = []
    chunk_lengths = []

    # Construire tous les chunks
    for doc in documents:
        if not doc.get("active", True):
            continue
        chunks = chunk_text(doc.get("content", ""))
        for c in chunks:
            chunk_lengths.append(len(tokenize(c)))
            all_chunks.append({
                "text": c,
                "source": doc.get("name", "Document"),
                "doc_id": str(doc.get("_id", "")),
            })

    if not all_chunks:
        return []

    avg_len = sum(chunk_lengths) / len(chunk_lengths) if chunk_lengths else 400

    # Score chaque chunk
    scored = []
    for chunk in all_chunks:
        score = bm25_score(query_tokens, chunk["text"], avg_len=avg_len)
        if score > 0:
            scored.append({**chunk, "score": round(score, 4)})

    # Tri par score décroissant
    scored.sort(key=lambda x: x["score"], reverse=True)

    # Déduplique les sources pour diversifier
    seen_sources = {}
    results = []
    for item in scored:
        src = item["source"]
        seen_sources[src] = seen_sources.get(src, 0) + 1
        # Max 3 chunks par source pour la diversité
        if seen_sources[src] <= 3:
            results.append(item)
        if len(results) >= top_k:
            break

    return results


def build_rag_context(chunks: List[dict]) -> str:
    """Formate les chunks récupérés en contexte pour Claude."""
    if not chunks:
        return ""
    parts = []
    for i, c in enumerate(chunks, 1):
        parts.append(f"[Source {i}: {c['source']}]\n{c['text']}")
    return "\n\n" + "─" * 50 + "\n\n".join(parts)
