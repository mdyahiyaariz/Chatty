import { useEffect, useMemo, type RefObject } from "react";
import { useAuthStore } from "../stores/authStore";
import { useSocketContext } from "../contexts/SocketContext";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { toast } from "sonner"
import type { Message, MessageReaction } from "../services/messageService";


export function useMessageListen(
    conversationId: string | undefined,
    containerRef: RefObject<HTMLDivElement | null>
) {
    const { user } = useAuthStore();    
    const { socket } = useSocketContext();
    const queryClient = useQueryClient();
    const sound = useMemo(() => new Audio("/pop.mp3"), []);

    useEffect(() => {
        if (!conversationId || !socket) return;

        const handleSendMessageError = (error: {error: string}) => toast.error(error.error);
        const handleReactError = (error: {error: string}) => toast.error(error.error);

        const handleNewMessage = (payload: {conversationId: string, message: Message}) => {
            if (payload.conversationId !== conversationId) return;
            
            queryClient.setQueryData(
                ["messages", conversationId],
                (currentData: InfiniteData<{messages: Message[], nextCursor: string, hasNext: boolean}>) => {
                    if (!currentData || !currentData.pages.length) return currentData;

                    const messages = currentData.pages.flatMap((page) => page.messages);
                    if (messages.some((message: Message) => message._id === payload.message._id)) return currentData;

                    const updatesPages = [...currentData.pages];
                    updatesPages[0] = {
                        ...updatesPages[0],
                        messages: [...updatesPages[0].messages, payload.message]
                    }     
                    
                    return {...currentData, pages: updatesPages}
                }
            )

            if (payload.message.sender._id !== user?.id) {
                try {
                    sound.currentTime = 0;
                    sound.play();
                } catch (error) {
                    console.warn("Audio playback failed", error);
                }
            }

            setTimeout(() => {
                if (!containerRef.current) return;

                containerRef.current.scrollTo({
                    top: containerRef.current.scrollHeight,
                    behavior: 'smooth'
                })
            }, 0)
        }

        const handleMessageReaction = (payload: {conversationId: string, messageId: string, reactions: MessageReaction[]}) => {
            if (payload.conversationId !== conversationId) return;

            queryClient.setQueryData(
                ["messages", conversationId],
                (currentData: InfiniteData<{messages: Message[], nextCursor: string, hasNext: boolean}>) => {
                    if (!currentData || !currentData.pages.length) return currentData;

                    const updatedPages = currentData.pages.map((page) => ({
                        ...page,
                        messages: page.messages.map((message) =>
                            message._id === payload.messageId
                                ? { ...message, reactions: payload.reactions }
                                : message
                        )
                    }))

                    return { ...currentData, pages: updatedPages }
                }
            )
        }

        socket.on("conversation:new-message", handleNewMessage);
        socket.on("conversation:send-message:error", handleSendMessageError);
        socket.on("conversation:message-reaction", handleMessageReaction);
        socket.on("conversation:react-to-message:error", handleReactError);

        return () => {
            socket.off("conversation:new-message", handleNewMessage);
            socket.off("conversation:send-message:error", handleSendMessageError);
            socket.off("conversation:message-reaction", handleMessageReaction);
            socket.off("conversation:react-to-message:error", handleReactError);
        }
    }, [conversationId, user, socket, queryClient, sound, containerRef])
}
