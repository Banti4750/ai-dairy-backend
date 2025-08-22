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
        // Added for zero-knowledge encryption
        encryptionSalt: {
            type: String,
            required: true, // Base64 encoded salt for key derivation
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

const Users = mongoose.model("Users", userSchema);
export default Users;
