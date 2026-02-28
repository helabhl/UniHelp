"""
Client LLM multi-fournisseurs — 100% GRATUIT
Priorité : Groq
"""

import os
import asyncio
import httpx
from typing import List
from dotenv import load_dotenv

load_dotenv()

# ── Config ─────────────────────────────────────────────────────────────────────
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq").lower()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL   = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")  # Fix 1 : modèle plus capable
GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions"

MAX_RETRIES  = 3      # Fix 2 : était 2, trop faible pour rate-limit Groq
TIMEOUT      = 90.0


# ══════════════════════════════════════════════════════════════════════════════
#  GROQ
# ══════════════════════════════════════════════════════════════════════════════
async def call_groq(messages: List[dict], system: str, max_tokens: int = 1000) -> str:
    if not GROQ_API_KEY:
        raise RuntimeError(
            "GROQ_API_KEY manquant. Inscrivez-vous sur https://console.groq.com "
            "(gratuit, pas de carte bancaire requise)."
        )

    payload = {
        "model":       GROQ_MODEL,
        "max_tokens":  max_tokens,
        "temperature": 0.1,   # Fix 3 : était 0.3 — trop élevé pour du RAG factuel (risque d'invention)
        "messages": [
            {"role": "system", "content": system},
            *messages,
        ],
    }

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        for attempt in range(MAX_RETRIES):
            try:
                resp = await client.post(
                    GROQ_URL,
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {GROQ_API_KEY}",
                        "Content-Type":  "application/json",
                    },
                )
                resp.raise_for_status()
                return resp.json()["choices"][0]["message"]["content"]

            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429:
                    wait = 2 ** attempt   # Fix 4 : backoff exponentiel (2s, 4s, 8s) au lieu de 2s fixe
                    await asyncio.sleep(wait)
                    continue
                raise RuntimeError(f"Groq API error {e.response.status_code}: {e.response.text}")

            except httpx.TimeoutException:
                # Fix 5 : timeout non géré dans la version originale
                if attempt == MAX_RETRIES - 1:
                    raise RuntimeError("Groq : timeout dépassé après plusieurs tentatives.")
                await asyncio.sleep(1)

            except Exception as e:
                if attempt == MAX_RETRIES - 1:
                    raise RuntimeError(f"Groq échoué : {e}")
                await asyncio.sleep(1)


# ══════════════════════════════════════════════════════════════════════════════
#  DISPATCHER PRINCIPAL
# ══════════════════════════════════════════════════════════════════════════════
async def call_llm(
    messages:   List[dict],
    system:     str,
    max_tokens: int = 1000,
) -> str:
    """Appelle le LLM configuré dans LLM_PROVIDER."""
    dispatch = {
        "groq": call_groq,
    }

    fn = dispatch.get(LLM_PROVIDER)
    if not fn:
        raise RuntimeError(
            f"LLM_PROVIDER '{LLM_PROVIDER}' inconnu. Valeurs valides : groq"
        )

    return await fn(messages, system, max_tokens)


# ── System prompts ─────────────────────────────────────────────────────────────
def build_rag_system_prompt(context: str) -> str:
    # Fix 6 : règles anti-hallucination alignées avec system_prompt_patch
    return f"""Tu es UniAssist, l'assistant IA officiel de l'ENS de Tunis.

RÈGLES ABSOLUES — NE JAMAIS ENFREINDRE :
1. Tu réponds UNIQUEMENT à partir des documents officiels fournis dans le contexte ci-dessous.
2. Si l'information demandée (tarif, date, montant, nom) n'est PAS explicitement écrite dans ces documents, réponds exactement : "Cette information ne figure pas dans les documents officiels de l'ENS. Veuillez contacter le service compétent."
3. Ne complète JAMAIS avec des chiffres, dates ou détails issus de tes propres connaissances.
4. Si deux documents semblent contradictoires, cite les deux sources et signale la divergence sans trancher.
5. Cite toujours la source entre parenthèses, ex : (Source : Règlement Intérieur, Article 6).
6. Mets en **gras** les dates, montants et délais importants.
7. Pour les procédures multi-étapes, utilise des listes numérotées.
8. Langue : français uniquement. Ton : professionnel et bienveillant.

DOCUMENTS OFFICIELS :
{context}"""


def build_email_system_prompt(context: str = "") -> str:
    # Fix 7 : ajout règle d'exclusivité du type d'email (cause de la confusion attestation/rattrapage)
    base = """Tu es un assistant administratif formel de l'ENS de Tunis.
Tu génères des emails administratifs professionnels, formels et standardisés en français.

RÈGLES DE RÉDACTION :
1. Traite EXCLUSIVEMENT le type de demande spécifié — ne mélange JAMAIS deux types de demandes.
2. N'invente aucun formulaire, pièce jointe ou procédure non mentionné dans les instructions.
3. Format imposé :
   - Ligne 1 : "Objet: [objet précis]"
   - Ligne 2 : vide
   - Corps : formule d'appel → présentation courte → demande explicite → pièces jointes (uniquement celles requises pour CE type) → formule de politesse complète
   - Signature : "Prénom NOM | CIN : XXXXXXXX | Niveau : XXXXX | Email : [email étudiant]"
"""
    if context:
        base += f"\nPROCÉDURES OFFICIELLES APPLICABLES :\n{context}"
    return base