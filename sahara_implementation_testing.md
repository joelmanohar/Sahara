# CHAPTER – 6
# IMPLEMENTATION

## 6.1 Modules:

**Document Preprocessing Module:** 
The Document Preprocessing Module is responsible for preparing raw bureaucratic, legal, and financial guidelines (such as PDFs and text files regarding probation, pensions, and liabilities) for system ingestion. It includes text extraction, where raw characters are standardized by removing unnecessary line breaks and special characters. Chunking techniques are applied to split large documents into semantically coherent, manageable text segments (e.g., 500-1000 tokens) to maintain contextual consistency. Metadata tagging is also performed to label sections accurately. These preprocessing steps ensure optimal input quality for the Retrieval-Augmented Generation (RAG) pipeline.

**Vector Embedding Extraction Module:** 
The Vector Embedding Extraction Module is responsible for identifying and capturing essential semantic patterns from procedural documents to improve search accuracy. High-dimensional embedding algorithms serve as the backbone, extracting deep semantic features and mapping sentences into a dense vector space. This ensures that the system understands the intent of a user's query (e.g., recognizing that "closing accounts" and "canceling a ledger" share semantic similarities).

**Contextual Retrieval & Prompt formulation Module:** 
This module is designed to enhance the generative accuracy of the assistant by addressing context limitations and preventing AI hallucinations. It integrates Vector Similarity Search (calculating Cosine distance via the FAISS index), which retrieves the most highly relevant document chunks based on a user's prompt. Additionally, strict System Prompt Templates are dynamically applied to ensure the Large Language Model (LLM) prioritizes retrieved facts and enforces a warm, empathetic, and non-prescriptive tone suitable for grieving users.

**Knowledge Base Indexing & LLM Integration Module:** 
This module creates the architectural bridge between the user interface and the AI services. During initialization, the system uses the Generative AI or OpenRouter API to build the vector index of all procedural documents, storing them efficiently using faiss-node. The pipeline is built within an Express/Node.js environment, utilizing an event-driven architecture that manages real-time chat requests, dynamic routing, and retry logic to gracefully handle external network requests or potential latency.

**Response Generation Module:** 
The Response Generation Module is responsible for generating accurate, empathetic procedural guidance from user chat inputs. Processing an incoming message, the module queries the FAISS index, extracts multi-scale textual context, and instructs the LLM to produce a structured, step-by-step response. Post-processing techniques are applied on the backend to parse markdown, refine the output, and automatically extract actionable "Tasks" (e.g., "Call the bank") that can be synced directly to the user's frontend UI dashboard.

**Evaluation and Error Handling Module:** 
The Evaluation Module assesses the reliability and stability of the system. It employs timeout limits, API payload validation, and programmatic retry mechanisms with exponential backoff. It actively monitors for 503 (Service Unavailable) or network timeout errors from the LLM provider. If an external service latency occurs, this module automatically triggers a fallback mechanism, smoothly transitioning the user interface to utilize static, rule-based procedural guidance and predefined decision trees without crashing the application.

**Deployment Module:** 
The Deployment Module is responsible for integrating the AI-powered procedural engine into a real-world web application. The backend architecture is deployed using Node.js and Express to create a robust RESTful API. MongoDB (via Mongoose) manages user accounts and stateful task persistence. The interactive frontend is built using React to provide a fluid, Single-Page Application (SPA) experience with progressive disclosure pathways, making the complex procedural model accessible and digestible for bereaved families.

## 6.2 Description of Sample Code of Each Module:

### 6.2.1 Document Ingestion and Vector Search Initialization:

```javascript
// RAG Document Ingestion and Embedding Generator
const { GoogleGenerativeAI } = require('@google/generative-ai');
const faiss = require('faiss-node');
const fs = require('fs');
const path = require('path');

class RagVectorEngine {
    constructor(apiKey, embeddingModel = 'text-embedding-004') {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: embeddingModel });
        this.dimension = 768; // Standard dimension for Google embeddings
        this.index = new faiss.IndexFlatL2(this.dimension);
        this.documentMap = {}; // Maps vector ID to text chunk
    }

    // Text chunking for optimal context parsing
    chunkText(text, chunkSize = 500) {
        const words = text.split(' ');
        const chunks = [];
        for (let i = 0; i < words.length; i += chunkSize) {
            chunks.push(words.slice(i, i + chunkSize).join(' '));
        }
        return chunks;
    }

    // Processing documents and populating FAISS index
    async ingestDocuments(directoryPath) {
        const files = fs.readdirSync(directoryPath);
        let idCounter = 0;

        for (const file of files) {
            const filePath = path.join(directoryPath, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const chunks = this.chunkText(content);

            for (const chunk of chunks) {
                try {
                    // Generate AI Embedding
                    const result = await this.model.embedContent(chunk);
                    const vector = result.embedding.values;

                    // Add to FAISS Vector Database
                    this.index.add(vector);
                    this.documentMap[idCounter] = chunk;
                    
                    idCounter++;
                } catch (error) {
                    console.error(`Error embedding chunk from ${file}:`, error);
                }
            }
        }
        console.log(`Successfully ingested ${idCounter} procedural chunks.`);
    }

    // Similarity Search for LLM Context Generation
    async retrieveContext(userQuery, topK = 3) {
        try {
            const queryResult = await this.model.embedContent(userQuery);
            const queryVector = queryResult.embedding.values;

            // Search FAISS for nearest neighbors
            const searchResults = this.index.search(queryVector, topK);
            
            let retrievedContext = "";
            for (const id of searchResults.labels) {
                if (id !== -1 && this.documentMap[id]) {
                    retrievedContext += this.documentMap[id] + "\n\n";
                }
            }
            return retrievedContext;
        } catch (error) {
            console.error("Retrieval failed, falling back to static context:", error);
            return null;
        }
    }
}
```

