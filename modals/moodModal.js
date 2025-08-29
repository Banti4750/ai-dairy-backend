import mongoose from "mongoose";

const { Schema } = mongoose;

const moodSchema = new Schema(
    {
        mood: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        moodIconURL: {
            type: String,
        },
    },
    { timestamps: true }
);


const Mood = mongoose.model("Mood", moodSchema);
export default Mood;