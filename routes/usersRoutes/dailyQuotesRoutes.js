import express from 'express';
import DailyQuotes from '../../modals/dailyQuotes.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        // pick one random quote
        const [dailyQuote] = await DailyQuotes.aggregate([{ $sample: { size: 1 } }]);

        if (!dailyQuote) {
            return res.status(404).json({ message: "No quotes found" });
        }

        res.status(200).json({
            message: "Daily quote fetched successfully",
            dailyQuote,
        });
    } catch (error) {
        console.error("Error fetching daily quote:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
