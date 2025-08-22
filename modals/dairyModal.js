import mongoose, { Schema } from "mongoose";

const diaryEntrySchema = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
            required: true,
        },
        // Encrypted fields - stored as encrypted objects
        encryptedTitle: {
            data: [Number], // Encrypted title as array of bytes
            iv: [Number]    // Initialization vector
        },
        encryptedContent: {
            data: [Number], // Encrypted content as array of bytes
            iv: [Number]    // Initialization vector
        },
        encryptedMood: {
            data: [Number], // Encrypted mood as array of bytes
            iv: [Number]    // Initialization vector
        },
        // Non-sensitive metadata (can remain unencrypted for queries)
        entryDate: {
            type: Date,
            default: Date.now,
            required: true
        },

    },
    {
        timestamps: true
    }
);

const DiaryEntry = mongoose.model("DiaryEntry", diaryEntrySchema);
export default DiaryEntry;