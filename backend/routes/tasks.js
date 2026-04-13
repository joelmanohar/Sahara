const express = require('express');
const router = express.Router();

const CATEGORY_ICONS = {
    bank: '🏦', insurance: '🛡', digital: '📱', investment: '📈',
    pension: '🎖', property: '🏠', tax: '📑', legal: '⚖️',
    utility: '🔌', government: '🏛', general: '📋'
};

const isMock = (userId) => !global.USE_DB || userId === 'mock-user-id-123';

// In-memory store for mock mode (starts empty)
let mockTasks = [];

// GET tasks for a user
router.get('/:userId', async (req, res, next) => {
    try {
        if (isMock(req.params.userId)) return res.json(mockTasks);
        const Task = require('../db/models/Task');
        let taskDoc = await Task.findOne({ userId: req.params.userId });
        if (!taskDoc) {
            // Create empty task document for new users
            taskDoc = await Task.create({ userId: req.params.userId, tasks: [] });
        }
        res.json(taskDoc.tasks);
    } catch (err) {
        next(err);
    }
});

// POST — create a new task
router.post('/:userId', async (req, res, next) => {
    try {
        const { name, category, sub, priority, deadline, source, officialLink, notes } = req.body;
        if (!name) return res.status(400).json({ error: 'Task name is required' });

        const icon = CATEGORY_ICONS[category] || CATEGORY_ICONS.general;
        const isUrgent = priority === 'urgent';
        const isImportant = priority === 'important' || priority === 'urgent';

        // Compute deadline date if a relative deadline string is provided
        let deadlineDate = null;
        if (deadline) {
            const match = deadline.match(/(\d+)\s*(day|week|month)/i);
            if (match) {
                const num = parseInt(match[1], 10);
                const unit = match[2].toLowerCase();
                deadlineDate = new Date();
                if (unit === 'day' || unit === 'days') deadlineDate.setDate(deadlineDate.getDate() + num);
                else if (unit === 'week' || unit === 'weeks') deadlineDate.setDate(deadlineDate.getDate() + num * 7);
                else if (unit === 'month' || unit === 'months') deadlineDate.setMonth(deadlineDate.getMonth() + num);
            }
        }

        const newTask = {
            icon,
            category: category || 'general',
            name,
            sub: sub || 'Added from ' + (source || 'manual'),
            status: 'pending',
            priority: priority || 'normal',
            isImportant,
            isUrgent,
            deadline: deadline || '',
            deadlineDate,
            source: source || 'manual',
            officialLink: officialLink || '',
            notes: notes || '',
            updatedAt: new Date()
        };

        if (isMock(req.params.userId)) {
            mockTasks.push(newTask);
            return res.json({ success: true, task: newTask, tasks: mockTasks });
        }

        const Task = require('../db/models/Task');
        let taskDoc = await Task.findOne({ userId: req.params.userId });
        if (!taskDoc) {
            taskDoc = await Task.create({ userId: req.params.userId, tasks: [] });
        }
        taskDoc.tasks.push(newTask);
        await taskDoc.save();
        res.json({ success: true, task: newTask, tasks: taskDoc.tasks });
    } catch (err) {
        next(err);
    }
});

// DELETE — remove a task
router.delete('/:userId/:taskIndex', async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const taskIndex = parseInt(req.params.taskIndex, 10);

        if (isMock(userId)) {
            if (mockTasks[taskIndex]) {
                const removed = mockTasks.splice(taskIndex, 1);
                return res.json({ success: true, removed, tasks: mockTasks });
            }
            return res.status(404).json({ error: 'Task not found' });
        }

        const Task = require('../db/models/Task');
        const taskDoc = await Task.findOne({ userId });
        if (!taskDoc) return res.status(404).json({ error: 'Tasks not found' });

        if (taskDoc.tasks[taskIndex]) {
            taskDoc.tasks.splice(taskIndex, 1);
            await taskDoc.save();
            return res.json({ success: true, tasks: taskDoc.tasks });
        }
        res.status(404).json({ error: 'Task not found' });
    } catch (err) {
        next(err);
    }
});

// PUT — update task (can be status-only or full-update)
router.put('/:userId', async (req, res, next) => {
    try {
        const { taskIndex, status, notes, priority, name, category, sub, deadline, officialLink } = req.body;
        const userId = req.params.userId;
        
        const idx = parseInt(taskIndex, 10);

        const updateData = (target) => {
            if (status) target.status = status;
            if (notes !== undefined) target.notes = notes;
            if (priority) {
                target.priority = priority;
                target.isImportant = priority === 'important' || priority === 'urgent';
                target.isUrgent = priority === 'urgent';
            }
            if (name) target.name = name;
            if (category) {
                target.category = category;
                target.icon = CATEGORY_ICONS[category] || CATEGORY_ICONS.general;
            }
            if (sub) target.sub = sub;
            if (deadline !== undefined) target.deadline = deadline;
            if (officialLink !== undefined) target.officialLink = officialLink;
            target.updatedAt = new Date();
        };

        if (isMock(userId)) {
            if (mockTasks[idx]) {
                updateData(mockTasks[idx]);
            }
            return res.json(mockTasks);
        }

        const Task = require('../db/models/Task');
        const taskDoc = await Task.findOne({ userId });
        if (!taskDoc) return res.status(404).json({ error: 'Tasks not found' });

        if (taskDoc.tasks[idx]) {
            updateData(taskDoc.tasks[idx]);
            await taskDoc.save();
        }
        res.json(taskDoc.tasks);
    } catch (err) {
        next(err);
    }
});


module.exports = router;
