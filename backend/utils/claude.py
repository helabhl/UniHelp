"""
Client Anthropic Claude — wrapper async avec retry.
"""

import os
import asyncio
import httpx
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL      = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-20250514")
CLAUDE_API_URL    = "https://api.anthropic.com/v1/messages"

MAX_RETRIES = 3
RETRY_DELAY = 1.5  # secondes


async def call_claude(
    messages: List[dict],
    system: str,
    max_tokens: int = 1000,
    temperature: float = 0.3,
) -> str:
    """
    Appel async à l'API Claude avec retry automatique.

    Args:
        messages: liste de { role, content }
        system:   prompt système
        max_tokens: tokens max en sortie
        temperature: créativité (0 = déterministe)

    Returns:
        Texte de la réponse.

    Raises:
        RuntimeError si tous les retries échouent.
    """
    if not ANTHROPIC_API_KEY:
        raise RuntimeError("ANTHROPIC_API_KEY non configurée dans .env")

    payload = {
        "model":      CLAUDE_MODEL,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "system":     system,
        "messages":   messages,
    }
    headers = {
        "Content-Type":      "application/json",
        "x-api-key":         ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
    }

    last_error = None
    async with httpx.AsyncClient(timeout=60.0) as client:
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                resp = await client.post(CLAUDE_API_URL, json=payload, headers=headers)
                resp.raise_for_status()
                data = resp.json()
                return data["content"][0]["text"]
            except httpx.HTTPStatusError as e:
                last_error = f"HTTP {e.response.status_code}: {e.response.text}"
                if e.response.status_code in (400, 401, 403):
                    break  # erreurs non-retryables
            except Exception as e:
                last_error = str(e)

            if attempt < MAX_RETRIES:
                await asyncio.sleep(RETRY_DELAY * attempt)

    raise RuntimeError(f"Claude API échouée après {MAX_RETRIES} tentatives : {last_error}")


# ── System prompts ─────────────────────────────────────────────────────────────
def build_rag_system_prompt(context: str) -> str:
    return f"""Tu es UniAssist, l'assistant IA officiel de l'ENS de Tunis.

RÈGLES ABSOLUES :
1. Tu réponds UNIQUEMENT à partir des documents officiels fournis dans le contexte.
2. Si la réponse n'est pas dans les documents, dis clairement : "Cette information ne figure pas dans mes documents. Contactez le secrétariat."
3. Cite toujours la source entre parenthèses après chaque information clé, ex: (Source: Règlement intérieur).
4. Sois précis sur les dates, montants et délais — utilise **gras** pour les mettre en évidence.
5. Langue : français uniquement. Ton : professionnel et bienveillant.
6. Pour les procédures, utilise des listes numérotées.

DOCUMENTS OFFICIELS :
{context}"""


def build_email_system_prompt(context: str = "") -> str:
    base = """Tu es un assistant administratif formel de l'ENS de Tunis.
Tu génères des emails administratifs professionnels, formels et standardisés en français.
Format imposé :
- Ligne 1 : "Objet: [objet précis]"
- Ligne 2 : vide
- Corps : formule d'appel → corps → demande explicite → pièces jointes si pertinent → formule de politesse complète → signature
- Signature : "Nom Prénom | CIN: XXXXXXXX | Niveau: XXXXX | Tél: [laisser vide] | Email: [email étudiant]"
"""
    if context:
        base += f"\nPROCÉDURES OFFICIELLES APPLICABLES :\n{context}"
    return base
