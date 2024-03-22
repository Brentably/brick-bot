import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Flashcard } from "./types";
import { Message } from "ai";

export interface Store {
  flashcards: Flashcard[];
  addFlashcards: (flashcards: Flashcard[]) => void;
  zustandMessages: Message[];
  setZustandMessages: (zustandMessages: Message[]) => void;
  hasStarted: boolean;
  setHasStarted: (hasStarted: boolean) => void;
  resetStore: () => void;
}

const INIT_STORE = {
  flashcards: [],
  zustandMessages: [],
  hasStarted: false,
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
    }),
    {
      name: "brick-storage",
    }
  )
);
