from authlib.integrations.starlette_client import OAuth
from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, engine, get_db
from app.models import User
from app.session import create_session, delete_session, get_session

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth = OAuth()

app = FastAPI(title="bff-auth", root_path="")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    username: str


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def seed_admin_user(db: Session) -> None:
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        db.add(User(username="admin", password_hash=hash_password("admin")))
        db.commit()
    elif not verify_password("admin", admin.password_hash):
        admin.password_hash = hash_password("admin")
        db.commit()


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        seed_admin_user(db)
    finally:
        db.close()


@app.get("/api/auth/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/auth/login")
def login(body: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    session_id = create_session(user.id, user.username)
    response.set_cookie(
        key=settings.session_cookie_name,
        value=session_id,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/",
        max_age=settings.session_ttl_seconds,
    )
    return {"username": user.username, "redirect": "/app/"}


@app.get("/api/auth/me", response_model=UserResponse)
def me(request: Request) -> UserResponse:
    session_id = request.cookies.get(settings.session_cookie_name)
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=401, detail="Session expired")

    return UserResponse(username=session["username"])


@app.post("/api/auth/logout")
def logout(request: Request, response: Response) -> dict:
    session_id = request.cookies.get(settings.session_cookie_name)
    if session_id:
        delete_session(session_id)
    response.delete_cookie(settings.session_cookie_name, path="/")
    return {"ok": True}
