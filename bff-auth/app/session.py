import json
import secrets

import redis

from app.config import settings

redis_client = redis.from_url(settings.redis_url, decode_responses=True)


def create_session(user_id: int, username: str) -> str:
    session_id = secrets.token_urlsafe(32)
    payload = json.dumps({"user_id": user_id, "username": username})
    redis_client.setex(
        f"session:{session_id}",
        settings.session_ttl_seconds,
        payload,
    )
    return session_id


def get_session(session_id: str) -> dict | None:
    data = redis_client.get(f"session:{session_id}")
    if not data:
        return None
    return json.loads(data)


def delete_session(session_id: str) -> None:
    redis_client.delete(f"session:{session_id}")
