import express from 'express';
import bcrypt from 'bcrypt';
import crypto from "crypto";
import dotenv from 'dotenv';
import DiaryEntry from '../../modals/dairyModal.js';
import mongoose from 'mongoose';
import verifyToken from '../../middleware/verifyToken.js';
import { decryptData, encryptData } from '../../utils/encryptData.js';

const TAG_LENGTH = 16;
dotenv.config();
const router = express.Router();

router.post("/add", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            title,
            content,
            mood,
            weather,
            images,
            voiceNotes,
            location,
            tags,
            category,
            isPrivate,
            password,
            entryDate,
            isFavorite,
            streakDay
        } = req.body;

        // Validate required fields
        if (!userId || !title || !content) {
            return res.status(400).json({
                success: false,
                message: "userId, title, and content are required fields"
            });
        }

        // Validate userId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid userId format"
            });
        }

        // Validate title length (before encryption)
        if (title.length > 200) {
            return res.status(400).json({
                success: false,
                message: "Title must be 200 characters or less"
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

        // Validate weather condition enum
        const validWeatherConditions = ['sunny', 'cloudy', 'rainy', 'snowy', 'stormy', 'foggy'];
        if (weather?.condition && !validWeatherConditions.includes(weather.condition)) {
            return res.status(400).json({
                success: false,
                message: "Invalid weather condition"
            });
        }

        // Validate category enum
        const validCategories = ['personal', 'work', 'travel', 'health', 'relationships', 'goals', 'gratitude', 'other'];
        if (category && !validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: "Invalid category value"
            });
        }

        // Validate images array structure
        if (images && Array.isArray(images)) {
            for (const image of images) {
                if (!image.url) {
                    return res.status(400).json({
                        success: false,
                        message: "Each image must have a url"
                    });
                }
            }
        }

        // Validate voice notes array structure
        if (voiceNotes && Array.isArray(voiceNotes)) {
            for (const note of voiceNotes) {
                if (!note.url || !note.duration) {
                    return res.status(400).json({
                        success: false,
                        message: "Each voice note must have url and duration"
                    });
                }
            }
        }

        // Check if password is provided for encryption
        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Password is required for encrypting diary content"
            });
        }

        // Prepare diary entry data with encryption
        const diaryEntryData = {
            userId,
            title: encryptData(title.trim(), password), // Encrypt title
            content: encryptData(content, password), // Encrypt content
            entryDate: entryDate ? new Date(entryDate) : new Date(),
            isPrivate: isPrivate !== undefined ? isPrivate : true,
            isFavorite: isFavorite || false,
            isEncrypted: true, // Flag to indicate this entry is encrypted
            encryptionVersion: '1.0' // Track encryption version for future upgrades
        };

        // Add optional fields (encrypt sensitive ones)
        if (mood) diaryEntryData.mood = mood; // Don't encrypt mood for filtering
        if (weather) diaryEntryData.weather = weather; // Don't encrypt weather for filtering
        if (category) diaryEntryData.category = category; // Don't encrypt category for filtering
        if (streakDay) diaryEntryData.streakDay = streakDay;

        // Encrypt sensitive arrays
        if (images && Array.isArray(images)) {
            diaryEntryData.images = images.map(img => ({
                url: img.url, // URLs might not need encryption if they're from secure storage
                caption: img.caption ? encryptData(img.caption, password) : "",
                uploadedAt: img.uploadedAt || new Date()
            }));
        }

        if (voiceNotes && Array.isArray(voiceNotes)) {
            diaryEntryData.voiceNotes = voiceNotes.map(note => ({
                url: note.url, // URLs might not need encryption if they're from secure storage
                duration: note.duration,
                transcription: note.transcription ? encryptData(note.transcription, password) : "",
                uploadedAt: note.uploadedAt || new Date()
            }));
        }

        if (location) {
            diaryEntryData.location = {
                name: location.name ? encryptData(location.name, password) : "",
                coordinates: location.coordinates // Coordinates could be encrypted too if very sensitive
            };
        }

        if (tags && Array.isArray(tags)) {
            // Encrypt tags for privacy but this makes searching difficult
            // Consider keeping some tags unencrypted for searching capabilities
            diaryEntryData.tags = tags.map(tag => encryptData(tag, password));
        }

        // Store password hash for verification (don't store the actual password)
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
        diaryEntryData.passwordHash = passwordHash;

        // Create new diary entry
        const newDiaryEntry = new DiaryEntry(diaryEntryData);
        const savedEntry = await newDiaryEntry.save();

        // Return success response (exclude sensitive data)
        const responseEntry = savedEntry.toObject();
        delete responseEntry.passwordHash;
        delete responseEntry.encryptionVersion;

        res.status(201).json({
            success: true,
            message: "Diary entry created and encrypted successfully",
            data: {
                _id: responseEntry._id,
                userId: responseEntry.userId,
                mood: responseEntry.mood,
                weather: responseEntry.weather,
                category: responseEntry.category,
                isPrivate: responseEntry.isPrivate,
                isFavorite: responseEntry.isFavorite,
                entryDate: responseEntry.entryDate,
                createdAt: responseEntry.createdAt,
                updatedAt: responseEntry.updatedAt,
                isEncrypted: true,
                message: "Content is encrypted. Use the correct password to decrypt and view."
            }
        });

    } catch (error) {
        console.error("Error creating diary entry:", error);

        // Handle encryption errors
        if (error.message.includes('encrypt') || error.message.includes('decrypt')) {
            return res.status(400).json({
                success: false,
                message: "Encryption failed. Please check your data and try again."
            });
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: validationErrors
            });
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Duplicate entry detected"
            });
        }

        // Handle cast errors (invalid ObjectId, etc.)
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "Invalid data format provided"
            });
        }

        // Generic server error
        res.status(500).json({
            success: false,
            message: "Internal server error occurred while creating diary entry"
        });
    }
});


