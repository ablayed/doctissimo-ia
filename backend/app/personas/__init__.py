from pathlib import Path

import yaml

from app.schemas import Persona


PERSONAS_DIR = Path(__file__).parent


def load_all() -> list[Persona]:
    personas: list[Persona] = []
    for path in sorted(PERSONAS_DIR.glob("*.yaml")):
        with path.open(encoding="utf-8") as handle:
            personas.append(Persona.model_validate(yaml.safe_load(handle)))
    return personas


def get_by_archetype(archetype: str) -> list[Persona]:
    return [persona for persona in load_all() if persona.archetype == archetype]
