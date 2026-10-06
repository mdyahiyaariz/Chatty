import { ImagePlus, Loader2, Mic, Send, Square } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { useSelectedConversation } from "../../hooks/useSelectedConversation";
import { useSocketContext } from "../../contexts/SocketContext";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { uploadService, type UploadedAttachment } from "../../services/uploadService";

const MessageInput: React.FC = () => {
    const { user } = useAuthStore();
    const selectedConversation = useSelectedConversation();
    const { socket } = useSocketContext();
    const [message, setMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    const typingTimeoutRef = useRef<number | null>(null);
    const isTypingRef = useRef(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const emitTyping = (isTyping: boolean) => {
        if (!socket || !user || !selectedConversation) return;

        socket.emit("conversation:typing", {
            conversationId: selectedConversation.conversationId,
            isTyping,
        })
        isTypingRef.current = isTyping;
    }

    if (!selectedConversation) return;

    const sendMessage = (content: string, attachment?: UploadedAttachment) => {
        if (!user || !socket) return;

        socket.emit("conversation:send-message", {
            conversationId: selectedConversation.conversationId,
            content,
            attachment,
        })
    }

    const handleSendMessage = () => {
        if (message.trim() === '') return;

        sendMessage(message.trim());
        setMessage('');

        if (isTypingRef.current) {
            emitTyping(false);
        }
    }

    const handleOnChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);

        if (!isTypingRef.current) {
            emitTyping(true);
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            emitTyping(false);
        }, 500)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    }

    const handleImageButtonClick = () => fileInputRef.current?.click();

    const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // allow re-selecting the same file later
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        setIsUploading(true);
        try {
            const attachment = await uploadService.uploadFile(file, file.name);
            sendMessage('', attachment);
        } catch (error) {
            console.error('Error uploading image', error);
            toast.error('Failed to upload image');
        } finally {
            setIsUploading(false);
        }
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            }

            recorder.onstop = async () => {
                stream.getTracks().forEach((track) => track.stop());

                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                if (audioBlob.size === 0) return;

                setIsUploading(true);
                try {
                    const attachment = await uploadService.uploadFile(audioBlob, 'voice-message.webm');
                    sendMessage('', attachment);
                } catch (error) {
                    console.error('Error uploading voice message', error);
                    toast.error('Failed to send voice message');
                } finally {
                    setIsUploading(false);
                }
            }

            mediaRecorderRef.current = recorder;
            recorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error accessing microphone', error);
            toast.error('Unable to access microphone');
        }
    }

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        mediaRecorderRef.current = null;
        setIsRecording(false);
    }

    const handleMicClick = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }

    const busy = isUploading || isRecording;

    return <div className="p-4 border-t border-paper-line bg-paper">
        <div className="flex items-end gap-2">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelected}
            />

            <button
                onClick={handleImageButtonClick}
                type="button"
                disabled={busy}
                className="size-11 shrink-0 flex items-center justify-center rounded-lg text-ink/45 hover:text-ink hover:bg-ink/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                aria-label="Send an image"
            >
                <ImagePlus className="size-[18px]"/>
            </button>

            <button
                onClick={handleMicClick}
                type="button"
                disabled={isUploading}
                className={`
                    size-11 shrink-0 flex items-center justify-center rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer
                    ${isRecording ? "bg-red-500 text-white hover:bg-red-600" : "text-ink/45 hover:text-ink hover:bg-ink/5"}
                `}
                aria-label={isRecording ? "Stop recording" : "Record a voice message"}
            >
                {isRecording ? <Square className="size-[16px]"/> : <Mic className="size-[18px]"/>}
            </button>

            <div className="flex-1">
                <textarea
                    placeholder={isRecording ? "Recording voice message..." : "Write a message"}
                    rows={1}
                    disabled={isRecording}
                    className="w-full text-sm bg-white border border-paper-line rounded-xl py-3 px-4 focus:outline-none focus:border-teal/60 resize-none text-ink placeholder-ink/35 disabled:opacity-60"
                    value={message}
                    onChange={(e) => handleOnChange(e)}
                    onKeyDown={handleKeyDown}
                />
            </div>

            <button
                onClick={handleSendMessage}
                type="button"
                disabled={message.trim() === '' || busy}
                className="bg-teal text-paper rounded-lg size-11 flex items-center justify-center hover:bg-teal-dark disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shrink-0"
                aria-label="Send message"
            >
                {isUploading ? <Loader2 className="size-[16px] animate-spin"/> : <Send className="size-[16px]"/>}
            </button>
        </div>
    </div>
}

export default MessageInput;
