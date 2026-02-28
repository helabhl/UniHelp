"""
Authentification admin — JWT simple.
"""

import os
import jwt
import hashlib
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

from models import LoginRequest, LoginResponse

load_dotenv()

router = APIRouter()
security = HTTPBearer()

SECRET_KEY    = os.getenv("JWT_SECRET", "uniassist-secret-key-change-me")
ADMIN_PASS    = os.getenv("ADMIN_PASSWORD", "admin@iit2025")
TOKEN_EXPIRY  = int(os.getenv("TOKEN_EXPIRY_HOURS", "24"))
ALGORITHM     = "HS256"


def hash_password(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()


def create_token(role: str = "admin") -> str:
    payload = {
        "role": role,
        "exp":  datetime.utcnow() + timedelta(hours=TOKEN_EXPIRY),
        "iat":  datetime.utcnow(),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Dépendance FastAPI — vérifie le token JWT."""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré. Reconnectez-vous.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide.")


# ── Routes ─────────────────────────────────────────────────────────────────────
@router.post("/login", response_model=LoginResponse, summary="Connexion admin")
async def login(body: LoginRequest):
    if body.password != ADMIN_PASS:
        raise HTTPException(status_code=401, detail="Mot de passe incorrect.")
    token = create_token("admin")
    return LoginResponse(token=token, role="admin", message="Connexion réussie !")


@router.get("/me", summary="Vérifier le token")
async def me(payload: dict = Depends(verify_token)):
    return {"role": payload.get("role"), "valid": True}
