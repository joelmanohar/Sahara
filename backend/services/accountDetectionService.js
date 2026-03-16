const gemini = require('./geminiService');

const SYSTEM_PROMPT = `You are a financial account detection assistant. Analyze the given text and identify all financial or digital accounts mentioned.

For each account found, extract:
- type: The account category (e.g., "Bank Account", "Life Insurance", "EPF/PF", "Demat/Stocks", "UPI Wallet", "Mutual Funds", "PPF", "NPS", "Fixed Deposit", "Credit Card", "Vehicle RC", "Real Estate", "Social Media", "Subscription Service", "Digital Wallet", "Pension")
- name: Specific institution or service name if mentioned (e.g., "SBI", "LIC", "HDFC Bank")
- note: Any extra detail (account number last 4 digits, policy number, reference, etc.)
- confidence: "low" | "medium" | "high"

Return ONLY a valid JSON array. Example:
[
  { "type": "Bank Account", "name": "SBI", "note": "XXXX1234", "confidence": "high" },
  { "type": "Life Insurance", "name": "LIC", "note": "Policy no. 12345678", "confidence": "medium" }
]

If no accounts are found, return an empty array [].
Do NOT include any explanation or text outside the JSON array.`;

/**
 * Detect accounts from extracted document text.
 * @param {string} text - Raw text extracted from a PDF or image
 * @returns {Promise<Array<{type, name, note, confidence}>>}
 */
exports.detectFromDocument = async (text) => {
    return _detect(text, 'document');
};

/**
 * Detect accounts from pasted email or SMS text.
 * @param {string} text - Raw pasted email/SMS content
 * @param {'email'|'sms'} source
 * @returns {Promise<Array<{type, name, note, confidence}>>}
 */
exports.detectFromText = async (text, source = 'email') => {
    return _detect(text, source);
};

async function _detect(text, source) {
    if (!text || text.trim().length < 10) return [];

    const userMessage = `Source type: ${source}\n\nText to analyze:\n\n${text.substring(0, 8000)}`;

    try {
        const reply = await gemini.chat(SYSTEM_PROMPT, [], userMessage);

        // Extract JSON from the reply
        const firstBracket = reply.indexOf('[');
        const lastBracket = reply.lastIndexOf(']');
        if (firstBracket === -1 || lastBracket === -1) return [];

        const jsonText = reply.slice(firstBracket, lastBracket + 1);
        const parsed = JSON.parse(jsonText);

        if (!Array.isArray(parsed)) return [];

        return parsed.map(item => ({
            type: item.type || 'Unknown',
            name: item.name || '',
            note: item.note || '',
            confidence: item.confidence || 'low',
            detectedBy: source
        }));
    } catch (e) {
        console.error('[accountDetectionService] Error:', e.message);
        return [];
    }
}
