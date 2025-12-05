import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config(); // Load ENV variables

import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import caseRoutes from './routes/caseRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';

const app = express();
const port = process.env.PORT || 8000;

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
    res.status(200).send('API is OK!');
});

// APIs
app.use('/api', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/sessions', sessionRoutes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
