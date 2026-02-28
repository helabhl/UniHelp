"""
CRUD Documents — upload PDF, ajout manuel, update, delete.
"""

import os
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Query
from bson import ObjectId

from database import get_db
from models import (
    DocumentCreate, DocumentUpdate, DocumentOut, DocumentSummary, StatsResponse
)
from utils.pdf import extract_text_from_pdf, get_pdf_metadata
from utils.rag import chunk_text, count_chunks
from routes.auth import verify_token

router = APIRouter()

MAX_PDF_SIZE = int(os.getenv("MAX_PDF_SIZE_MB", "20")) * 1024 * 1024  # bytes


def serialize_doc(doc: dict) -> dict:
    """Convertit ObjectId en str pour la sérialisation JSON."""
    doc["_id"] = str(doc["_id"])
    return doc


# ── Upload PDF ─────────────────────────────────────────────────────────────────
@router.post("/upload-pdf", summary="Importer un PDF")
async def upload_pdf(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    tags: Optional[str] = Form(""),          # CSV : "tag1,tag2"
    _: dict = Depends(verify_token),
):
    """
    Upload un PDF, extrait le texte et l'indexe dans MongoDB.
    """
    # Validation
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Seuls les fichiers PDF sont acceptés.")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_PDF_SIZE:
        raise HTTPException(413, f"Fichier trop volumineux (max {MAX_PDF_SIZE // (1024*1024)} MB).")

    # Extraction
    try:
        text, page_count = extract_text_from_pdf(file_bytes)
        meta = get_pdf_metadata(file_bytes)
    except (ValueError, ImportError) as e:
        raise HTTPException(422, str(e))

    doc_name = (name or file.filename.replace(".pdf", "")).strip()
    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []

    doc = {
        "name":        doc_name,
        "type":        "pdf",
        "content":     text,
        "char_count":  len(text),
        "chunk_count": count_chunks(text),
        "tags":        tag_list,
        "active":      True,
        "meta": {
            "original_filename": file.filename,
            "pages":  page_count,
            "size_kb": meta.get("size_kb", 0),
            "author": meta.get("author", ""),
        },
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    db = get_db()
    result = await db.documents.insert_one(doc)
    doc["_id"] = str(result.inserted_id)

    return {
        "message": f"PDF indexé avec succès ({page_count} pages, {len(text):,} caractères)",
        "document": serialize_doc(doc),
    }


# ── Ajouter document manuel ────────────────────────────────────────────────────
@router.post("/", summary="Ajouter un document manuellement")
async def create_document(
    body: DocumentCreate,
    _: dict = Depends(verify_token),
):
    doc = {
        **body.model_dump(),
        "char_count":  len(body.content),
        "chunk_count": count_chunks(body.content),
        "meta":        {},
        "created_at":  datetime.utcnow(),
        "updated_at":  datetime.utcnow(),
    }
    db = get_db()
    result = await db.documents.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return {"message": "Document ajouté avec succès.", "document": serialize_doc(doc)}


# ── Liste documents ────────────────────────────────────────────────────────────
@router.get("/", summary="Lister tous les documents")
async def list_documents(
    type: Optional[str] = Query(None),
    active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    db = get_db()
    query: dict = {}

    if type:
        query["type"] = type
    if active is not None:
        query["active"] = active
    if search:
        query["$text"] = {"$search": search}

    cursor = db.documents.find(
        query,
        {"content": 0}  # exclut le contenu pour alléger la liste
    ).sort("created_at", -1).skip(skip).limit(limit)

    docs = []
    async for d in cursor:
        d["_id"] = str(d["_id"])
        docs.append(d)

    total = await db.documents.count_documents(query)
    return {"total": total, "documents": docs}


# ── Obtenir un document ────────────────────────────────────────────────────────
@router.get("/{doc_id}", summary="Obtenir un document complet")
async def get_document(doc_id: str, _: dict = Depends(verify_token)):
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(400, "ID invalide.")
    db = get_db()
    doc = await db.documents.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        raise HTTPException(404, "Document introuvable.")
    return serialize_doc(doc)


# ── Mettre à jour ──────────────────────────────────────────────────────────────
@router.patch("/{doc_id}", summary="Modifier un document")
async def update_document(
    doc_id: str,
    body: DocumentUpdate,
    _: dict = Depends(verify_token),
):
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(400, "ID invalide.")

    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(400, "Aucune mise à jour fournie.")

    if "content" in updates:
        updates["char_count"]  = len(updates["content"])
        updates["chunk_count"] = count_chunks(updates["content"])

    updates["updated_at"] = datetime.utcnow()

    db = get_db()
    result = await db.documents.update_one(
        {"_id": ObjectId(doc_id)},
        {"$set": updates}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Document introuvable.")

    updated = await db.documents.find_one({"_id": ObjectId(doc_id)})
    return {"message": "Document mis à jour.", "document": serialize_doc(updated)}


# ── Activer / Désactiver ───────────────────────────────────────────────────────
@router.patch("/{doc_id}/toggle", summary="Activer/Désactiver un document")
async def toggle_document(doc_id: str, _: dict = Depends(verify_token)):
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(400, "ID invalide.")
    db = get_db()
    doc = await db.documents.find_one({"_id": ObjectId(doc_id)}, {"active": 1})
    if not doc:
        raise HTTPException(404, "Document introuvable.")
    new_state = not doc.get("active", True)
    await db.documents.update_one(
        {"_id": ObjectId(doc_id)},
        {"$set": {"active": new_state, "updated_at": datetime.utcnow()}}
    )
    return {"message": f"Document {'activé' if new_state else 'désactivé'}.", "active": new_state}


# ── Supprimer ──────────────────────────────────────────────────────────────────
@router.delete("/{doc_id}", summary="Supprimer un document")
async def delete_document(doc_id: str, _: dict = Depends(verify_token)):
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(400, "ID invalide.")
    db = get_db()
    result = await db.documents.delete_one({"_id": ObjectId(doc_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, "Document introuvable.")
    return {"message": "Document supprimé définitivement."}


# ── Statistiques ───────────────────────────────────────────────────────────────
@router.get("/meta/stats", summary="Statistiques de la base documentaire")
async def get_stats(_: dict = Depends(verify_token)):
    db = get_db()

    pipeline = [
        {"$group": {
            "_id": "$type",
            "count": {"$sum": 1},
            "total_chars": {"$sum": "$char_count"},
            "total_chunks": {"$sum": "$chunk_count"},
        }}
    ]
    agg = await db.documents.aggregate(pipeline).to_list(None)

    total_docs   = sum(r["count"] for r in agg)
    total_chars  = sum(r["total_chars"] for r in agg)
    total_chunks = sum(r["total_chunks"] for r in agg)
    by_type      = {r["_id"]: r["count"] for r in agg}

    active_count = await db.documents.count_documents({"active": True})
    chat_count   = await db.conversations.count_documents({})
    email_count  = await db.email_logs.count_documents({})

    return StatsResponse(
        total_documents=total_docs,
        active_documents=active_count,
        total_chars=total_chars,
        total_chunks=total_chunks,
        by_type=by_type,
        total_chats=chat_count,
        total_emails=email_count,
    )