The design for Sahara's conversational intelligence utilizes a deep semantic search approach that combines Generative AI embeddings with a highly scalable FAISS vector database. The RagVectorEngine class handles the conversion of raw bureaucratic text files into mathematical arrays that capture language intent. When a grieving user inputs a query, the system vectorizes their sentence and rapidly scans the FAISS index (using L2 distance/cosine similarity metrics) to extract the most technically accurate procedural steps from the local document map.

A key feature of this pipeline is its resilience. Included within the system are chunking algorithms designed to break down massive legal PDFs into digestible, 500-word blocks. This guarantees the LLM receives highly relevant context efficiently. If the generative API experiences a network timeout or temporary unavailability, the system relies on native error-handling logic to bypass the dynamic query and fall back to native, pre-cached static procedural guidance without breaking the frontend experience.

---

# CHAPTER – 7
# TESTING

## 7.1 Testing Strategy:

**Hold-Out Conversational Testing:** 
A portion of an expected query dataset (typically 20% of common bereavement questions) is reserved for final testing. This ensures the conversational AI model is evaluated on unseen edge cases, guaranteeing its ability to generalize unfamiliar phrasing and emotional nuances from a user.

**Cross-Prompt Validation:** 
A systematic validation strategy where the core System Prompt (responsible for the system's empathetic, non-robotic tone) is tested under various constraints. Different iterations of the meta-prompt are provided to the LLM alongside identical user queries to evaluate whether the engine can consistently output sympathetic, accurate data without trailing into harmful, presumptive language.

**Metric-Based Evaluation:** 
The system’s generative accuracy and retrieval performance are assessed using key NLP and software metrics:
*   **Contextual Relevance:** Measures the semantic overlap between the user's intent and the document chunks retrieved from the FAISS index.
*   **Generative Faithfulness:** Evaluates the proportion of accurately cited legal/bureaucratic facts in the final output compared to model "hallucinations" (false data).
*   **System Latency & Load Time:** Ensures asynchronous API calls between the React frontend, Node.js backend, and AI endpoints resolve within acceptable UI thresholds (e.g., < 3 seconds).
*   **Task Extraction Precision:** Measures the reliability of the backend parser stringing together actionable "Tasks" from markdown to sync to the MongoDB database.

**Ablation Testing:** 
To evaluate the absolute necessity of the RAG module, the system is tested with variations in architecture (e.g., querying the LLM without the FAISS context database injected). This proves the effectiveness of the local knowledge base in preventing dangerously inaccurate legal advice.

**Real-World Simulation Testing:** 
The system is stress-tested under simulated high concurrent loads to evaluate performance resilience. Scripts simulate high volumes of concurrent requests to confirm that the system handles capacity limits gracefully and that the fallback architecture seamlessly defaults to deterministic decision logic and static UI guidance instead of crashing.

**Statistical Significance Testing:** 
System logs are evaluated to calculate average crash rates, timeout errors (503 Service Unavailable), and 404 embedding mismatches. This validates the reliability of the system compared to older static-page website paradigms.

## 7.2 Test Cases:

| Test Case ID | Test Scenario | Input | Expected Output | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC_00000** | The model processes a direct, factual query regarding document retrieval. | "How do I get my husband's death certificate?" | Generated response utilizing RAG to outline specific municipal steps, appending a new task to the user dashboard. | Pass |
| **TC_00011** | The model processes a highly emotional, syntactically messy user query. | "im so lost idk what to do with his banks and stuff help me" | Generated response detecting the emotional tone. It replies with sincere empathy and breaks down the difference between checking and investment accounts simply, without overwhelming jargon. | Pass |
| **TC_00033** | The system experiences a simulated network timeout during the generative retrieval process. | "What do I do about the mortgage?" | The Express backend catches the network failure, prevents application crash, and seamlessly renders a predefined, static HTML procedural guide regarding property liabilities on the React UI. | Pass |

Table A.1 - Represents various conversational and architectural test cases, validating the expected handling of natural language input, emotional variance, and fault tolerance.
