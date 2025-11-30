// ... existing code ...
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import express from 'express';
import cors from 'cors';


const app = express();
// Cấu hình cho phép mọi origin truy cập
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mongoURI = process.env.MONGO_URI || 'mongodb+srv://nvt120205:thang1202@thangnguyen.8aiscbh.mongodb.net/';
const port = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET || 'my_jwt_secret';

// Kết nối và CHỌN ĐÚNG DB "User"
mongoose.connect(mongoURI, { dbName: 'User' }).then(() => {
    console.log('Connected to MongoDB <User>');
}).catch((err) => {
    console.error('Error connecting to MongoDB:', err);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==== USER SCHEMA với collection là member ====
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    session_owner: { type: [String], default: [] },
    resetCode: { type: String },
    resetCodeExpires: { type: Date },
},{ collection: 'member' });

const User = mongoose.model('User', userSchema, 'member');

// ==== CASE SCHEMA với collection là contexts ====
const caseContextSchema = new mongoose.Schema({
    case_id: { type: String, required: true, unique: true },
    initial_context: { type: Object }
}, { collection: 'contexts' });

// ==== SKELETON SCHEMA với collection là skeletons ====
const skeletonSchema = new mongoose.Schema({
    case_id: { type: String, required: true, unique: true },
    title: { type: String },
    canon_events: { type: Array }
}, { collection: 'skeletons' });

// ==== PERSONAS SCHEMA với collection là personas ====
const personasSchema = new mongoose.Schema({
    case_id: { type: String, required: true },
    id: { type: String, required: true },
    name: { type: String },
    role: { type: String },
    age: { type: Number },
    gender: { type: String },
    background: { type: String },
    personality: { type: String },
    goal: { type: String },
    speech_pattern: { type: String },
    emotion_init: { type: String },
    emotion_during: { type: Array },
    emotion_end: { type: String },
    voice_tags: { type: Array },

}, { collection: 'personas' });

// Đảm bảo rằng mỗi persona trong một case là duy nhất
personasSchema.index({ case_id: 1, id: 1 }, { unique: true });

app.get('/', (req, res) => {
    res.status(200).send('API is OK!');
  });

// === REGISTER (hash password) ===
app.post('/api/register', async (req, res) => {
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
        console.error('Error in /api/register:', err);
        return res.status(500).json({ message: 'Register error', error: String(err) });
    }
});

// === LOGIN (compare password, generate JWT) ===
app.post('/api/login', async (req, res) => {
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

// === MIDDLEWARE AUTH ===
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user; // {userId, email}
        next();
    });
}
// Muốn bảo vệ route API thì dùng: app.get('/api/xxx', authenticateToken, (req, res) => {...})

// === API GET ALL USERS, bảo vệ bằng authenticateToken ===
app.get('/api/user', authenticateToken, async (req, res) => {
    try {
        const users = await User.find({}, { password: 0 }); // không trả về trường password
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi lấy user', error: err.message });
    }
});

// === API GET ALL CASES ===
app.get('/api/cases', async (req, res) => {
    try {
        // Kết nối đến DB 'case_study_db'
        const caseDb = mongoose.connection.useDb('case_study_db');
        // Lấy model từ DB đã chọn. Mongoose sẽ cache model này cho kết nối 'caseDb'.
        const CaseModel = caseDb.model('CaseContext', caseContextSchema, 'contexts');
        // Truy vấn và chỉ lấy các trường cần thiết
        const cases = await CaseModel.find({}, { case_id: 1, topic: 1, 'initial_context.topic': 1, _id: 0 });
        res.json(cases);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi lấy danh sách case', error: err.message });
    }
});

// === API GET CASE DETAILS BY ID (skeleton, personas, context) ===
app.get('/api/cases/:caseId', async (req, res) => {
    const { caseId } = req.params;
    try {
        // Kết nối đến DB 'case_study_db'
        const caseDb = mongoose.connection.useDb('case_study_db');

        // Lấy models từ DB đã chọn
        const SkeletonModel = caseDb.model('Skeleton', skeletonSchema, 'skeletons');
        const PersonasModel = caseDb.model('Personas', personasSchema, 'personas');
        const ContextModel = caseDb.model('CaseContext', caseContextSchema, 'contexts');

        // Dùng Promise.all để truy vấn song song
        const [skeleton, personas, context] = await Promise.all([
            SkeletonModel.findOne({ case_id: caseId }, { _id: 0 }),
            PersonasModel.findOne({ case_id: caseId }, { _id: 0 }),
            ContextModel.findOne({ case_id: caseId }, { _id: 0 })
        ]);

        if (!skeleton || !personas || !context) {
            return res.status(404).json({ message: 'Không tìm thấy đầy đủ dữ liệu cho case này.' });
        }

        res.json({ skeleton, personas, context });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi lấy chi tiết case', error: err.message });
    }
});

// === API SAVE/UPDATE CASE (SKELETON, CONTEXT, PERSONAS) ===
app.post('/api/cases', async (req, res) => {
    const { case_id, skeleton, context, personas } = req.body;

    if (!case_id) {
        return res.status(400).json({ message: 'case_id is required' });
    }

    try {
        // Kết nối đến DB 'case_study_db'
        const caseDb = mongoose.connection.useDb('case_study_db');

        // Lấy models từ DB đã chọn
        const SkeletonModel = caseDb.model('Skeleton', skeletonSchema);
        const ContextModel = caseDb.model('CaseContext', caseContextSchema);
        const PersonasModel = caseDb.model('Personas', personasSchema);

        const options = { upsert: true, new: true, setDefaultsOnInsert: true };

        // Xử lý lưu Skeleton và Context
        const [savedSkeleton, savedContext] = await Promise.all([
            SkeletonModel.findOneAndUpdate({ case_id: case_id }, skeleton, options),
            ContextModel.findOneAndUpdate({ case_id: case_id }, { initial_context: context }, options),
        ]);

        // Xử lý lưu từng Persona riêng lẻ
        const personaSavePromises = personas.personas.map(p => {
            const personaWithCaseId = { ...p, case_id: case_id };
            // Mỗi persona là một document, tìm và cập nhật dựa trên case_id và persona id
            return PersonasModel.findOneAndUpdate({ case_id: case_id, id: p.id }, personaWithCaseId, options);
        });

        const savedPersonas = await Promise.all(personaSavePromises);

        const personasCount = savedPersonas.length;

        res.status(200).json({
            message: `Đã lưu case '${case_id}' thành công.`,
            case_id: case_id,
            personas_count: personasCount
        });

    } catch (err) {
        console.error('Error in POST /api/cases:', err);
        // Kiểm tra lỗi trùng lặp key
        if (err.code === 11000) {
            return res.status(409).json({ message: `Lỗi: case_id '${case_id}' đã tồn tại và có lỗi khi cập nhật.`, error: err.message });
        }
        res.status(500).json({ message: 'Lỗi khi lưu case vào database', error: err.message });
    }
});


// === FORGOT PASSWORD - Send reset code ===
app.post('/api/forgot-password', async (req, res) => {
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
        console.error('Error in /api/forgot-password:', err);
        res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
});

// === VERIFY RESET CODE ===
app.post('/api/verify-reset-code', async (req, res) => {
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
        console.error('Error in /api/verify-reset-code:', err);
        res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
});

// === RESET PASSWORD ===
app.post('/api/reset-password', async (req, res) => {
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
        console.error('Error in /api/reset-password:', err);
        res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
