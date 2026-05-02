import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting Doctissimo.IA backend...")
    yield


app = FastAPI(title="Doctissimo.IA API", version="0.1.0", lifespan=lifespan)

allowed_origin = os.environ.get("ALLOWED_ORIGIN", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[allowed_origin] if allowed_origin != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "version": "0.1.0"}


@app.get("/api/warm")
async def warm() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/smoke")
async def smoke() -> dict[str, str]:
    """E2E ping: confirms Azure works. Returns one short LLM completion."""
    from app.azure import call_llm

    try:
        text = await call_llm(
            "mini",
            [
                {
                    "role": "user",
                    "content": "Réponds UNIQUEMENT par 'OK Doctissimo' en français.",
                }
            ],
            max_tokens=20,
            temperature=0.0,
        )
        return {"status": "ok", "azure_says": text.strip()}
    except Exception as e:
        return {"status": "error", "detail": str(e)}
