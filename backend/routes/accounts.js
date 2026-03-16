const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const User = require('../db/models/User');
const accountDetectionService = require('../services/accountDetectionService');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/**
 * POST /api/accounts/detect-document
 * Upload a PDF or text file; extract text and run AI detection.
 */
router.post('/detect-document', upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

        let text = '';
        const mime = req.file.mimetype;

        if (mime === 'application/pdf') {
            const parsed = await pdfParse(req.file.buffer);
            text = parsed.text;
        } else if (mime.startsWith('text/')) {
            text = req.file.buffer.toString('utf-8');
        } else {
            // For images or unknown types, pass the filename + a short hint to Gemini
            text = `[Image/Document file: ${req.file.originalname}] — Please identify financial accounts that might be referenced in this type of document.`;
        }

        if (!text || text.trim().length < 5) {
            return res.status(422).json({ error: 'Could not extract text from the uploaded file.' });
        }

        const accounts = await accountDetectionService.detectFromDocument(text);
        res.json({ accounts, extractedTextLength: text.length });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/accounts/detect-text
 * Analyse pasted email or SMS text.
 * Body: { text: string, source: 'email'|'sms' }
 */
router.post('/detect-text', async (req, res, next) => {
    try {
        const { text, source = 'email' } = req.body;
        if (!text || text.trim().length < 10) {
            return res.status(400).json({ error: 'Please provide text to analyse.' });
        }
        const accounts = await accountDetectionService.detectFromText(text, source);
        res.json({ accounts });
    } catch (err) {
        next(err);
    }
});

/**
 * PUT /api/accounts/:userId/merge
 * Merge detected/manual accounts into the user's profile (deduplicates by type+name).
 * Body: { accounts: [{ type, name, note, detectedBy }] }
 */
router.put('/:userId/merge', async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { accounts: newAccounts = [] } = req.body;

        if (!global.USE_DB) {
            // Mock mode — just echo back success
            return res.json({ success: true, accounts: newAccounts, merged: newAccounts.length });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const existing = user.accounts || [];

        // Deduplicate: skip if type+name combo already saved
        const makeKey = (a) => `${(a.type || '').toLowerCase()}:${(a.name || '').toLowerCase()}`;
        const existingKeys = new Set(existing.map(makeKey));

        let mergedCount = 0;
        for (const acc of newAccounts) {
            const key = makeKey(acc);
            if (!existingKeys.has(key)) {
                existing.push({
                    type: acc.type || 'Unknown',
                    name: acc.name || '',
                    note: acc.note || '',
                    detectedBy: acc.detectedBy || 'manual'
                });
                existingKeys.add(key);
                mergedCount++;
            }
        }

        user.accounts = existing;
        await user.save();

        res.json({ success: true, accounts: user.accounts, merged: mergedCount });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/accounts/:userId
 * Fetch the user's saved accounts.
 */
router.get('/:userId', async (req, res, next) => {
    try {
        const { userId } = req.params;

        if (!global.USE_DB) {
            return res.json({ accounts: [] });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({ accounts: user.accounts || [] });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
