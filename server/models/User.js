import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    session_owner: { type: [String], default: [] },
    resetCode: { type: String },
    resetCodeExpires: { type: Date },
}, { collection: 'member' });

const User = mongoose.model('User', userSchema, 'member');

export default User;
