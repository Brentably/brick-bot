import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Flashcard } from "./types";
import { Message } from "ai";
import { MessageData } from "../app/page";

export interface Store {
  flashcards: Flashcard[];
  addFlashcards: (flashcards: Flashcard[]) => void;
  zustandMessages: Message[];
  setZustandMessages: (zustandMessages: Message[]) => void;
  hasStarted: boolean;
  setHasStarted: (hasStarted: boolean) => void;
  resetStore: () => void;
  messagesData: MessageData[];
  setMessagesData: (messagesData: MessageData[] | ((previousMessagesData: MessageData[]) => MessageData[])) => void
}

const INIT_STORE = {
  flashcards: [],
  zustandMessages: [],
  hasStarted: false,
  messagesData: [{didMakeMistakes: null}, {didMakeMistakes: null}]
};

export const useBrickStore = create<Store>()(
  persist(
    (set, get) => ({
      ...INIT_STORE,
      addFlashcards: (newFlashcards) =>
        set((ps) => ({
          ...ps,
          flashcards: [...ps.flashcards, ...newFlashcards],
        })),
      setZustandMessages: (zustandMessages) =>
        set((pS) => ({ ...pS, zustandMessages })),
      setHasStarted: (hasStarted) => set((pS) => ({ ...pS, hasStarted })),
      resetStore: () => set(() => ({ ...INIT_STORE })),
      setMessagesData: (newMessagesDataOrFunction) => {
        if(typeof newMessagesDataOrFunction === 'object') set(ps => ({...ps, messagesData: newMessagesDataOrFunction}))
        else set(ps => ({...ps, messagesData: newMessagesDataOrFunction(ps.messagesData)}))
      }
    }),
    {
      name: "brick-storage",
    }
  )
);
