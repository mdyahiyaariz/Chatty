import ChatWindow from "../../components/ChatWindow/ChatWindow";
import Sidebar from "../../components/Sidebar/Sidebar";
import { SocketProvider } from "../../contexts/SocketContext";
import { FriendRequestsProvider } from "../../contexts/FriendRequestsContext";
import { ConversationsProvider } from "../../contexts/ConversationsContext";
import { useConversationStore } from "../../stores/conversationStore";

const Chat: React.FC = () => {
    const selectedId = useConversationStore((s) => s.selectedConversationId);

    // Providers sit above both panes so the sidebar and the chat window read the same live data.
    return <SocketProvider>
        <FriendRequestsProvider>
            <ConversationsProvider>
                <div className="min-h-screen flex bg-paper-dim">
                    <div className={`w-full sm:block sm:w-[340px] sm:shrink-0 min-h-screen ${selectedId ? 'hidden' : 'block'}`}>
                        <Sidebar />
                    </div>
                    <div className={`${selectedId ? 'flex' : 'hidden'} sm:flex flex-1 min-w-0 min-h-screen`}>
                        <ChatWindow />
                    </div>
                </div>
            </ConversationsProvider>
        </FriendRequestsProvider>
    </SocketProvider>
}

export default Chat;
