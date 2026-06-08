import requests
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from requests.auth import HTTPBasicAuth

from app.config import settings
from app.session import require_session

app = FastAPI(title="bff-sms", root_path="")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SendMessageRequest(BaseModel):
    from_staff: str
    mobile_no: str
    message: str


@app.get("/api/app/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/app/send-message")
def send_message(
    body: SendMessageRequest,
    request: Request,
    _session: dict = Depends(require_session),
) -> dict:
    payload = {
        "messages": [
            {
                "to": body.mobile_no,
                "message": body.message,
                "sender": settings.sms_sender,
                "custom_ref": body.from_staff,
            }
        ]
    }

    try:
        response = requests.post(
            settings.sms_api_url,
            json=payload,
            auth=HTTPBasicAuth(settings.sms_api_user, settings.sms_api_password),
            timeout=30,
        )
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"SMS provider unreachable: {exc}") from exc

    if not response.ok:
        raise HTTPException(
            status_code=response.status_code,
            detail=response.text or "SMS provider returned an error",
        )

    return response.json()
