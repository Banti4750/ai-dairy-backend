import mongoose, { Schema } from "mongoose";

const otpSchema = new Schema({
    email: {
        type: String,
        required: true,
        index: true
    },
    otp: {
        type: String,
        required: true
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        default: () => Date.now() + 5 * 60 * 1000,
        index: { expires: 0 }
    }
}, { timestamps: true });

const Otps = mongoose.model("Otps", otpSchema);
export default Otps;
