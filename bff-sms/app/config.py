from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    redis_url: str = "redis://localhost:6379/0"
    session_cookie_name: str = "session_id"
    sms_api_url: str = ""
    sms_api_user: str = ""
    sms_api_password: str = ""
    sms_sender: str = ""

    class Config:
        env_file = (".env", "../.env")


settings = Settings()
