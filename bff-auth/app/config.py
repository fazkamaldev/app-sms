from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "mysql+pymysql://root:root@localhost:3306/auth_db"
    redis_url: str = "redis://localhost:6379/0"
    session_cookie_name: str = "session_id"
    session_ttl_seconds: int = 3600
    cookie_secure: bool = False

    class Config:
        env_file = ".env"


settings = Settings()
