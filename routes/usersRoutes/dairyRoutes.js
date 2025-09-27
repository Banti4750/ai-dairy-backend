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
            moodId,
            entryDate,


        } = req.body;


        // Validate required encrypted fields
        if (!encryptedTitle || !encryptedContent) {
            return res.status(400).json({
                success: false,
                message: "Encrypted title and content are required"
            });
        }

        // check if moodId is valid ObjectId if provided
        if (moodId && !mongoose.Types.ObjectId.isValid(moodId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid mood ID"
            });
        }
        //check if moodId exists in Mood collection
        if (moodId) {
            const moodExists = await mongoose.model('Mood').exists({ _id: moodId });
            if (!moodExists) {
                return res.status(400).json({
                    success: false,
                    message: "Mood not found"
                });
            }
        }

        // Prepare diary entry data
        const diaryEntryData = {
            userId: new mongoose.Types.ObjectId(userId),
            encryptedTitle,
            encryptedContent,
            entryDate: entryDate ? new Date(entryDate) : new Date(),
        };

        // Add optional encrypted fields
        if (moodId) diaryEntryData.moodId = moodId;

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
        const {
            page = 1,
            limit = 10,
            sortBy = 'entryDate',
            sortOrder = 'desc',
            timeframe = '30days',
            start,
            end
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        // 🔹 Date filter logic
        let dateFilter = {};

        if (start && end) {
            // ✅ Custom range mode
            const startDate = new Date(start);
            const endDate = new Date(end);
            endDate.setHours(23, 59, 59, 999); // include whole day
            dateFilter = { entryDate: { $gte: startDate, $lte: endDate } };

        } else if (timeframe && timeframe !== "all") {
            // ✅ Predefined timeframe mode
            const now = new Date();
            let startDate;

            switch (timeframe) {
                case "today":
                    startDate = new Date();
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case "yesterday":
                    startDate = new Date();
                    startDate.setDate(startDate.getDate() - 1);
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case "thisWeek":
                    startDate = new Date();
                    const firstDayOfWeek = startDate.getDate() - startDate.getDay();
                    startDate.setDate(firstDayOfWeek);
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case "thisMonth":
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case "lastMonth":
                    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    break;
                case "7days":
                    startDate = new Date(now.setDate(now.getDate() - 7));
                    break;
                case "15days":
                    startDate = new Date(now.setDate(now.getDate() - 15));
                    break;
                case "30days":
                    startDate = new Date(now.setDate(now.getDate() - 30));
                    break;
                case "90days":
                    startDate = new Date(now.setDate(now.getDate() - 90));
                    break;
                case "6months":
                    startDate = new Date(now.setMonth(now.getMonth() - 6));
                    break;
                case "1year":
                    startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                    break;
                case "2years":
                    startDate = new Date(now.setFullYear(now.getFullYear() - 2));
                    break;
                default:
                    startDate = null;
            }

            if (startDate) {
                dateFilter = { entryDate: { $gte: startDate } };
            }
        }

        const filter = { userId, ...dateFilter };

        const entries = await DiaryEntry.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .select('encryptedTitle encryptedContent encryptedMood moodId entryDate createdAt updatedAt');

        const total = await DiaryEntry.countDocuments(filter);

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


//show the entry of dairy in calender by month and year
diaryRouter.get("/calendar", verifyToken, async (req, res) => {
    try {

        const userId = req.user.id;
        const { month, year } = req.query;
        if (!month || !year) {
            return res.status(400).json({
                success: false,
                message: "Month and year are required"
            });
        }
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        const entries = await DiaryEntry.find({
            userId,
            entryDate: { $gte: startDate, $lte: endDate }
        }).select('entryDate');
        res.status(200).json({
            message: "Diary entries for calendar retrieved successfully",
            data: entries
        });
    } catch (error) {
        console.error("Error retrieving diary entries for calendar:", error);
        res.status(500).json({
            message: "Internal server error occurred while retrieving diary entries for calendar"
        });
    }
});

export default diaryRouter;
