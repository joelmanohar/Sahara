const gemini = require('./geminiService');

const DETECTION_PROMPT = `You are a financial account detection assistant. Analyze the given text and identify all financial or digital accounts mentioned.

For each account found, extract:
- type: The account category (e.g., "Bank Account", "Life Insurance", "EPF/PF", "Demat/Stocks", "UPI Wallet", "Mutual Funds", "PPF", "NPS", "Fixed Deposit", "Credit Card", "Vehicle RC", "Real Estate", "Social Media", "Subscription Service", "Digital Wallet", "Pension", "Home Loan", "Personal Loan", "Gold Loan", "Education Loan")
- name: Specific institution or service name if mentioned (e.g., "SBI", "LIC", "HDFC Bank")
- note: Any extra detail (account number last 4 digits, policy number, reference, etc.)
- confidence: "low" | "medium" | "high"
- accountCategory: Classify into one of: "Bank" | "Insurance" | "Loan" | "Government" | "Digital" | "Investment" | "Property"

Return ONLY a valid JSON array. Example:
[
  { "type": "Bank Account", "name": "SBI", "note": "XXXX1234", "confidence": "high", "accountCategory": "Bank" },
  { "type": "Life Insurance", "name": "LIC", "note": "Policy no. 12345678", "confidence": "medium", "accountCategory": "Insurance" }
]

If no accounts are found, return an empty array [].
Do NOT include any explanation or text outside the JSON array.`;

/**
 * Detect accounts from extracted document text.
 */
exports.detectFromDocument = async (text) => {
    return _detect(text, 'document');
};

/**
 * Detect accounts from pasted email or SMS text.
 */
exports.detectFromText = async (text, source = 'email') => {
    return _detect(text, source);
};

/**
 * Generate decision support guidance for detected accounts.
 * Returns static decision support to conserve API limits.
 */
exports.generateDecisionSupport = async (accounts, userProfile = {}) => {
    if (!accounts || accounts.length === 0) return [];

    return accounts.map((account, i) => {
        let whatItIs = "A standard financial or digital account.";
        let whatToGain = "Potential remaining balance or settlement.";
        let risksOfIgnoring = "Account may become dormant or funds transferred to government unclaimed pools.";
        let recommendedAction = "Investigate";
        let urgencyLevel = "normal";
        let suggestedDeadline = "Within 3-6 months";
        let keySteps = ["Notify the institution", "Check for nominees", "Submit claim forms"];

        const type = (account.type || '').toLowerCase();

        if (type.includes('bank')) {
            whatItIs = "A bank account holding deposits.";
            whatToGain = "Claim the remaining balance in the account.";
            risksOfIgnoring = "Account freezes, auto-debits bounce, and eventually becomes an unclaimed deposit.";
            recommendedAction = "Claim";
            urgencyLevel = "important";
            suggestedDeadline = "Within 30-90 days";
        } else if (type.includes('insurance')) {
            whatItIs = "A life or health insurance policy.";
            whatToGain = "Potential death benefit or maturity sum.";
            risksOfIgnoring = "Claim might be rejected if delayed beyond the insurer's strict notification window.";
            recommendedAction = "Claim";
            urgencyLevel = "urgent";
            suggestedDeadline = "Within 7-15 days";
        } else if (type.includes('epf') || type.includes('pf')) {
            whatItIs = "Employee Provident Fund or Pension.";
            whatToGain = "PF balance and EDLI death insurance.";
            risksOfIgnoring = "Loss of interest and delayed access to essential funds for the family.";
            recommendedAction = "Claim";
            urgencyLevel = "important";
            suggestedDeadline = "Within 3 months";
        } else if (type.includes('loan')) {
            whatItIs = "An outstanding credit or loan account.";
            whatToGain = "Closure of liability or invocation of loan insurance.";
            risksOfIgnoring = "Accumulation of penal interest and legal notices to the estate.";
            recommendedAction = "Investigate";
            urgencyLevel = "urgent";
            suggestedDeadline = "Immediately";
        }

        return {
            accountIndex: i,
            whatItIs,
            whatToGain,
            risksOfIgnoring,
            recommendedAction,
            urgencyLevel,
            suggestedDeadline,
            keySteps
        };
    });
};

async function _detect(text, source) {
    if (!text || text.trim().length < 10) return [];

    const userMessage = `Source type: ${source}\n\nText to analyze:\n\n${text.substring(0, 8000)}`;

    try {
        const reply = await gemini.chat(DETECTION_PROMPT, [], userMessage);

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
            accountCategory: item.accountCategory || 'Digital',
            detectedBy: source
        }));
    } catch (e) {
        console.error('[accountDetectionService] Error:', e.message);
        return [];
    }
}
