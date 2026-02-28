<div align="center">

# 🎓 UniHelp — Assistant IA Administratif
###  ENS Tunis

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=flat&logo=mongodb)](https://mongodb.com)
[![Groq](https://img.shields.io/badge/LLM-Groq%20%7C%20LLaMA3-F55036?style=flat)](https://console.groq.com)


**Assistant IA basé sur RAG qui répond aux questions administratives des étudiants et génère des emails officiels — fondé exclusivement sur les documents de l'ENS Tunis.**

[Démo](#démo) · [Installation](#installation) · [Architecture](#architecture) · [Dataset](#dataset)

</div>
---

## ✨ Fonctionnalités

- 💬 **Chat RAG** — Répond aux questions des étudiants en se basant uniquement sur les documents officiels de l'ENS (règlement intérieur, FAQ, procédures, horaires)
- ✉️ **Générateur d'emails** — Produit des emails administratifs formels et standardisés (attestation, justification d'absence, réclamation de note, convention de stage…)
- 📂 **Gestion de documents** — Upload PDF ou texte, indexation automatique en chunks pour le RAG
- 🛡️ **Anti-hallucination** — Le LLM ne répond jamais en dehors des documents indexés
- 📊 **Dashboard admin** — Statistiques d'utilisation, gestion du corpus documentaire

---

## 🏗️ Architecture

```
uniassist/
├── backend/                  # FastAPI
│   ├── main.py
│   ├── database.py           # Connexion MongoDB
│   ├── models.py             # Modèles Pydantic
│   ├── routes/
│   │   ├── chat.py           # Route RAG /chat
│   │   ├── email.py          # Route génération email /email
│   │   └── documents.py      # CRUD documents
│   └── utils/
│       ├── rag.py            # Chunking + retrieval TF-IDF
│       └── llm.py            # Client Groq (LLaMA 3)
│
├── frontend/                 # React + Vite
│   └── src/
│       ├── pages/
│       │   ├── Chat/
│       │   ├── StudentEmail/
│       │   └── Admin/
│       ├── components/UI/
│       └── api/client.js
│
├── docs/
│   ├── screenshots/          # Images pour le README
│   └── dataset/              # Dataset de simulation
│
├── .env.example
├── .gitignore
└── README.md
```

---

## ⚙️ Installation

### Prérequis
- Python 3.11+
- Node.js 18+
- MongoDB 7.0 (local ou Atlas)
- Clé API Groq gratuite → [console.groq.com](https://console.groq.com)

### 1. Cloner le repo

```bash
git clone https://github.com/helabhl/UniHelp.git
```

### 2. Configuration des variables d'environnement

```bash
cp .env.example .env
```

Remplir `.env` :

```env
# LLM
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
GROQ_MODEL=llama-3.3-70b-versatile
LLM_PROVIDER=groq

# MongoDB
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB=uniassist

# Auth admin
ADMIN_PASSWORD=votre_mot_de_passe_secret
SECRET_KEY=votre_cle_jwt_secrete
```

### 3. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows : venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API disponible sur : `http://localhost:8000`
Documentation Swagger : `http://localhost:8000/docs`

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Interface disponible sur : `http://localhost:5173`

---

## 📡 API — Endpoints principaux

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/chat/ask` | Question RAG étudiant |
| `POST` | `/email/generate` | Génération email administratif |
| `GET` | `/email/types` | Liste des types d'emails |
| `POST` | `/documents/` | Ajouter un document RAG |
| `GET` | `/documents/` | Lister les documents |
| `DELETE` | `/documents/{id}` | Supprimer un document |
| `GET` | `/stats` | Statistiques d'utilisation |

---

## 🗂️ Dataset de simulation

Pour évaluer les performances du système RAG, un dataset de questions/réponses a été généré à partir des documents officiels de l'IIT :

```
docs/dataset/qa_dataset.json

---

## 🛠️ Stack technique

| Composant | Technologie |
|-----------|-------------|
| Frontend | React 18, Vite,  |
| Backend | FastAPI, Python 3.11 |
| Base de données | MongoDB 7.0 |
| LLM | LLaMA 3.3 70B via Groq API (gratuit) |
| RAG | TF-IDF vectorisation, chunking sémantique |

