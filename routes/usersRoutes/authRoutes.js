import express from 'express';
import bcrypt from 'bcrypt';
import Users from '../../modals/userModal.js';
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




export default router;
