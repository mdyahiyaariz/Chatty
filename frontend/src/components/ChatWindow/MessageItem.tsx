import { useState } from "react";
import { SmilePlus } from "lucide-react";
import type { Message } from "../../services/messageService";
import { useAuthStore } from "../../stores/authStore";
import { useSocketContext } from "../../contexts/SocketContext";
import { getAssetUrl } from "../../utils/assetUrl";
import Avatar from "../ui/Avatar";
import type { Member } from "../../types/chat";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

interface MessageItemProps extends Message {
    conversationId: string;
    /** Live profile from the conversation, so a changed picture shows on old messages too. */
    senderProfile?: Member;
    isGroup: boolean;
    startsRun: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({
    _id,
    sender,
    content,
    createdAt,
    reactions = [],
    attachment,
    conversationId,
    senderProfile,
    isGroup,
    startsRun,
}) => {
    const { user } = useAuthStore();
    const { socket } = useSocketContext();
    const [pickerOpen, setPickerOpen] = useState(false);
    const userIsSender = sender._id === user?.id;

    const created = new Date(createdAt);
    const now = new Date();

    const diffInMs = now.getTime() - created.getTime();
    const diffInDays = diffInMs /  (1000 * 60 * 60 * 24);

    const time = created.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    })

    const date = created.toLocaleDateString([], {
        year: "numeric",
        month: "short",
        day: "numeric"
    })

    const displayTime = diffInDays > 1 ? `${date} ${time}` : time;

    // Group raw reactions into { emoji: { count, reactedByMe } } for display.
    const grouped = reactions.reduce<Record<string, { count: number; reactedByMe: boolean }>>((acc, reaction) => {
        if (!acc[reaction.emoji]) acc[reaction.emoji] = { count: 0, reactedByMe: false };
        acc[reaction.emoji].count += 1;
        if (reaction.user === user?.id) acc[reaction.emoji].reactedByMe = true;
        return acc;
    }, {});

    const react = (emoji: string) => {
        if (!socket) return;
        socket.emit("conversation:react-to-message", { conversationId, messageId: _id, emoji });
        setPickerOpen(false);
    };

    const ReactionPicker = (
        <div className="absolute z-10 -top-11 flex items-center gap-0.5 bg-ink rounded-full px-1.5 py-1 shadow-lg">
            {REACTION_EMOJIS.map((emoji) => (
                <button
                    key={emoji}
                    type="button"
                    onClick={() => react(emoji)}
                    className="text-base leading-none p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                >
                    {emoji}
                </button>
            ))}
        </div>
    );

    const ReactionChips = Object.keys(grouped).length > 0 && (
        <div className={`flex flex-wrap gap-1 mt-1 ${userIsSender ? "justify-end" : "justify-start"}`}>
            {Object.entries(grouped).map(([emoji, { count, reactedByMe }]) => (
                <button
                    key={emoji}
                    type="button"
                    onClick={() => react(emoji)}
                    className={`
                        text-xs leading-none flex items-center gap-1 px-2 py-1 rounded-full border transition-colors cursor-pointer
                        ${reactedByMe ? "bg-teal-soft border-teal/40 text-teal-dark" : "bg-white border-paper-line text-ink/60 hover:border-ink/20"}
                    `}
                >
                    <span>{emoji}</span>
                    <span>{count}</span>
                </button>
            ))}
        </div>
    );

    const AttachmentBlock = attachment && (
        attachment.type === "image" ? (
            <a href={getAssetUrl(attachment.url)} target="_blank" rel="noopener noreferrer">
                <img
                    src={getAssetUrl(attachment.url)}
                    alt="Attachment"
                    className="rounded-xl max-w-[240px] max-h-[320px] object-cover block"
                />
            </a>
        ) : (
            <audio controls src={getAssetUrl(attachment.url)} className="max-w-[240px]" />
        )
    );

    if (userIsSender) {
        return <div className="flex flex-col items-end mt-1 mb-0.5 group">
            <div className="relative flex items-center gap-1.5">
                <button
                    type="button"
                    onClick={() => setPickerOpen((open) => !open)}
                    onBlur={() => setTimeout(() => setPickerOpen(false), 150)}
                    className="opacity-0 group-hover:opacity-100 text-ink/35 hover:text-ink/60 transition-opacity cursor-pointer shrink-0"
                    aria-label="Add reaction"
                >
                    <SmilePlus className="size-4"/>
                </button>
                {pickerOpen && ReactionPicker}
                <div className="bg-ink text-paper p-3 max-w-xs lg:max-w-md rounded-xl rounded-br-sm">
                    {attachment && <div className="mb-1.5">{AttachmentBlock}</div>}
                    {content && <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{content}</p>}
                    <span className="text-[11px] text-paper/40 mt-1 block">{displayTime}</span>
                </div>
            </div>
            {ReactionChips}
        </div>
    }

    const displayName = senderProfile?.fullName ?? sender.fullName ?? sender.username;

    return <div className={`flex flex-col items-start group ${startsRun ? "mt-3" : "mt-1"} mb-0.5`}>
        <div className="relative flex items-center gap-1.5">
            <div className="mr-1 self-end w-8 shrink-0">
                {(startsRun || !isGroup) && (
                    <Avatar name={displayName} src={senderProfile ? senderProfile.avatarUrl : sender.avatarUrl} size={32} />
                )}
            </div>
            <div className="bg-white border border-paper-line p-3 max-w-xs lg:max-w-md rounded-xl rounded-bl-sm">
                {isGroup && startsRun && <p className="text-xs font-medium text-teal-dark mb-0.5">{displayName}</p>}
                {attachment && <div className="mb-1.5">{AttachmentBlock}</div>}
                {content && <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap break-words">{content}</p>}
                <span className="text-[11px] text-ink/35 mt-1 block">{displayTime}</span>
            </div>
            <button
                type="button"
                onClick={() => setPickerOpen((open) => !open)}
                onBlur={() => setTimeout(() => setPickerOpen(false), 150)}
                className="opacity-0 group-hover:opacity-100 text-ink/35 hover:text-ink/60 transition-opacity cursor-pointer shrink-0"
                aria-label="Add reaction"
            >
                <SmilePlus className="size-4"/>
            </button>
            {pickerOpen && ReactionPicker}
        </div>
        <div className="ml-9">{ReactionChips}</div>
    </div>
}

export default MessageItem;
