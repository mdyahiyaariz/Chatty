import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: "sm" | "md" | "lg"
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClass = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg" };

    return <div
        className="fixed inset-0 bg-ink/60 flex justify-center items-center z-50 p-4"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
        <div role="dialog" aria-modal="true" aria-label={title} className={`bg-paper rounded-lg border border-paper-line shadow-xl w-full ${sizeClass[size]} max-h-[90vh] flex flex-col`}>
            <div className="flex justify-between items-center px-6 pt-5 pb-4 border-b border-paper-line">
                {title && <h2 className="font-display text-xl text-ink">{title}</h2>}
                <button type="button" onClick={onClose} className="text-ink/40 hover:text-ink cursor-pointer" aria-label="Close">
                    <X className="size-5" />
                </button>
            </div>

            <div className="px-6 py-5 overflow-y-auto">{children}</div>

            {footer && <div className="px-6 pb-5">{footer}</div>}
        </div>
    </div>
}

export default Modal;
