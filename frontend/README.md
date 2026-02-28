# UniHelp Frontend 🎓

**React 18 + Vite + Framer Motion**  
Interface admin & étudiant pour l'assistant IA de l'ENS Tunis.

---

## ⚡ Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer
cp .env.example .env
# → VITE_API_URL=/api  (laisser par défaut si backend sur localhost:8000)

# 3. Lancer (dev)
npm run dev
# → http://localhost:3000
```

## 🏗️ Build production

```bash
npm run build
# → dossier dist/ à servir avec nginx, vercel, etc.
```

---

## 🗺️ Routes

| Route | Description |
|-------|-------------|
| `/` | Page d'accueil — choix Admin / Étudiant |
| `/admin/login` | Connexion administrateur |
| `/admin/documents` | Liste + gestion CRUD |
| `/admin/upload` | Import PDF drag & drop |
| `/admin/add` | Ajout manuel règle/FAQ/note |
| `/admin/edit/:id` | Modification d'un document |
| `/admin/stats` | Statistiques de la base |
| `/student/chat` | Chat RAG étudiant |
| `/student/email` | Générateur d'emails |

---

## 🔌 Connexion au Backend

Le proxy Vite redirige `/api/*` → `http://localhost:8000/api/*`.  
Assurez-vous que le backend FastAPI tourne sur le port 8000.

---

*ainightchallenge 2026 · ENS Tunis*
