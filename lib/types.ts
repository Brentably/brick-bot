import { Message } from "ai";
import { Card } from "ts-fsrs";

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
  // any whitespace characters following original token
  token_ws: string,
  root_words: string[],
  is_svp: boolean,
}

export interface MessageData extends Message{
  mistakes?: string;
  correctedMessage?: string;
  explanation?: string;
  // store word/lemma/clicked data for each word in message
  tokenDataArr?: TokenData[];
  xmlContent?: string
};


export interface BrickCard extends Card {
  // is tracking means that it's in rotation of what we might decide to show the user or not.
  isTracking?: boolean;
}