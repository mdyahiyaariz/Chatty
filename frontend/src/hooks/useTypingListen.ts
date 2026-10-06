import { useEffect, useRef, useState, type RefObject } from "react";
import { useSocketContext } from "../contexts/SocketContext";

const isNearBottom = (containerRef: RefObject<HTMLDivElement | null>) => {
    if (!containerRef.current) return false;

    const {scrollTop, scrollHeight, clientHeight} = containerRef.current;
    return scrollTop + clientHeight >= scrollHeight - 100;
}

const without = (record: Record<string, string>, key: string) => {
    const copy = { ...record };
    delete copy[key];
    return copy;
};

const STALE_AFTER_MS = 4000; // a "typing" state is dropped if the stop event never arrives

/** Names of everyone currently typing in this conversation. Works for one person or a whole group. */
export function useTypingListen(
    conversationId: string | undefined,
    containerRef: RefObject<HTMLDivElement | null>
) {
    const { socket } = useSocketContext();
    const [typing, setTyping] = useState<Record<string, string>>({});
    const timers = useRef<Record<string, number>>({});

    useEffect(() => {
        setTyping({});
        if (!socket || !conversationId) return;

        const handleTyping = (payload: {conversationId: string; userId: string; username: string; isTyping: boolean}) => {
            if (payload.conversationId !== conversationId) return;

            window.clearTimeout(timers.current[payload.userId]);

            if (payload.isTyping) {
                timers.current[payload.userId] = window.setTimeout(
                    () => setTyping((prev) => without(prev, payload.userId)), STALE_AFTER_MS);
                setTyping((prev) => ({...prev, [payload.userId]: payload.username}));

                if (isNearBottom(containerRef)) {
                    setTimeout(() => containerRef.current?.scrollTo({top: containerRef.current.scrollHeight, behavior: 'smooth'}), 0)
                }
            } else {
                setTyping((prev) => without(prev, payload.userId));
            }
        }

        socket.on("conversation:update-typing", handleTyping);
        const activeTimers = timers.current;

        return () => {
            socket.off("conversation:update-typing", handleTyping);
            Object.values(activeTimers).forEach((t) => window.clearTimeout(t));
        }
    }, [socket, conversationId, containerRef])

    return { typingNames: Object.values(typing) }
}
