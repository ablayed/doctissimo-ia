# Doctissimo.IA — Codex Agent Instructions

## Project
Pixel-perfect parody of forum.doctissimo.fr 2003-2005. Under the hood:
LangGraph multi-agent system where 30 AI personas reply to a health
symptom in 8s. ONE persona (InfirmièreUrgences42) is grounded on a
medical RAG (Ameli + HAS + MSD via BGE-M3 + Upstash Vector).

Hackathon: DEFENDHACK 1st edition, theme "Site Année 2000",
livestream Sun May 3 2026 19h Paris time. 48h, solo team.

## Stack — DO NOT SUBSTITUTE WITHOUT EXPLICIT APPROVAL
- Backend: Python 3.11, FastAPI, uvicorn, LangGraph >=0.2.50,
  langchain-openai (AzureChatOpenAI), sse-starlette, upstash-redis,
  upstash-vector, FlagEmbedding (BGE-M3), httpx, pydantic v2,
  pyyaml, backoff.
- Frontend: Vite + React 18 + TypeScript, native EventSource, plain
  CSS (NO Tailwind, we want authentic <table bgcolor> Y2K).
- Hosting: HF Space Docker port 7860 (backend), Vercel (frontend).
- Storage: Upstash Redis (state) + Upstash Vector (RAG).

## LangGraph conventions (CRITICAL)
- ForumState uses Annotated[list[Post], operator.add] for posts
  (concurrent-safe append across 30 parallel personas).
- All nodes are async, return dict (state delta).
- Fan-out via Send API: one Send per persona from fanout_wave1.
- Stagger via asyncio.sleep(delay) inside the node, NOT via LangGraph.
- max_concurrency=12 when calling graph.astream.
- Stream mode = "updates" for SSE.
- max_tokens caps: 180 (mini), 400 (4o expert), 140 (replies).

## Persona conventions
- 30 YAML files in backend/app/personas/, validated by Pydantic.
- Archetypes: noise (24), skeptic (3), expert (3) — expert uses
  gpt-4o + RAG.
- Each persona has 3-5 few-shot examples that dominate the voice.
- French Doctissimo 2003 speech patterns: "ya", "jé", "pkoi", "mdr",
  ":bounce:", "les filles", "ma puce", abusive "...", ALL CAPS for
  emphasis. Heavy use of typos.

## Safety — INVIOLABLE
- backend/app/safety.py contains a regex pre-filter BEFORE any LLM call.
- Red flags: suicid, douleur thoracique, AVC symptoms, baby fever,
  convulsion, bleeding pregnancy, overdose, anaphylaxis.
- If match -> return REFUSAL template with 15/3114/112/114, NO RAG.
- Expert ALWAYS cites source URL (Ameli/HAS) in reply.

## Done-when (gating criteria)
- POST /api/forum/start with French topic returns thread_id.
- GET /api/forum/{id}/stream emits >=20 SSE "post" events in 8s.
- Wave 2 emits >=5 "reply" events over 30s.
- Frontend renders posts in arrival order with 100x100 avatar.
- pytest -q && ruff check . pass before any merge.

## Secrets (env vars — NEVER commit)
AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY,
AZURE_DEPLOYMENT_MINI, AZURE_DEPLOYMENT_4O,
UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN,
UPSTASH_VECTOR_REST_URL, UPSTASH_VECTOR_REST_TOKEN

## Aesthetics (NON-negotiable)
- Primary colors: #E5007E (rose Doctissimo), #FFCCE5 (rose clair),
  #CC0066 (header), links #0000FF, visited #800080.
- Font: Verdana 11px everywhere. Tahoma for titles.
- Fixed 770px width, <table> layout. NO flexbox on posts.
- Smileys = real GIFs in /assets/smileys/.
- Avatars = 30 consistent 100x100 PNG (DALL-E with style guide).

## Git workflow
- One commit per logical unit, conventional-commits format.
- Push after every iteration.
- NEVER force-push to main.
- If a change risks breaking the running app, branch first.
