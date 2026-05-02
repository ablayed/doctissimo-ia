import re


_CATEGORY_PATTERNS: dict[str, list[str]] = {
    "suicide": [
        r"suicid",
        r"me tuer",
        r"envie de mourir",
        r"me faire du mal",
        r"automutil",
    ],
    "cardiac": [
        r"douleur thoracique",
        r"serrement poitrine",
        r"mal poitrine.{0,15}irradi",
    ],
    "stroke": [
        r"paralysie",
        r"bouche tordue",
        r"aphasie",
        r"AVC",
        r"attaque cérébrale",
    ],
    "respiratory": [
        r"étouffe",
        r"détresse respi",
        r"œdème de quincke",
        r"anaphylax",
    ],
    "baby_infant": [
        r"nourrisson.{0,30}(fièvre|convuls|purpura)",
        r"bébé.{0,20}\d+\s?mois.{0,20}fièvre",
    ],
    "meningitis": [
        r"convulsion",
        r"méningite",
        r"purpura",
        r"tache violette",
    ],
    "pregnancy": [
        r"saigne(ment)?.{0,30}enceinte",
        r"enceinte.{0,30}saigne",
    ],
    "poisoning": [
        r"surdose",
        r"overdose",
        r"avalé.{0,15}médic",
        r"intoxicat",
    ],
}

_CATEGORY_REGEXES = {
    category: re.compile("|".join(f"(?:{pattern})" for pattern in patterns), re.IGNORECASE)
    for category, patterns in _CATEGORY_PATTERNS.items()
}

REDFLAGS = re.compile(
    "|".join(
        f"(?:{pattern})"
        for patterns in _CATEGORY_PATTERNS.values()
        for pattern in patterns
    ),
    re.IGNORECASE,
)


def is_emergency(text: str) -> bool:
    return REDFLAGS.search(text) is not None


def refusal_text() -> str:
    return (
        "Je ne peux pas répondre comme un forum pour ce message, car il peut évoquer "
        "une urgence médicale.\n\n"
        "Appelez immédiatement le 15 ou le 112 si la situation est grave ou évolue vite.\n"
        "En cas d'idées suicidaires ou de danger pour vous-même: 3114.\n"
        "Si vous ne pouvez pas parler au téléphone: 114 par SMS.\n"
        "Pour un conseil médical non urgent hors horaires: 116 117.\n\n"
        "Ne restez pas seul(e), contactez un proche ou un professionnel maintenant."
    )


def why_refused(text: str) -> str | None:
    for category, regex in _CATEGORY_REGEXES.items():
        if regex.search(text):
            return category
    return None
