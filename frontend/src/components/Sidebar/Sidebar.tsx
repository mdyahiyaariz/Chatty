import Conversations from "./Conversations";
import Header from "./Header";
import SearchBar from "./SearchBar";
import UserProfile from "./UserProfile";

const Sidebar: React.FC = () => {
    return <div className="min-h-screen max-h-screen bg-ink flex flex-col border-r border-ink-line">
        <Header />
        <SearchBar />
        <Conversations />
        <UserProfile />
    </div>
}

export default Sidebar;
