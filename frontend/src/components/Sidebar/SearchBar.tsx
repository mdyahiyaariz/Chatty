import { Search } from "lucide-react";
import { useConversationsContext } from "../../contexts/ConversationsContext";

const SearchBar: React.FC = () => {
    const {searchTerm, setSearchTerm} = useConversationsContext();

    return <div className="px-5 pb-4 relative">
        <input
            type="text"
            placeholder="Search conversations"
            className="w-full text-sm bg-ink-soft text-paper placeholder-paper/35 rounded-lg py-2.5 px-4 pl-10 border border-transparent focus:outline-none focus:border-teal/60 focus:bg-ink-soft transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute size-[16px] text-paper/35 left-[33px] top-[50%] -translate-y-[50%]"/>
    </div>
}

export default SearchBar;
