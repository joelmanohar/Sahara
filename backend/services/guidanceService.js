const ragService = require('./ragService');
// Gemini service removed to conserve API requests
// const gemini = require('./geminiService');

const STATIC_GUIDANCE = {
    "Bank Account": {
        summary: "To close or transfer a bank account, you must notify the bank and submit a claim form along with the death certificate and KYC documents.",
        requiredDocuments: ["Death Certificate (Original/Attested)", "Claim Form", "Passbook/Cheque Book", "Nominee KYC (Aadhaar/PAN)"],
        timelines: "Settlement usually takes 15-30 days after submitting all documents.",
        rightsAndEscalation: ["If delayed beyond 30 days, file a complaint with the Banking Ombudsman."],
        steps: [
            { id: 1, title: "Obtain Death Certificate", description: "Get multiple original copies of the Death Certificate.", when: "Immediately" },
            { id: 2, title: "Notify the Bank", description: "Inform the home branch in writing about the demise.", when: "" },
            { id: 3, title: "Submit Claim Form", description: "Fill out the deceased claim form. If you are the nominee, submit it with your KYC.", when: "If nominee exists" },
            { id: 4, title: "Provide Succession Certificate", description: "Required if no nominee was registered.", when: "If no nominee exists" }
        ],
        confidence: "high"
    },
    "Life Insurance": {
        summary: "Filing a life insurance claim requires submitting a death claim form, the original policy document, and the death certificate to the insurer.",
        requiredDocuments: ["Original Policy Document", "Death Claim Form", "Death Certificate", "Nominee KYC and Bank Mandate"],
        timelines: "Insurers typically process claims within 30 days of receiving all documents.",
        rightsAndEscalation: ["Approach the Insurance Ombudsman or IRDAI if the claim is rejected arbitrarily."],
        steps: [
            { id: 1, title: "Intimate the Insurer", description: "Notify the insurance company branch or online portal about the death.", when: "Immediately" },
            { id: 2, title: "Collect Documents", description: "Gather the original policy bond, death certificate, and nominee KYC.", when: "" },
            { id: 3, title: "Submit Claim Form", description: "Fill out the specific death claim form provided by the insurer.", when: "" },
            { id: 4, title: "Follow Up", description: "Track the claim status. Further medical records might be requested if death occurred early in the policy term.", when: "If asked" }
        ],
        confidence: "high"
    },
    "EPF/PF": {
        summary: "Employees' Provident Fund withdrawal requires submitting Form 20, 10D, and 5IF through the employer or EPFO portal.",
        requiredDocuments: ["Form 20, 10D, 5IF", "Death Certificate", "Nominee/Beneficiary KYC", "Aadhaar linked Bank Account"],
        timelines: "Processing usually takes 20-30 days via the EPFO portal.",
        rightsAndEscalation: ["Lodge a grievance on the EPFiGMS portal if delayed."],
        steps: [
            { id: 1, title: "Inform the Employer", description: "The deceased's employer must update the exit date as 'Death' in the EPFO portal.", when: "First step" },
            { id: 2, title: "Prepare Forms", description: "Fill Form 20 for PF withdrawal, 10D for pension, and 5IF for EDLI insurance.", when: "" },
            { id: 3, title: "Submit to EPFO", description: "Submit the physical forms attested by the employer to the regional EPFO office.", when: "If Aadhaar is not seeded" },
            { id: 4, title: "Online Claim", description: "File claim online via the UAN portal if the nominee's Aadhaar is seeded.", when: "If Aadhaar is seeded" }
        ],
        confidence: "high"
    },
    "Mutual Funds": {
        summary: "Mutual fund transmission requires submitting a transmission request form (Form T3) along with the death certificate and KYC of the nominee.",
        requiredDocuments: ["Transmission Form (T3)", "Death Certificate (Attested)", "Nominee KYC (PAN/Aadhaar)", "Cancelled Cheque of Nominee"],
        timelines: "Usually processed within 15-21 days of submitting complete documents.",
        rightsAndEscalation: ["Lodge a complaint on the SEBI SCORES portal if delayed."],
        steps: [
            { id: 1, title: "Notify the AMC/RTA", description: "Inform the Mutual Fund house or RTA (CAMS/KFintech) to freeze the account.", when: "Immediately" },
            { id: 2, title: "Submit Transmission Form", description: "Fill and submit Form T3 along with KYC and Death Certificate.", when: "" },
            { id: 3, title: "Provide Legal Heir Certificate", description: "Required if no nominee was registered on the folio.", when: "If no nominee exists" }
        ],
        confidence: "high"
    }
};

