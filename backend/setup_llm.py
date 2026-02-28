#!/usr/bin/env python3
"""
Script de configuration guidée — UniAssist
Configuration automatique avec Groq uniquement.
"""

import os
import asyncio

BOLD  = "\033[1m"
GREEN = "\033[92m"
GOLD  = "\033[93m"
RED   = "\033[91m"
BLUE  = "\033[94m"
RESET = "\033[0m"


def p(msg, color=RESET):
    print(f"{color}{msg}{RESET}")


def header():
    print()
    p("╔══════════════════════════════════════════════════════════╗", BLUE)
    p("║          UniAssist — Configuration LLM Gratuit           ║", BLUE)
    p("║              ainightchallenge 2026 · ENS                 ║", BLUE)
    p("╚══════════════════════════════════════════════════════════╝", BLUE)
    print()


def write_env(api_key, model):
    env_content = f"""# UniAssist — Configuration générée automatiquement
LLM_PROVIDER=groq

# Groq
GROQ_API_KEY={api_key}
GROQ_MODEL={model}

# MongoDB
MONGO_URI=mongodb://localhost:27017
DB_NAME=uniassist

# Auth
ADMIN_PASSWORD=admin@iit2025
JWT_SECRET=uniassist-secret-{os.urandom(8).hex()}
TOKEN_EXPIRIRY_HOURS=24
MAX_PDF_SIZE_MB=20
"""
    with open(".env", "w") as f:
        f.write(env_content)

    p("\n✅ Fichier .env créé avec succès !", GREEN)


async def test_connection(api_key, model):
    """Test rapide de connexion à Groq."""
    import httpx

    p("\n🧪 Test de connexion à GROQ…", GOLD)

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                json={
                    "model": model,
                    "max_tokens": 10,
                    "messages": [{"role": "user", "content": "Réponds juste: OK"}],
                },
                headers={"Authorization": f"Bearer {api_key}"},
            )

        if r.status_code == 200:
            p("✅ Groq connecté avec succès !", GREEN)
            return True
        else:
            p(f"❌ Erreur Groq : {r.status_code}", RED)
            try:
                p(r.text, RED)
            except:
                pass
            return False

    except Exception as e:
        p(f"❌ Connexion échouée : {e}", RED)
        return False


def setup_groq():
    p("\n📋 Configuration GROQ :", BOLD)
    p("1. Allez sur : https://console.groq.com", BLUE)
    p("2. Créez un compte gratuit")
    p("3. API Keys → Create API Key")
    p("4. Copiez la clé (gsk_...)\n")

    api_key = input("Collez votre clé Groq (gsk_...) : ").strip()

    if not api_key.startswith("gsk_"):
        p("⚠️ Attention : une clé Groq commence normalement par gsk_", GOLD)

    print()
    p("Modèles disponibles :", BOLD)
    p("1. llama-3.1-8b-instant   (rapide, recommandé)")
    p("2. mixtral-8x7b-32768     (meilleur raisonnement)")
    p("3. llama-3.3-70b-versatile (le plus puissant)")

    model_choice = input("Choisir (1-3, défaut=1) : ").strip() or "1"

    models = {
        "1": "llama-3.1-8b-instant",
        "2": "mixtral-8x7b-32768",
        "3": "llama-3.3-70b-versatile",
    }

    model = models.get(model_choice, "llama-3.1-8b-instant")

    write_env(api_key, model)

    return api_key, model


async def main():
    header()

    api_key, model = setup_groq()

    # Test connexion
    ok = await test_connection(api_key, model)

    print()
    p("═" * 60, BLUE)

    if ok:
        p("🎉 Configuration terminée avec succès !", GREEN)
    else:
        p("⚠️ Configuration créée mais test échoué.", GOLD)

    p("\nProchaines étapes :", BOLD)
    p("1. pip install -r requirements.txt")
    p("2. Assurez-vous que MongoDB tourne")
    p("   docker-compose up -d mongodb")
    p("3. Lancer le serveur :")
    p("   uvicorn main:app --reload --port 8000")
    p("4. Ouvrir : http://localhost:8000/docs", BLUE)
    p("═" * 60, BLUE)


if __name__ == "__main__":
    asyncio.run(main())