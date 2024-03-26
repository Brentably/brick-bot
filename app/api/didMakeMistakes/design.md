Different types of flashcards:
1. cloze sentence card - 
  ai specifies the german sentence to be tested and which words to be clozed.
  program calls deepl for english translation.
  card is formulated. optional TTS on backside this way.
2. vocab card - 
  I'm a little uncertain how we will handle non-isomorphic mappings. If there are multiple translations, not sure what to do. Maybe we can have the AI specify a word, and again, we use DeepL for the translation, taking the top few definitions if there are several.
    - potential postprocessing: flattening analagous / similar words so there's less to learn.
    - if multiple defintions, consider implementing sectioned anki cards. 