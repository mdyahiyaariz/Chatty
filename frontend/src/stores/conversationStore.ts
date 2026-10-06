import { create } from "zustand";

/* Only the id is stored. The conversation itself lives in ConversationsContext, so the open chat
   always shows live data (new members, online status, renamed group) instead of a stale copy. */
type ConversationState = {
    selectedConversationId: string | null,
    setSelectedConversationId: (id: string | null) => void;
}

export const useConversationStore = create<ConversationState>((set) => ({
    selectedConversationId: null,
    setSelectedConversationId: (id) => set({selectedConversationId: id})
}))
