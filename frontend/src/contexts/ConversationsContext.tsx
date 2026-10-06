import React, { createContext, useContext, useEffect, useState } from "react"
import { toast } from "sonner";
import { useConversations } from "../hooks/useConversations"
import { useSocketContext } from "./SocketContext"
import { useAuthStore } from "../stores/authStore";
import { useConversationStore } from "../stores/conversationStore";
import type { Conversation, LastMessage } from "../types/chat";
import { conversationTitle, getFriend } from "../utils/conversation";

type ConversationsContextType = {
    conversations: Conversation[],
    filteredConversations: Conversation[],
    searchTerm: string,
    setSearchTerm: (term: string) => void;

    isLoading: boolean
    isError: boolean
}

const ConversationsContext = createContext<ConversationsContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useConversationsContext = () => {
    const context = useContext(ConversationsContext);
    if (!context) throw new Error("useConversationsContext must be used within ConversationsProvider")
    return context;
}

export const ConversationsProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const {data, isLoading, isError} = useConversations();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const { socket } = useSocketContext();
    const { user, setUser } = useAuthStore();
    const myId = user?.id;

    useEffect(() => {
        if (data) setConversations(data.data);
    }, [data])

    const term = searchTerm.trim().toLowerCase();
    const filteredConversations = conversations.filter((c) =>
        !term
        || conversationTitle(c, myId).toLowerCase().includes(term)
        || c.members.some((m) => m.username.toLowerCase().includes(term))
    )

    useEffect(() => {
        if (!socket) return;

        const upsert = (conversation: Conversation) =>
            setConversations((prev) =>
                prev.some((c) => c.conversationId === conversation.conversationId)
                    ? prev.map((c) => c.conversationId === conversation.conversationId ? conversation : c)
                    : [conversation, ...prev]
            );

        const onOnlineStatus = ({friendId, username, online}: {friendId: string, username: string, online: boolean}) => {
            setConversations((prev) => prev.map((c) => ({
                ...c,
                members: c.members.map((m) => m.id === friendId ? {...m, online} : m),
            })));
            toast.info(`${username} is ${online ? "online" : "offline"}`);
        };

        // A new 1-to-1 chat after a friend request is accepted.
        const onAccept = (conversation: Conversation) => {
            upsert(conversation);
            toast.success(`You and ${getFriend(conversation, myId)?.username ?? "your friend"} are now friends!`);
        };

        // Added to a group (or created one).
        const onAdded = (conversation: Conversation) => {
            upsert(conversation);
            if (conversation.createdBy !== myId) toast.success(`You were added to “${conversation.name}”`);
        };

        const onRemoved = ({conversationId, reason}: {conversationId: string, reason: "left" | "removed"}) => {
            setConversations((prev) => prev.filter((c) => c.conversationId !== conversationId));
            const store = useConversationStore.getState();
            if (store.selectedConversationId === conversationId) store.setSelectedConversationId(null);
            if (reason === "removed") toast.info("You were removed from a group");
        };

        const onUnread = ({conversationId, unreadCounts}: {conversationId: string, unreadCounts: Record<string, number>}) =>
            setConversations((prev) => prev.map((c) => c.conversationId === conversationId ? {...c, unreadCounts} : c));

        const onConversationUpdate = ({conversationId, lastMessage, unreadCounts}:
            {conversationId: string, lastMessage: LastMessage | null, unreadCounts: Record<string, number>}) =>
            setConversations((prev) => {
                const updated = prev.map((c) => c.conversationId === conversationId ? {...c, lastMessage, unreadCounts} : c);
                // Newest activity floats to the top.
                return updated.sort((a, b) => new Date(b.lastMessage?.timestamp ?? 0).getTime() - new Date(a.lastMessage?.timestamp ?? 0).getTime());
            });

        const onProfileUpdated = (profile: {id: string, fullName: string, avatarUrl: string | null}) => {
            setConversations((prev) => prev.map((c) => ({
                ...c,
                members: c.members.map((m) => m.id === profile.id ? {...m, fullName: profile.fullName, avatarUrl: profile.avatarUrl} : m),
            })));
            const me = useAuthStore.getState().user;
            if (me && me.id === profile.id) setUser({...me, fullName: profile.fullName, avatarUrl: profile.avatarUrl});
        };

        const onErrorNew = () => toast.error("Unable to add conversation!");
        const onErrorRead = () => toast.error("Unable to mark conversation as read!");

        socket.on("conversation:online-status", onOnlineStatus);
        socket.on("conversation:accept", onAccept);
        socket.on("conversation:added", onAdded);
        socket.on("conversation:updated", upsert);
        socket.on("conversation:removed", onRemoved);
        socket.on("conversation:update-unread-counts", onUnread);
        socket.on("conversation:update-conversation", onConversationUpdate);
        socket.on("user:profile-updated", onProfileUpdated);
        socket.on("conversation:request:error", onErrorNew);
        socket.on("conversation:mark-as-read:error", onErrorRead);

        return () => {
            socket.off("conversation:online-status", onOnlineStatus);
            socket.off("conversation:accept", onAccept);
            socket.off("conversation:added", onAdded);
            socket.off("conversation:updated", upsert);
            socket.off("conversation:removed", onRemoved);
            socket.off("conversation:update-unread-counts", onUnread);
            socket.off("conversation:update-conversation", onConversationUpdate);
            socket.off("user:profile-updated", onProfileUpdated);
            socket.off("conversation:request:error", onErrorNew);
            socket.off("conversation:mark-as-read:error", onErrorRead);
        }
    }, [socket, myId, setUser])

    return <ConversationsContext.Provider value={{conversations, filteredConversations, searchTerm, setSearchTerm, isLoading, isError}}>
        {children}
    </ConversationsContext.Provider>
}
