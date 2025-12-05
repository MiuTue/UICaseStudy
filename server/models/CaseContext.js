import mongoose from 'mongoose';

const caseContextSchema = new mongoose.Schema({
    case_id: { type: String, required: true, unique: true },
    initial_context: { type: Object }
}, { collection: 'contexts' });

export const getCaseContextModel = () => {
    const db = mongoose.connection.useDb('case_study_db');
    return db.model('CaseContext', caseContextSchema, 'contexts');
};
