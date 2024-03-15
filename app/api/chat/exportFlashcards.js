"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportFlashcards = void 0;
var fs = require('fs');
var flashcards = [
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
];
function exportFlashcards(flashcards) {
    var data = '';
    for (var i = 0; i < flashcards.length; i++) {
        data += "".concat(flashcards[i].front, ";").concat(flashcards[i].back, "\n");
    }
    console.log(data);
    return data;
}
exports.exportFlashcards = exportFlashcards;
var data = exportFlashcards(flashcards);
fs.writeFile('flashcards.txt', data, function (err) {
    if (err) {
        console.error(err);
        return;
    }
    return 0;
});
