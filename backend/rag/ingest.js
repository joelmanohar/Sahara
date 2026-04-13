const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const faiss = require('faiss-node');
const embeddingService = require('../services/embeddingService');
const pdfParse = require('pdf-parse');

const sourcesDir = path.join(__dirname, 'sources');
const indexDir = path.join(__dirname, 'index');

// Ensure directories exist
if (!fs.existsSync(sourcesDir)) fs.mkdirSync(sourcesDir, { recursive: true });
if (!fs.existsSync(indexDir)) fs.mkdirSync(indexDir, { recursive: true });

async function ingest() {
    const files = fs.readdirSync(sourcesDir);
    let allChunks = [];

    for (const file of files) {
        const filePath = path.join(sourcesDir, file);
        let text = '';

        if (file.endsWith('.txt')) {
            text = fs.readFileSync(filePath, 'utf8');
        } else if (file.endsWith('.pdf')) {
            const dataBuffer = fs.readFileSync(filePath);
            try {
                const data = await pdfParse(dataBuffer);
                text = data.text;
            } catch (err) {
                console.error(`Error parsing ${file}:`, err);
                continue;
            }
        } else {
            continue;
        }

        // Derive a topic/category tag from the filename for better retrieval
        const topic = file.replace(/\.txt$|\.pdf$/i, '').replace(/_/g, ' ');

        // Chunk text by paragraphs roughly
        const paragraphs = text.split(/\n\s*\n/);
        let currentChunk = '';

        for (const p of paragraphs) {
            if ((currentChunk.length + p.length) > 1200) {
                allChunks.push({ text: currentChunk.trim(), source: file, topic });
                // rudimentary overlap — keep last paragraph for context
                currentChunk = p;
            } else {
                currentChunk += '\n\n' + p;
            }
        }
        if (currentChunk.trim()) {
            allChunks.push({ text: currentChunk.trim(), source: file, topic });
        }
    }

    if (allChunks.length === 0) {
        console.log('No chunks to index.');
        return;
    }

    console.log(`Embedding ${allChunks.length} chunks from ${files.length} source files...`);
    const vectors = [];
    for (let i = 0; i < allChunks.length; i++) {
        if (i % 10 === 0) console.log(`  Embedding chunk ${i + 1}/${allChunks.length}...`);
        const vec = await embeddingService.embed(allChunks[i].text);
        vectors.push(vec);
        // Small delay to avoid rate limiting on embedding API
        if (i > 0 && i % 20 === 0) await new Promise(r => setTimeout(r, 500));
    }

    // Detect dimension from first vector
    const d = vectors[0].length;
    console.log(`Detected embedding dimension: ${d}`);

    const index = new faiss.IndexFlatL2(d);

    // faiss-node Index.add expects a flat JS array of length n * d.
    const n = vectors.length;
    const flat = new Array(n * d);
    for (let i = 0; i < n; i++) {
        const v = vectors[i];
        const arr = Array.isArray(v) ? v : Array.from(v);
        if (arr.length !== d) {
            throw new Error(`Invalid vector length ${arr.length} (expected ${d}) for chunk ${i}`);
        }
        for (let j = 0; j < d; j++) {
            flat[i * d + j] = arr[j];
        }
    }

    // debug: verify lengths
    console.log('faiss ingest: adding', n, 'vectors. dimension:', d);
    console.log('faiss ingest: flat length:', flat.length);
    index.add(flat);

    index.write(path.join(indexDir, 'faiss.index'));
    fs.writeFileSync(path.join(indexDir, 'chunks.json'), JSON.stringify(allChunks, null, 2));

    console.log(`\n✅ Ingestion complete. FAISS index created with ${n} chunks (dim=${d}).`);
    console.log(`   Sources: ${[...new Set(allChunks.map(c => c.source))].join(', ')}`);
}

ingest().catch(console.error);
