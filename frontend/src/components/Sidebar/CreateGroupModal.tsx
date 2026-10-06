import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import Modal from "../ui/Modal";
import AvatarPicker from "../ui/AvatarPicker";
import FriendPicker from "../ui/FriendPicker";
import { conversationService } from "../../services/conversationService";
import { useConversationStore } from "../../stores/conversationStore";

const MIN_FRIENDS = 2;

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose }) => {
    const [name, setName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [selected, setSelected] = useState<string[]>([]);
    const [creating, setCreating] = useState(false);
    const setSelectedConversationId = useConversationStore((s) => s.setSelectedConversationId);

    const { data: friends = [], isLoading } = useQuery({
        queryKey: ["friends"],
        queryFn: conversationService.fetchFriends,
        enabled: isOpen,
        staleTime: 0,
    });

    useEffect(() => {
        if (!isOpen) {
            setName(""); setAvatarUrl(null); setSelected([]);
        }
    }, [isOpen]);

    const toggle = (id: string) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    const canCreate = name.trim().length > 0 && selected.length >= MIN_FRIENDS && !creating;

    const create = async () => {
        setCreating(true);
        try {
            const { conversationId } = await conversationService.createGroup({ name: name.trim(), memberIds: selected, avatarUrl });
            setSelectedConversationId(conversationId);
            toast.success(`“${name.trim()}” created`);
            onClose();
        } catch (error: unknown) {
            toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Could not create the group");
        } finally {
            setCreating(false);
        }
    };

    return <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="New group"
        footer={
            <button
                type="button"
                onClick={create}
                disabled={!canCreate}
                className="w-full flex justify-center items-center bg-teal text-paper py-3 rounded-md hover:bg-teal-dark transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
                {creating ? <Loader2 className="animate-spin size-5" /> : `Create group${selected.length ? ` with ${selected.length + 1} people` : ""}`}
            </button>
        }
    >
        <div className="space-y-5">
            <AvatarPicker name={name || "Group"} value={avatarUrl} onChange={setAvatarUrl} group />

            <div>
                <label htmlFor="groupName" className="block text-sm text-ink/70 mb-1.5">Group name</label>
                <input
                    id="groupName"
                    value={name}
                    maxLength={50}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Weekend plans"
                    className="w-full text-sm text-ink bg-white border border-paper-line rounded-md px-3 py-2.5 focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
                />
            </div>

            <div>
                <div className="flex justify-between items-baseline mb-1.5">
                    <span className="text-sm text-ink/70">Add friends</span>
                    <span className={`text-xs ${selected.length >= MIN_FRIENDS ? "text-teal" : "text-ink/40"}`}>{selected.length} selected · pick at least {MIN_FRIENDS}</span>
                </div>
                {isLoading
                    ? <div className="flex justify-center py-6"><div className="size-7 bg-teal-soft rounded-full animate-pulse" /></div>
                    : <FriendPicker friends={friends} selected={selected} onToggle={toggle} emptyText="You need friends first. Add people with their Connect ID, then start a group." />}
            </div>
        </div>
    </Modal>;
};

export default CreateGroupModal;
