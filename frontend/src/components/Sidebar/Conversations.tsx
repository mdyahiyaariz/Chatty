import { useConversationsContext } from "../../contexts/ConversationsContext";
import ConversationItem from "./ConversationItem";

const Conversations: React.FC = () => {
    const {filteredConversations, isLoading, isError, searchTerm} = useConversationsContext();

    if (isLoading) {
        return <div className="flex-1 flex items-center justify-center py-6">
            <div className="size-8 bg-white/10 rounded-full animate-pulse"></div>
        </div>
    }

    if (isError) {
        return <div className="flex-1 px-5 py-4 text-sm text-paper/50">Something went wrong loading your conversations.</div>
    }

    if (filteredConversations.length === 0) {
        return <div className="flex-1 px-5 py-6 text-sm text-paper/40">
            {searchTerm ? "No conversations match your search" : "No conversations yet. Add a friend, or start a group once you have two."}
        </div>
    }

    return <div className="flex-1 overflow-y-auto py-1">
        {filteredConversations.map((conversation) => <ConversationItem key={conversation.conversationId} conversation={conversation} />)}
    </div>
}

export default Conversations;