router.post("/decrypt/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Password is required to decrypt diary content"
            });
        }

        const diaryEntry = await DiaryEntry.findById(id);
        if (!diaryEntry) {
            return res.status(404).json({
                success: false,
                message: "Diary entry not found"
            });
        }

        // Verify password
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
        if (diaryEntry.passwordHash !== passwordHash) {
            return res.status(401).json({
                success: false,
                message: "Invalid password. Cannot decrypt diary content."
            });
        }

        // Decrypt the content
        const decryptedEntry = {
            _id: diaryEntry._id,
            userId: diaryEntry.userId,
            title: decryptData(diaryEntry.title, password),
            content: decryptData(diaryEntry.content, password),
            mood: diaryEntry.mood,
            weather: diaryEntry.weather,
            category: diaryEntry.category,
            isPrivate: diaryEntry.isPrivate,
            isFavorite: diaryEntry.isFavorite,
            entryDate: diaryEntry.entryDate,
            createdAt: diaryEntry.createdAt,
            updatedAt: diaryEntry.updatedAt
        };

        // Decrypt images if they exist
        if (diaryEntry.images && diaryEntry.images.length > 0) {
            decryptedEntry.images = diaryEntry.images.map(img => ({
                url: img.url,
                caption: decryptData(img.caption, password),
                uploadedAt: img.uploadedAt
            }));
        }

        // Decrypt voice notes if they exist
        if (diaryEntry.voiceNotes && diaryEntry.voiceNotes.length > 0) {
            decryptedEntry.voiceNotes = diaryEntry.voiceNotes.map(note => ({
                url: note.url,
                duration: note.duration,
                transcription: decryptData(note.transcription, password),
                uploadedAt: note.uploadedAt
            }));
        }

        // Decrypt location if it exists
        if (diaryEntry.location) {
            decryptedEntry.location = {
                name: decryptData(diaryEntry.location.name, password),
                coordinates: diaryEntry.location.coordinates
            };
        }

        // Decrypt tags if they exist
        if (diaryEntry.tags && diaryEntry.tags.length > 0) {
            decryptedEntry.tags = diaryEntry.tags.map(tag => decryptData(tag, password));
        }

        res.status(200).json({
            success: true,
            message: "Diary entry decrypted successfully",
            data: decryptedEntry
        });

    } catch (error) {
        console.error("Error decrypting diary entry:", error);

        if (error.message.includes('decrypt')) {
            return res.status(400).json({
                success: false,
                message: "Decryption failed. Invalid password or corrupted data."
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error occurred while decrypting diary entry"
        });
    }
});

router

export default router;