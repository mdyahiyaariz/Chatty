import { useState } from "react";
import { Users } from "lucide-react";
import { getAssetUrl } from "../../utils/assetUrl";

// Quiet, tonal fallbacks so initials never fight with the interface colours.
const TONES = [
    "bg-teal-soft text-teal-dark",
    "bg-amber-100 text-amber-900",
    "bg-stone-200 text-stone-700",
    "bg-emerald-100 text-emerald-900",
    "bg-orange-100 text-orange-900",
    "bg-slate-200 text-slate-700",
];

const toneFor = (name: string) => {
    let hash = 0;
    for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    return TONES[hash % TONES.length];
};

const initialsOf = (name: string) =>
    name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";

type AvatarProps = {
    name: string;
    src?: string | null;
    size?: number;
    /** Groups use a rounded square so they read differently from people at a glance. */
    group?: boolean;
    online?: boolean;
    ringClass?: string;
};

const Avatar: React.FC<AvatarProps> = ({ name, src, size = 40, group = false, online, ringClass = "border-ink" }) => {
    const [failedSrc, setFailedSrc] = useState<string | null>(null);
    const showImage = !!src && failedSrc !== src;
    const shape = group ? "rounded-lg" : "rounded-full";

    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            {showImage ? (
                <img
                    src={getAssetUrl(src)}
                    alt={name}
                    onError={() => setFailedSrc(src ?? null)}
                    className={`size-full object-cover ${shape} ring-1 ring-black/10`}
                />
            ) : (
                <div
                    aria-label={name}
                    className={`size-full flex items-center justify-center font-medium ${shape} ${toneFor(name)}`}
                    style={{ fontSize: size * 0.38 }}
                >
                    {group ? <Users style={{ width: size * 0.45, height: size * 0.45 }} /> : initialsOf(name)}
                </div>
            )}
            {online !== undefined && (
                <span
                    className={`absolute bottom-0 right-0 rounded-full border-2 ${ringClass} ${online ? "bg-teal" : "bg-paper/30"}`}
                    style={{ width: Math.max(10, size * 0.28), height: Math.max(10, size * 0.28) }}
                />
            )}
        </div>
    );
};

export default Avatar;
