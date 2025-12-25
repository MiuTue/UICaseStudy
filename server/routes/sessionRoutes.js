import express from 'express';
import SessionHistory from '../models/SessionHistory.js';
import authenticateToken from '../middleware/authMiddleware.js';

const router = express.Router();

// === GET HISTORY LIST ===
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const histories = await SessionHistory.find({ userId: userId }).sort({ createdAt: -1 });
        res.json(histories);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi lấy lịch sử', error: err.message });
    }
});

// === GET HISTORY DETAIL ===
router.get('/history/:sessionId', authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.userId;
        const history = await SessionHistory.findOne({ sessionId: sessionId, userId: userId });

        if (!history) {
            return res.status(404).json({ message: 'Không tìm thấy lịch sử' });
        }
        res.json(history);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi lấy chi tiết lịch sử', error: err.message });
    }
});

// === SAVE HISTORY ===
router.post('/history', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { sessionId, caseId, messages, finalScore, finalState } = req.body;

        // Check if exists
        let history = await SessionHistory.findOne({ sessionId });
        if (history) {
            // Update
            history.messages = messages;
            history.finalScore = finalScore;
            history.finalState = finalState;
            history.caseId = caseId; // Just in case
        } else {
            // Create
            history = new SessionHistory({
                userId,
                sessionId,
                caseId,
                messages,
                finalScore,
                finalState
            });
        }
        await history.save();
        res.json({ message: 'Lưu lịch sử thành công', history });

    } catch (err) {
        console.error('Error saving history:', err);
        res.status(500).json({ message: 'Lỗi lưu lịch sử', error: err.message });
    }
});

export default router;
