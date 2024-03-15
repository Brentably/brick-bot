const fs = require('fs');
import { Flashcard } from './Flashcard'
import { promisify } from 'util'
const writeFile = promisify(fs.writeFile);

export async function exportFlashcardsTxt(flashcards: Flashcard[]): Promise<number> {
    let data = '';
    for (let i = 0; i < flashcards.length; i++) {
        data += `${flashcards[i].front};${flashcards[i].back}\n`;
    }
    console.log(data)
    try {
        await writeFile('flashcards.txt', data);
        return 0;
    } catch (err) {
        console.error(err);
        throw err;
    }
}
