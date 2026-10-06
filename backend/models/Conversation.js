import mongoose from "mongoose"

const conversationSchema = new mongoose.Schema({
    // "direct" = the original 1-to-1 chat, "group" = named chat with 3+ people.
    type: {
        type: String,
        enum: ["direct", "group"],
        default: "direct",
        index: true,
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }],
    // Sorted "<idA>_<idB>" for direct chats only. Unique, so two people can never end up with two chats.
    directKey: {
        type: String,
    },
    // Group-only fields
    name: {
        type: String,
        trim: true,
        maxLength: 50,
    },
    avatarUrl: {
        type: String,
        default: null,
    },
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message"
    },
    lastMessagePreview: {
        content: String,
        timestamp: Date,
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    },
    unreadCounts: {
        type: Map,
        of: Number,
        default: {}
    }
}, {timestamps: true})

conversationSchema.index({directKey: 1}, {unique: true, sparse: true})
conversationSchema.index({participants: 1})

conversationSchema.pre("save", function (next) {
    if (this.type === "direct" && this.participants && this.participants.length === 2) {
        this.participants = this.participants.map(p => p.toString()).sort();
        this.directKey = this.participants.join("_");
    }

    next();
})

export default mongoose.model("Conversation", conversationSchema);
