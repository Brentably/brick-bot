import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Flashcard } from "./types";
import { Message } from "ai";
import { MessageData } from "../lib/types";
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
  tooltipDisplayCount: number;
  incrementTooltipDisplayCount: () => void;
  mixpanelId: string
}

const INIT_STORE = {
  flashcards: [],
  zustandMessages: [],
  hasStarted: false,
  messagesData: [
    { role: "system", didMakeMistakes: null },
    { role: "user", didMakeMistakes: null },
  ] as MessageData[],
  flashcardsGoal: 10,
  tooltipDisplayCount: 0,
  mixpanelId: crypto.randomUUID()
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
      resetStore: () => set(() => ({ ...INIT_STORE, mixpanelId: get().mixpanelId })),
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
      incrementTooltipDisplayCount: () =>
        set((ps) => ({ ...ps, tooltipDisplayCount: ps.tooltipDisplayCount + 1 })),
    }),
    {
      name: "brick-storage",
      skipHydration: true,
    }
  )
);
