import json

import redis
from fastapi import HTTPException, Request

from app.config import settings

redis_client = redis.from_url(settings.redis_url, decode_responses=True)


def require_session(request: Request) -> dict:
    session_id = request.cookies.get(settings.session_cookie_name)
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    data = redis_client.get(f"session:{session_id}")
    if not data:
        raise HTTPException(status_code=401, detail="Session expired")

    return json.loads(data)
