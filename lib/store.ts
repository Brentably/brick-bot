import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BrickCard, Flashcard } from "./types";
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
  resetChat: () => void;
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
  mixpanelId: string;
  allowedWordList: string[];
  setAllowedWordList: (
    allowedWordList: 
      | string[] 
      | ((previousAllowedWordList: string[]) => string[])
  ) => void;
  rootWordToCard: Record<string, BrickCard>;
  setRootWordToCard: (
    rootWordToCard:
      | Record<string, BrickCard>
      | ((rootWordToCard: Record<string, BrickCard>) => Record<string, BrickCard>)
  ) => void;
}

const INIT_STORE = {
  flashcards: [],
  zustandMessages: [],
  hasStarted: false,
  messagesData: [] as MessageData[],
  flashcardsGoal: 10,
  tooltipDisplayCount: 0,
  mixpanelId: crypto.randomUUID(),
  allowedWordList: [],
  rootWordToCard: {},
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
      resetChat: () =>
        set(() => ({ ...INIT_STORE, allowedWordList: get().allowedWordList, rootWordToCard: get().rootWordToCard, mixpanelId: get().mixpanelId })),
      setMessagesData: (newMessagesDataOrFunction) => {
        const newMessagesData =
          typeof newMessagesDataOrFunction === "object"
            ? newMessagesDataOrFunction
            : newMessagesDataOrFunction(get().messagesData);
        set((ps) => ({ ...ps, messagesData: newMessagesData }));
      },
      setFlashcardsGoal: (flashcardsGoal) =>
        set((pS) => ({ ...pS, flashcardsGoal })),
      incrementTooltipDisplayCount: () =>
        set((ps) => ({
          ...ps,
          tooltipDisplayCount: ps.tooltipDisplayCount + 1,
        })),
      setAllowedWordList: (allowedWordListOrFunction) => {
        const allowedWordList =
          typeof allowedWordListOrFunction === "function"
            ? allowedWordListOrFunction(get().allowedWordList)
            : allowedWordListOrFunction;
        set((pS) => ({ ...pS, allowedWordList }));
      },
      setRootWordToCard: (newRootWordToCardOrFunction) => {
        const newRootWordToCard =
          typeof newRootWordToCardOrFunction === "object"
            ? newRootWordToCardOrFunction
            : newRootWordToCardOrFunction(get().rootWordToCard);
          set((ps) => ({ ...ps, rootWordToCard: newRootWordToCard }));
      },
    }),
    {
      name: "brick-storage",
      skipHydration: true,
    }
  )
);
