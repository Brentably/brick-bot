import genanki
from fastapi import FastAPI
import json
import random
from pydantic import BaseModel
from typing import List

app = FastAPI()

model_id = random.randrange(1 << 30, 1 << 31)
model = genanki.Model(
  model_id,
  'Flashcard',
  fields=[
    {'name': 'front'},
    {'name': 'back'},
  ],
  templates=[
    {
      'name': 'Flashcard',
      'qfmt': '{{front}}',
      'afmt': '{{FrontSide}}<hr id="answer">{{back}}',
    },
  ])

class Flashcard(BaseModel):
    front: str
    back: str

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
            model=model,
            fields=[f.front, f.back]
        );
        print(f.front + ' ' + f.back + '\n')
        deck.add_note(note);
    genanki.Package(deck).write_to_file('flashcards.apkg');
