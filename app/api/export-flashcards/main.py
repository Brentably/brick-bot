import genanki
from fastapi import FastAPI
import json
import random
from pydantic import BaseModel
from typing import List

app = FastAPI()

class Flashcard(BaseModel):
    front: str
    back: str

class Flashcards(BaseModel):
    jsonFlashcards: List[Flashcard]

class Cloze(BaseModel):
    text: str
    back_extra: str

class ClozeCards(BaseModel):
    jsonClozeCards: List[Cloze]

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/export-flashcards/")
async def exportFlashcards(flashcards: Flashcards):
    deck_id = random.randrange(1 << 30, 1 << 31)
    deck = genanki.Deck(deck_id, 'Brick German Words');
    for f in flashcards.jsonFlashcards:
        note = genanki.Note(
            model=genanki.BASIC_MODEL,
            fields=[f.front, f.back]
        );
        print(f.front + ' ' + f.back + '\n')
        deck.add_note(note);
    genanki.Package(deck).write_to_file('flashcards.apkg');


@app.post("/export-cloze-cards/")
async def exportClozeCards(clozeCards: ClozeCards):
    deck_id = random.randrange(1 << 30, 1 << 31)
    deck = genanki.Deck(deck_id, 'Brick German Words');
    for c in clozeCards.jsonClozeCards:
        note = genanki.Note(
            model=genanki.CLOZE_MODEL,
            fields=[c.text, c.back_extra]
        );
        print(c.text + ' ' + c.back_extra + '\n')
        deck.add_note(note);
    genanki.Package(deck).write_to_file('flashcards.apkg');
