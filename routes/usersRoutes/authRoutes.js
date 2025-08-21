import express from 'express';
import bcrypt from 'bcrypt';
import Users from '../../modals/userModal.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import mongoose from "mongoose";
import verifyToken from '../../middleware/verifyToken.js';

dotenv.config();
const router = express.Router();


//register user
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({
                message: "All fields required"
            })
        }

        if (password.length < 6 || password.length > 20) {
            return res.status(400).json({ message: "Password must be at least 6 characters and less than 20" });
        }

        const existingUser = await Users.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }


        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await Users.create({ email, password: hashedPassword, name });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: newUser._id,
                email: newUser.email,
                name: newUser.name,
                createdAt: newUser.createdAt,
            },
        });

    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
})

//login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                message: "All fields required"
            })
        }

        if (password.length < 6 || password.length > 20) {
            return res.status(400).json({ message: "Password must be at least 6 characters and less than 20" });
        }

        const isUserExit = await Users.findOne({ email });
        if (!isUserExit) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, isUserExit.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { id: isUserExit._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" } // token valid for 1 hour
        );

        res.status(200).json({
            message: "User login successfully",
            token
        })

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
})


//get user
router.get('/profile', verifyToken, async (req, res) => {
    const user_id = req.user.id;
    console.log(req.user)
    try {
        const user = await Users.findById(new mongoose.Types.ObjectId(user_id)).select("name email profileImage gender _id ");

        res.status(200).json({ user });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
})



export default router;
