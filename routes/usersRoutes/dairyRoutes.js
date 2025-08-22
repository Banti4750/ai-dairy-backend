import express from 'express';
import dotenv from 'dotenv';
import DiaryEntry from '../../modals/dairyModal.js';
import verifyToken from '../../middleware/verifyToken.js';
import mongoose from 'mongoose';

dotenv.config();
const diaryRouter = express.Router();

// Add encrypted diary entry
diaryRouter.post("/add", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            encryptedTitle,
            encryptedContent,
            encryptedMood,
            entryDate,


        } = req.body;

        // Validate required encrypted fields
        if (!encryptedTitle || !encryptedContent) {
            return res.status(400).json({
                success: false,
                message: "Encrypted title and content are required"
            });
        }

        // Validate encryption object structure
        // const validateEncryptedField = (field, fieldName) => {
        //     if (!field.data || !field.iv || !Array.isArray(field.data) || !Array.isArray(field.iv)) {
        //         throw new Error(`Invalid ${fieldName} encryption format`);
        //     }
        // };

        // validateEncryptedField(encryptedTitle, "title");
        // validateEncryptedField(encryptedContent, "content");

        // if (encryptedMood) {
        //     validateEncryptedField(encryptedMood, "mood");
        // }

        // Prepare diary entry data
        const diaryEntryData = {
            userId: new mongoose.Types.ObjectId(userId),
            encryptedTitle,
            encryptedContent,
            entryDate: entryDate ? new Date(entryDate) : new Date(),
        };

        // Add optional encrypted fields
        if (encryptedMood) diaryEntryData.encryptedMood = encryptedMood;

        // Create new diary entry
        const newDiaryEntry = new DiaryEntry(diaryEntryData);
        const savedEntry = await newDiaryEntry.save();

        res.status(201).json({
            success: true,
            message: "Encrypted diary entry created successfully",
            data: {
                _id: savedEntry._id,
                userId: savedEntry.userId,
                entryDate: savedEntry.entryDate,
                createdAt: savedEntry.createdAt,
                updatedAt: savedEntry.updatedAt
                // Note: Not returning encrypted data in response for security
            }
        });

    } catch (error) {
        console.error("Error creating diary entry:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error occurred while creating diary entry"
        });
    }
});

// Get all encrypted diary entries for user
diaryRouter.get("/entries", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10, sortBy = 'entryDate', sortOrder = 'desc' } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const entries = await DiaryEntry.find({ userId })
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .select('encryptedTitle encryptedContent encryptedMood  entryDate createdAt updatedAt');

        const total = await DiaryEntry.countDocuments({ userId });

        res.status(200).json({
            success: true,
            message: "Diary entries retrieved successfully",
            data: {
                entries,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalEntries: total,
                    hasNextPage: skip + entries.length < total,
                    hasPrevPage: parseInt(page) > 1
                }
            }
        });

    } catch (error) {
        console.error("Error retrieving diary entries:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error occurred while retrieving diary entries"
        });
    }
});

// Get single encrypted diary entry
diaryRouter.get("/entries/:entryId", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { entryId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(entryId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid entry ID"
            });
        }

        const entry = await DiaryEntry.findOne({
            _id: entryId,
            userId
        }).select('encryptedTitle encryptedContent encryptedMood  entryDate createdAt updatedAt');

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: "Diary entry not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Diary entry retrieved successfully",
            data: entry
        });

    } catch (error) {
        console.error("Error retrieving diary entry:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error occurred while retrieving diary entry"
        });
    }
});

// Update encrypted diary entry
diaryRouter.put("/entries/:entryId", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { entryId } = req.params;
        const {
            encryptedTitle,
            encryptedContent,
            encryptedMood,
            entryDate,
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(entryId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid entry ID"
            });
        }

        // Check if entry exists and belongs to user
        const existingEntry = await DiaryEntry.findOne({ _id: entryId, userId });
        if (!existingEntry) {
            return res.status(404).json({
                success: false,
                message: "Diary entry not found"
            });
        }

        // Prepare update data
        const updateData = {};
        if (encryptedTitle) updateData.encryptedTitle = encryptedTitle;
        if (encryptedContent) updateData.encryptedContent = encryptedContent;
        if (encryptedMood) updateData.encryptedMood = encryptedMood;
        if (entryDate) updateData.entryDate = new Date(entryDate);

        const updatedEntry = await DiaryEntry.findByIdAndUpdate(
            entryId,
            updateData,
            { new: true, runValidators: true }
        ).select('_id userId entryDate createdAt updatedAt');

        res.status(200).json({
            success: true,
            message: "Diary entry updated successfully",
            data: updatedEntry
        });

    } catch (error) {
        console.error("Error updating diary entry:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error occurred while updating diary entry"
        });
    }
});

// Delete diary entry
diaryRouter.delete("/entries/:entryId", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { entryId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(entryId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid entry ID"
            });
        }

        const deletedEntry = await DiaryEntry.findOneAndDelete({
            _id: entryId,
            userId
        });

        if (!deletedEntry) {
            return res.status(404).json({
                success: false,
                message: "Diary entry not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Diary entry deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting diary entry:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error occurred while deleting diary entry"
        });
    }
});

export default diaryRouter;
