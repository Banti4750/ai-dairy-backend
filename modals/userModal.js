import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema(
    {
        email: {
            type: String,
            unique: true,
            required: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        dob: {
            type: Date,
        },
        gender: {
            type: String,
            enum: ["Male", "Female", "Other"],
            default: "Other",
        },
        profileImage: {
            type: String,
            default: "https://via.placeholder.com/150",
        },
    },
    { timestamps: true }
);

// Create model
const Users = mongoose.model("Users", userSchema);

export default Users;
