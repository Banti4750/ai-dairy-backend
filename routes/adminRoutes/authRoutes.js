
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import AdminUsers from '../../modals/adminUsers.js';


dotenv.config();
const router = express.Router();

// Login user with encryption salt
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email, password, are required" });
        }

        const user = await AdminUsers.findOne({ email: email });
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
                name: user.name,
                email: user.email,
                profileImage: user.profileImage || null,
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// router.post('/register', async (req, res) => {
//     try {
//         const { email, password, name, profileImage } = req.body;
//         if (!email || !password || !name) {
//             return res.status(400).json({ message: "Email, password, name are required" });
//         }
//         const existingUser = await AdminUsers.find({ email: email });
//         if (existingUser.length > 0) {
//             return res.status(409).json({ message: "Email already exists" });
//         }
//         const salt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash(password, salt);
//         const newUser = new AdminUsers({
//             email,
//             password: hashedPassword,
//             name,
//             profileImage
//         });
//         await newUser.save();
//         res.status(201).json({ message: "User registered successfully" });
//     }
//     catch (error) {
//         console.error("Registration error:", error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// });



export default router;