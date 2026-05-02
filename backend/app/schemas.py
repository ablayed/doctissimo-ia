from pydantic import BaseModel


class Persona(BaseModel):
    id: str
    pseudo: str
    age: int
    region: str
    archetype: str
    sub_type: str
    expertise: str
    model: str
    temperature: float
    length_words: int
    smiley_freq: str
    quirks: list[str]
    signature: str
    avatar_prompt: str
    few_shot: list[str]
    truth_teller: bool


class Post(BaseModel):
    id: str
    persona_id: str
    pseudo: str
    parent_id: str | None
    text: str
    arrived_at: float


class ForumThread(BaseModel):
    thread_id: str
    topic: str
    seed_post: str
    posts: list[Post]
