# UniAssist Backend 🎓

**FastAPI + MongoDB + RAG + Claude AI**  
Assistant administratif IA pour l'ENS Tunis — ainightchallenge

---

## 🏗️ Architecture

```
uniassist-backend/
├── main.py                  # Point d'entrée FastAPI
├── database.py              # Connexion MongoDB async (Motor)
├── models.py                # Modèles Pydantic (validation)
├── routes/
│   ├── auth.py              # JWT Login/Logout
│   ├── documents.py         # CRUD + Upload PDF
│   ├── chat.py              # RAG Chat endpoint
│   └── email.py             # Génération d'emails
├── utils/
│   ├── rag.py               # Chunking BM25 + Retrieval
│   ├── pdf.py               # Extraction texte PDF (PyMuPDF)
│   └── claude.py            # Client Anthropic API
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## ⚡ Lancement rapide

### Option A — Docker (recommandé)

```bash
# 1. Cloner et configurer
cp .env.example .env
# → Remplir ANTHROPIC_API_KEY dans .env

# 2. Lancer
docker-compose up -d

# 3. API disponible sur http://localhost:8000
# 4. Swagger UI : http://localhost:8000/docs
```

### Option B — Local

```bash
# Prérequis : Python 3.11+, MongoDB en local

# 1. Environnement virtuel
python -m venv venv
source venv/bin/activate        # Linux/Mac
# venv\Scripts\activate         # Windows

# 2. Dépendances
pip install -r requirements.txt

# 3. Config
cp .env.example .env
# Remplir .env

# 4. Lancer
uvicorn main:app --reload --port 8000
```

---

## 📡 API Endpoints

### 🔐 Auth
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/login` | Connexion admin → token JWT |
| GET  | `/api/auth/me`    | Vérifier le token |

**Login :**
```json
POST /api/auth/login
{ "password": "admin@iit2025" }

→ { "token": "eyJ...", "role": "admin" }
```

---

### 📄 Documents (Admin requis)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET    | `/api/documents/`               | Lister tous les documents |
| POST   | `/api/documents/`               | Ajouter un document manuel |
| POST   | `/api/documents/upload-pdf`     | **Uploader un PDF** |
| GET    | `/api/documents/{id}`           | Obtenir un document complet |
| PATCH  | `/api/documents/{id}`           | Modifier un document |
| PATCH  | `/api/documents/{id}/toggle`    | Activer/Désactiver |
| DELETE | `/api/documents/{id}`           | Supprimer |
| GET    | `/api/documents/meta/stats`     | Statistiques |

**Upload PDF :**
```bash
curl -X POST http://localhost:8000/api/documents/upload-pdf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@reglement.pdf" \
  -F "name=Règlement Intérieur 2024" \
  -F "tags=règlement,absences,inscriptions"
```

**Ajouter une règle manuelle :**
```json
POST /api/documents/
Authorization: Bearer YOUR_TOKEN

{
  "name": "Procédure Attestation",
  "type": "rule",
  "content": "Pour obtenir une attestation...",
  "tags": ["attestation", "certificat"]
}
```

---

### 💬 Chat RAG

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/chat/`                   | Poser une question |
| GET  | `/api/chat/history/{session}` | Historique session |

**Question :**
```json
POST /api/chat/
{
  "question": "Comment obtenir une attestation de scolarité ?",
  "session_id": "sess_abc123",
  "history": [],
  "top_k": 8
}

→ {
  "answer": "Pour obtenir une attestation...",
  "session_id": "sess_abc123",
  "sources": ["Règlement Intérieur 2024", "FAQ Administrative"],
  "chunks_used": 5
}
```

---

### ✉️ Génération d'Emails

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/email/generate` | Générer un email |
| GET  | `/api/email/types`    | Types disponibles |

**Types d'emails disponibles :**
- `attestation` — Demande d'attestation de scolarité
- `bourse` — Demande de bourse CROUS
- `stage` — Convention de stage
- `rattrapage` — Session de rattrapage
- `reclamation` — Réclamation académique
- `absence` — Justification d'absence
- `pfe` — Dépôt rapport PFE
- `inscription` — Réinscription
- `autre` — Demande générale

**Exemple :**
```json
POST /api/email/generate
{
  "email_type": "attestation",
  "nom": "Ben Abdallah",
  "prenom": "Taoufik",
  "cin": "12345678",
  "email_etudiant": "taoufik@iit.ens.tn",
  "niveau": "Licence 3 Génie Informatique",
  "motif": "Pour dossier bourse CROUS"
}

→ {
  "subject": "Demande d'attestation de scolarité — Taoufik Ben Abdallah",
  "body": "Monsieur/Madame,...",
  "email_type": "attestation",
  "label": "Demande d'attestation de scolarité"
}
```

---

## 🧠 Pipeline RAG

```
Question étudiant
       ↓
[MongoDB] Charger docs actifs
       ↓
[BM25 Scoring] Découper en chunks (600 chars, 100 overlap)
               Score chaque chunk vs question
               Retenir top-K chunks
       ↓
[Claude API] system: règles + contexte chunks
             messages: historique + question
       ↓
Réponse avec sources citées
       ↓
[MongoDB] Sauvegarder conversation
```

---

## 🔒 Sécurité

- Token JWT expirant (24h par défaut)
- Validation stricte des entrées (Pydantic)
- Limite taille PDF (20 MB par défaut)
- CORS configurable
- Mot de passe hashé en SHA-256

---

## 📊 Collections MongoDB

| Collection | Description |
|------------|-------------|
| `documents` | Documents indexés (PDFs, règles, FAQs) |
| `conversations` | Historique des chats RAG |
| `email_logs` | Log des emails générés |

---

## 🚀 Pour la démo

1. Démarrer avec `docker-compose up -d`
2. Ouvrir `http://localhost:8000/docs` (Swagger UI interactif)
3. Login admin → récupérer le token
4. Uploader les PDFs officiels ENS
5. Tester le chat RAG
6. Générer des emails

---

*UniAssist — ainightchallenge 2026*
