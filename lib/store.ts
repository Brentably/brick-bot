import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Flashcard } from "./types";
import { Message } from "ai";
import { MessageData } from "../app/page";
import { toast } from "react-toastify";

export interface Store {
  flashcards: Flashcard[];
  addFlashcards: (flashcards: Flashcard[]) => void;
  zustandMessages: Message[];
  setZustandMessages: (zustandMessages: Message[]) => void;
  hasStarted: boolean;
  setHasStarted: (hasStarted: boolean) => void;
  resetStore: () => void;
  messagesData: MessageData[];
  setMessagesData: (
    messagesData:
      | MessageData[]
      | ((previousMessagesData: MessageData[]) => MessageData[])
  ) => void;
  flashcardsGoal: number;
  setFlashcardsGoal: (flashcardsGoal: number) => void;
}

const INIT_STORE = {
  flashcards: [],
  zustandMessages: [],
  hasStarted: false,
  messagesData: [
    { role: "system", didMakeMistakes: null },
    { role: "user", didMakeMistakes: null },
  ] as MessageData[],
  flashcardsGoal: 20,
};

export const useBrickStore = create<Store>()(
  persist(
    (set, get) => ({
      ...INIT_STORE,
      addFlashcards: (newFlashcards) => {
        set((ps) => ({
          ...ps,
          flashcards: [...ps.flashcards, ...newFlashcards],
        }));
      },
      setZustandMessages: (zustandMessages) =>
        set((pS) => ({ ...pS, zustandMessages })),
      setHasStarted: (hasStarted) => set((pS) => ({ ...pS, hasStarted })),
      resetStore: () => set(() => ({ ...INIT_STORE })),
      setMessagesData: (newMessagesDataOrFunction) => {
        const newMessagesData =
          typeof newMessagesDataOrFunction === "object"
            ? newMessagesDataOrFunction
            : newMessagesDataOrFunction(get().messagesData);
        if (typeof newMessagesDataOrFunction === "object")
          set((ps) => ({ ...ps, messagesData: newMessagesData }));
        else set((ps) => ({ ...ps, messagesData: newMessagesData }));
      },
      setFlashcardsGoal: (flashcardsGoal) =>
        set((pS) => ({ ...pS, flashcardsGoal })),
    }),
    {
      name: "brick-storage",
      skipHydration: true,
    }
  )
);
