import type { Conversation } from "../../types/chat";
import { useAuthStore } from "../../stores/authStore";
import { useConversationStore } from "../../stores/conversationStore";
import Avatar from "../ui/Avatar";
import { conversationAvatarUrl, conversationTitle, getFriend, isGroup, memberMap } from "../../utils/conversation";

const formatTime = (timestamp: string) => {
    const created = new Date(timestamp);
    const time = created.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (Date.now() - created.getTime() < 24 * 60 * 60 * 1000) return time;
    return created.toLocaleDateString([], { month: "short", day: "numeric" });
};

const ConversationItem: React.FC<{ conversation: Conversation }> = ({ conversation }) => {
    const { user } = useAuthStore();
    const { selectedConversationId, setSelectedConversationId } = useConversationStore();

    const group = isGroup(conversation);
    const unread = user ? (conversation.unreadCounts[user.id] ?? 0) : 0;
    const isSelected = selectedConversationId === conversation.conversationId;
    const title = conversationTitle(conversation, user?.id);
    const friend = group ? undefined : getFriend(conversation, user?.id);

    const { lastMessage } = conversation;
    let preview = lastMessage?.content ?? "";
    if (lastMessage && preview) {
        if (lastMessage.sender === user?.id) preview = `You: ${preview}`;
        else if (group && lastMessage.sender) preview = `${memberMap(conversation).get(lastMessage.sender)?.fullName.split(" ")[0] ?? "Someone"}: ${preview}`;
    } else if (group) {
        preview = `${conversation.members.length} members`;
    }

    return <button
        type="button"
        className={`
            w-full text-left px-5 py-3 flex items-center gap-3 cursor-pointer transition-colors border-l-2
            ${isSelected ? 'bg-white/[0.06] border-teal' : 'border-transparent hover:bg-white/[0.04]'}
        `}
        onClick={() => setSelectedConversationId(isSelected ? null : conversation.conversationId)}
    >
        <Avatar name={title} src={conversationAvatarUrl(conversation, user?.id)} size={44} group={group} online={friend?.online} />

        <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline gap-2">
                <h2 className={`truncate text-sm text-paper ${unread > 0 ? "font-semibold" : "font-medium"}`}>{title}</h2>
                {lastMessage?.timestamp && <span className="text-[11px] text-paper/35 shrink-0">{formatTime(lastMessage.timestamp)}</span>}
            </div>

            <div className="flex items-center gap-2">
                <p className={`text-sm truncate min-h-[20px] flex-1 ${unread > 0 ? "text-paper" : "text-paper/50"}`}>{preview}</p>
                {unread > 0 && (
                    <span className="bg-gold text-[11px] font-medium text-ink rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center shrink-0">
                        {unread > 99 ? "99+" : unread}
                    </span>
                )}
            </div>
        </div>
    </button>
}

export default ConversationItem;
