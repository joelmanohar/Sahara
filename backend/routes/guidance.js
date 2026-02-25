const express = require('express');
const router = express.Router();
const guidanceService = require('../services/guidanceService');

// POST /api/guidance
// body: { accounts: ['sbi','lic'], userProfile: { name, relationship, state } }
router.post('/', async (req, res, next) => {
    try {
        const { accounts = [], userProfile = {} } = req.body || {};
        if (!Array.isArray(accounts) || accounts.length === 0) {
            return res.status(400).json({ error: 'Provide accounts array' });
        }

        const plan = await guidanceService.generateForAccounts(accounts, userProfile);
        res.json({ plan });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
