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

// Register user with encryption support
router.post('/register', async (req, res) => {
    try {

        const parsed = createUserSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                message: "Validation failed",
                errors: parsed.error.format(),
            });
        }

        const data = parsed.data;

        // 2️ Check if user already exists
        const existingUser = await Users.findOne({ email: data.email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // 3️ Generate salt (for encryption key)
        const encryptionKeySalt = bcrypt.genSaltSync(10);

        // 4️ Hash password
        const hashedPassword = await bcrypt.hash(data.password, 12);

        // 5 Create user object
        const userData = {
            ...data,
            password: hashedPassword,
            encryptionKeySalt,
        };

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
                encryptionKeySalt: newUser.encryptionKeySalt,
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

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const user = await Users.findById(userId).select(
            "name email phone bio profileImage gender dob createdAt encryptionKeySalt"
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            user: {
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


//edit profile route
router.put('/edit-profile', verifyToken, async (req, res) => {
    const userId = req.user.id;
    const { name, phone, bio, gender, dob, profileImage } = req.body;

    try {
        const updatedData = {};

        if (name) updatedData.name = name;
        if (phone) updatedData.phone = phone;
        if (bio) updatedData.bio = bio;
        if (gender) updatedData.gender = gender;
        if (dob) updatedData.dob = new Date(dob);
        if (profileImage) updatedData.profileImage = profileImage;

        const updatedUser = await Users.findByIdAndUpdate(
            userId,
            { $set: updatedData },
            { new: true, runValidators: true }
        )

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({
            message: "Profile updated successfully",
            user: {
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone || null,
                bio: updatedUser.bio || null,
                joinDate: moment(updatedUser.createdAt).format("MMMM YYYY"), // e.g., "January 2024"
                dob: updatedUser.dob ? moment(updatedUser.dob).format("MMMM DD, YYYY") : null,
                gender: updatedUser.gender || null,
                profileImage: updatedUser.profileImage || null,
            }
        })
    } catch (error) {
        console.error("Edit Profile error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;