# 🕵️‍♂️ Perisclaw (Astra EA) - Project Blueprint
**A Proactive, Agentic Executive Assistant inside WhatsApp.**

---

## 🔍 PROJECT OVERVIEW
- **What does this app do?** Perisclaw is a WhatsApp-native AI Executive Assistant named **Astra**. She monitors your conversations, manages your Google Workspace (Gmail/Calendar), tracks your promises (Memory Bank), and processes visual data (Invoices/Docs)—all from a single chat thread.
- **What problem does it solve?** It eliminates "Context Switching." Instead of jumping between Gmail, Calendar, and Slack, you manage your entire professional life inside the app you already use: WhatsApp. It also prevents "Commitment Leak"—forgetting a promise you made in a fast-moving chat.
- **Target Audience:** Solo founders, busy executives, and freelancers who live on WhatsApp and need a stoic, reliable partner to handle the "admin overhead" of life.
- **One-Liner:** "The zero-friction Executive Assistant that lives in your WhatsApp and thinks across your digital workspace."

---

## ⚙️ HOW IT WORKS
1. **Interactive Session Flow:** 
   - User sends a message (Text, Voice, or Image).
   - Astra's **Intent Engine** parses the request and generates a **Proposal Hub**.
   - Instead of guessing, Astra replies with a **Numbered Menu** (e.g., 1. 🚀 Send Now, 2. 📝 Save Draft).
   - User replies with a single digit (e.g., "1").
   - Astra executes the task via Google APIs and returns a success confirmation.
2. **Background Intelligence:**
   - **Passive Extraction:** Every message is scanned for "Commitments" (promises). Astra silently logs these into a "Memory Bank" for future follow-ups.
   - **Visual Perception:** Images are routed to Gemini 2.0 Flash to extract actionable data (e.g., turning an invoice photo into a draft payment email).
3. **Core Algorithm:** A **State-Machine Agent**. The app maintains a "Session State" for each user, allowing multi-turn decisions (Proposal -> Choice -> Execution).

---

## 🛠️ TECH STACK
- **Frontend:** **Astra Live Dashboard** built with Vanilla HTML/JS and **Socket.io** for real-time log streaming from the cloud.
- **Backend:** **Node.js (TypeScript)** runtime using **tsx** for high-speed execution.
- **Database:** **Supabase (PostgreSQL)**. Used for:
  - `auth_state`: Persistent WhatsApp sessions (QR-less login).
  - `google_tokens`: Secure OAuth2 storage.
  - `memories`: The long-term commitment vault.
- **Deployment:** **Render (Web Service)** with full CI/CD integration.
- **APIs & SDKs:**
  - **WhatsApp:** `Baileys` (Multi-device socket-based integration).
  - **AI (LLM):** `Groq (Llama 3.3 70B)` for near-instant intent parsing.
  - **AI (Vision):** `Google Gemini 2.0 Flash` for visual data extraction.
  - **Productivity:** `Google Workspace APIs` (Gmail & Calendar).
- **Google Antigravity:** I (Antigravity) acted as the **Product Builder and Architect**. I designed the V2 Interactive Hub, implemented the conflict-aware reconnection strategy for cloud stability, and architected the Memory Bank extraction logic.

---

## 🏗️ ARCHITECTURE
- **Agentic Pattern:** The system uses a "Propose-Confirm-Execute" design pattern to ensure 100% reliability in actions.
- **Data Flow:** WhatsApp Message -> Baileys Socket -> AI Intent Service -> State Manager (Session Create) -> WhatsApp Reply (Menu) -> User Choice -> Execution Service (Google/Reminders) -> Success Response.
- **Cloud Isolation:** Designed for Render's ephemeral filesystem by externalizing all "State" (Auth & Tokens) to Supabase.

---

## 🎨 DESIGN & UX
- **The "Astra Hub" UI:** A clean, dark-mode terminal dashboard for monitoring Astra's "thoughts" in real-time.
- **The WhatsApp Interface:**
  - **Stoic Voice:** Short, efficient, and professional copy.
  - **Menu Navigation:** Uses high-impact emojis (🚀, 📝, 📅) and numbered lists for rapid "one-tap" interaction on mobile.
- **Micro-Interactions:** Custom confirmation messages and "Executing..." status updates to keep the user informed during long-running API calls.

---

## 📊 FEATURES LIST
### **Core Features (Built)**
- ✅ **Gmail Dispatcher**: Search, Draft, and Direct Send emails.
- ✅ **Calendar Hub**: List upcoming events and create new meetings via voice/text.
- ✅ **Memory Bank**: Passive extraction of "Commitments" and "Facts" from chats.
- ✅ **Visual Brain**: Scan invoices, docs, and cards via Gemini Vision.
- ✅ **Interactive Hub**: Numbered menu system for decision-making.
- ✅ **Cloud Persistence**: Supabase-backed authentication (No frequent QR scanning).

### **Secondary Features (Built)**
- ✅ **Voice Note Processing**: Transcribe and process voice notes instantly via Groq Whisper.
- ✅ **Live Dashboard**: Real-time observability of Astra's logic.
- ✅ **Conflict Backoff**: Smart logic to prevent multiple instances from fighting over the WhatsApp socket.

---

## ⚡ PERFORMANCE & SEO
- **Speed:** Uses **Groq Llama 3**, delivering AI responses in <500ms.
- **Latency:** Interactive Hub minimizes user typing time (replying "1" is faster than typing "Yes").
- **Observability:** Custom pino-logger hooked into Socket.io for a sub-second dashboard feed.

---

## 🚧 CURRENT LIMITATIONS & ROADMAP
- **Limitations:**
  - Currently limited to a single user (Owner).
  - Memory search is currently basic text-match (needs Vector/Semantic search).
- **Roadmap (To Build):**
  - **RAG Memory Search**: Allow Astra to answer questions like *"What did I say I'd do for Monish?"*
  - **Document Filing**: Automatically save scanned invoices to a specific Google Drive folder.
  - **Multi-Tenant**: Allow other users to "Authorize" their own Astra instance via a web portal.

---
**Created with ❤️ by Antigravity AI.**
