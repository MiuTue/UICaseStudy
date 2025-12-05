import mongoose from 'mongoose';

const sessionHistorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: String, required: true, unique: true },
    caseId: { type: String, required: true },
    messages: { type: Array, default: [] },
    finalScore: { type: Number, default: 0 },
    finalState: { type: Object, default: {} },
}, { collection: 'chat_histories' });

const SessionHistory = mongoose.model('SessionHistory', sessionHistorySchema, 'chat_histories');

export default SessionHistory;
