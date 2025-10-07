import express from 'express';
import dotenv from 'dotenv';
import connectDb from './config/connectDB.js';
import cors from 'cors';

import userAuthRoutes from './routes/usersRoutes/authRoutes.js'
import userdairyRoutes from './routes/usersRoutes/dairyRoutes.js'
import adminmoodRoutes from './routes/adminRoutes/moodRoutes.js'
import usermoodRoutes from './routes/usersRoutes/moodRoutes.js'
import userDetailsRoutes from './routes/usersRoutes/userDetailsRoutes.js'
import adminFaqRoutes from './routes/adminRoutes/faqRoutes.js';
import adminDailyQuotesRoutes from './routes/adminRoutes/dailyQuotesRoutes.js';
import userFaqRoutes from './routes/usersRoutes/faqRoutes.js';
import userDailyQuotesRoutes from './routes/usersRoutes/dailyQuotesRoutes.js';
import adminAuthRoutes from './routes/adminRoutes/authRoutes.js';
import Users from './modals/userModal.js';

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors())
const PORT = process.env.PORT;

connectDb();

//all user routes
app.use('/api/auth', userAuthRoutes)
app.use('/api/diary', userdairyRoutes)
app.use('/api/mood', usermoodRoutes)
app.use('/api/userdetails', userDetailsRoutes);
app.use('/api/faq', userFaqRoutes);
app.use('/api/dailyquotes', userDailyQuotesRoutes);


//all admin routes
app.use('/api/admin/mood', adminmoodRoutes)
app.use('/api/admin/faq', adminFaqRoutes)
app.use('/api/admin/dailyquotes', adminDailyQuotesRoutes)
app.use('/api/admin/auth', adminAuthRoutes)


//api for testing
app.get('/', (req, res) => {
    res.send("AI Dairy backend is running...")
})
app.get('/db/test', async (req, res) => {
    try {
        const user = await Users.findOne({});
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
})

app.listen(PORT, () => {
    console.log(`✅ Server is listenting on port ${PORT}`)
})