import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { useFriendRequests } from "../hooks/useFriendRequests.ts";
import { useSocketContext } from "./SocketContext";

export type RequestUser = {
    id: string;
    fullName: string;
    username: string;
    connectCode: string;
    avatarUrl?: string | null;
};

export type FriendRequest = {
    requestId: string;
    user: RequestUser;
};

type FriendRequestsContextType = {
    incoming: FriendRequest[];
    outgoing: FriendRequest[];
    isLoading: boolean;
    respondToRequest: (requestId: string, accept: boolean) => void;
};

const FriendRequestsContext = createContext<FriendRequestsContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useFriendRequestsContext = () => {
    const context = useContext(FriendRequestsContext);
    if (!context) throw new Error("useFriendRequestsContext must be used within FriendRequestsProvider");
    return context;
};

export const FriendRequestsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { data, isLoading, refetch } = useFriendRequests();
    const { socket } = useSocketContext();

    const [incoming, setIncoming] = useState<FriendRequest[]>([]);
    const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);

    useEffect(() => {
        if (data) {
            setIncoming(data.incoming ?? []);
            setOutgoing(data.outgoing ?? []);
        }
    }, [data]);

    const respondToRequest = (requestId: string, accept: boolean) => {
        if (!socket) return;

        socket.emit("conversation:request:respond", { requestId, accept });
        // Optimistically remove it; a server-side error handler below will resync if it fails.
        setIncoming((prev) => prev.filter((request) => request.requestId !== requestId));
    };

    useEffect(() => {
        const handleIncoming = (payload: { requestId: string; requester: RequestUser }) => {
            setIncoming((prev) => [...prev, { requestId: payload.requestId, user: payload.requester }]);
            toast.info(`${payload.requester.username} sent you a friend request`);
        };

        const handleSent = (payload: { requestId: string; friend: RequestUser }) => {
            setOutgoing((prev) => [...prev, { requestId: payload.requestId, user: payload.friend }]);
            toast.success(`Request sent to ${payload.friend.username}`);
        };

        const handleDeclined = (payload: { requestId: string; username: string }) => {
            setOutgoing((prev) => prev.filter((request) => request.requestId !== payload.requestId));
            toast.info(`${payload.username} declined your request`);
        };

        // A friendship that just turned into a live conversation is no longer "pending" on either side.
        const handleAccepted = (payload: { friend: RequestUser }) => {
            setOutgoing((prev) => prev.filter((request) => request.user.id !== payload.friend.id));
            setIncoming((prev) => prev.filter((request) => request.user.id !== payload.friend.id));
        };

        const handleRespondError = (payload: { error: string }) => {
            toast.error(payload.error || "Unable to respond to that request");
            refetch();
        };

        socket?.on("conversation:request:incoming", handleIncoming);
        socket?.on("conversation:request:sent", handleSent);
        socket?.on("conversation:request:declined", handleDeclined);
        socket?.on("conversation:accept", handleAccepted);
        socket?.on("conversation:request:respond:error", handleRespondError);

        return () => {
            socket?.off("conversation:request:incoming", handleIncoming);
            socket?.off("conversation:request:sent", handleSent);
            socket?.off("conversation:request:declined", handleDeclined);
            socket?.off("conversation:accept", handleAccepted);
            socket?.off("conversation:request:respond:error", handleRespondError);
        };
    }, [socket, refetch]);

    return (
        <FriendRequestsContext.Provider value={{ incoming, outgoing, isLoading, respondToRequest }}>
            {children}
        </FriendRequestsContext.Provider>
    );
};
