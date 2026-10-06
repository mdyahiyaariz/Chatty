import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LogOut, UserMinus } from "lucide-react";
import { toast } from "sonner";

import Modal from "../ui/Modal";
import Avatar from "../ui/Avatar";
import AvatarPicker from "../ui/AvatarPicker";
import FriendPicker from "../ui/FriendPicker";
import { conversationService } from "../../services/conversationService";
import { useAuthStore } from "../../stores/authStore";
import type { Conversation } from "../../types/chat";
import { isAdmin as isAdminOf } from "../../utils/conversation";

interface GroupInfoModalProps {
    conversation: Conversation;
    isOpen: boolean;
    onClose: () => void;
}

const errorOf = (error: unknown) => (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Something went wrong";

const GroupInfoModal: React.FC<GroupInfoModalProps> = ({ conversation, isOpen, onClose }) => {
    const { user } = useAuthStore();
    const admin = isAdminOf(conversation, user?.id);
    const [name, setName] = useState(conversation.name ?? "");
    const [toAdd, setToAdd] = useState<string[]>([]);
    const [busy, setBusy] = useState(false);

    const { data: friends = [] } = useQuery({
        queryKey: ["friends"],
        queryFn: conversationService.fetchFriends,
        enabled: isOpen && admin,
        staleTime: 0,
    });

    const memberIds = conversation.members.map((m) => m.id);
    const addable = friends.filter((f) => !memberIds.includes(f.id));

    const run = async (action: () => Promise<unknown>, success?: string) => {
        setBusy(true);
        try {
            await action();
            if (success) toast.success(success);
        } catch (error) {
            toast.error(errorOf(error));
        } finally {
            setBusy(false);
        }
    };

    const rename = () => run(() => conversationService.updateGroup(conversation.conversationId, { name: name.trim() }), "Group renamed");
    const changePicture = (avatarUrl: string | null) => run(() => conversationService.updateGroup(conversation.conversationId, { avatarUrl }), avatarUrl ? "Group picture updated" : "Group picture removed");
    const addPeople = () => run(async () => { await conversationService.addMembers(conversation.conversationId, toAdd); setToAdd([]); }, "People added");
    const remove = (id: string, label: string) => window.confirm(`Remove ${label} from the group?`) && run(() => conversationService.removeMember(conversation.conversationId, id));
    const leave = () => window.confirm("Leave this group? You will stop receiving its messages.") && run(async () => {
        await conversationService.removeMember(conversation.conversationId, user!.id);
        onClose();
    });

    return <Modal isOpen={isOpen} onClose={onClose} title="Group info" size="lg">
        <div className="space-y-6">
            {admin ? (
                <>
                    <AvatarPicker name={conversation.name ?? "Group"} value={conversation.avatarUrl} onChange={changePicture} group />
                    <div>
                        <label htmlFor="groupRename" className="block text-sm text-ink/70 mb-1.5">Group name</label>
                        <div className="flex gap-2">
                            <input
                                id="groupRename"
                                value={name}
                                maxLength={50}
                                onChange={(e) => setName(e.target.value)}
                                className="flex-1 min-w-0 text-sm text-ink bg-white border border-paper-line rounded-md px-3 py-2.5 focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
                            />
                            <button
                                type="button"
                                onClick={rename}
                                disabled={busy || !name.trim() || name.trim() === conversation.name}
                                className="px-4 text-sm bg-teal text-paper rounded-md hover:bg-teal-dark disabled:opacity-40 cursor-pointer"
                            >Save</button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex items-center gap-4">
                    <Avatar name={conversation.name ?? "Group"} src={conversation.avatarUrl} size={72} group />
                    <div>
                        <h3 className="font-display text-xl text-ink">{conversation.name}</h3>
                        <p className="text-sm text-ink/45">Only admins can edit this group</p>
                    </div>
                </div>
            )}

            <div>
                <h3 className="text-xs text-ink/45 mb-2">{conversation.members.length} members</h3>
                <ul className="divide-y divide-paper-line border border-paper-line rounded-md bg-white">
                    {conversation.members.map((member) => {
                        const isMe = member.id === user?.id;
                        return <li key={member.id} className="flex items-center gap-3 px-3 py-2.5">
                            <Avatar name={member.fullName} src={member.avatarUrl} size={36} online={member.online} ringClass="border-white" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-ink truncate">{member.fullName}{isMe && <span className="text-ink/40"> (you)</span>}</p>
                                <p className="text-xs text-ink/40 truncate">@{member.username}</p>
                            </div>
                            {conversation.admins.includes(member.id) && (
                                <span className="text-[11px] text-teal-dark bg-teal-soft px-2 py-0.5 rounded">Admin</span>
                            )}
                            {admin && !isMe && (
                                <button
                                    type="button"
                                    onClick={() => remove(member.id, member.fullName)}
                                    disabled={busy}
                                    className="p-1.5 text-ink/35 hover:text-red-600 cursor-pointer"
                                    aria-label={`Remove ${member.fullName}`}
                                    title="Remove from group"
                                >
                                    <UserMinus className="size-4" />
                                </button>
                            )}
                        </li>;
                    })}
                </ul>
            </div>

            {admin && addable.length > 0 && (
                <div>
                    <h3 className="text-xs text-ink/45 mb-2">Add people</h3>
                    <FriendPicker friends={addable} selected={toAdd} onToggle={(id) => setToAdd((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])} emptyText="" />
                    <button
                        type="button"
                        onClick={addPeople}
                        disabled={busy || toAdd.length === 0}
                        className="mt-3 w-full bg-teal text-paper py-2.5 rounded-md text-sm hover:bg-teal-dark disabled:opacity-40 cursor-pointer"
                    >
                        {toAdd.length ? `Add ${toAdd.length} ${toAdd.length === 1 ? "person" : "people"}` : "Select friends to add"}
                    </button>
                </div>
            )}

            <button
                type="button"
                onClick={leave}
                disabled={busy}
                className="w-full flex items-center justify-center gap-2 text-sm text-red-600 border border-red-200 rounded-md py-2.5 hover:bg-red-50 transition-colors cursor-pointer"
            >
                <LogOut className="size-4" /> Leave group
            </button>
        </div>
    </Modal>;
};

export default GroupInfoModal;
