import re


_CATEGORY_PATTERNS: dict[str, list[str]] = {
    "suicide": [
        r"suicid",
        r"\bje veux me tuer\b",
        r"\bme tuer\b",
        r"\benvie de mourir\b",
        r"\benvies de mourir\b",
        r"\bme faire du mal\b",
        r"\bje me fais du mal\b",
        r"automutil",
        r"auto[- ]?mutil",
    ],
    "cardiac": [
        r"douleur thoracique",
        r"serrement.{0,20}poitrine",
        r"poitrine.{0,20}serrement",
        r"poitrine.{0,20}irradi",
        r"thoracique.{0,20}irradi",
        r"bras gauche.{0,20}poitrine",
        r"machoire.{0,20}poitrine",
    ],
    "stroke": [
        r"bouche tordue",
        r"n'arrive plus a parler",
        r"paralysie.{0,20}(visage|cote)",
        r"aphasie",
        r"\bavc\b",
        r"attaque cerebrale",
    ],
    "respiratory": [
        r"j['’]?[ée]touffe",
        r"etouffe",
        r"[ée]touffe",
        r"n'arrive plus a respirer",
        r"detresse respi",
        r"oedeme de quincke",
        r"oed[èe]me de quincke",
        r"quincke",
        r"anaphylax",
    ],
    "baby_infant": [
        r"nourrisson.{0,30}(fievre|fi[eè]vre|convuls|purpura)",
        r"bebe.{0,25}\d+\s?mois.{0,25}(fievre|fi[eè]vre)",
        r"bébé.{0,25}\d+\s?mois.{0,25}(fi[eè]vre|fievre)",
        r"convulsion.{0,20}bebe",
        r"convulsion.{0,20}bébé",
        r"bebe.{0,20}convulsion",
        r"bébé.{0,20}convulsion",
    ],
    "meningitis": [
        r"convulsion",
        r"purpura",
        r"tache violette.{0,20}dispar",
        r"meningite",
        r"méningite",
    ],
    "pregnancy": [
        r"saigne(ment)?.{0,30}enceinte",
        r"enceinte.{0,30}saigne",
    ],
    "poisoning": [
        r"surdose",
        r"overdose",
        r"avale.{0,20}(medic|paracetamol|comprime)",
        r"aval[ée].{0,20}(m[ée]dic|medic|paracetamol|comprime)",
        r"intoxicat",
        r"produit menager.{0,20}(enfant|bebe)",
    ],
}

_CATEGORY_REGEXES = {
    category: re.compile("|".join(f"(?:{pattern})" for pattern in patterns), re.IGNORECASE)
    for category, patterns in _CATEGORY_PATTERNS.items()
}

REDFLAGS = re.compile(
    "|".join(f"(?:{pattern})" for patterns in _CATEGORY_PATTERNS.values() for pattern in patterns),
    re.IGNORECASE,
)


def is_emergency(text: str) -> bool:
    return REDFLAGS.search(text) is not None


def refusal_text() -> str:
    return (
        "Cette question concerne une situation potentiellement urgente.\n"
        "Doctissimo.IA est un site PARODIQUE et ne peut pas y repondre.\n\n"
        "Si vous ou un proche etes en danger immediat :\n"
        "- 15 (SAMU) ou 112 (Europe)\n"
        "- 3114 (prevention suicide, 24h/24, gratuit)\n"
        "- 114 (par SMS pour sourds/malentendants)\n"
        "- 116 117 (medecin de garde non urgent)\n\n"
        "Vous n'etes pas seul·e. Parlez-en autour de vous."
    )


def why_refused(text: str) -> str | None:
    for category, regex in _CATEGORY_REGEXES.items():
        if regex.search(text):
            return category
    return None
