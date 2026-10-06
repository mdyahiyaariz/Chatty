import { useSelectedConversation } from "../../hooks/useSelectedConversation";
import ChatHeader from "./ChatHeader";
import ChatPlaceholder from "./ChatPlaceholder";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";

const ChatWindow: React.FC = () => {
    const conversation = useSelectedConversation();

    if (!conversation) return <ChatPlaceholder />;

    return <div className="min-h-screen max-h-screen w-full bg-paper flex flex-col justify-between">
        <ChatHeader />
        <MessageList key={conversation.conversationId} />
        <MessageInput />
    </div>
}

export default ChatWindow;
