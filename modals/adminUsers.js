import mongoose from "mongoose";

const { Schema } = mongoose;

const AdminUserSchema = new Schema(
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
        profileImage: {
            type: String,
            default: "https://via.placeholder.com/150",
        },
    },
    { timestamps: true }
);

const AdminUsers = mongoose.model("AdminUsers", AdminUserSchema);
export default AdminUsers;
