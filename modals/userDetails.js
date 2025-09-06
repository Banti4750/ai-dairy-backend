import mongoose from "mongoose";

const { Schema } = mongoose;
const userDetailsSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "Users",
            required: true,
            unique: true,
        },
        purpose: {
            type: String,
            trim: true,
        },
        goals: {
            type: String,
            trim: true,
        },
        aboutme: {
            type: String,
            trim: true,
        },

    },
    { timestamps: true }
);

const UserDetails = mongoose.model("UserDetails", userDetailsSchema);
export default UserDetails;