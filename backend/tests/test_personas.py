from app.personas import get_by_archetype, load_all


def test_all_personas_load_and_validate() -> None:
    personas = load_all()

    assert len(personas) == 30


def test_exactly_one_truth_teller() -> None:
    personas = load_all()

    assert sum(persona.truth_teller for persona in personas) == 1
    assert [persona.pseudo for persona in personas if persona.truth_teller] == [
        "InfirmièreUrgences42"
    ]


def test_archetype_distribution() -> None:
    assert len(get_by_archetype("expert")) == 1
    assert len(get_by_archetype("skeptic")) == 3
    assert len(get_by_archetype("noise")) >= 20


def test_every_persona_has_three_few_shots() -> None:
    personas = load_all()

    assert all(len(persona.few_shot) >= 3 for persona in personas)
