import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const dailyQuotesSchema = new Schema(
    {
        text: {
            type: String,
            required: true,
        },
        author: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const DailyQuotes = model('DailyQuotes', dailyQuotesSchema);

export default DailyQuotes;
