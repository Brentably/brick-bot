function splitTextIntoWords(text: string) {
    // This regex matches words (including those with accents and other special characters)
    // and punctuation as separate entities. Dashes and apostrophes are treated as delimiters.
    const regex = /[\wÀ-ž]+|[^\wÀ-ž\s]+/g;
    return text.match(regex) || [];
  }
  
// Example usage:
const text = "bonjour, tous le monde. est-ce que tu sais si quelq'un de célèbre?";
const words = splitTextIntoWords(text);
console.log(words);