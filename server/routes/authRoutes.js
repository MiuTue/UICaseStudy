import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'my_jwt_secret';

// === REGISTER (hash password) ===
router.post('/register', async (req, res) => {
    console.log('Received register request:', req.body);
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword, session_owner: [] });
        await user.save();
        console.log('User saved:', user);
        return res.status(201).json({ message: 'Registered successfully' });
    } catch (err) {
        console.error('Error in /register:', err);
        return res.status(500).json({ message: 'Register error', error: String(err) });
    }
});

// === LOGIN (compare password, generate JWT) ===
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ message: 'Email and password are required' });
    try {
        const user = await User.findOne({ email });
        if (!user)
            return res.status(401).json({ message: 'Invalid email or password' });
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword)
            return res.status(401).json({ message: 'Invalid email or password' });
        // Create JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: 'Login error', error: err.message });
    }
});

// === FORGOT PASSWORD - Send reset code ===
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Email không tồn tại trong hệ thống' });
        }

        // Generate 6-digit reset code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Set expiration time (15 minutes from now)
        const resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000);

        // Update user with reset code
        user.resetCode = resetCode;
        user.resetCodeExpires = resetCodeExpires;
        await user.save();

        // TODO: Send email with reset code (implement email service)
        console.log(`Reset code for ${email}: ${resetCode}`);

        res.json({ message: 'Mã reset đã được gửi đến email của bạn' });
    } catch (err) {
        console.error('Error in /forgot-password:', err);
        res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
});

// === VERIFY RESET CODE ===
router.post('/verify-reset-code', async (req, res) => {
    const { email, resetCode } = req.body;
    if (!email || !resetCode) {
        return res.status(400).json({ message: 'Email và mã reset là bắt buộc' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Email không tồn tại' });
        }

        // Check if reset code exists and is not expired
        if (!user.resetCode || user.resetCode !== resetCode) {
            return res.status(400).json({ message: 'Mã reset không hợp lệ' });
        }

        if (user.resetCodeExpires < new Date()) {
            return res.status(400).json({ message: 'Mã reset đã hết hạn' });
        }

        res.json({ message: 'Mã reset hợp lệ' });
    } catch (err) {
        console.error('Error in /verify-reset-code:', err);
        res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
});

// === RESET PASSWORD ===
router.post('/reset-password', async (req, res) => {
    const { email, resetCode, newPassword } = req.body;
    if (!email || !resetCode || !newPassword) {
        return res.status(400).json({ message: 'Email, mã reset và mật khẩu mới là bắt buộc' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Email không tồn tại' });
        }

        // Verify reset code
        if (!user.resetCode || user.resetCode !== resetCode) {
            return res.status(400).json({ message: 'Mã reset không hợp lệ' });
        }

        if (user.resetCodeExpires < new Date()) {
            return res.status(400).json({ message: 'Mã reset đã hết hạn' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear reset code
        user.password = hashedPassword;
        user.resetCode = undefined;
        user.resetCodeExpires = undefined;
        await user.save();

        res.json({ message: 'Mật khẩu đã được cập nhật thành công' });
    } catch (err) {
        console.error('Error in /reset-password:', err);
        res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
});

export default router;
