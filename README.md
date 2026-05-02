# Doctissimo.IA

Doctissimo.IA is a DEFENDHACK 2026 parody of a 2003 Doctissimo forum: a user posts a health question, 30 AI forum personas answer in real time, and one emergency nurse persona is grounded on medical RAG. The project is a hackathon prototype and not medical advice.

Live URL: https://doctissimo-ia.vercel.app

API info: https://ablaye-doctissimo-ia-api.hf.space/api/info

Stack: Python 3.11 · FastAPI · LangGraph · Azure OpenAI · Upstash Redis/Vector · Vite React · Vercel · Hugging Face Spaces

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
