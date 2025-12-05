import mongoose from 'mongoose';

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

export const getPersonasModel = () => {
    const db = mongoose.connection.useDb('case_study_db');
    return db.model('Personas', personasSchema, 'personas');
};
