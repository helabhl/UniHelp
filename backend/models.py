"""
Modèles Pydantic pour la validation des données.
"""

from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field
from bson import ObjectId


# ── Helper pour ObjectId ───────────────────────────────────────────────────────
class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        if ObjectId.is_valid(str(v)):
            return str(v)
        raise ValueError(f"Invalid ObjectId: {v}")


# ── Document ───────────────────────────────────────────────────────────────────
class DocumentBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200, description="Titre du document")
    type: Literal["pdf", "rule", "faq", "note"] = Field("rule", description="Type de document")
    content: str = Field(..., min_length=10, description="Contenu textuel complet")
    tags: Optional[List[str]] = Field(default_factory=list)
    active: bool = Field(True, description="Document actif dans la base RAG")


class DocumentCreate(DocumentBase):
    pass


class DocumentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    type: Optional[Literal["pdf", "rule", "faq", "note"]] = None
    content: Optional[str] = Field(None, min_length=10)
    tags: Optional[List[str]] = None
    active: Optional[bool] = None


class DocumentOut(DocumentBase):
    id: str = Field(alias="_id")
    char_count: int
    chunk_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class DocumentSummary(BaseModel):
    id: str = Field(alias="_id")
    name: str
    type: str
    active: bool
    char_count: int
    tags: List[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


# ── Chat / RAG ─────────────────────────────────────────────────────────────────
class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=2000)
    session_id: Optional[str] = None
    history: Optional[List[ChatMessage]] = Field(default_factory=list)
    top_k: int = Field(8, ge=1, le=20, description="Nombre de chunks RAG à récupérer")


class RetrievedChunk(BaseModel):
    text: str
    source: str
    score: float
    doc_id: str


class ChatResponse(BaseModel):
    answer: str
    session_id: str
    sources: List[str]
    chunks_used: int
    model: str = "claude-sonnet-4-20250514"


# ── Email ──────────────────────────────────────────────────────────────────────
EmailType = Literal[
    "attestation_scolarite",
    "attestation_inscription",
    "releve_notes",
    "justification_absence",
    "reclamation_note",
    "examen_substitution",
    "convention_stage",
    "demande_bourse",
    "paiement_echelonne",
    "transfert",
]

EMAIL_LABELS: dict[str, str] = {
    "attestation_scolarite":   "Demande d'attestation de scolarité",
    "attestation_inscription": "Demande d'attestation d'inscription",
    "releve_notes":            "Demande de relevé de notes officiel",
    "justification_absence":   "Justification d'absence",
    "reclamation_note":        "Réclamation sur une note d'examen",
    "examen_substitution":     "Demande d'examen de substitution",
    "convention_stage":        "Demande de convention de stage",
    "demande_bourse":          "Demande de bourse universitaire",
    "paiement_echelonne":      "Demande de paiement échelonné",
    "transfert":               "Demande de transfert",
}

# Destinataire officiel par type — nom, titre et email du service compétent
EMAIL_RECIPIENTS: dict[str, dict[str, str]] = {
    "attestation_scolarite": {
        "name":  "le Responsable du Secrétariat Principal",
        "title": "Responsable du Secrétariat Principal",
        "email": "secretariat@iit.ens.tn",
    },
    "attestation_inscription": {
        "name":  "le Responsable du Secrétariat Principal",
        "title": "Responsable du Secrétariat Principal",
        "email": "secretariat@iit.ens.tn",
    },
    "releve_notes": {
        "name":  "le Responsable du Secrétariat Pédagogique",
        "title": "Responsable du Secrétariat Pédagogique",
        "email": "pedagogique@iit.ens.tn",
    },
    "justification_absence": {
        "name":  "le Responsable du Secrétariat Pédagogique",
        "title": "Responsable du Secrétariat Pédagogique",
        "email": "pedagogique@iit.ens.tn",
    },
    "reclamation_note": {
        "name":  "le Chef de Département",
        "title": "Chef de Département",
        "email": "pedagogique@iit.ens.tn",
    },
    "examen_substitution": {
        "name":  "le Chef de Département",
        "title": "Chef de Département",
        "email": "pedagogique@iit.ens.tn",
    },
    "convention_stage": {
        "name":  "le Responsable du Bureau des Stages",
        "title": "Responsable du Bureau des Stages",
        "email": "stages@iit.ens.tn",
    },
    "demande_bourse": {
        "name":  "le Responsable du Service des Affaires Sociales",
        "title": "Responsable du Service des Affaires Sociales",
        "email": "social@iit.ens.tn",
    },
    "paiement_echelonne": {
        "name":  "le Directeur Administratif et Financier",
        "title": "Directeur Administratif et Financier",
        "email": "caisse@iit.ens.tn",
    },
    "transfert": {
        "name":  "Monsieur le Directeur",
        "title": "Directeur de l'IIT",
        "email": "direction@iit.ens.tn",
    },
}


class EmailRequest(BaseModel):
    email_type: EmailType
    nom: str = Field(..., min_length=2, max_length=60)
    prenom: str = Field(..., min_length=2, max_length=60)
    cin: Optional[str] = Field(None, max_length=20)
    email_etudiant: Optional[str] = None
    niveau: Optional[str] = Field(None, max_length=80)
    motif: Optional[str] = Field(None, max_length=1000)


class EmailResponse(BaseModel):
    subject: str
    body: str
    email_type: str
    label: str
    recipient_email: str = ""
    recipient_name: str = ""


# ── Auth ───────────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    password: str


class LoginResponse(BaseModel):
    token: str
    role: str = "admin"
    message: str = "Connexion réussie"


# ── Stats ──────────────────────────────────────────────────────────────────────
class StatsResponse(BaseModel):
    total_documents: int
    active_documents: int
    total_chars: int
    total_chunks: int
    by_type: dict
    total_chats: int
    total_emails: int