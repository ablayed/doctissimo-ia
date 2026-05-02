# Phase 4 Assets Missing

The repo currently does not include the original binary media pack expected by the Y2K skin:

- `frontend/public/smileys/*.gif`
- `frontend/public/avatars/*.png`
- `frontend/public/ads/*.gif`
- `frontend/public/sounds/modem.mp3`
- `frontend/public/sounds/post-ding.mp3`
- `frontend/public/gifs/*.gif`

Fallbacks implemented in code:

- Smileys render as inline SVG placeholders.
- Avatars fall back to inline SVG placeholders.
- Ads render as inline SVG banners.
- Modem and ding sounds use Web Audio oscillators.
- Footer badges and construction strips use inline SVG placeholders.
