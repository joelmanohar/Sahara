const express = require('express');
const router = express.Router();

const initialTasks = [
    { icon: '🛡', category: 'insurance', name: 'LIC Policy Claim', sub: 'Submitted · Awaiting response', status: 'submitted', updatedAt: new Date() },
    { icon: '📧', category: 'digital', name: 'Gmail Account', sub: 'Memorialization complete', status: 'done', updatedAt: new Date() },
    { icon: '📊', category: 'pension', name: 'EPF / PF Claim', sub: 'Form 10D download pending', status: 'pending', updatedAt: new Date() },
    { icon: '📈', category: 'investment', name: 'Demat Account', sub: 'Account details required', status: 'pending', updatedAt: new Date() },
    { icon: '📱', category: 'digital', name: 'Instagram Account', sub: 'Not started', status: 'pending', updatedAt: new Date() },
    { icon: '💸', category: 'digital', name: 'PhonePe Wallet', sub: 'Balance to be withdrawn', status: 'pending', updatedAt: new Date() },
];
let mockTasks = initialTasks.map(t => ({ ...t }));

const isMock = (userId) => !global.USE_DB || userId === 'mock-user-id-123';

router.get('/:userId', async (req, res, next) => {
    try {
        if (isMock(req.params.userId)) return res.json(mockTasks);
        const Task = require('../db/models/Task');
        const taskDoc = await Task.findOne({ userId: req.params.userId });
        if (!taskDoc) return res.status(404).json({ error: 'Tasks not found' });
        res.json(taskDoc.tasks);
    } catch (err) {
        next(err);
    }
});

router.put('/:userId', async (req, res, next) => {
    try {
        const { taskIndex, status, notes } = req.body;
        if (isMock(req.params.userId)) {
            if (mockTasks[taskIndex]) {
                mockTasks[taskIndex].status = status;
                if (notes !== undefined) mockTasks[taskIndex].notes = notes;
                mockTasks[taskIndex].updatedAt = new Date();
            }
            return res.json(mockTasks);
        }
        const Task = require('../db/models/Task');
        const taskDoc = await Task.findOne({ userId: req.params.userId });
        if (!taskDoc) return res.status(404).json({ error: 'Tasks not found' });
        if (taskDoc.tasks[taskIndex]) {
            taskDoc.tasks[taskIndex].status = status;
            if (notes !== undefined) taskDoc.tasks[taskIndex].notes = notes;
            taskDoc.tasks[taskIndex].updatedAt = new Date();
            await taskDoc.save();
        }
        res.json(taskDoc.tasks);
    } catch (err) {
        next(err);
    }
});

module.exports = router;

