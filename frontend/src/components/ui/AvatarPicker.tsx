import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Avatar from "./Avatar";
import { uploadService } from "../../services/uploadService";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

type AvatarPickerProps = {
    name: string;
    value: string | null | undefined;
    onChange: (url: string | null) => void | Promise<void>;
    group?: boolean;
    size?: number;
};

/** Click the picture to choose a new one. Uploads straight away and hands the stored URL to onChange. */
const AvatarPicker: React.FC<AvatarPickerProps> = ({ name, value, onChange, group = false, size = 88 }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);

    const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        if (!ALLOWED.includes(file.type)) return void toast.error("Use a JPG, PNG or WebP image");
        if (file.size > MAX_BYTES) return void toast.error("Picture must be 2 MB or smaller");

        setBusy(true);
        try {
            const url = await uploadService.uploadAvatar(file);
            await onChange(url);
        } catch (error: unknown) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message ?? "Could not upload that picture");
        } finally {
            setBusy(false);
        }
    };

    const remove = async () => {
        setBusy(true);
        try { await onChange(null); } finally { setBusy(false); }
    };

    return (
        <div className="flex items-center gap-4">
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="relative group cursor-pointer"
                aria-label="Change picture"
            >
                <Avatar name={name} src={value} size={size} group={group} />
                <span className={`absolute inset-0 flex items-center justify-center bg-ink/55 text-paper opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity ${group ? "rounded-lg" : "rounded-full"}`}>
                    {busy ? <Loader2 className="size-5 animate-spin" /> : <Camera className="size-5" />}
                </span>
            </button>
            <div className="text-sm">
                <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="text-teal hover:text-teal-dark font-medium cursor-pointer">
                    {value ? "Change picture" : "Upload picture"}
                </button>
                {value && (
                    <button type="button" onClick={remove} disabled={busy} className="flex items-center gap-1 text-ink/45 hover:text-red-600 mt-1 cursor-pointer">
                        <Trash2 className="size-3.5" /> Remove
                    </button>
                )}
                <p className="text-xs text-ink/40 mt-1">JPG, PNG or WebP, up to 2 MB</p>
            </div>
            <input ref={inputRef} type="file" accept={ALLOWED.join(",")} className="hidden" onChange={pick} />
        </div>
    );
};

export default AvatarPicker;
