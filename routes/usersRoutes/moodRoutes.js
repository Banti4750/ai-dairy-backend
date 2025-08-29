import express from 'express';
import Mood from '../../modals/moodModal.js';


const router = express.Router();

router.get('/all', async (req, res) => {

    try {
        const newMood = await Mood.find({});
        res.status(201).json({ message: "Mood fetched successfully", moods: newMood });
    } catch (error) {
        console.error("Error adding mood:", error);
        res.status(500).json({ message: "Internal server error" });
    }
})

export default router;