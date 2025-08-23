import express from 'express';
import dotenv from 'dotenv';
import connectDb from './config/connectDB.js';
import cors from 'cors';

import userAuthRoutes from './routes/usersRoutes/authRoutes.js'
import userdairyRoutes from './routes/usersRoutes/dairyRoutes.js'

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors())
const PORT = process.env.PORT;

connectDb();

//all routes
app.use('/api/auth', userAuthRoutes)
app.use('/api/diary', userdairyRoutes)

app.listen(PORT, () => {
    console.log(`✅ Server is listenting on port ${PORT}`)
})