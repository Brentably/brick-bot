const genanki = require('genanki');
const random = require('random');
import { Flashcard } from './Flashcard'

const model_id = random.randrange(1 << 30, 1 << 31);
const model = new genanki.Model({
    model_id, 
    name: 'Basic Translation',
    fields: [
      {name: 'Target Word'},
      {name: 'English Word'},
    ],
    templates: [{
      qfmt: '{{Target Word}}',
      afmt: '{{English Word}}',
    }],
});

export async function exportFlashcardsApkg(flashcards: Flashcard[]): Promise<number> {
    const deck_id = random.randrange(1 << 30, 1 << 31);
    const deck = new genanki.Deck(deck_id, 'Brick German Words');

    for (let i = 0; i < flashcards.length; i++) {
        const note = new genanki.Note({
            model: model, 
            fields: [flashcards[i].front, flashcards[i].back]
        });
        deck.add_note(note);
    }

    try {
        await genanki.Package(deck).write_to_file('flashcards.apkg');
        return 0;
    } catch (err) {
        console.error(err);
        throw err;
    }
}
