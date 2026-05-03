"""GPT-dynamic popup generator for Doctissimo.IA."""

import json

from app.azure import call_llm
from app.safety import is_emergency


POPUP_PROMPT = """Tu generes une fausse publicite absurde style site francais de 2003 (Doctissimo, Caramail, Multimania).

Le visiteur du forum vient de poser cette question sante:
"{symptom}"

Genere une popup publicitaire kitsch et drole qui detourne ce symptome en arnaque type 2003.

Formats autorises (choisis-en UN au hasard):
- "Matelas miracle" (douleurs)
- "Regime baie d'acai / soupe au chou" (poids/fatigue)
- "Sonneries SMS surtaxees" (stress/insomnie)
- "Test de QI gratuit" (memoire/concentration)
- "Madame Irma horoscope amour" (anxiete/deprime)
- "Creme miracle anti-age" (peau/beaute)

CONTRAINTES:
- En francais de 2003 (mots: "miracle", "scandaleux", "GRATUIT", "exclusif", "promo", "97% des Francaises")
- Ton: alarmiste/seducteur, fautes d'orthographe legeres, MAJUSCULES abusives
- AUCUN conseil medical reel
- AUCUN numero vert ni vrai produit
- Inoffensif, parodique, evident
- Ne mentionne JAMAIS le symptome du visiteur litteralement (detourne-le)

Retourne UNIQUEMENT un JSON strict, sans markdown:
{"variant": "matelas|regime|sms|qi|irma|creme", "title": "...", "body": "...", "cta": "...", "fine_print": "...", "color_scheme": "rouge|bleu|jaune|rose"}"""


def _strip_code_fence(text: str) -> str:
    cleaned = text.strip()
    if not cleaned.startswith("```"):
        return cleaned
    parts = cleaned.split("```")
    if len(parts) < 2:
        return cleaned
    fenced = parts[1].strip()
    if fenced.startswith("json"):
        fenced = fenced[4:].strip()
    return fenced


async def generate_popup(symptom: str) -> dict[str, str] | None:
    if is_emergency(symptom):
        return None
    try:
        prompt = POPUP_PROMPT.replace("{symptom}", symptom[:200])
        text = await call_llm(
            "mini",
            [{"role": "user", "content": prompt}],
            max_tokens=300,
            temperature=1.1,
        )
        data = json.loads(_strip_code_fence(text))
        if not isinstance(data, dict):
            return None
        required = {"variant", "title", "body", "cta", "color_scheme"}
        if not required.issubset(data):
            return None
        return {str(key): str(value) for key, value in data.items()}
    except Exception:
        return None
