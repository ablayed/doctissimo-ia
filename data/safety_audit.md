# Safety Audit - 2026-05-02

## Summary

- Local safety and edge-case test suite: PASS
- Backend pytest status: 55 passed
- Live production audit against the published public URLs: BLOCKED

## What was verified locally

- Emergency regex coverage for suicide, cardiac pain, stroke, respiratory distress, infant fever and convulsions, meningitis and purpura, pregnancy bleeding, and poisoning
- Emergency flow returns a single moderation post with crisis numbers
- Benign prompts do not trigger the emergency responder in unit tests
- Request length validation, Redis fallback behavior, and persona modem-fallback behavior

## Live audit blocker

At the time of the Phase 5 freeze, both public URLs listed in the playbook returned `404` on the expected API routes:

- `https://doctissimo-ia.vercel.app`
- `https://ablaye-doctissimo-ia-api.hf.space`

Because the deployed public hosts were not serving the expected `/api/forum/*` and `/api/info` routes, the full live 37-prompt production audit could not be completed from this environment.

## Next action outside code freeze

- Fix or confirm the real production host mapping
- Rerun `python -m scripts.safety_audit`
- Replace this note with the final live report
