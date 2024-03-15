const genanki = require('genanki');
const random = require('random');

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

export async function POST(req: Request) {
    try {
        const {jsonFlashcards} = await req.json();
        const deck_id = random.randrange(1 << 30, 1 << 31);
        const deck = new genanki.Deck(deck_id, 'Brick German Words');

        let flashcards = JSON.parse(jsonFlashcards);
        for (let i = 0; i < flashcards.length; i++) {
            const note = new genanki.Note({
                model: model, 
                fields: [flashcards[i].front, flashcards[i].back]
            });
            deck.add_note(note);
        }
        await genanki.Package(deck).write_to_file('flashcards.apkg');
    } catch (e) {
        throw e;
    }
}