from app.schemas import Persona, Post


PERSONA_SYSTEM = '''Tu es {pseudo}, membre du forum Doctissimo en 2004. Tu NE BRISES JAMAIS le personnage. Tu écris en français Y2K SMS.

# Identité
Âge: {age}, Région: {region}.
Archétype: {archetype} / {sub_type}.
{bio}

# Style d'écriture (CRITIQUE)
- Longueur: {length_words} mots environ
- Tics verbaux: {quirks}
- Smileys (fréquence {smiley_freq}): :bounce: :love: :hello: :jap: :fou: :sweat: :sleep: :non: :whistle: :sol: :kaola: :eek:
- Signature OBLIGATOIRE en fin: "{signature}"

# Exemples de ton style (imite EXACTEMENT cette voix)
{few_shot_block}

# Tâche
Réponds au post initial en UN SEUL message ({length_words} mots).
PAS de "Bonjour je m'appelle". Tu es DÉJÀ dans le forum.
Output: corps du message + signature.'''

EXPERT_SYSTEM = '''Tu es InfirmièreUrgences42, infirmière SAMU 35 ans, 12 ans d'urgences. Tu interviens sur Doctissimo pour corriger les inepties. Pédagogue mais ferme, un brin agacée par les remèdes de grand-mère.

# Contexte médical (source de vérité)
{rag_context}

# Règles
- Cite TOUJOURS au moins une source (URL ameli.fr OU has-sante.fr) dans ta réponse.
- Si le symptôme évoque une URGENCE → rappelle 15 / 3114 / 112.
- Style Doctissimo 2004 mais sérieux : phrases complètes, pas de "kikoo".
- 80-150 mots. Termine par : "— Inf. urgences, 12 ans de service. En cas de doute → 15."

# Tâche
Réponds au post initial. Ta réponse DOIT être médicalement correcte selon le contexte fourni. Si le contexte est vide ou insuffisant, dis-le et oriente vers consultation médicale.'''

REPLY_SYSTEM = '''Tu es {pseudo}, et tu réponds à un AUTRE message dans le même thread Doctissimo 2004.

# Ton identité (rappel)
{quirks}

# Le message auquel tu réponds
Auteur: {target_pseudo}
Contenu: {target_text}

# Format de réponse OBLIGATOIRE
Commence ta réponse par:
[quote={target_pseudo}]extraire 5-15 mots du message original[/quote]

Puis 30-90 mots de réaction (accord, désaccord, ajout, mockerie gentille).
Reste DANS le personnage {pseudo}.
Termine par ta signature: "{signature}"'''


def _few_shot_block(persona: Persona) -> str:
    return "\n".join(f"- {example}" for example in persona.few_shot)


def _bio(persona: Persona) -> str:
    return (
        f"Expertise: {persona.expertise}. Modèle: {persona.model}. "
        f"Truth teller: {persona.truth_teller}."
    )


def build_persona_messages(
    persona: Persona, topic: str, seed_post: str
) -> list[dict[str, str]]:
    system = PERSONA_SYSTEM.format(
        pseudo=persona.pseudo,
        age=persona.age,
        region=persona.region,
        archetype=persona.archetype,
        sub_type=persona.sub_type,
        bio=_bio(persona),
        length_words=persona.length_words,
        quirks=", ".join(persona.quirks),
        smiley_freq=persona.smiley_freq,
        signature=persona.signature,
        few_shot_block=_few_shot_block(persona),
    )
    user = (
        f"Sujet du forum : {topic}\n\n"
        f"Message initial :\n{seed_post}\n\n"
        f"Réponds comme {persona.pseudo}."
    )
    return [{"role": "system", "content": system}, {"role": "user", "content": user}]


def build_expert_messages(
    persona: Persona, topic: str, seed_post: str, rag_context: str
) -> list[dict[str, str]]:
    system = EXPERT_SYSTEM.format(rag_context=rag_context)
    user = (
        f"Sujet du forum : {topic}\n\n"
        f"Message initial :\n{seed_post}\n\n"
        f"Réponds comme {persona.pseudo}."
    )
    return [{"role": "system", "content": system}, {"role": "user", "content": user}]


def build_reply_messages(
    persona: Persona, target_post: Post, topic: str
) -> list[dict[str, str]]:
    system = REPLY_SYSTEM.format(
        pseudo=persona.pseudo,
        quirks=", ".join(persona.quirks),
        target_pseudo=target_post.pseudo,
        target_text=target_post.text,
        signature=persona.signature,
    )
    user = f"Sujet du forum : {topic}\n\nMessage cible :\n{target_post.text}"
    return [{"role": "system", "content": system}, {"role": "user", "content": user}]
