import mongoose, { Schema } from "mongoose";

const diaryEntrySchema = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,

        },
        content: {
            type: String,
            required: true
        },
        mood: {
            type: String,
            enum: ['very_happy', 'happy', 'neutral', 'sad', 'very_sad', 'angry', 'excited', 'anxious', 'grateful', 'stressed'],
        },
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