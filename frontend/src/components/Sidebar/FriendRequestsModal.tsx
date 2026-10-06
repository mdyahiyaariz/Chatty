import { Check, Clock, X } from "lucide-react";
import Modal from "../ui/Modal";
import Avatar from "../ui/Avatar";
import { useFriendRequestsContext } from "../../contexts/FriendRequestsContext";

interface FriendRequestsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const FriendRequestsModal: React.FC<FriendRequestsModalProps> = ({ isOpen, onClose }) => {
    const { incoming, outgoing, isLoading, respondToRequest } = useFriendRequestsContext();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Friend requests">
            {isLoading ? (
                <div className="flex justify-center py-6">
                    <div className="size-8 bg-teal-soft rounded-full animate-pulse" />
                </div>
            ) : (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xs text-ink/45 mb-3">
                            Incoming {incoming.length > 0 && `(${incoming.length})`}
                        </h3>

                        {incoming.length === 0 ? (
                            <p className="text-sm text-ink/40">No pending requests right now</p>
                        ) : (
                            <ul className="space-y-2">
                                {incoming.map((request) => (
                                    <li
                                        key={request.requestId}
                                        className="flex items-center gap-3 bg-paper-dim rounded-lg px-3 py-2.5"
                                    >
                                        <Avatar name={request.user.fullName} src={request.user.avatarUrl} size={36} />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-ink truncate">{request.user.fullName}</p>
                                            <p className="text-xs text-ink/45 truncate">@{request.user.username}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => respondToRequest(request.requestId, true)}
                                            className="shrink-0 size-8 flex items-center justify-center rounded-lg bg-teal text-paper hover:bg-teal-dark transition-colors cursor-pointer"
                                            aria-label={`Accept ${request.user.username}`}
                                        >
                                            <Check className="size-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => respondToRequest(request.requestId, false)}
                                            className="shrink-0 size-8 flex items-center justify-center rounded-lg border border-paper-line text-ink/50 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer"
                                            aria-label={`Decline ${request.user.username}`}
                                        >
                                            <X className="size-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div>
                        <h3 className="text-xs text-ink/45 mb-3">
                            Sent {outgoing.length > 0 && `(${outgoing.length})`}
                        </h3>

                        {outgoing.length === 0 ? (
                            <p className="text-sm text-ink/40">You haven't sent any requests</p>
                        ) : (
                            <ul className="space-y-2">
                                {outgoing.map((request) => (
                                    <li
                                        key={request.requestId}
                                        className="flex items-center gap-3 bg-paper-dim rounded-lg px-3 py-2.5"
                                    >
                                        <Avatar name={request.user.fullName} src={request.user.avatarUrl} size={36} />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-ink truncate">{request.user.fullName}</p>
                                            <p className="text-xs text-ink/45 truncate">@{request.user.username}</p>
                                        </div>
                                        <span className="shrink-0 flex items-center gap-1 text-xs text-ink/40">
                                            <Clock className="size-3.5" />
                                            Pending
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default FriendRequestsModal;
