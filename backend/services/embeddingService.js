require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const crypto = require('crypto');

// Desired embedding dimension used elsewhere in the repo
const DIMENSION = 1536;

// Try to use Google Generative AI embeddings if configured. We require lazily
// to avoid failing when the package isn't installed and Google keys aren't set.
let googleClient = null;
let googleModel = process.env.GOOGLE_EMBEDDING_MODEL || null;
if (process.env.GOOGLE_API_KEY && googleModel) {
    try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        googleClient = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        console.log('embeddingService: using Google Generative AI model', googleModel);
    } catch (e) {
        console.warn('embeddingService: failed to load @google/generative-ai, falling back to local embeddings');
        googleClient = null;
    }
} else if (process.env.GOOGLE_API_KEY && !googleModel) {
    console.warn('embeddingService: GOOGLE_API_KEY set but GOOGLE_EMBEDDING_MODEL is not set; falling back to local embeddings');
}

// Deterministic local embedding fallback: expands SHA-256 keyed hashes into
// a Float32Array of length DIMENSION with values in [-1, 1]. This is NOT a
// production-quality embedding, but useful to build and test the FAISS index
// when external API keys are unavailable.
function localEmbed(text) {
    const out = new Float32Array(DIMENSION);
    let bytesNeeded = DIMENSION * 4; // 4 bytes per float
    let hashCounter = 0;
    const chunks = [];

    while (Buffer.concat(chunks).length < bytesNeeded) {
        const h = crypto.createHash('sha256');
        h.update(text);
        h.update(Buffer.from([hashCounter & 0xff]));
        chunks.push(h.digest());
        hashCounter++;
    }

    const buf = Buffer.concat(chunks);
    for (let i = 0; i < DIMENSION; i++) {
        const offset = i * 4;
        // Read 4 bytes as unsigned int, map to [0,1], then to [-1,1]
        const uint = buf.readUInt32BE(offset);
        const normalized = uint / 0xffffffff; // 0..1
        out[i] = (normalized * 2) - 1; // -1..1
    }
    return out;
}

exports.embed = async (text) => {
    // Use Google client if available
    if (googleClient) {
        try {
            const model = googleClient.getGenerativeModel({ model: googleModel });
            const result = await model.embedContent(text);
            // result.embedding.values is expected to be an array/Float32Array
            return Float32Array.from(result.embedding.values);
        } catch (err) {
            console.error('Google embedding error:', err.message || err);
            console.warn('Falling back to local deterministic embeddings');
            return localEmbed(text);
        }
    }

    // No external embedding provider configured: use local deterministic embed
    return localEmbed(text);
};
