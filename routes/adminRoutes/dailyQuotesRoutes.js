import express from 'express';
import DailyQuotes from '../../modals/dailyQuotes';

const router = express.Router();

router.get('/daily-quote', async (req, res) => {
    try {
        const dailyQuotes = await DailyQuotes.find({});

        res.status(200).json({
            message: "Daily quote fetched successfully",
            dailyQuotes,
        });
    } catch (error) {
        console.error("Error fetching daily quote:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post('/daily-quote/add', async (req, res) => {
    const { quote, author } = req.body;
    if (!quote || !author) {
        return res.status(400).json({ message: "All fields required" });
    }
    try {
        const newQuote = new DailyQuotes({ quote, author });
        await newQuote.save();
        res.status(201).json({ message: "Daily quote added successfully", dailyQuote: newQuote });
    }
    catch (error) {
        console.error("Error adding daily quote:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.delete('/daily-quote/delete/:id', async (req, res) => {
    const quoteId = req.params.id;
    try {
        const deletedQuote = await DailyQuotes.findById
        if (!deletedQuote) {
            return res.status(404).json({ message: "Quote not found" });
        }
        await DailyQuotes.findByIdAndDelete(quoteId);
        res.status(200).json({ message: "Daily quote deleted successfully" });
    } catch (error) {
        console.error("Error deleting daily quote:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


router.put('/daily-quote/update/:id', async (req, res) => {
    const quoteId = req.params.id;
    const { quote, author } = req.body;
    if (!quote || !author) {
        return res.status(400).json({ message: "All fields required" });
    }
    try {
        const updatedQuote = await DailyQuotes.findByIdAndUpdate(
            quoteId,
            { quote, author },
            { new: true }
        );
        if (!updatedQuote) {
            return res.status(404).json({ message: "Quote not found" });
        }
        res.status(200).json({ message: "Daily quote updated successfully", dailyQuote: updatedQuote });
    } catch (error) {
        console.error("Error updating daily quote:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
