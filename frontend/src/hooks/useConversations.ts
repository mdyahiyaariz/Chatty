import { useQuery } from "@tanstack/react-query";
import { conversationService } from "../services/conversationService";


export function useConversations() {
    return useQuery({
        queryKey: ['conversations'],
        queryFn: conversationService.fetchConversations,
        retry: false,
    })
}