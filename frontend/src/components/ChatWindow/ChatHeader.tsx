import { useState } from "react";
import { ArrowLeft, Info } from "lucide-react";
import { useConversationStore } from "../../stores/conversationStore";
import { useSelectedConversation } from "../../hooks/useSelectedConversation";
import { useAuthStore } from "../../stores/authStore";
import Avatar from "../ui/Avatar";
import GroupInfoModal from "./GroupInfoModal";
import { conversationAvatarUrl, conversationTitle, getFriend, isGroup } from "../../utils/conversation";

const ChatHeader: React.FC = () => {
    const conversation = useSelectedConversation();
    const setSelectedConversationId = useConversationStore((s) => s.setSelectedConversationId);
    const { user } = useAuthStore();
    const [infoOpen, setInfoOpen] = useState(false);

    if (!conversation) return null;

    const group = isGroup(conversation);
    const title = conversationTitle(conversation, user?.id);
    const friend = group ? undefined : getFriend(conversation, user?.id);
    const onlineCount = conversation.members.filter((m) => m.online).length;

    const subtitle = group
        ? `${conversation.members.length} members · ${onlineCount} online`
        : friend?.online ? "Online" : "Offline";

    return <div className="px-4 sm:px-6 py-3.5 border-b border-paper-line bg-paper flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setSelectedConversationId(null)} className="sm:hidden p-1.5 -ml-1 rounded-md text-ink/50 hover:text-ink hover:bg-ink/5 cursor-pointer" aria-label="Back to conversations">
                <ArrowLeft className="size-5"/>
            </button>
            <Avatar name={title} src={conversationAvatarUrl(conversation, user?.id)} size={42} group={group} online={friend?.online} ringClass="border-paper" />
            <div className="min-w-0">
                <h2 className="font-medium text-ink truncate">{title}</h2>
                <p className={`text-xs truncate ${!group && friend?.online ? 'text-teal' : 'text-ink/45'}`}>{subtitle}</p>
            </div>
        </div>
        {group && (
            <button onClick={() => setInfoOpen(true)} className="p-2 rounded-md text-ink/45 hover:text-ink hover:bg-ink/5 cursor-pointer transition-colors" aria-label="Group info" title="Group info">
                <Info className="size-[18px]"/>
            </button>
        )}
        {group && <GroupInfoModal key={conversation.conversationId + conversation.name} conversation={conversation} isOpen={infoOpen} onClose={() => setInfoOpen(false)} />}
    </div>
}

export default ChatHeader;
