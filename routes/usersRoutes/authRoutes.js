import express from 'express';
import bcrypt from 'bcrypt';
import Users from '../../modals/userModal.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import verifyToken from '../../middleware/verifyToken.js';
import Otps from '../../modals/otpModal.js';
import sendOtpToEmail from '../../utils/sendEmail.js';

dotenv.config();
const router = express.Router();

// Register user with encryption support
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, dob, gender } = req.body;
        const encryptionKeySalt = bcrypt.genSaltSync(10);
        // console.log(encryptionKeySalt);

        if (!email || !password || !name) {
            return res.status(400).json({
                message: "Email, password, and name are required"
            });
        }

        // Updated password requirements for better security
        if (password.length < 8 || password.length > 128) {
            return res.status(400).json({
                message: "Password must be at least 8 characters and less than 128"
            });
        }

        const existingUser = await Users.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }


        // Hash password for authentication (separate from encryption)
        const hashedPassword = await bcrypt.hash(password, 12);

        const userData = {
            email,
            password: hashedPassword,
            name,
            encryptionKeySalt
        };

        // Add optional fields
        if (dob) userData.dob = new Date(dob);
        if (gender) userData.gender = gender;

        const newUser = await Users.create(userData);

        const token = jwt.sign(
            { id: newUser._id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: newUser._id,
                email: newUser.email,
                name: newUser.name,
                dob: newUser.dob,
                gender: newUser.gender,
                profileImage: newUser.profileImage,
                createdAt: newUser.createdAt,
            },
        });

    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Login user with encryption salt
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await Users.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
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
                email: user.email,
                name: user.name,
                dob: user.dob,
                gender: user.gender,
                profileImage: user.profileImage,
            }
        });
        console.log("hi")
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const user = await Users.findById(userId).select(
            "name email profileImage gender dob  _id encryptionKeySalt"
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profileImage: user.profileImage,
                gender: user.gender,
                dob: user.dob,
                encryptionKeySalt: user.encryptionKeySalt
            }
        });
    } catch (error) {
        console.error("Profile error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


//send otp for reset password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required!" });
    }

    try {
        // Check if user exists
        const user = await Users.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found!" });
        }

        // Rate limiting (3 OTPs per minute)
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        const otpCount = await Otps.countDocuments({
            email,
            createdAt: { $gte: oneMinuteAgo }
        });

        if (otpCount >= 3) {
            return res.status(429).json({ message: "Too many requests. Try again after 1 minute." });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP

        // Save OTP
        const otpEntry = await Otps.create({
            email,
            otp,
            expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes expiry
        });

        // TODO: Send OTP via email or SMS
        sendOtpToEmail(otp, email, user.name).catch(err => console.error('OTP Email Failed:', err));

        return res.status(200).json({ message: "OTP sent successfully!", otp });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

router.post('/verify-otp-reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;


    if (!email || !otp || !newPassword) {
        return res.status(400).json({ message: "All fields are required!" });
    }

    try {
        // Find OTP record
        const otpRecord = await Otps.findOne({ email, otp });

        if (!otpRecord) {
            return res.status(400).json({ message: "Invalid OTP!" });
        }

        // Check if OTP already used
        if (otpRecord.isUsed) {
            return res.status(400).json({ message: "OTP already used!" });
        }

        // Check if OTP expired
        if (otpRecord.expiresAt && otpRecord.expiresAt < Date.now()) {
            return res.status(400).json({ message: "OTP expired!" });
        }

        // Mark OTP as used
        otpRecord.isUsed = true;
        await otpRecord.save();

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password
        await Users.updateOne(
            { email },
            { $set: { password: hashedPassword } }
        );

        return res.status(200).json({ message: "Password reset successfully!" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});



export default router;