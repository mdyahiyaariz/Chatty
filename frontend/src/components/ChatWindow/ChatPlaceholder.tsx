import { MessageCircle } from "lucide-react";

const ChatPlaceholder: React.FC = () => {
    return <div className="min-h-screen w-full bg-paper flex flex-col items-center justify-center text-center p-8">
        <div className="bg-teal-soft p-5 rounded-lg mb-5">
            <MessageCircle className="size-8 text-teal"/>
        </div>
        <h2 className="font-display text-2xl text-ink">Welcome to Chatty</h2>
        <p className="text-sm mt-2 text-ink/45 max-w-xs">Pick a conversation to continue, or start a group with two or more friends.</p>
    </div>
}

export default ChatPlaceholder;
