import express from 'express';
import dotenv from 'dotenv';
import connectDb from './config/connectDB.js';

import userAuthRoutes from './routes/usersRoutes/authRoutes.js'

dotenv.config();
const app = express();
app.use(express.json());
const PORT = process.env.PORT;

connectDb();

//all routes
app.use('/api/user', userAuthRoutes)

app.listen(PORT, () => {
    console.log(`✅ Server is listenting on port ${PORT}`)
})