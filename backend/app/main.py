from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import voice, files

def create_app() -> FastAPI:
    app = FastAPI(
        title="Qwen3-TTS Web",
        description="Qwen3-TTS Web Interface",
        version="1.0.0",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(voice.router)
    app.include_router(files.router)
    return app

app = create_app()
