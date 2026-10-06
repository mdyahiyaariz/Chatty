import { useEffect, useMemo, useRef } from "react";
import { useMessages } from "../../hooks/useMessages";
import { useSelectedConversation } from "../../hooks/useSelectedConversation";
import MessageItem from "./MessageItem";
import { useSocketContext } from "../../contexts/SocketContext";
import { useMessageListen } from "../../hooks/useMessageListen";
import { useTypingListen } from "../../hooks/useTypingListen";
import TypingIndicator from "./TypingIndicator";
import { isGroup, memberMap } from "../../utils/conversation";

const MessageList: React.FC = () => {
    const conversation = useSelectedConversation();
    const conversationId = conversation?.conversationId;
    const containerRef = useRef<HTMLDivElement | null>(null);
    const { data, isLoading, handleLoadMore, isFetchingNextPage, hasNextPage } = useMessages(conversationId, containerRef);
    const { socket } = useSocketContext();
    const scrolledRef = useRef(false);

    const allMessages = data?.pages.slice().reverse().flatMap((page) => page.messages) ?? [];
    const members = useMemo(() => memberMap(conversation), [conversation]);
    const group = conversation ? isGroup(conversation) : false;

    useEffect(() => {
        if (!conversationId) return;

        if (data?.pages.length && !scrolledRef.current) {
            setTimeout(() => {
                if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight;
            }, 0)
            scrolledRef.current = true;
        }

        socket?.emit("conversation:mark-as-read", { conversationId })
    }, [data, conversationId, socket])

    useMessageListen(conversationId, containerRef);
    const { typingNames } = useTypingListen(conversationId, containerRef);

    if (isLoading) {
        return <div className="relative flex-1 h-full flex items-center justify-center">
            <div className="size-10 bg-teal-soft rounded-full animate-pulse"></div>
        </div>
    }

    return <div ref={containerRef} className="flex-1 bg-paper overflow-y-auto px-4 sm:px-6 py-5 pb-10">
        {hasNextPage && <div className="flex justify-center mb-4">
            <button
                type="button"
                className="px-3 py-1 text-xs bg-white border border-paper-line text-ink/60 rounded-md hover:bg-paper-dim transition-colors cursor-pointer"
                onClick={handleLoadMore}
                disabled={isFetchingNextPage}
            >
                {isFetchingNextPage ? 'Loading...' : 'Load earlier messages'}
            </button>
        </div>}

        {allMessages.length === 0 && (
            <p className="text-center text-sm text-ink/40 mt-10">{group ? "Say hello to the group." : "No messages yet. Say hello."}</p>
        )}

        {allMessages.map((message, i) => {
            const previous = allMessages[i - 1];
            // In a group, show the sender's name and picture once per run of messages.
            const startsRun = !previous || previous.sender._id !== message.sender._id;
            return <MessageItem
                key={message._id}
                {...message}
                conversationId={conversationId ?? ''}
                senderProfile={members.get(message.sender._id)}
                isGroup={group}
                startsRun={startsRun}
            />
        })}

        {typingNames.length > 0 && <TypingIndicator names={typingNames} />}
    </div>
}

export default MessageList;
