export type BasicFlashcard = {
  front: string;
  back: string;
};
export type ClozeFlashcard = {
  text: string;
  back_extra: string;
  foreign_sentence_base: string;
};

export type Flashcard = BasicFlashcard | ClozeFlashcard;
