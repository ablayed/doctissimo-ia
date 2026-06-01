# Doctissimo.IA

<img width="1880" height="917" alt="image" src="https://github.com/user-attachments/assets/1a0f1135-f4dc-45f8-94a8-5d323f55056a" />


Doctissimo.IA is a DEFENDHACK 2026 parody of a 2003 Doctissimo forum: a user posts a health question, 30 AI forum personas answer in real time, and one emergency nurse persona is grounded on medical RAG. The project is a hackathon prototype and not medical advice.

Live URL: https://doctissimo-ia.vercel.app

API info: https://ablaye-doctissimo-ia-api.hf.space/api/info

Stack: Python 3.11 | FastAPI | LangGraph | Azure OpenAI | Upstash Redis/Vector | Vite React | Vercel | Hugging Face Spaces

Disclaimer: parody site for DEFENDHACK 2026. Do not use it for medical diagnosis, treatment, or emergency decisions.

## What works at H+24

- Multi-agent forum with 30 personas and wave 2 reply chains
- Medical RAG on the truth-teller persona
- Vote game, reveal modal, and truth-teller glow
- Pseudo registration and connected banner
- Stats counter, sub-forum sidebar, recent threads, and fake ads
- Easter eggs: Konami code, logo click/night mode, `:bounce:`, right-click, devtools console, reward popup, footer gag
- Cost cap middleware and admin monitoring endpoint
- Redis persistence with replay URLs

## Visual

![Screenshot](docs/screenshots/forum-with-skin.png)

## What works at H+36

- Phase 4 Y2K skin complete: 770px fixed layout, phpBB-style posts, modem modal, sound toggle, rotating ads, and retro chrome
- Safety audit path in place with hardened regex coverage and visible footer urgency banner
- Warmup path implemented for startup and `/api/warm`, plus richer `/api/info` health data
- Edge cases handled: persona timeout fallback, Redis persistence failure fallback, empty RAG fallback, and request length validation
- Demo mode implemented with 5 pre-cached threads served from `/api/forum/demo/{1-5}` and a hidden frontend demo toggle
- Final smoke script and safety audit scripts available in `backend/scripts/`
