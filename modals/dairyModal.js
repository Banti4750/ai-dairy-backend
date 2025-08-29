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
            type: String,
            required: true,
        },
        encryptedContent: {
            type: String,
            required: true,
        },
        moodId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Mood',
            required: true,
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