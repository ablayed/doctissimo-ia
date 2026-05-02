import pytest

from app.safety import is_emergency, refusal_text, why_refused


@pytest.mark.parametrize(
    ("phrase", "category"),
    [
        ("je pense au suicide depuis hier", "suicide"),
        ("j'ai envie de mourir ce soir", "suicide"),
        ("douleur thoracique brutale depuis 10 minutes", "cardiac"),
        ("mal poitrine qui irradie dans le bras gauche", "cardiac"),
        ("ma bouche tordue et je parle bizarre", "stroke"),
        ("suspicion AVC chez mon pere", "stroke"),
        ("je m'étouffe depuis tout a l'heure", "respiratory"),
        ("oedeme bizarre, anaphylax possible", "respiratory"),
        ("nourrisson de 2 mois avec grosse fièvre", "baby_infant"),
        ("bébé 3 mois avec fièvre depuis ce matin", "baby_infant"),
        ("convulsion pendant la nuit", "meningitis"),
        ("tache violette qui ne disparait pas", "meningitis"),
        ("je saigne beaucoup et je suis enceinte", "pregnancy"),
        ("overdose de medicaments possible", "poisoning"),
        ("j'ai avalé des médic ce matin", "poisoning"),
    ],
)
def test_emergency_phrases_trigger(phrase: str, category: str) -> None:
    assert is_emergency(phrase)
    assert why_refused(phrase) == category


@pytest.mark.parametrize(
    "phrase",
    [
        "j'ai mal au ventre depuis hier",
        "fatigue depuis 1 semaine",
        "stress au boulot",
        "petit rhume sans fièvre",
        "bouton sur le menton",
        "mal de gorge leger",
        "je dors mal en ce moment",
        "migraine habituelle qui passe avec repos",
        "mon ado est grognon",
        "j'ai peur de tomber malade",
        "allergie au pollen comme chaque printemps",
        "douleurs de règles classiques",
        "brulure d'estomac apres repas",
        "constipation depuis deux jours",
        "question contraception pilule oubliee",
    ],
)
def test_benign_phrases_do_not_trigger(phrase: str) -> None:
    assert not is_emergency(phrase)
    assert why_refused(phrase) is None


def test_refusal_text_contains_emergency_numbers() -> None:
    text = refusal_text()
    assert "15" in text
    assert "3114" in text
    assert "112" in text
    assert "114" in text
