import express from 'express';
import Mood from '../../modals/moodModal.js';
import verifyToken from '../../middleware/verifyToken.js';


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

router.get('/:id', verifyToken, async (req, res) => {

    try {
        const moodId = req.params.id;
        const mood = await Mood.findById(moodId);

        if (!mood) {
            return res.status(404).json({ message: "Mood not found" });
        }

        res.status(200).json({ message: "Mood fetched successfully", mood });
    } catch (error) {
        console.error("Error fetching mood:", error);
        res.status(500).json({ message: "Internal server error" });
    }
})

export default router;