"""
Route Chat RAG — récupère les chunks pertinents → appelle Claude.
"""

import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException

from database import get_db
from models import ChatRequest, ChatResponse
from utils.rag import retrieve_chunks, build_rag_context
from utils.llm import call_llm, build_rag_system_prompt

router = APIRouter()


@router.post("/", response_model=ChatResponse, summary="Poser une question (RAG)")
async def chat(body: ChatRequest):
    """
    Pipeline RAG complet :
    1. Charge tous les documents actifs depuis MongoDB
    2. Récupère les chunks les plus pertinents (BM25)
    3. Envoie le contexte + historique à Claude
    4. Sauvegarde la conversation
    5. Retourne la réponse + sources
    """
    db = get_db()

    # ── 1. Charger les documents actifs ───────────────────────────────────────
    cursor = db.documents.find({"active": True}, {"_id": 1, "name": 1, "content": 1})
    documents = await cursor.to_list(length=500)

    if not documents:
        return ChatResponse(
            answer=(
                "⚠️ La base documentaire est vide. "
                "L'administrateur doit d'abord importer des documents."
            ),
            session_id=body.session_id or str(uuid.uuid4()),
            sources=[],
            chunks_used=0,
        )

    # ── 2. Retrieval BM25 ─────────────────────────────────────────────────────
    chunks = retrieve_chunks(documents, body.question, top_k=body.top_k)

    if not chunks:
        # Fallback : envoie juste les 3 premiers docs (résumés)
        context = "\n\n".join(
            f"[{d['name']}]\n{d['content'][:600]}…"
            for d in documents[:3]
        )
        sources = [d["name"] for d in documents[:3]]
    else:
        context = build_rag_context(chunks)
        sources = list(dict.fromkeys(c["source"] for c in chunks))  # dédupliqué + ordonné

    # ── 3. Appel Claude ───────────────────────────────────────────────────────
    system = build_rag_system_prompt(context)

    # Historique : max 6 derniers échanges (12 messages)
    history = body.history[-12:] if body.history else []
    messages = [{"role": m.role, "content": m.content} for m in history]
    messages.append({"role": "user", "content": body.question})

    try:
        answer = await call_llm(messages, system, max_tokens=1200)
    except RuntimeError as e:
        raise HTTPException(503, f"Service IA indisponible : {e}")

    # ── 4. Sauvegarder la conversation ────────────────────────────────────────
    session_id = body.session_id or str(uuid.uuid4())
    await db.conversations.insert_one({
        "session_id":  session_id,
        "question":    body.question,
        "answer":      answer,
        "sources":     sources,
        "chunks_used": len(chunks),
        "created_at":  datetime.utcnow(),
    })

    # ── 5. Répondre ───────────────────────────────────────────────────────────
    return ChatResponse(
        answer=answer,
        session_id=session_id,
        sources=sources,
        chunks_used=len(chunks),
    )


@router.get("/history/{session_id}", summary="Historique d'une session")
async def get_history(session_id: str, limit: int = 20):
    db = get_db()
    cursor = db.conversations.find(
        {"session_id": session_id},
        {"_id": 0}
    ).sort("created_at", 1).limit(limit)
    history = await cursor.to_list(length=limit)
    return {"session_id": session_id, "messages": history}
