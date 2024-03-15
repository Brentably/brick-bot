const fs = require('fs');

interface Flashcard {
    front: string;
    back: string;
}

let flashcards: Flashcard[] = 
[
    {
        front: "front1",
        back: "back1"
    },
    {
        front: "front2",
        back: "back2"
    },
    {
        front: "front3",
        back: "back3"
    }
]


export function exportFlashcards(flashcards: Flashcard[]): string {
    let data = '';
    for (let i = 0; i < flashcards.length; i++) {
        data += `${flashcards[i].front};${flashcards[i].back}\n`;
    }
    console.log(data)
    return data;
}

let data: string = exportFlashcards(flashcards)

fs.writeFile('flashcards.txt', data, (err) => {
    if (err) {
      console.error(err);
      return;
    }
    return 0;
  });
