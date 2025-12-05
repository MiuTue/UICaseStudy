import express from 'express';
import User from '../models/User.js';
import authenticateToken from '../middleware/authMiddleware.js';

const router = express.Router();

// === API GET ALL USERS, bảo vệ bằng authenticateToken ===
router.get('/', authenticateToken, async (req, res) => {
    try {
        const users = await User.find({}, { password: 0 }); // không trả về trường password
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi lấy user', error: err.message });
    }
});

export default router;
