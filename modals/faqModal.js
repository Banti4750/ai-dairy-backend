import mongoose from "mongoose";
const { Schema, model } = mongoose;

const faqModalSchema = new Schema(
    {
        question: {
            type: String,
            required: true,
        },
        answer: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);
const FaqModal = model("FaqModal", faqModalSchema);

export default FaqModal;