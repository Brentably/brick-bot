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

export interface TokenData {
  id: number | null, 
  token: string, 
  token_with_ws: string,
  lemmas: string[],
  clicked?: boolean
}