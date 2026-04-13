const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const guidanceService = require('../services/guidanceService');

const sourcesDir = path.join(__dirname, '../rag/sources');

// POST /api/guidance — generate guidance for multiple accounts
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

// GET /api/guidance/topic/:topicId — get structured content for a specific topic
router.get('/topic/:topicId', async (req, res, next) => {
    try {
        const { topicId } = req.params;
        const fileName = `${topicId}.txt`;
        const filePath = path.join(sourcesDir, fileName);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: `Topic "${topicId}" not found` });
        }

        const rawText = fs.readFileSync(filePath, 'utf8');

        // Parse the raw text into structured sections
        const sections = parseRawTextToSections(rawText);

        // Extract links
        const links = [];
        const linkRegex = /(https?:\/\/[^\s)]+)/g;
        let m;
        while ((m = linkRegex.exec(rawText)) !== null) {
            // Try to find a label before the URL
            const idx = m.index;
            const before = rawText.substring(Math.max(0, idx - 100), idx);
            const labelMatch = before.match(/([A-Z][^:\n]*?):\s*$/);
            links.push({
                url: m[1],
                label: labelMatch ? labelMatch[1].trim() : m[1].replace(/https?:\/\/(www\.)?/, '').split('/')[0]
            });
        }

        res.json({
            topicId,
            title: sections[0]?.title || topicId.replace(/_/g, ' '),
            rawText,
            sections,
            officialLinks: links.slice(0, 10) // limit to 10 most relevant
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/guidance/topics — list all available topics
router.get('/topics', (req, res) => {
    try {
        const files = fs.readdirSync(sourcesDir).filter(f => f.endsWith('.txt'));
        const topics = files.map(f => ({
            id: f.replace('.txt', ''),
            title: f.replace('.txt', '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            fileName: f
        }));
        res.json({ topics });
    } catch (err) {
        res.json({ topics: [] });
    }
});

function parseRawTextToSections(rawText) {
    if (!rawText) return [];
    const lines = rawText.split('\n');
    const sections = [];
    let currentSection = { title: 'Overview', lines: [] };

    // Common header keywords based on the knowledge base structure
    const headerKeywords = [
        'STEP', 'SCENARIO', 'TYPE', 'OVERVIEW', 'IMPORTANT', 'ESCALATION', 
        'REQUIRED DOCUMENTS', 'TIMELINE', 'GENERAL', 'SPECIAL CASES', 
        'TAX IMPLICATIONS', 'KEY PRINCIPLE', 'TYPES OF', 'THREE TYPES', 
        'WHO IS', 'WHEN IS', 'WILL AND', 'ADDITIONAL', 'HOUSING', 
        'AGRICULTURAL', 'DISPUTES', 'STAMP DUTY', 'CREDIT REPORT', 
        'GOVERNMENT SCHEMES', 'CERTIFIED COPIES'
    ];

    const headerRegex = new RegExp(`^(${headerKeywords.join('|')})`, 'i');

    for (const line of lines) {
        const trimmed = line.trim();

        // Detect section headers: must start with keyword, be relatively short, and not be a bullet point
        const isHeader = headerRegex.test(trimmed) && 
                        trimmed.length > 3 && 
                        trimmed.length < 120 && 
                        !trimmed.startsWith('-') && 
                        !trimmed.startsWith('•');

        if (isHeader) {
            // If we found a new header, push the previous section if it has content
            if (currentSection.lines.length > 0) {
                sections.push({ 
                    title: currentSection.title, 
                    content: currentSection.lines.join('\n').trim() 
                });
            }
            currentSection = { title: trimmed.replace(/:$/, ''), lines: [] };
        } else {
            currentSection.lines.push(line);
        }
    }

    // Push the final section
    if (currentSection.lines.length > 0) {
        sections.push({ 
            title: currentSection.title, 
            content: currentSection.lines.join('\n').trim() 
        });
    }

    // Filter out empty sections
    return sections.filter(s => s.content.length > 0 || s.title !== 'Overview');
}


module.exports = router;
