import { useEffect } from "react";
import { z } from "zod"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner"
import {Loader2, Wifi} from "lucide-react"

import { conversationService } from "../../services/conversationService";
import { useSocketContext } from "../../contexts/SocketContext";
import Modal from "../ui/Modal";
import { useQuery } from "@tanstack/react-query";

const addConversationSchema = z.object({
    connectCode: z.string().min(6, {message: "Invalid connect ID"})
})

type AddConversationFormData = z.infer<typeof addConversationSchema>

interface AddConversationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddConversationModal: React.FC<AddConversationModalProps> = ({
    isOpen,
    onClose
}) => {
    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors }
    } = useForm<AddConversationFormData>({
        resolver: zodResolver(addConversationSchema)
    })
    const { socket } = useSocketContext();

    const connectCode = watch('connectCode');

    const { isFetching, refetch } = useQuery({
        queryKey: ["checkConnectCode", connectCode],
        queryFn: () => conversationService.checkConnectCode(connectCode),
        enabled: false,
        retry: false
    })

    const onSubmit = async (formData: AddConversationFormData) => {
        const result = await refetch();

        if (result?.data?.success) {
            socket?.emit('conversation:request', {
                connectCode: formData.connectCode,
            })
            onClose();
        } else {
            toast.error((result.error as { response?: { data?: { message?: string } } } | null)?.response?.data?.message ?? "Invalid connect ID");
        }
    }

    useEffect(() => {
        if (!isOpen) {
            reset();
        }
    }, [isOpen, reset])

    return <>
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add conversation"
        >
            <form onSubmit={handleSubmit(onSubmit)}>
                <label htmlFor="connectCode" className="block text-ink/70 mb-2 text-sm">Connect ID</label>
                <div className="relative">
                    <Wifi className="absolute left-3 size-4 text-ink/35 top-1/2 -translate-y-1/2"/>
                    <input
                        {...register('connectCode')}
                        className="text-ink text-sm w-full pl-10 pr-3 py-3 bg-white border border-paper-line rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                    />
                </div>
                {errors.connectCode && <p className="text-red-500 text-sm mt-1">{errors.connectCode.message}</p>}
                <button
                    type="submit"
                    disabled={isFetching}
                    className="w-full flex justify-center items-center bg-teal text-paper py-3 rounded-lg hover:bg-teal-dark transition-colors cursor-pointer mt-4 disabled:opacity-60"
                >
                    {isFetching ? <Loader2 className="animate-spin size-5"/> : "Connect"}
                </button>
            </form>
        </Modal>
    </>
}

export default AddConversationModal;
