import express from 'express';
import { getCaseContextModel } from '../models/CaseContext.js';
import { getSkeletonModel } from '../models/Skeleton.js';
import { getPersonasModel } from '../models/Personas.js';

const router = express.Router();

// === API GET ALL CASES ===
router.get('/', async (req, res) => {
    try {
        const CaseModel = getCaseContextModel();
        // Truy vấn và chỉ lấy các trường cần thiết
        const cases = await CaseModel.find({}, { case_id: 1, topic: 1, 'initial_context.topic': 1, _id: 0 });
        res.json(cases);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi lấy danh sách case', error: err.message });
    }
});

// === API GET CASE DETAILS BY ID (skeleton, personas, context) ===
router.get('/:caseId', async (req, res) => {
    const { caseId } = req.params;
    try {
        const SkeletonModel = getSkeletonModel();
        const PersonasModel = getPersonasModel();
        const ContextModel = getCaseContextModel();

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
router.post('/', async (req, res) => {
    const { case_id, skeleton, context, personas } = req.body;

    if (!case_id) {
        return res.status(400).json({ message: 'case_id is required' });
    }

    try {
        const SkeletonModel = getSkeletonModel();
        const ContextModel = getCaseContextModel();
        const PersonasModel = getPersonasModel();

        const options = { upsert: true, new: true, setDefaultsOnInsert: true };

        // Xử lý lưu Skeleton và Context
        const [savedSkeleton, savedContext] = await Promise.all([
            SkeletonModel.findOneAndUpdate({ case_id: case_id }, skeleton, options),
            ContextModel.findOneAndUpdate({ case_id: case_id }, { initial_context: context }, options),
        ]);

        // Xử lý lưu từng Persona riêng lẻ
        // personas.personas là mảng các persona
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

export default router;
