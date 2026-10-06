import { useConversationStore } from "../stores/conversationStore";
import { useConversationsContext } from "../contexts/ConversationsContext";
import type { Conversation } from "../types/chat";

/** The open conversation, always read from live state. */
export function useSelectedConversation(): Conversation | null {
    const id = useConversationStore((s) => s.selectedConversationId);
    const { conversations } = useConversationsContext();
    return conversations.find((c) => c.conversationId === id) ?? null;
}
