from app.personas import load_all
from app.prompts import (
    build_expert_messages,
    build_persona_messages,
    build_reply_messages,
)
from app.schemas import Post


def _persona():
    return next(persona for persona in load_all() if persona.pseudo == "Sandra67")


def _expert():
    return next(
        persona for persona in load_all() if persona.pseudo == "InfirmièreUrgences42"
    )


def test_build_persona_messages_returns_system_and_user() -> None:
    messages = build_persona_messages(_persona(), "Mal au ventre", "jé mal")

    assert len(messages) == 2
    assert messages[0]["role"] == "system"
    assert messages[1]["role"] == "user"


def test_persona_system_contains_pseudo_and_signature() -> None:
    persona = _persona()
    messages = build_persona_messages(persona, "Mal au ventre", "jé mal")

    assert persona.pseudo in messages[0]["content"]
    assert persona.signature in messages[0]["content"]


def test_few_shot_block_contains_all_examples() -> None:
    persona = _persona()
    messages = build_persona_messages(persona, "Mal au ventre", "jé mal")

    for example in persona.few_shot:
        assert example in messages[0]["content"]


def test_build_expert_messages_includes_rag_context() -> None:
    context = "[Source: https://www.ameli.fr/foo] Consultez si fièvre."
    messages = build_expert_messages(_expert(), "Fièvre", "jé fièvre", context)

    assert context in messages[0]["content"]


def test_build_reply_messages_contains_quote_instruction() -> None:
    persona = _persona()
    target = Post(
        id="post_1",
        persona_id="claire_bienveillante",
        pseudo="ClaireBienveillante",
        parent_id=None,
        text="Ma belle, demande un avis médical si ça continue.",
        arrived_at=1.0,
    )

    messages = build_reply_messages(persona, target, "Mal au ventre")

    assert "[quote=ClaireBienveillante]" in messages[0]["content"]
