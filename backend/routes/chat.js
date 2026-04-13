const express = require('express');
const router = express.Router();
const User = require('../db/models/User');
const ragService = require('../services/ragService');
const geminiService = require('../services/geminiService');

// Get chat history for a user
router.get('/:userId', async (req, res, next) => {
    try {
        if (!global.USE_DB || req.params.userId === 'mock-user-id-123') {
            return res.json([]);
        }
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user.chatHistory || []);
    } catch (err) {
        next(err);
    }
});

// Post a new message
router.post('/', async (req, res, next) => {
    try {
        const { message, history, userId, accounts } = req.body;

        let userProfile = { name: 'User', relationship: '', state: '', employment: '', accounts: [] };
        let dbUser = null;
        if (global.USE_DB && userId && userId !== 'mock-user-id-123') {
            dbUser = await User.findById(userId);
            if (dbUser) {
                userProfile = dbUser;
            }
        }

        const exactMsg = message.trim();
        let staticReply = null;
        let staticShowDocCTA = false;

        if (exactMsg === 'Next step') {
            staticReply = "Here is the next step typically recommended: Focus on obtaining multiple original copies of the Death Certificate first, as they are required for all subsequent administrative actions. Let me know if you need instructions for a specific account or task.";
        } else if (exactMsg === 'Go back to the previous step') {
            staticReply = "Understood. We can return to the previous topic. Please refer to the information previously provided, or let me know what specific part you'd like to review again.";
        } else if (exactMsg === 'Can you explain that more simply?') {
            staticReply = "Of course. To put it simply: don't worry about tackling everything at once. Take it one step at a time. First, get the Death Certificate. Then, use that to notify the bank and insurance companies. You can find ready-to-use letter templates in the Documents section to make this easier.";
            staticShowDocCTA = true;
        }

        if (staticReply) {
            const aiReply = {
                reply: staticReply,
                sources: [],
                showDocCTA: staticShowDocCTA,
                taskSuggestions: [],
                hasRagData: false
            };

            // Save history if connected to DB
            if (dbUser) {
                dbUser.chatHistory = [
                    ...history,
                    { role: 'user', content: message },
                    { 
                        role: 'assistant', 
                        content: aiReply.reply, 
                        sources: aiReply.sources, 
                        showDocCTA: aiReply.showDocCTA,
                        taskSuggestions: aiReply.taskSuggestions,
                        hasRagData: aiReply.hasRagData
                    }
                ];
                await dbUser.save();
            }

            return res.json(aiReply);
        }

        const ragChunks = await ragService.retrieve(message, accounts, 5);

        const systemPrompt = `You are Sahara, a compassionate post-bereavement navigation assistant for India. Help bereaved families navigate legal, financial, and digital account closure after a loved one's death.
        
USER PROFILE:
Name: ${userProfile.name}, Relationship: ${userProfile.relationship}, State: ${userProfile.state},
Employment: ${userProfile.employment}, Accounts: ${(userProfile.accounts || []).map(a => a.type).join(', ')}

RETRIEVED KNOWLEDGE BASE (cite sources in responses):
${ragChunks.map(c => c.text).join('\n\n')}

INSTRUCTIONS:
- Be warm, empathetic, concise
- Always cite sources: 'Per RBI Direction...' or 'As per IRDAI...'
- List required documents clearly
- Keep responses under 180 words unless detailed steps requested
- Use plain text; no markdown
- If you suggest a specific action (like "close bank account" or "apply for death certificate"), add a special line at the end in this EXACT format:
[TASK: Task Name | Category | Priority]
Categories: bank, insurance, digital, investment, pension, property, tax, legal, utility, government, general
Priority: normal, important, urgent
Example: [TASK: Close HDFC Bank Account | bank | urgent]`;

        const reply = await geminiService.chat(systemPrompt, history, message);
        
        // Parse task suggestions
        const taskSuggestions = [];
        const taskRegex = /\[TASK:\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\]/g;
        let match;
        let cleanReply = reply;
        
        while ((match = taskRegex.exec(reply)) !== null) {
            taskSuggestions.push({
                name: match[1],
                category: match[2].toLowerCase(),
                priority: match[3].toLowerCase()
            });
            // Optionally remove the raw tag from the display text
            cleanReply = cleanReply.replace(match[0], '').trim();
        }

        const showDocCTA = reply.toLowerCase().includes('document') || reply.toLowerCase().includes('form');

        const aiReply = {
            reply: cleanReply,
            sources: ragChunks.map(c => c.source),
            showDocCTA,
            taskSuggestions
        };

        // Save history if connected to DB
        if (dbUser) {
            dbUser.chatHistory = [
                ...history,
                { role: 'user', content: message },
                { 
                    role: 'assistant', 
                    content: aiReply.reply, 
                    sources: aiReply.sources, 
                    showDocCTA: aiReply.showDocCTA,
                    taskSuggestions: aiReply.taskSuggestions 
                }
            ];
            await dbUser.save();
        }

        res.json(aiReply);
    } catch (err) {
        next(err);
    }
});


module.exports = router;
