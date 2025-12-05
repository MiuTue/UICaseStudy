import mongoose from 'mongoose';

const skeletonSchema = new mongoose.Schema({
    case_id: { type: String, required: true, unique: true },
    title: { type: String },
    canon_events: { type: Array }
}, { collection: 'skeletons' });

export const getSkeletonModel = () => {
    const db = mongoose.connection.useDb('case_study_db');
    return db.model('Skeleton', skeletonSchema, 'skeletons');
};
