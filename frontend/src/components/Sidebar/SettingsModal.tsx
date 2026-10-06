import { useState } from "react";
import { Check, Copy, LogOut, Mail, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import Modal from "../ui/Modal";
import AvatarPicker from "../ui/AvatarPicker";
import { useAuthStore } from "../../stores/authStore";
import { useConversationStore } from "../../stores/conversationStore";
import { authService } from "../../services/authService";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { user, logout, setUser } = useAuthStore();
    const setSelectedConversationId = useConversationStore((s) => s.setSelectedConversationId);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [copied, setCopied] = useState(false);
    const [name, setName] = useState(user?.fullName ?? "");
    const [saving, setSaving] = useState(false);

    const errorOf = (error: unknown) => (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Could not save changes";

    const changeAvatar = async (avatarUrl: string | null) => {
        try {
            const data = await authService.updateProfile({ avatarUrl });
            setUser(data.user);
            toast.success(avatarUrl ? "Profile picture updated" : "Profile picture removed");
        } catch (error) {
            toast.error(errorOf(error));
        }
    };

    const saveName = async () => {
        if (!name.trim() || name.trim() === user?.fullName) return;
        setSaving(true);
        try {
            const data = await authService.updateProfile({ fullName: name.trim() });
            setUser(data.user);
            toast.success("Name updated");
        } catch (error) {
            toast.error(errorOf(error));
        } finally {
            setSaving(false);
        }
    };

    const copyConnectCode = async () => {
        if (!user?.connectCode) return;
        try {
            await navigator.clipboard.writeText(user.connectCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // Clipboard can be blocked (permissions, non-secure context); fail silently.
        }
    };

    const logoutUser = async () => {
        await authService.logout();
        logout();
        queryClient.removeQueries();
        setSelectedConversationId(null);
        onClose();
        navigate("/auth");
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Profile & settings">
            <div className="pb-5 mb-5 border-b border-paper-line">
                <AvatarPicker name={user?.fullName ?? "You"} value={user?.avatarUrl} onChange={changeAvatar} />
            </div>

            <div className="space-y-4">
                <div>
                    <label htmlFor="fullName" className="flex items-center gap-2 text-xs text-ink/45 mb-1.5">
                        <UserIcon className="size-3.5" /> Display name
                    </label>
                    <div className="flex gap-2">
                        <input
                            id="fullName"
                            value={name}
                            maxLength={30}
                            onChange={(e) => setName(e.target.value)}
                            className="flex-1 min-w-0 text-sm text-ink bg-white border border-paper-line rounded-md px-3 py-2.5 focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
                        />
                        <button
                            type="button"
                            onClick={saveName}
                            disabled={saving || name.trim().length < 3 || name.trim() === user?.fullName}
                            className="px-4 text-sm bg-teal text-paper rounded-md hover:bg-teal-dark disabled:opacity-40 cursor-pointer"
                        >
                            Save
                        </button>
                    </div>
                </div>

                <div>
                    <label className="flex items-center gap-2 text-xs text-ink/45 mb-1.5">
                        <Mail className="size-3.5" /> Email
                    </label>
                    <p className="text-sm text-ink bg-paper-dim rounded-md px-3 py-2.5">{user?.email}</p>
                </div>

                <div>
                    <label className="text-xs text-ink/45 block mb-1.5">Connect ID · share it so friends can add you</label>
                    <div className="flex items-center gap-2">
                        <p className="flex-1 text-sm text-ink bg-paper-dim rounded-md px-3 py-2.5 font-mono tracking-wide">{user?.connectCode}</p>
                        <button
                            type="button"
                            onClick={copyConnectCode}
                            className="shrink-0 size-10 flex items-center justify-center rounded-md border border-paper-line text-ink/60 hover:text-teal hover:border-teal/40 transition-colors cursor-pointer"
                            aria-label="Copy connect ID"
                        >
                            {copied ? <Check className="size-4 text-teal" /> : <Copy className="size-4" />}
                        </button>
                    </div>
                </div>
            </div>

            <button
                type="button"
                onClick={logoutUser}
                className="mt-6 w-full flex items-center justify-center gap-2 text-sm text-red-600 border border-red-200 rounded-md py-2.5 hover:bg-red-50 transition-colors cursor-pointer"
            >
                <LogOut className="size-4" /> Log out
            </button>
        </Modal>
    );
};

export default SettingsModal;
