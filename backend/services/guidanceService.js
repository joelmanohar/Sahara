const ragService = require('./ragService');
const gemini = require('./geminiService');

/**
 * Generate structured, personalized guidance for a given account type.
 * Returns JSON: { accountType, summary, steps: [{id, title, description, when}], requiredDocuments: [], timelines: '', rightsAndEscalation: [], sources: [], confidence }
 */
exports.generateForAccount = async (accountType, userProfile = {}, opts = {}) => {
    const query = `Official procedures, required documents, timelines, rights and escalation steps for ${accountType} in India`;

    // Retrieve relevant knowledge chunks
    const chunks = await ragService.retrieve(query, [accountType], 6);

    const sourcesText = chunks.map(c => `Source: ${c.source}\n${c.text}`).join('\n\n');

    const systemPrompt = `You are Sahara, a helpful and empathetic assistant that turns regulatory and product procedures into clear, actionable step-by-step guidance for bereaved family members in India.

User profile: name=${userProfile.name || ''}, relationship=${userProfile.relationship || ''}, state=${userProfile.state || ''}

Instructions:
- Read the retrieved knowledge and produce a concise JSON object describing how to proceed for the account type '${accountType}'.
- Include: summary (1-2 sentences), requiredDocuments (array), timelines (string), rightsAndEscalation (array of bullets), a step-by-step 'steps' array with ordered actions. Each step should include an optional 'when' or condition (e.g., "if nominee exists", "if no nominee").
- For each item include a list of sources (file names or URLs). Use the retrieved sources only; do not invent official URLs. If info is missing, state what official document to consult (e.g., 'Check RBI/IRDAI portal').
- Return strictly JSON (no explanatory text). Example schema:
  { accountType: "...,", summary: "...", requiredDocuments: ["..."], timelines: "...", rightsAndEscalation: ["..."], steps: [{id:1,title:"",description:"",when:""}], sources: [...], confidence: "low|medium|high" }

Retrieved knowledge:\n${sourcesText}`;

    // Ask the LLM to synthesize
    const reply = await gemini.chat(systemPrompt, [], `Please produce the JSON guidance for ${accountType}`);

    // Try to parse JSON out of the reply — robustly
    let parsed = null;
    try {
        const firstBrace = reply.indexOf('{');
        const jsonText = firstBrace >= 0 ? reply.slice(firstBrace) : reply;
        parsed = JSON.parse(jsonText);
    } catch (e) {
        // Fallback: return a best-effort structure
        parsed = {
            accountType,
            summary: reply.split('\n').slice(0, 3).join(' '),
            requiredDocuments: [],
            timelines: '',
            rightsAndEscalation: [],
            steps: [],
            sources: chunks.map(c => c.source),
            confidence: 'low'
        };
    }

    // Attach retrieved sources if missing
    if (!parsed.sources || parsed.sources.length === 0) parsed.sources = chunks.map(c => c.source);
    if (!parsed.accountType) parsed.accountType = accountType;
    return parsed;
};

/**
 * Generate guidance for multiple accounts in parallel and merge into a single plan.
 */
exports.generateForAccounts = async (accounts = [], userProfile = {}) => {
    const results = [];
    for (const acc of accounts) {
        try {
            const g = await exports.generateForAccount(acc, userProfile);
            results.push(g);
        } catch (e) {
            results.push({ accountType: acc, error: e.message || 'Failed to generate guidance' });
        }
    }
    return results;
};
