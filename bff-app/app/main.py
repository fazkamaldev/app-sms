from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Setting
from app.session import require_session

app = FastAPI(title="bff-app", root_path="")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SettingResponse(BaseModel):
    key: str
    value: str


@app.get("/api/app/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/app/settings", response_model=list[SettingResponse])
def list_settings(
    request: Request,
    db: Session = Depends(get_db),
    _session: dict = Depends(require_session),
) -> list[SettingResponse]:
    rows = db.query(Setting).all()
    return [SettingResponse(key=row.key, value=row.value) for row in rows]


@app.get("/api/app/settings/{key}", response_model=SettingResponse)
def get_setting(
    key: str,
    request: Request,
    db: Session = Depends(get_db),
    _session: dict = Depends(require_session),
) -> SettingResponse:
    row = db.query(Setting).filter(Setting.key == key).first()
    if not row:
        raise HTTPException(status_code=404, detail="Setting not found")
    return SettingResponse(key=row.key, value=row.value)
