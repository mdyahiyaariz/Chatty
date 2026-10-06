import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";

export const connectDB = async () => {
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017";

    try {
        await mongoose.connect(uri, {dbName: 'chatty'})
        console.log("MongoDB connected!")

        // Migration for databases created before group chats existed:
        // the old unique index on the first two participants would reject groups, so drop it.
        try {
            await Conversation.collection.dropIndex("participants.0_1_participants.1_1");
            console.log("Dropped legacy conversation index");
        } catch {
            // index not present, nothing to do
        }
        await Conversation.updateMany({type: {$exists: false}}, {$set: {type: "direct"}});
    } catch (error) {
        console.error("MongoDB connection error", error);
        process.exit(1);
    }
}
