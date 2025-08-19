import express from 'express';
import dotenv from 'dotenv';
import connectDb from './config/connectDB.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT;

connectDb();

app.listen(PORT, () => {
    console.log(`✅ Server is listenting on port ${PORT}`)
})