"""
Route Génération d'emails administratifs — contextuelle avec RAG.
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException

from database import get_db
from models import EmailRequest, EmailResponse, EMAIL_LABELS, EMAIL_RECIPIENTS
from utils.rag import retrieve_chunks
from utils.llm import call_llm, build_email_system_prompt

router = APIRouter()


@router.post("/generate", response_model=EmailResponse, summary="Générer un email administratif")
async def generate_email(body: EmailRequest):
    """
    Génère un email formel basé sur :
    - Le type de demande
    - Les informations de l'étudiant
    - Les procédures officielles récupérées via RAG
    """
    db = get_db()
    label = EMAIL_LABELS.get(body.email_type, "Demande administrative")

    # ── Destinataire dynamique selon le type d'email ─────────────────────────
    recipient = EMAIL_RECIPIENTS.get(body.email_type, {
        "name":  "Monsieur/Madame le Responsable",
        "email": "administration@iit.ens.tn",
        "title": "Responsable Administratif",
    })

    # ── Récupère les procédures pertinentes ───────────────────────────────────
    cursor = db.documents.find({"active": True}, {"_id": 0, "name": 1, "content": 1})
    documents = await cursor.to_list(length=300)

    search_query = f"{label} procédure délai pièces requises"
    chunks = retrieve_chunks(documents, search_query, top_k=4)
    context = "\n\n".join(c["text"] for c in chunks) if chunks else ""

    # ── Construit le prompt ───────────────────────────────────────────────────
    system = build_email_system_prompt(context)

    motif_info  = f"\n- Motif / contexte : {body.motif}"          if body.motif          else ""
    niveau_info = f"\n- Niveau d'études : {body.niveau}"          if body.niveau         else ""
    cin_info    = f"\n- N° CIN : {body.cin}"                      if body.cin            else ""
    email_info  = f"\n- Email étudiant : {body.email_etudiant}"   if body.email_etudiant else ""

    prompt = f"""Rédige un email administratif formel UNIQUEMENT de type "{label}".

NE MÉLANGE PAS avec d'autres types de demandes (ne parle pas d'attestation si c'est un examen de substitution, etc.).
L'email doit traiter EXCLUSIVEMENT l'objet suivant : {label}.

INFORMATIONS ÉTUDIANT :
- Nom complet : {body.prenom} {body.nom}{cin_info}{niveau_info}{email_info}{motif_info}

DESTINATAIRE (utilise exactement ces informations) :
- Nom : {recipient["name"]}
- Titre : {recipient["title"]}
- Email : {recipient["email"]}

INSTRUCTIONS DE RÉDACTION :
1. Commence par "Objet: ..." (ligne seule)
2. Salutation : "Monsieur/Madame {recipient["name"]}," (ou titre exact si connu)
3. Corps : présentation courte → demande précise → justification si motif → formule de politesse
4. Signature : Prénom Nom | CIN | Niveau | Email
5. Pièces jointes : liste uniquement les documents requis pour CE type de demande selon les procédures officielles

Ne mentionne aucune autre démarche que "{label}"."""

    try:
        raw = await call_llm(
            [{"role": "user", "content": prompt}],
            system,
            max_tokens=900,
        )
    except RuntimeError as e:
        raise HTTPException(503, f"Service IA indisponible : {e}")

    # ── Sépare objet et corps ─────────────────────────────────────────────────
    lines = raw.strip().splitlines()
    subject = ""
    body_lines = []

    for line in lines:
        if (not subject) and (line.lower().startswith("objet:") or line.lower().startswith("objet :")):
            subject = line.split(":", 1)[1].strip()
        else:
            body_lines.append(line)

    email_body = "\n".join(body_lines).strip()
    if not subject:
        subject = f"{label} — {body.prenom} {body.nom}"

    # ── Log ───────────────────────────────────────────────────────────────────
    await db.email_logs.insert_one({
        "email_type":       body.email_type,
        "label":            label,
        "nom":              body.nom,
        "prenom":           body.prenom,
        "niveau":           body.niveau or "",
        "recipient_email":  recipient["email"],
        "subject":          subject,
        "created_at":       datetime.utcnow(),
    })

    return EmailResponse(
        subject=subject,
        body=email_body,
        email_type=body.email_type,
        label=label,
        recipient_email=recipient["email"],
        recipient_name=recipient["name"],
    )


@router.get("/types", summary="Liste des types d'emails disponibles")
async def get_email_types():
    return {
        "types": [
            {"key": k, "label": v, "recipient": EMAIL_RECIPIENTS.get(k, {}).get("title", "")}
            for k, v in EMAIL_LABELS.items()
        ]
    }