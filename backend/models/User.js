import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
    connectCode: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        minLength: 3,
        maxLength: 30,
    },
    username: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 30,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        minLength: 6,
    },
    // Relative URL under /uploads/avatars. Empty means "show initials".
    avatarUrl: {
        type: String,
        default: null,
    }
})

export default mongoose.model("User", userSchema)
