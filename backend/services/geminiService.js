require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY, { apiVersion: 'v1' });

/**
 * Chat with Gemini.
 * @param {string} systemPrompt  - Instructions injected as the system context
 * @param {Array}  history       - [{role:'user'|'assistant', content:'...'}]
 * @param {string} newMessage    - Latest user message
 */
exports.chat = async (systemPrompt, history, newMessage) => {
    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: systemPrompt,
        });

        // Convert OpenAI-style history to Gemini format
        // Gemini roles: 'user' | 'model'
        const geminiHistory = history.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        }));

        const chat = model.startChat({ history: geminiHistory });
        const result = await chat.sendMessage(newMessage);
        return result.response.text();
    } catch (err) {
        console.error('Gemini Chat Error:', err.message || err);
        return 'I apologize, but I am currently experiencing a service interruption. Please try again later.';
    }
};
