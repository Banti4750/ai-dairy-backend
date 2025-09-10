import express from 'express';
import dotenv from 'dotenv';
import Faq from '../../modals/faqModal.js';

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

router.post('/add', async (req, res) => {
    const { question, answer } = req.body;
    if (!question || !answer) {
        return res.status(400).json({ message: "All fields required" });
    }
    try {
        const newFaq = new Faq({ question, answer });
        await newFaq.save();
        res.status(201).json({ message: "Faq added successfully", faq: newFaq });
    }

    catch (error) {
        console.error("Error adding faq:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.delete('/delete/:id', async (req, res) => {
    const faqId = req.params.id;
    try {
        const deletedFaq = await Faq.findById
        if (!deletedFaq) {
            return res.status(404).json({ message: "Faq not found" });
        }
        await Faq.findByIdAndDelete(faqId);
        res.status(200).json({ message: "Faq deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting faq:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
router.put('/update/:id', async (req, res) => {
    const faqId = req.params.id;
    const { question, answer } = req.body;
    if (!question || !answer) {
        return res.status(400).json({ message: "All fields required" });
    }
    try {
        const updatedFaq = await Faq.findByIdAndUpdate(
            faqId,
            { question, answer },
            { new: true }
        );
        res.status(200).json({ message: "Faq updated successfully", faq: updatedFaq });
    }
    catch (error) {
        console.error("Error updating faq:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;