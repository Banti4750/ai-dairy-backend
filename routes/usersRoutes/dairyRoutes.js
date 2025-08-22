import express from 'express';
import dotenv from 'dotenv';
import DiaryEntry from '../../modals/dairyModal.js';
import verifyToken from '../../middleware/verifyToken.js';

dotenv.config();
const router = express.Router();

router.post("/add", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            title,
            content,
            mood,
            entryDate
        } = req.body;

        // Validate required fields
        if (!userId || !title || !content) {
            return res.status(400).json({
                success: false,
                message: "userId, title, and content are required fields"
            });
        }

        // Validate mood enum
        const validMoods = ['very_happy', 'happy', 'neutral', 'sad', 'very_sad', 'angry', 'excited', 'anxious', 'grateful', 'stressed'];
        if (mood && !validMoods.includes(mood)) {
            return res.status(400).json({
                success: false,
                message: "Invalid mood value"
            });
        }


        // Prepare diary entry data - match your schema structure
        const diaryEntryData = {
            userId,
            title: title.trim(),
            content: content,
            entryDate: entryDate ? new Date(entryDate) : new Date(),
        };

        // Add optional fields that match your schema
        if (mood) diaryEntryData.mood = mood;

        // Create new diary entry
        const newDiaryEntry = new DiaryEntry(diaryEntryData);
        const savedEntry = await newDiaryEntry.save();

        // Return success response
        const responseEntry = savedEntry.toObject();

        res.status(201).json({
            success: true,
            message: "Diary entry created successfully",
            data: {
                _id: responseEntry._id,
                userId: responseEntry.userId,
                title: responseEntry.title,
                content: responseEntry.content,
                mood: responseEntry.mood,
                entryDate: responseEntry.entryDate,
                createdAt: responseEntry.createdAt,
                updatedAt: responseEntry.updatedAt
            }
        });

    } catch (error) {
        console.error("Error creating diary entry:", error);
        // Generic server error
        res.status(500).json({
            success: false,
            message: "Internal server error occurred while creating diary entry"
        });
    }
});




export default router;