const DEFAULT_GUIDANCE = {
    summary: "Generally, you need to notify the institution with a copy of the death certificate and your KYC to claim or close an account.",
    requiredDocuments: ["Death Certificate", "Claimant KYC", "Account details/Proof of holding"],
    timelines: "Usually 30-45 days depending on the institution's policies.",
    rightsAndEscalation: ["Check the institution's official grievance redressal mechanism.", "If you face unfair rejection, consult a consumer court or the relevant regulatory body."],
    steps: [
        { id: 1, title: "Notify the Institution", description: "Send a formal intimation of death along with the death certificate to block the account.", when: "Immediately" },
        { id: 2, title: "Determine Nominee Status", description: "Check if a nominee is registered. Claim settlement is significantly faster for registered nominees.", when: "" },
        { id: 3, title: "Submit Required Forms", description: "Request the institution's specific death claim form and submit it with your KYC and bank details.", when: "" },
        { id: 4, title: "Obtain Succession Certificate", description: "If there is no nominee, the institution may require a legal heir certificate or succession certificate.", when: "If no nominee exists" }
    ],
    confidence: "medium"
};


/**
 * Generate structured, personalized guidance for a given account type.
 * Returns JSON: { accountType, summary, steps: [{id, title, description, when}], requiredDocuments: [], timelines: '', rightsAndEscalation: [], sources: [], confidence }
 */
exports.generateForAccount = async (accountType, userProfile = {}, opts = {}) => {
    // 1. We still fetch from RAG to get the accurate sources list, even if we don't pass them to Gemini!
    const query = `Official procedures, required documents, timelines, rights and escalation steps for ${accountType} in India`;
    const chunks = await ragService.retrieve(query, [accountType], 4);
    
    // Extract unique source files
    const uniqueSources = [...new Set(chunks.map(c => c.source))];

    // 2. Select predefined guidance or fallback
    let guidance = STATIC_GUIDANCE[accountType];
    
    // Handle approximate matches if needed
    if (!guidance && accountType.toLowerCase().includes('bank')) {
        guidance = STATIC_GUIDANCE["Bank Account"];
    } else if (!guidance && accountType.toLowerCase().includes('insurance')) {
        guidance = STATIC_GUIDANCE["Life Insurance"];
    } else if (!guidance && (accountType.toLowerCase().includes('epf') || accountType.toLowerCase().includes('pf') || accountType.toLowerCase().includes('provident'))) {
        guidance = STATIC_GUIDANCE["EPF/PF"];
    } else if (!guidance && accountType.toLowerCase().includes('fund')) {
        guidance = STATIC_GUIDANCE["Mutual Funds"];
    }

    if (!guidance) {
        guidance = DEFAULT_GUIDANCE;
    }

    // 3. Construct the final object
    return {
        accountType: accountType,
        summary: guidance.summary,
        requiredDocuments: guidance.requiredDocuments,
        timelines: guidance.timelines,
        rightsAndEscalation: guidance.rightsAndEscalation,
        steps: guidance.steps,
        sources: uniqueSources.length > 0 ? uniqueSources : ["General Best Practices"],
        confidence: guidance.confidence
    };
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
