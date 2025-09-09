import express from 'express';
import dotenv from 'dotenv';



dotenv.config();
const router = express.Router();


router.get('/all', async (req, res) => {

    try {
        const newFaq = await Faq.find({});
        res.status(201).json({ message: "Faq fetched successfully", faqs: newFaq });
    } catch (error) {
        console.error("Error adding faq:", error);
        res.status(500).json({ message: "Internal server error" });
    }
})

export default router;