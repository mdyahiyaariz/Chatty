const label = (names: string[]) =>
    names.length === 1 ? `${names[0]} is typing` : names.length === 2 ? `${names[0]} and ${names[1]} are typing` : "Several people are typing";

const TypingIndicator: React.FC<{ names: string[] }> = ({ names }) => {
    return <div className="flex items-center gap-2 mb-2 ml-1" aria-live="polite">
        <div className="bg-white border border-paper-line px-3 py-2.5 rounded-xl flex items-center gap-1">
            {[0, 0.2, 0.4].map((delay) => (
                <div key={delay} className="size-1.5 bg-ink/30 rounded-full animate-pulse" style={{animationDelay: `${delay}s`}}></div>
            ))}
        </div>
        <span className="text-xs text-ink/40">{label(names)}</span>
    </div>
}

export default TypingIndicator;
