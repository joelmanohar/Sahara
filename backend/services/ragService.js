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
            console.log(`FAISS index loaded: ${chunks.length} chunks, dimension=${index.getDimension()}`);
        } else {
            console.log('FAISS index not found. Using text search fallback. Run "npm run ingest" to build the index.');
        }
    } catch (e) {
        console.error('Error loading FAISS index:', e);
    }
};

// Load on startup
loadIndex();

/**
 * Simple keyword-based fallback search when FAISS index is not available.
 */
function fallbackSearch(query, topK = 5) {
    const sourcesDir = path.join(__dirname, '../rag/sources');
    const results = [];

    try {
        const files = fs.readdirSync(sourcesDir).filter(f => f.endsWith('.txt'));
        const queryTerms = query.toLowerCase().split(/\s+/);

        for (const file of files) {
            const text = fs.readFileSync(path.join(sourcesDir, file), 'utf8');
            const topic = file.replace(/\.txt$/, '').replace(/_/g, ' ');

            // Score based on keyword matches
            let score = 0;
            const lowerText = text.toLowerCase();
            for (const term of queryTerms) {
                if (term.length < 3) continue;
                const matches = (lowerText.match(new RegExp(term, 'gi')) || []).length;
                score += matches;
            }

            // Boost score if the query matches the topic/filename
            const lowerTopic = topic.toLowerCase();
            for (const term of queryTerms) {
                if (lowerTopic.includes(term)) score += 10;
            }

            if (score > 0) {
                // Split into chunks and return the most relevant chunk
                const paragraphs = text.split(/\n\s*\n/);
                let bestChunk = '';
                let bestChunkScore = 0;

                let currentChunk = '';
                for (const p of paragraphs) {
                    if ((currentChunk.length + p.length) > 1200) {
                        const chunkScore = queryTerms.reduce((acc, term) =>
                            acc + (currentChunk.toLowerCase().includes(term) ? 1 : 0), 0);
                        if (chunkScore > bestChunkScore) {
                            bestChunkScore = chunkScore;
                            bestChunk = currentChunk;
                        }
                        currentChunk = p;
                    } else {
                        currentChunk += '\n\n' + p;
                    }
                }
                if (currentChunk) {
                    const chunkScore = queryTerms.reduce((acc, term) =>
                        acc + (currentChunk.toLowerCase().includes(term) ? 1 : 0), 0);
                    if (chunkScore > bestChunkScore) {
                        bestChunk = currentChunk;
                    }
                }

                results.push({
                    text: bestChunk || text.substring(0, 1500),
                    source: file,
                    topic,
                    score
                });
            }
        }

        results.sort((a, b) => b.score - a.score);
        return results.slice(0, topK);
    } catch (e) {
        console.error('Fallback search error:', e);
        return [];
    }
}

exports.retrieve = async (query, accounts = [], topK = 5) => {
    if (!index || chunks.length === 0) {
        // Fallback to keyword search if index not ingested yet
        console.log('Using keyword fallback search (no FAISS index)');
        const fallbackResults = fallbackSearch(query, topK);
        if (fallbackResults.length > 0) return fallbackResults;

        // Last resort: return the first source file
        try {
            const sourcesDir = path.join(__dirname, '../rag/sources');
            const files = fs.readdirSync(sourcesDir).filter(f => f.endsWith('.txt'));
            if (files.length > 0) {
                const rawText = fs.readFileSync(path.join(sourcesDir, files[0]), 'utf8');
                return [{ text: rawText.substring(0, 2000), source: files[0], topic: 'general' }];
            }
        } catch (e) { /* ignore */ }

        return [];
    }

    try {
        const queryVector = await embeddingService.embed(query);
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
                if (lbl[0] !== -1 && chunks[lbl[0]]) results.push({ ...chunks[lbl[0]], distance: distances[i] });
            } else {
                if (lbl !== -1 && chunks[lbl]) results.push({ ...chunks[lbl], distance: distances[i] });
            }
        }

        // Deduplicate by source — keep best result per source, but include diverse sources
        const seen = new Map();
        for (const r of results) {
            const key = r.source;
            if (!seen.has(key) || (r.distance && r.distance < seen.get(key).distance)) {
                seen.set(key, r);
            }
        }

        // Re-sort and return top K
        const dedupedResults = Array.from(seen.values());
        // Also include results from different chunks of the same high-relevance source
        const finalResults = results.slice(0, topK);

        return finalResults.length > 0 ? finalResults : dedupedResults.slice(0, topK);
    } catch (e) {
        console.error('Retrieval error:', e);
        // Attempt keyword fallback on vector search failure
        return fallbackSearch(query, topK);
    }
};
