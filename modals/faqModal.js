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
const Faq = model("Faq", faqModalSchema);

export default Faq;