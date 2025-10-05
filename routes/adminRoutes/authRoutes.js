

import express from 'express';
import bcrypt from 'bcrypt';
import Users from '../../modals/userModal.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import verifyToken from '../../middleware/verifyToken.js';
import Otps from '../../modals/otpModal.js';
import sendOtpToEmail from '../../utils/sendEmail.js';
import moment from "moment";
import { createUserSchema, loginUserSchema } from '../../validations/userValidation.js';


dotenv.config();
const router = express.Router();

// Login user with encryption salt
router.post('/login', async (req, res) => {
    try {
        // const { email, password } = req.body;

        // if (!email || !password) {
        //     return res.status(400).json({
        //         message: "Email and password are required"
        //     });
        // }
        const parsed = loginUserSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: "Validation failed",
                errors: parsed.error.format(),
            });
        }

        const data = parsed.data;
        console.log(data)

        const user = await Users.findOne({ email: data.email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(data.password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({
            message: "User login successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone || null,
                bio: user.bio || null,
                joinDate: moment(user.createdAt).format("MMMM YYYY"), // e.g., "January 2024"
                dob: user.dob ? moment(user.dob).format("MMMM DD, YYYY") : null,
                gender: user.gender,
                profileImage: user.profileImage || null,
                encryptionKeySalt: user.encryptionKeySalt
            }
        });
        console.log("hi")
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


export default router;