import mongoose, { Schema } from "mongoose";

const diaryEntrySchema = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            // Note: When encrypted, this will be longer than 200 chars
            // Original validation happens before encryption
        },
        content: {
            type: String,
            required: true
            // Note: When encrypted, this will be much longer
        },
        // Mood tracking (kept unencrypted for filtering/analytics)
        mood: {
            type: String,
            enum: ['very_happy', 'happy', 'neutral', 'sad', 'very_sad', 'angry', 'excited', 'anxious', 'grateful', 'stressed'],
        },

        // Weather (kept unencrypted for filtering/analytics)
        weather: {
            condition: {
                type: String,
                enum: ['sunny', 'cloudy', 'rainy', 'snowy', 'stormy', 'foggy']
            },
            temperature: Number
        },

        // Media attachments (URLs unencrypted, captions encrypted)
        images: [{
            url: {
                type: String,
                required: true
            },
            caption: {
                type: String,
                default: ""
                // This will be encrypted if password is provided
            },
            uploadedAt: {
                type: Date,
                default: Date.now
            }
        }],

        voiceNotes: [{
            url: {
                type: String,
                required: true
            },
            duration: {
                type: Number,
                required: true
            },
            transcription: {
                type: String,
                default: ""
                // This will be encrypted if password is provided
            },
            uploadedAt: {
                type: Date,
                default: Date.now
            }
        }],

        // Location (name encrypted, coordinates could be encrypted too)
        location: {
            name: String, // This will be encrypted
            coordinates: {
                latitude: Number,
                longitude: Number
            }
        },

        // Tags and categories
        tags: [String], // These will be encrypted (makes searching harder)
        category: {
            type: String,
            enum: ['personal', 'work', 'travel', 'health', 'relationships', 'goals', 'gratitude', 'other'],
            default: 'personal'
            // Kept unencrypted for filtering
        },

        // Privacy and security
        isPrivate: {
            type: Boolean,
            default: true
        },

        // Encryption-related fields
        passwordHash: {
            type: String,
            // SHA-256 hash of the password for verification
            // Don't store the actual password!
        },
        isEncrypted: {
            type: Boolean,
            default: false
        },
        encryptionVersion: {
            type: String,
            default: '1.0'
            // For future encryption algorithm upgrades
        },

        // Entry date (can be different from creation date)
        entryDate: {
            type: Date,
            default: Date.now,
            required: true
        },

        // Favorites/bookmarks
        isFavorite: {
            type: Boolean,
            default: false
        },

        // Streak tracking
        streakDay: Number, // Which day of writing streak this represents
    },
    {
        timestamps: true
    }
);

// Index for better query performance
diaryEntrySchema.index({ userId: 1, entryDate: -1 });
diaryEntrySchema.index({ userId: 1, category: 1 });
diaryEntrySchema.index({ userId: 1, mood: 1 });
diaryEntrySchema.index({ userId: 1, isEncrypted: 1 });

// Virtual for checking if entry needs password
diaryEntrySchema.virtual('needsPassword').get(function () {
    return this.isEncrypted && this.passwordHash;
});

// Method to check if password is correct
diaryEntrySchema.methods.verifyPassword = function (password) {
    if (!this.passwordHash) return false;
    const crypto = require('crypto');
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    return this.passwordHash === passwordHash;
};

const DiaryEntry = mongoose.model("DiaryEntry", diaryEntrySchema);

export default DiaryEntry;