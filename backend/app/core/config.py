import os
from typing import List, Union, Optional
from urllib.parse import quote_plus
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ResumeIQ API"
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"
    frontend_origins: Union[str, List[str]] = "http://localhost:5173,http://127.0.0.1:5173"

    # Supabase PostgreSQL Database Settings
    supabase_db_host: str = "aws-0-ap-south-1.pooler.supabase.com"
    supabase_db_port: int = 5432
    supabase_db_name: str = "postgres"
    supabase_db_user: str = "postgres.ceonvgfwmjiwmlkpqris"
    supabase_db_password: str = ""
    database_url: Optional[str] = None

    # Google Gemini API Settings
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.8-flash"

    # Firebase Authentication Settings
    firebase_project_id: str = "resume-analyser-e4441"
    firebase_credentials_path: Optional[str] = None
    firebase_credentials_json: Optional[str] = None

    # Upload Constraints
    max_upload_size_bytes: int = 5 * 1024 * 1024  # 5 MB

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), "..", "..", ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins(self) -> List[str]:
        if isinstance(self.frontend_origins, str):
            return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]
        return self.frontend_origins

    @property
    def resolved_firebase_credentials_path(self) -> Optional[str]:
        """
        Resolves the Firebase service account JSON path, handling tilde expansion and
        checking default location ~/.config/resumeiq/credentials/resumeiq-firebase-admin.json.
        """
        if self.firebase_credentials_path:
            expanded = os.path.expanduser(self.firebase_credentials_path)
            if os.path.exists(expanded):
                return expanded
        default_candidate = os.path.expanduser("~/.config/resumeiq/credentials/resumeiq-firebase-admin.json")
        if os.path.exists(default_candidate):
            return default_candidate
        return None

    @property
    def db_connection_url(self) -> str:
        """
        Constructs a safe, URL-encoded PostgreSQL connection string for SQLAlchemy using psycopg.
        """
        if self.database_url:
            return self.database_url
        if self.supabase_db_password:
            user = quote_plus(self.supabase_db_user)
            password = quote_plus(self.supabase_db_password)
            return (
                f"postgresql+psycopg://{user}:{password}@"
                f"{self.supabase_db_host}:{self.supabase_db_port}/{self.supabase_db_name}"
            )
        return ""


settings = Settings()
