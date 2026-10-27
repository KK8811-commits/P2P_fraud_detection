import os
import bcrypt
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "prod-super-secure-fraud-intelligence-token-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

class Token(BaseModel):
    access_token: str
    token_type: str
    user_name: str
    role: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

# Pre-computed bcrypt hashes for analysts
ANALYST_USERS_DB = {
    "lead_analyst": {
        "username": "lead_analyst",
        "full_name": "Elena Rostova",
        "email": "elena.rostova@bankdefense.ai",
        "hashed_password": hash_password("FraudGuard2026!"),
        "role": "LEAD_INVESTIGATOR"
    },
    "risk_officer": {
        "username": "risk_officer",
        "full_name": "Marcus Chen",
        "email": "marcus.chen@bankdefense.ai",
        "hashed_password": hash_password("RiskShield2026!"),
        "role": "COMPLIANCE_ADMIN"
    }
}

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate investigator credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username, role=role)
    except JWTError:
        raise credentials_exception

    user = ANALYST_USERS_DB.get(token_data.username)
    if user is None:
        raise credentials_exception
    return user
