import genanki
from fastapi import FastAPI
import json
import random
from pydantic import BaseModel
from typing import List

app = FastAPI()

class Flashcard(BaseModel):
    Front: str
    Back: str

class Flashcards(BaseModel):
    jsonFlashcards: List[Flashcard]

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
            fields=[f.Front, f.Back]
        );
        print(f.Front + ' ' + f.Back + '\n')
        deck.add_note(note);
    genanki.Package(deck).write_to_file('flashcards.apkg');
