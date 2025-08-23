import express from 'express';
import bcrypt from 'bcrypt';
import Users from '../../modals/userModal.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto';
import verifyToken from '../../middleware/verifyToken.js';

dotenv.config();
const router = express.Router();

// Register user with encryption support
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, dob, gender } = req.body;

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
        };

        // Add optional fields
        if (dob) userData.dob = new Date(dob);
        if (gender) userData.gender = gender;

        const newUser = await Users.create(userData);

        res.status(201).json({
            message: "User registered successfully",
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
            "name email profileImage gender dob  _id"
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
            }
        });
    } catch (error) {
        console.error("Profile error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;