function splitTextIntoWords(text) {
    // This regex matches words (including those with accents and other special characters)
    // and punctuation as separate entities. Dashes and apostrophes are treated as delimiters.
    var regex = /[\wÀ-ž]+|[^\wÀ-ž\s]+/g;
    return text.match(regex) || [];
}
// Example usage:
var text = "bonjour, tous le monde. est-ce que tu sais si quelq'un de célèbre?";
var words = splitTextIntoWords(text);
console.log(words);
