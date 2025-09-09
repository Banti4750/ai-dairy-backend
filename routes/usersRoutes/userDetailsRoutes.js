import express from 'express';
import verifyToken from '../../middleware/verifyToken.js';
import UserDetails from '../../modals/userDetails.js'; // adjust path as per your project

const router = express.Router();

/**
 * ========================
 * PURPOSE ROUTES
 * ========================
 */


router.put('/purpose/add-update', verifyToken, async (req, res) => {
    const userId = req.user.id;
    const { purpose } = req.body;

    if (!purpose) {
        return res.status(400).json({ message: "All fields required" });
    }
    try {
        const updated = await UserDetails.findOneAndUpdate(
            { userId },
            { purpose },
            { new: true }
        );
        res.json({ message: "Purpose updated successfully", userdetails: updated });
    } catch (error) {
        console.error("Error updating purpose:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get('/purpose/get', verifyToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const details = await UserDetails.findOne({ userId }, 'purpose');
        res.json({ purpose: details?.purpose || null });
    } catch (error) {
        console.error("Error fetching purpose:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * ========================
 * GOALS ROUTES
 * ========================
 */


router.put('/goals/add-update', verifyToken, async (req, res) => {
    const userId = req.user.id;
    const { goals } = req.body;
    console.log(goals)

    if (!goals) {
        return res.status(400).json({ message: "All fields required" });
    }
    try {
        const updated = await UserDetails.findOneAndUpdate(
            { userId },
            { goals },
            { new: true }
        );
        res.json({ message: "Goals updated successfully", userdetails: updated });
    } catch (error) {
        console.error("Error updating goals:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get('/goals/get', verifyToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const details = await UserDetails.findOne({ userId }, 'goals');
        res.json({ goals: details?.goals || null });
    } catch (error) {
        console.error("Error fetching goals:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * ========================
 * ABOUT ME ROUTES
 * ========================
 */


router.put('/aboutme/add-update', verifyToken, async (req, res) => {
    const userId = req.user.id;
    const { aboutme } = req.body;

    if (!aboutme) {
        return res.status(400).json({ message: "All fields required" });
    }
    try {
        const updated = await UserDetails.findOneAndUpdate(
            { userId },
            { aboutme },
            { new: true }
        );
        res.json({ message: "About Me updated successfully", userdetails: updated });
    } catch (error) {
        console.error("Error updating about me:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get('/aboutme/get', verifyToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const details = await UserDetails.findOne({ userId }, 'aboutme');
        res.json({ aboutme: details?.aboutme || null });
    } catch (error) {
        console.error("Error fetching about me:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
