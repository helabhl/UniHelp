"""
UniAssist Backend - FastAPI + MongoDB + RAG

"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import connect_db, close_db
from routes import documents, chat, email, auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="UniAssist API",
    description="Assistant IA pour l'administration universitaire — RAG + Claude",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS (ajustez les origines en production) ──────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(auth.router,      prefix="/api/auth",      tags=["Auth"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(chat.router,      prefix="/api/chat",      tags=["Chat RAG"])
app.include_router(email.router,     prefix="/api/email",     tags=["Email"])


@app.get("/")
async def root():
    return {
        "service": "UniAssist API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
