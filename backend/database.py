"""
Connexion MongoDB asynchrone via Motor.
"""

import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, TEXT
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME   = os.getenv("DB_NAME", "uniassist")

client: AsyncIOMotorClient = None


def get_db():
    return client[DB_NAME]


async def connect_db():
    global client
    client = AsyncIOMotorClient(MONGO_URI)
    db = get_db()

    # ── Indexes ────────────────────────────────────────────────────────────────
    # Recherche texte fulltext sur les documents
    await db.documents.create_index([("content", TEXT), ("name", TEXT)])
    await db.documents.create_index([("type", ASCENDING)])
    await db.documents.create_index([("created_at", ASCENDING)])

    # Historique des conversations
    await db.conversations.create_index([("session_id", ASCENDING)])
    await db.conversations.create_index([("created_at", ASCENDING)])

    # Logs des emails générés
    await db.email_logs.create_index([("created_at", ASCENDING)])

    print(f"✅ MongoDB connecté : {MONGO_URI} → base '{DB_NAME}'")


async def close_db():
    global client
    if client:
        client.close()
        print("🔌 MongoDB déconnecté.")
