const fs = require('fs');
const path = require('path');
const faiss = require('faiss-node');
const embeddingService = require('./embeddingService');

let index = null;
let chunks = [];

const indexDir = path.join(__dirname, '../rag/index');

const loadIndex = () => {
    try {
        const indexPath = path.join(indexDir, 'faiss.index');
        const chunksPath = path.join(indexDir, 'chunks.json');
        if (fs.existsSync(indexPath) && fs.existsSync(chunksPath)) {
            index = faiss.IndexFlatL2.read(indexPath);
            chunks = JSON.parse(fs.readFileSync(chunksPath, 'utf8'));
            console.log('FAISS index loaded.');
        } else {
            console.log('FAISS index not found. Using simple text search fallback.');
        }
    } catch (e) {
        console.error('Error loading FAISS index:', e);
    }
};

// Load on startup
loadIndex();

exports.retrieve = async (query, accounts = [], topK = 5) => {
    if (!index || chunks.length === 0) {
        // Fallback if index not ingested yet
        const rawMock = fs.readFileSync(path.join(__dirname, '../rag/sources/digital_platforms.txt'), 'utf8');
        return [{ text: rawMock, source: 'digital_platforms.txt', accountType: 'General' }];
    }

    try {
        const queryVector = await embeddingService.embed(query);
        // faiss-node expects a plain JS Array for search input (length = d for
        // a single query, or n*d for n queries). Ensure we pass an Array.
        const qArr = Array.isArray(queryVector) ? queryVector : Array.from(queryVector);
        const dim = index.getDimension();
        if (qArr.length !== dim) {
            throw new Error(`Invalid query vector length ${qArr.length} (expected ${dim})`);
        }
    // faiss requires k <= ntotal
    const ntotal = index.ntotal();
    const k = Math.max(1, Math.min(topK * 2, ntotal));
    const { distances, labels } = index.search(qArr, k);

        let results = [];
        for (let i = 0; i < labels.length; i++) {
            const lbl = labels[i];
            if (Array.isArray(lbl)) {
                // handle case where labels is n*k flattened; pick first (single query)
                if (lbl[0] !== -1 && chunks[lbl[0]]) results.push(chunks[lbl[0]]);
            } else {
                if (lbl !== -1 && chunks[lbl]) results.push(chunks[lbl]);
            }
        }

        // Optional: filter by accounts
        // ...

        return results.slice(0, topK);
    } catch (e) {
        console.error('Retrieval error:', e);
        return [];
    }
};
