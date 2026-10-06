import { LogOut } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { authService } from "../../services/authService";
import { useNavigate } from "react-router";
import { useConversationStore } from "../../stores/conversationStore";
import Avatar from "../ui/Avatar";

const UserProfile: React.FC = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const setSelectedConversationId = useConversationStore((s) => s.setSelectedConversationId);
    const queryClient = useQueryClient();

    const logoutUser = async () => {
        await authService.logout();
        logout();
        queryClient.removeQueries();
        setSelectedConversationId(null);
        navigate('/auth');
    }

    return <div className="px-5 py-4 border-t border-ink-line flex items-center gap-3">
        <Avatar name={user?.fullName ?? "You"} src={user?.avatarUrl} size={40} online ringClass="border-ink" />
        <div className="flex-1 min-w-0">
            <h2 className="font-medium truncate text-sm text-paper">{user?.fullName}</h2>
            <p className="text-xs text-paper/40 truncate">@{user?.username} <span className="font-mono">· {user?.connectCode}</span></p>
        </div>
        <button onClick={logoutUser} className="p-2 rounded-md text-paper/45 hover:text-paper hover:bg-white/5 cursor-pointer transition-colors" aria-label="Log out" title="Log out">
            <LogOut className="size-[16px]"/>
        </button>
    </div>
}

export default UserProfile;
