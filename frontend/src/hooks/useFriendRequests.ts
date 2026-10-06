import { useQuery } from "@tanstack/react-query";
import { conversationService } from "../services/conversationService";

export function useFriendRequests() {
    return useQuery({
        queryKey: ["friendRequests"],
        queryFn: conversationService.fetchFriendRequests,
    });
}
