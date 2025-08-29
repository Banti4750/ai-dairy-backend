import express from 'express';
import Mood from '../../modals/moodModal.js';


const router = express.Router();

router.post('/add', async (req, res) => {
    const { mood, description, moodIconURL } = req.body;
    if (!mood) {
        return res.status(400).json({ message: "Mood is required" });
    }
    try {
        const newMood = new Mood({ mood, description, moodIconURL });
        await newMood.save();
        res.status(201).json({ message: "Mood added successfully", mood: newMood });
    } catch (error) {
        console.error("Error adding mood:", error);
        res.status(500).json({ message: "Internal server error" });
    }
})

export default router;