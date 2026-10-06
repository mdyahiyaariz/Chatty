import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
        index: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    content: {
        type: String,
        trim: true,
        // Not required when the message is a standalone image/audio attachment.
        required: function () {
            return !this.attachment || !this.attachment.url;
        },
    },
    attachment: {
        url: { type: String },
        type: { type: String, enum: ["image", "audio"] },
        mimeType: { type: String },
        size: { type: Number },
    },
    read: {
        type: Boolean,
        default: false,
        index: true
    },
    reactions: {
        type: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            emoji: {
                type: String,
                required: true,
            }
        }],
        default: [],
    }
}, { timestamps: true})

messageSchema.index({conversation: 1, createdAt: -1});
messageSchema.index({sender: 1, createdAt: -1});

messageSchema.post("save", async function (doc) {
    try {
        const Conversation = mongoose.model("Conversation");

        let previewContent = doc.content;
        if (!previewContent && doc.attachment?.url) {
            previewContent = doc.attachment.type === "image" ? "📷 Photo" : "🎤 Voice message";
        }

        const preview = {
            content: previewContent,
            timestamp: doc.createdAt,
            sender: doc.sender,
        }

        await Conversation.findByIdAndUpdate(doc.conversation, {
            lastMessage: doc._id,
            lastMessagePreview: preview
        })
    } catch (error) {
        console.error("Eror updating conversation after message save", error);
    }
});

export default mongoose.model("Message", messageSchema)