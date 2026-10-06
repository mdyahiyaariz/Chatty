import { useState } from "react";
import { Check, Search } from "lucide-react";
import Avatar from "./Avatar";
import type { Member } from "../../types/chat";

type FriendPickerProps = {
    friends: Member[];
    selected: string[];
    onToggle: (id: string) => void;
    emptyText: string;
};

/** Searchable checklist of friends. Used when creating a group and when adding people to one. */
const FriendPicker: React.FC<FriendPickerProps> = ({ friends, selected, onToggle, emptyText }) => {
    const [query, setQuery] = useState("");
    const shown = friends.filter((f) => `${f.fullName} ${f.username}`.toLowerCase().includes(query.trim().toLowerCase()));

    if (friends.length === 0) return <p className="text-sm text-ink/45 py-3">{emptyText}</p>;

    return <div>
        <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink/35" />
            <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search friends"
                className="w-full text-sm bg-white border border-paper-line rounded-md py-2 pl-9 pr-3 focus:outline-none focus:border-teal"
            />
        </div>
        <ul className="max-h-52 overflow-y-auto border border-paper-line rounded-md divide-y divide-paper-line bg-white">
            {shown.map((friend) => {
                const checked = selected.includes(friend.id);
                return <li key={friend.id}>
                    <button
                        type="button"
                        onClick={() => onToggle(friend.id)}
                        aria-pressed={checked}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left cursor-pointer transition-colors ${checked ? "bg-teal-soft/60" : "hover:bg-paper-dim"}`}
                    >
                        <Avatar name={friend.fullName} src={friend.avatarUrl} size={32} />
                        <span className="flex-1 min-w-0">
                            <span className="block text-sm text-ink truncate">{friend.fullName}</span>
                            <span className="block text-xs text-ink/40 truncate">@{friend.username}</span>
                        </span>
                        <span className={`size-5 rounded border flex items-center justify-center ${checked ? "bg-teal border-teal text-paper" : "border-ink/25"}`}>
                            {checked && <Check className="size-3.5" />}
                        </span>
                    </button>
                </li>;
            })}
            {shown.length === 0 && <li className="px-3 py-3 text-sm text-ink/40">No friends match “{query}”</li>}
        </ul>
    </div>;
};

export default FriendPicker;
