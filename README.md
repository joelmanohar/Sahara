# 🕊️ Sahara Assistant

**Sahara** is a compassionate, AI-powered post-bereavement navigation platform designed explicitly to support families in India. It simplifies the overwhelming bureaucratic, legal, and financial processes that follow the loss of a loved one—such as claiming life insurance, closing bank accounts, withdrawing PF, and transferring property ownership.

---

## 🏗️ Technical Architecture & Stack

### Frontend (Client-side)
* **Framework:** React.js (via Vite/CRA)
* **State Management:** React Context API (`AppContext`)
* **Styling & UI:** Pure CSS with CSS Variables (`global.css`), coupled with `lucide-react` for iconography.
* **Features:** 
  * Responsive Mobile-First Design
  * Empathy-driven UI with calming color palettes (Teals, Creams, Warm Whites)

### Backend (Server-side)
* **Framework:** Node.js with Express.js (`server.js`)
* **Database:** MongoDB (using Mongoose) for storing user profiles, tracked tasks, and conversational histories.
* **Architecture:** Modular MVC approach isolating routing (`/routes`), logic (`/services`), and data schemas (`/db`).

### AI & RAG Engine (Core Intelligence)
* **LLM Provider:** Google Generative AI (`gemini-2.5-flash`).
* **RAG (Retrieval-Augmented Generation):** 
  * A local vector database powered by **FAISS (Facebook AI Similarity Search)** (`faiss-node`).
  * Text files in the `/rag/sources/` directory act as the trusted knowledge base (containing official RBI, IRDAI, and EPFO guidelines).
  * The system semantically matches queries using either the Google Embeddings API or a fast local-hashing embedding fallback.

---

## ✨ Core Features & Modules

### 1. 💬 Empathetic Chat Assistant (`Chat.jsx` / `chat.js`)
The primary conversational interface. Bereaved users can explain their exact situation (e.g., "My father passed away, how do I claim his PF?"). The backend dynamically queries the RAG system to find the correct local administrative guidelines, feeds it into Gemini, and produces a highly accurate, yet remarkably warm and supportive response.

### 2. 🖨️ Automated Document Generation (`Documents.jsx` / `docgen.js`)
A major pain point for families is finding the right formats for bureaucratic letters. The `docgen` module utilizes the `docx` package to instantly generate complete, ready-to-print Microsoft Word files dynamically filled with the user's data (Name, Relationship, Target Account Numbers).
* **Available Templates:** Bank Closure Request, LIC Claim Intimation, Demat Transmission Request, Vehicle RC Transfer, Local Death Certificate application, EPF Forms, Digital Memorialization.

### 3. ✅ Smart Task Dashboard (`TaskCard.jsx` / `tasks.js`)
A highly organized workflow manager. During the chat, if the AI detects an administrative requirement (e.g., "You must close the HDFC account"), it automatically adds a tracked card to the dashboard. Tasks are sorted dynamically by urgency to reduce cognitive load.

### 4. 🔍 Account Detection Engine (`accountDetectionService.js`)
A text analysis pipeline designed to scan pasted communications (SMS, Emails) or document OCR to magically identify "hidden" financial accounts the deceased may have had (like undiscovered Mutual Funds, Loans, or Insurance policies).

### 5. 📖 Procedural Guidance Engine (`guidanceService.js`)
A structured fallback module ensuring high data-integrity. It provides users with static, verified checklists containing exact Timelines, Required Documents, and Escalation Rights (e.g., Banking Ombudsman) for over a dozen common administrative scenarios.

---

## 🚀 Optimization & Quota Management
The application is highly tuned to operate efficiently within restrictive API limits (e.g., the Google 20-Request Free Tier limit).
* **Local Fallback Systems:** High-frequency interactions (like UI navigation and initial text embedding) are executed using local deterministic logic to heavily preserve external AI API quotas for complex chat responses. 
* **Static Caching:** Direct procedural pathways bypass the LLM and serve verified HTML/Markdown checklists directly to the frontend.
