const express = require('express');
const router = express.Router();
const User = require('../db/models/User');
const Task = require('../db/models/Task');

router.put('/:id', async (req, res, next) => {
    try {
        console.log(`[PUT /users/${req.params.id}] body:`, JSON.stringify(req.body));
        const { name, relationship, state, employment, accounts } = req.body;
        const userId = req.params.id;

        if (!global.USE_DB) {
            return res.json({ userId: 'mock-user-id-123' });
        }

        console.log(`[PUT /users/${userId}] updating user...`);
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.name = name || user.name;
        user.relationship = relationship || user.relationship;
        user.state = state || user.state;
        user.employment = employment || user.employment;
        user.accounts = (accounts || user.accounts || []).map(a => {
            if (typeof a === 'string') {
                // Legacy format from Setup.jsx — convert to object
                return { type: a, name: '', note: '', detectedBy: 'manual' };
            }
            return a;
        });

        await user.save();
        console.log(`[PUT /users/${userId}] user updated`);

        // Ensure task doc exists (empty — tasks are created dynamically from chat/guidance)
        let taskDoc = await Task.findOne({ userId: user._id });
        if (!taskDoc) {
            console.log(`[PUT /users/${userId}] creating empty task doc...`);
            taskDoc = new Task({ userId: user._id, tasks: [] });
            await taskDoc.save();
            console.log(`[PUT /users/${userId}] taskDoc saved`);
        }

        res.json({ userId: user._id });
    } catch (err) {
        console.error(`[PUT /users] ERROR:`, err.message, err.stack);
        next(err);
    }
});

module.exports = router;
