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
        encryptionKeySalt: {
            type: String,
            required: true,
        },
        dob: {
            type: Date,
        },
        number: {
            type: String,
            trim: true,
            default: "not set",
        },
        bio: {
            type: String,
            trim: true,
            default: "This user prefers to keep an air of mystery about them.",
        },
        gender: {
            type: String,
            enum: ["Male", "Female", "Other", "Not Specified"],
            default: "Not Specified",
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
