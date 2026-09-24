# 🎓 AI-Powered Resume Screener — Complete Interview Walkthrough (Steps 1-3)

> **Your Mentor's Promise:** After finishing this guide, you will be able to explain this project confidently in any software engineering interview, answer deep technical questions, and modify/extend features without confusion.

---

## ═══════════════════════════════
## STEP 1 — THE BIG PICTURE
## ═══════════════════════════════

### 🔍 What Is This Project?

**ProfileIQ AI** is a full-stack web application that uses **Artificial Intelligence** to analyze resumes against job descriptions. Think of it as building your own **ATS (Applicant Tracking System)** — the same kind of software that companies like Google, Amazon, and Microsoft use to filter thousands of resumes before a human ever reads them.

> **Real-Life Analogy:** Imagine a teacher with 500 exam papers. Instead of reading each one, she has a machine that scans every paper, checks if the student answered the key topics, gives a score, and highlights what's missing. That's exactly what this project does — but for resumes.

### 🧩 What Problem Does It Solve?

| Problem | How This Project Solves It |
|---|---|
| Recruiters receive 1000+ resumes per job opening | AI automatically scores and ranks resumes |
| Job seekers don't know if their resume matches a JD | Gives an **ATS Match Score** (0-100%) |
| Resumes have vague bullet points | AI rewrites bullets with **quantified metrics** |
| Candidates don't know what skills they're missing | Shows **matched** vs **missing** keywords |
| No feedback loop for resume improvement | Provides an **AI chatbot** for Q&A about your resume |

### 👥 Who Are the Users?

1. **Job Seekers / Students** — Want to check if their resume matches a job description before applying
2. **Developers** — Want to aggregate their coding profiles (LeetCode, GitHub, Codeforces) in one dashboard
3. **Recruiters (future)** — Could use this to screen candidates at scale

### 🎬 Complete User Journey (Start to Finish)

```
User opens the website (http://localhost:5173)
        │
        ├── NOT LOGGED IN?
        │   └── Sees Login page ──► Signs up (email/password OR Google OAuth)
        │                            └── JWT token saved to localStorage
        │
        ├── LOGGED IN ──► Redirected to Dashboard (/)
        │   │
        │   ├── STEP 1: Upload PDF Resume (drag/drop or click)
        │   │
        │   ├── STEP 2: Paste Job Description (or use 1-click preset templates)
        │   │
        │   ├── STEP 3: Click "Analyze Resume ATS Compatibility"
        │   │    │
        │   │    ├── Frontend sends POST /api/analyses (multipart/form-data)
        │   │    │
        │   │    ├── Backend extracts text from PDF (pdf-parse library)
        │   │    │
        │   │    ├── Saves Analysis record to MongoDB (status: "pending")
        │   │    │
        │   │    ├── Adds job to BullMQ queue (Redis)
        │   │    │
        │   │    ├── ALSO fires a background setTimeout for immediate processing
        │   │    │
        │   │    └── Returns { analysisId } to frontend
        │   │
        │   ├── Frontend starts POLLING: GET /api/analyses/:id every 1.5 seconds
        │   │
        │   ├── Background Worker (worker.js):
        │   │    ├── Picks up job from Redis queue
        │   │    ├── Sends resume text + JD to Google Gemini AI
        │   │    ├── Parses JSON response
        │   │    └── Updates MongoDB (status: "complete", result: {...})
        │   │
        │   └── Frontend detects status === "complete"
        │        └── Redirects to /result/:id
        │
        ├── RESULT PAGE shows:
        │   ├── Circular SVG Match Score Gauge (0-100%)
        │   ├── Matched Keywords (green badges)
        │   ├── Missing Keywords (red badges)
        │   ├── Strengths & Weaknesses
        │   ├── "What Can Be Added" suggestions
        │   ├── Original vs. Improved bullet point rewrites
        │   ├── Interactive AI Bullet Optimizer tool
        │   └── AI Chat Assistant (ask questions about your resume)
        │
        ├── HISTORY PAGE (/history)
        │   └── Table of all past analyses with View/Delete actions
        │
        ├── CODING PROFILE PAGE (/coding-profile)
        │   └── Enter LeetCode/Codeforces/GitHub/etc. usernames
        │       └── Fetches and aggregates stats into a unified dashboard
        │
        └── ACCOUNT PAGE (/account)
            └── View profile info, sign out
```

### 🏗️ Architecture Overview (ASCII Diagram)

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                   │
│  ┌──────┐ ┌──────────┐ ┌─────────┐ ┌────────┐ ┌──────────────┐ │
│  │Login │ │Dashboard │ │ Result  │ │History │ │CodingProfile │ │
│  └──┬───┘ └────┬─────┘ └────┬────┘ └───┬────┘ └──────┬───────┘ │
│     │          │            │           │             │          │
│     └──────────┴────────────┴───────────┴─────────────┘          │
│                            │                                     │
│                    Axios (HTTP Client)                            │
│                    + JWT Auth Interceptor                         │
└────────────────────────────┬─────────────────────────────────────┘
                             │  HTTP/HTTPS (REST API)
                             │
┌────────────────────────────┴─────────────────────────────────────┐
│                     BACKEND (Node.js + Express)                   │
│  ┌──────────┐  ┌────────────────┐  ┌───────────────────────┐    │
│  │Middleware │  │   Routes       │  │    Services           │    │
│  │• auth.js  │  │• auth.routes   │  │• ai.service.js        │    │
│  │• upload   │  │• analysis.rtes │  │  (Gemini AI prompts)  │    │
│  │• rateLimit│  │• codingProfile │  │• pdf.service.js       │    │
│  └──────────┘  └────────────────┘  │• platform scrapers    │    │
│                                     └───────────────────────┘    │
│         │                     │                    │              │
│    ┌────┴─────┐    ┌──────────┴──────┐    ┌───────┴────────┐    │
│    │ MongoDB  │    │ Upstash Redis   │    │ Google Gemini  │    │
│    │ Atlas    │    │ (BullMQ Queue)  │    │ AI API         │    │
│    └──────────┘    └─────────────────┘    └────────────────┘    │
│                            │                                     │
│                    ┌───────┴────────┐                            │
│                    │  worker.js     │                            │
│                    │ (Background    │                            │
│                    │  Job Processor)│                            │
│                    └────────────────┘                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## ═══════════════════════════════
## STEP 2 — FOLDER STRUCTURE
## ═══════════════════════════════

```
AI-Powered-Resume/                      ◄── Project root (monorepo)
├── .git/                               ◄── Git version control data
├── .gitignore                          ◄── Tells Git which files to ignore
├── PROJECT_DOCUMENTATION.md            ◄── Project documentation
├── render.yaml                         ◄── Render.com deployment config
├── demo-assets/                        ◄── Sample test data
│   └── Sample_JD.txt                   ◄── Example job description for testing
│
├── backend/                            ◄── ALL server-side code
│   ├── .env                            ◄── Secret environment variables
│   ├── .env.example                    ◄── Template showing required env vars
│   ├── .gitignore                      ◄── Backend-specific ignores
│   ├── package.json                    ◄── Dependencies + npm scripts
│   ├── package-lock.json               ◄── Exact dependency versions
│   ├── worker.js                       ◄── Background job processor (separate process)
│   └── src/                            ◄── Source code
│       ├── index.js                    ◄── 🚀 Server entry point (starts Express)
│       ├── config/                     ◄── Configuration modules
│       │   └── redis.js                ◄── Redis client singleton
│       ├── controllers/                ◄── Business logic handlers
│       │   └── codingProfile.controller.js
│       ├── middleware/                  ◄── Request interceptors
│       │   ├── auth.js                 ◄── JWT token verification
│       │   ├── rateLimit.js            ◄── IP rate limiting + quota checking
│       │   └── upload.js              ◄── Multer file upload config (PDF only)
│       ├── models/                     ◄── Database schemas (Mongoose)
│       │   ├── User.js                 ◄── User account schema
│       │   ├── Analysis.js             ◄── Resume analysis result schema
│       │   └── CodingProfile.js        ◄── Coding platform stats schema
│       ├── routes/                     ◄── API endpoint definitions
│       │   ├── auth.routes.js          ◄── /api/auth/* (login, signup, google)
│       │   ├── analysis.routes.js      ◄── /api/analyses/* (upload, get, delete, chat)
│       │   └── codingProfile.routes.js ◄── /api/coding-profile/*
│       ├── services/                   ◄── Core business logic
│       │   ├── ai.service.js           ◄── 🧠 Gemini AI prompt engine (420 lines!)
│       │   ├── pdf.service.js          ◄── PDF text extraction
│       │   └── platforms/              ◄── Coding platform scrapers
│       │       ├── leetcode.service.js
│       │       ├── codeforces.service.js
│       │       ├── codechef.service.js
│       │       ├── gfg.service.js
│       │       └── github.service.js
│       └── utils/                      ◄── Helper/utility functions
│           ├── urlParser.js            ◄── Parse platform URLs/usernames
│           └── fixPending.js           ◄── One-off script to fix stuck analyses
│
└── frontend/                           ◄── ALL client-side code
    ├── .env                            ◄── Frontend environment variables
    ├── .env.example                    ◄── Template
    ├── .gitignore                      ◄── Frontend ignores
    ├── .oxlintrc.json                  ◄── Linter configuration
    ├── index.html                      ◄── 🚀 HTML entry point (single page)
    ├── package.json                    ◄── Frontend dependencies
    ├── vite.config.js                  ◄── Vite build tool configuration
    ├── vercel.json                     ◄── Vercel deployment rewrites
    ├── public/                         ◄── Static assets (favicon, etc.)
    ├── dist/                           ◄── Production build output
    └── src/                            ◄── Source code
        ├── main.jsx                    ◄── 🚀 React entry point
        ├── App.jsx                     ◄── Router + route definitions
        ├── App.css                     ◄── Vite boilerplate CSS (mostly unused)
        ├── index.css                   ◄── 🎨 Global styles + Tailwind import
        ├── api/                        ◄── API client configuration
        │   ├── axios.js                ◄── Axios instance + JWT interceptor
        │   └── codingProfile.api.js    ◄── Coding profile API functions
        ├── components/                 ◄── Reusable UI components
        │   ├── Sidebar.jsx             ◄── App shell layout + navigation
        │   ├── Navbar.jsx              ◄── Top navigation bar
        │   ├── ResumeChat.jsx          ◄── AI chatbot component
        │   ├── BulletOptimizer.jsx     ◄── Interactive bullet rewrite tool
        │   ├── ReportExport.jsx        ◄── Copy/print report utility
        │   └── coding-profile/         ◄── Coding dashboard sub-components
        │       ├── PlatformUrlInput.jsx
        │       ├── CodingScoreCard.jsx
        │       ├── PlatformCard.jsx
        │       ├── DSATab.jsx
        │       ├── CompetitiveProgrammingTab.jsx
        │       ├── DevelopmentTab.jsx
        │       └── ActivityHeatmap.jsx
        ├── pages/                      ◄── Full page components (one per route)
        │   ├── Login.jsx               ◄── /login
        │   ├── Signup.jsx              ◄── /signup
        │   ├── Dashboard.jsx           ◄── / (home — upload form)
        │   ├── Result.jsx              ◄── /result/:id
        │   ├── History.jsx             ◄── /history
        │   ├── CodingProfile.jsx       ◄── /coding-profile
        │   └── Account.jsx             ◄── /account
        └── assets/                     ◄── Static images/icons
```

### Why Does Each Folder Exist?

| Folder | Why It Exists | What Happens If Removed? |
|--------|--------------|--------------------------|
| `backend/src/config/` | Centralized configuration (Redis client). One place to change connection settings. | Redis connection code would be duplicated across files |
| `backend/src/controllers/` | Separates business logic from route definitions (MVC pattern). | Routes become bloated with 300+ line handler functions |
| `backend/src/middleware/` | Reusable request pre-processors. Auth, upload, rate-limiting run BEFORE your route handler. | You'd copy-paste JWT verification into every route |
| `backend/src/models/` | Database schema definitions. Single source of truth for data structure. | No data validation, any garbage data enters DB |
| `backend/src/routes/` | Maps HTTP endpoints (URLs) to handler functions. | Server wouldn't know what to do with incoming requests |
| `backend/src/services/` | Core business logic (AI, PDF parsing, platform APIs). Reusable across routes AND worker. | AI analysis logic would be duplicated in routes and worker |
| `backend/src/utils/` | Small helper functions used across the codebase. | Code duplication for common operations |
| `frontend/src/api/` | Centralized HTTP client configuration. | Every component would create its own Axios instance |
| `frontend/src/components/` | Reusable UI building blocks. Used by multiple pages. | Code duplication; changes require editing multiple files |
| `frontend/src/pages/` | Full-screen views, one per route. | No separation between routing and rendering |

---

## ═══════════════════════════════
## STEP 3 — FILE BY FILE
## ═══════════════════════════════

> For every file, I'll explain: Purpose → When it runs → Who calls it → Data in/out → Key functions → Interview questions.

---

### 📁 ROOT FILES

---

#### 📄 [.gitignore](file:///d:/AI-Powered-Resume/.gitignore)

**Purpose:** Tells Git which files/folders to NEVER track in version control.

**Why it exists:** Prevents uploading secrets (`.env` files), massive folders (`node_modules/`), and build artifacts (`dist/`) to GitHub.

**Key entries explained:**

```gitignore
node_modules/          # 500MB+ of downloaded libraries — recreatable via npm install
.env                   # Contains passwords, API keys — NEVER commit to Git!
!.env.example          # The ! means "DON'T ignore this" — template is safe to share
frontend/dist/         # Build output — regenerated by `npm run build`
```

> **Interview Q:** *"What would happen if you committed your `.env` file to GitHub?"*
> **A:** Anyone can see your database password, API keys, and JWT secrets. Attackers could steal data, impersonate users, or run up your API bills. Even if you delete it later, Git history still contains it — you'd need to rotate ALL credentials immediately.

---

#### 📄 [render.yaml](file:///d:/AI-Powered-Resume/render.yaml)

**Purpose:** Infrastructure-as-Code deployment configuration for [Render.com](https://render.com).

**When executed:** When you deploy the project to Render's cloud platform.

**What it defines:**

```yaml
services:
  - type: web                           # Web service (receives HTTP requests)
    name: resume-screener-api           # Service name
    buildCommand: cd backend && npm install   # Run during deployment
    startCommand: cd backend && node src/index.js  # Run the Express server

  - type: worker                        # Background worker (no HTTP port)
    name: resume-screener-worker
    startCommand: cd backend && node worker.js   # Run the BullMQ worker
    envVars:
      - key: MONGODB_URI
        fromService:                     # Share env vars between services
          type: web
          name: resume-screener-api
```

**Key concept — `web` vs `worker`:**
- `web` service = receives HTTP requests (your Express API server)
- `worker` service = background process (picks up jobs from Redis queue, has no HTTP endpoint)

> **Interview Q:** *"Why run the worker as a separate process instead of inside the same Express server?"*
> **A:** If AI analysis takes 30 seconds and runs inside the Express server, it blocks the Node.js event loop. Other users' HTTP requests would hang. Separating the worker means the API server stays responsive while heavy AI work happens independently.

---

### 📁 BACKEND FILES

---

#### 📄 [backend/package.json](file:///d:/AI-Powered-Resume/backend/package.json)

**Purpose:** Defines the backend project's metadata, scripts, and dependencies.

**Every dependency explained:**

| Package | What It Does | Why This Project Needs It |
|---------|-------------|--------------------------|
| `express@5.2.1` | Web framework for Node.js. Handles HTTP requests, routing, middleware. | The backbone of our API server |
| `mongoose@9.8.0` | ODM (Object Document Mapper) for MongoDB. Provides schemas, validation, queries. | Interact with MongoDB in a structured way |
| `@google/genai@2.13.0` | Official Google Gemini AI SDK. | Send resume+JD to Gemini, get analysis back |
| `bullmq@5.81.0` | Redis-based job queue library. | Queue AI analysis jobs for background processing |
| `ioredis@5.11.1` | Redis client for Node.js. | Connect to Upstash Redis (used by BullMQ) |
| `jsonwebtoken@9.0.3` | Create and verify JWT tokens. | Stateless authentication (no sessions needed) |
| `bcrypt@6.0.0` | Hash passwords using bcrypt algorithm. | Never store plain-text passwords |
| `cors@2.8.6` | Enable Cross-Origin Resource Sharing. | Allow frontend (port 5173) to call backend (port 5000) |
| `dotenv@17.4.2` | Load `.env` file variables into `process.env`. | Keep secrets out of source code |
| `multer@2.2.0` | Handle `multipart/form-data` file uploads. | Accept PDF files from the upload form |
| `pdf-parse@1.1.1` | Extract text content from PDF files. | Read the resume PDF as plain text |
| `express-rate-limit@8.6.0` | Limit repeated requests from same IP. | Prevent abuse/DDoS attacks |
| `google-auth-library@10.9.0` | Verify Google OAuth ID tokens. | Validate Google Sign-In credentials server-side |
| `axios@1.18.1` | HTTP client (used server-side too). | Fetch data from coding platform APIs |
| `cloudinary@1.41.3` | Cloud image/file hosting SDK. | **Legacy** — not actively used (memory storage now) |
| `multer-storage-cloudinary@4.0.0` | Multer storage engine for Cloudinary. | **Legacy** — replaced by `memoryStorage()` |

**npm scripts:**

```json
"start": "node src/index.js",     // Production: run server directly
"dev": "nodemon src/index.js"     // Development: auto-restart on file changes
```

**Dev dependency:**
- `nodemon@3.1.14` — Watches files and automatically restarts Node.js when you save changes. Only needed during development, not in production.

> **Interview Q:** *"What's the difference between dependencies and devDependencies?"*
> **A:** `dependencies` are needed at runtime in production (Express, Mongoose). `devDependencies` are only needed during development (nodemon, linters). When you run `npm install --production`, devDependencies are skipped, making the production bundle smaller.

---

#### 📄 [backend/src/index.js](file:///d:/AI-Powered-Resume/backend/src/index.js) — 🚀 SERVER ENTRY POINT

**Purpose:** This is the **first file that runs** when you start the backend. It creates the Express server, connects to MongoDB, registers all routes, and starts listening for HTTP requests.

**When executed:** `node src/index.js` or `npm run dev`

**Line-by-line breakdown:**

```javascript
require('dotenv').config();  // Load .env file variables into process.env
// Without this, process.env.MONGODB_URI would be undefined
```

```javascript
const app = express();       // Create an Express application instance
const PORT = process.env.PORT || 5000;  // Use env PORT or default to 5000
```

**CORS configuration (Lines 14-30):**
```javascript
const allowedOrigins = [
  process.env.FRONTEND_URL,     // Production frontend URL
  'http://localhost:5173',       // Vite dev server default
  'http://localhost:3000',       // Alternative dev port
  'http://127.0.0.1:5173'       // localhost alias
].filter(Boolean);              // Remove undefined/null values

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);   // Allow the request
    }
    return callback(null, true);     // Currently permissive for dev
  },
  credentials: true   // Allow cookies/auth headers to be sent
}));
```

> **What is CORS?** When your frontend at `localhost:5173` tries to call your backend at `localhost:5000`, the browser blocks it by default (Same-Origin Policy). CORS headers tell the browser "it's okay, this origin is allowed."

**Google OAuth header (Lines 33-36):**
```javascript
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});
```
This is needed because Google Sign-In opens a popup window. Without this header, the popup can't communicate back to your app.

**MongoDB connection (Lines 41-43):**
```javascript
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resume')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));
```

**Route registration (Lines 46-48):**
```javascript
app.use('/api/auth', authRoutes);              // All auth routes start with /api/auth
app.use('/api/analyses', analysisRoutes);       // All analysis routes start with /api/analyses
app.use('/api/coding-profile', authMiddleware, codingProfileRoutes);  // Protected!
```
Notice: `codingProfileRoutes` has `authMiddleware` applied to ALL its routes — meaning every coding profile endpoint requires a valid JWT token.

**Global error handler (Lines 51-54):**
```javascript
app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});
```
Express recognizes this as an error handler because it has **4 parameters** (err, req, res, next). Any `throw` or `next(err)` in any route will land here.

**Process crash prevention (Lines 57-63):**
```javascript
process.on('unhandledRejection', (reason) => { ... });
process.on('uncaughtException', (err) => { ... });
```
Without these, if any Promise fails without a `.catch()`, or any synchronous error goes uncaught, Node.js would **crash the entire server**. These handlers log the error and keep the server alive.

> **Interview Q:** *"Is catching uncaughtException a good practice in production?"*
> **A:** It's controversial. Node.js docs recommend crashing and restarting (via PM2 or Docker restart policies) because the process may be in an inconsistent state. This project catches it for development convenience, but in production, you'd want a process manager to restart automatically.

---

#### 📄 [backend/worker.js](file:///d:/AI-Powered-Resume/backend/worker.js) — 🔧 BACKGROUND JOB PROCESSOR

**Purpose:** A completely **separate Node.js process** that listens to the Redis queue and processes AI analysis jobs.

**When executed:** `node worker.js` (runs in its own terminal)

**Which files call it?** Nobody calls it directly — it's a **standalone process** that pulls jobs from the BullMQ `resume-analysis` queue in Redis.

**Which files it calls:**
- [Analysis.js](file:///d:/AI-Powered-Resume/backend/src/models/Analysis.js) (to read/update analysis records)
- [ai.service.js](file:///d:/AI-Powered-Resume/backend/src/services/ai.service.js) (to run AI analysis)

**Data flow:**
```
Redis Queue → { analysisId: "abc123" }
    │
    ▼
Worker finds Analysis document in MongoDB
    │
    ▼
Sends resumeText + jobDescription to Gemini AI
    │
    ▼
Updates MongoDB: status="complete", result={matchScore, keywords, ...}
```

**Key code:**
```javascript
const worker = new Worker('resume-analysis', async (job) => {
  const { analysisId } = job.data;                    // Get analysis ID from job
  const analysis = await Analysis.findById(analysisId); // Fetch from MongoDB
  analysis.status = 'processing';                      // Update status
  await analysis.save();

  const text = analysis.extractedResumeText;           // Resume was already parsed
  const aiResult = await analyzeResume(text, analysis.jobDescription);  // Call Gemini

  analysis.result = aiResult;                          // Save AI results
  analysis.status = 'complete';
  analysis.completedAt = new Date();
  await analysis.save();
}, { connection });  // connection = Redis client
```

> **Interview Q:** *"Why does the worker run as a separate process instead of within the Express server?"*
> **A:** Three reasons:
> 1. **Non-blocking:** AI analysis takes 5-30 seconds. If it ran inside Express, the event loop would be blocked, making ALL other API requests slow.
> 2. **Scalability:** You can run 5 worker instances on different machines, all pulling from the same queue.
> 3. **Fault isolation:** If the worker crashes, the API server keeps working. Users can still upload; jobs just queue up.

---

#### 📄 [backend/src/middleware/auth.js](file:///d:/AI-Powered-Resume/backend/src/middleware/auth.js) — 🔐 JWT AUTHENTICATION GUARD

**Purpose:** Middleware that runs BEFORE protected routes. It extracts and verifies the JWT token from the `Authorization` header.

**Data in:** HTTP request with `Authorization: Bearer <token>` header
**Data out:** `req.user = { id, email }` (decoded from token) → next middleware/route runs

```javascript
module.exports = function(req, res, next) {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
  //                             ^^^^ 401 = Unauthorized (not authenticated)

  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), secret);
    // jwt.verify() does TWO things:
    // 1. Checks the signature (was this token created with our secret?)
    // 2. Checks expiration (has the 7-day window passed?)
    req.user = decoded;  // Attach decoded payload to request object
    next();              // Allow request to continue to the route handler
  } catch (ex) {
    res.status(400).json({ error: 'Invalid or expired token.' });
    //           ^^^^ 400 = Bad Request (token is malformed or expired)
  }
};
```

> **Interview Q:** *"What is JWT and how does it work?"*
> **A:** JWT (JSON Web Token) is a string with 3 parts: `header.payload.signature`.
> - **Header:** Algorithm used (HS256)
> - **Payload:** User data (`{ id: "abc", email: "user@example.com" }`)
> - **Signature:** `HMAC(header + payload, JWT_SECRET)` — proves the token wasn't tampered with
>
> The server never stores sessions. It just verifies the signature matches, and the data is authentic.

---

#### 📄 [backend/src/middleware/upload.js](file:///d:/AI-Powered-Resume/backend/src/middleware/upload.js) — 📎 FILE UPLOAD HANDLER

**Purpose:** Configures Multer to accept PDF file uploads and hold them in memory (as a Buffer).

```javascript
const storage = multer.memoryStorage();  // Store file in RAM, not disk

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },  // 10MB max (10 * 1024KB * 1024B)
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);    // Accept: it's a PDF
    } else {
      cb(new Error('Only PDFs are allowed'));  // Reject: not a PDF
    }
  }
});
```

> **Interview Q:** *"Why use memoryStorage() instead of saving to disk?"*
> **A:** The PDF is immediately parsed into text during the upload request. After text extraction, we don't need the file anymore. Memory storage avoids:
> 1. Writing temporary files to disk (slow I/O)
> 2. Cleaning up temp files later
> 3. Needing cloud storage credentials
> The tradeoff: large files consume server RAM temporarily.

---

#### 📄 [backend/src/middleware/rateLimit.js](file:///d:/AI-Powered-Resume/backend/src/middleware/rateLimit.js) — 🛡️ RATE LIMITING & QUOTA

**Purpose:** Two layers of protection:
1. **IP Rate Limiter:** Max 200 requests per 15 minutes from the same IP
2. **User Quota:** Tracks daily analysis count per user (currently unlimited)

```javascript
// Layer 1: IP-based rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes in milliseconds
  max: 200,                   // max requests per window
  message: { error: 'Too many requests...' }
});

// Layer 2: User-level daily quota
const checkQuota = async (req, res, next) => {
  const user = await User.findById(req.user.id);

  // Reset counter at midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (today > lastReset) {
    await User.findByIdAndUpdate(req.user.id, {
      'usage.analysesToday': 0,
      'usage.lastResetDate': new Date()
    });
  }
  next();
};
```

> **Interview Q:** *"What's the difference between rate limiting and quota?"*
> **A:** **Rate limiting** prevents burst attacks (too many requests in a short time) — based on IP address. **Quota** is a business limit (free users get 5 analyses/day, pro gets 50) — based on user identity. You need BOTH: rate limiting protects the infrastructure; quota protects the business model.

---

#### 📄 [backend/src/models/User.js](file:///d:/AI-Powered-Resume/backend/src/models/User.js) — 👤 USER DATABASE SCHEMA

**Purpose:** Defines the structure of user documents in MongoDB.

```javascript
const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },  // Must be unique
  passwordHash: { type: String },     // Optional — Google users don't have passwords
  googleId: { type: String },         // Set when user signs in via Google
  planTier: { type: String, enum: ['free', 'pro'], default: 'free' },
  usage: {
    analysesToday: { type: Number, default: 0 },
    lastResetDate: { type: Date, default: Date.now }
  }
}, { timestamps: true });  // Auto-adds createdAt, updatedAt
```

**Pre-save hook (password hashing):**
```javascript
userSchema.pre('save', async function() {
  if (this.isModified('passwordHash') && this.passwordHash) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
    // 10 = salt rounds. Higher = more secure but slower.
    // 10 rounds ≈ 10ms. 12 rounds ≈ 40ms.
  }
});
```
This runs **automatically** before every `user.save()`. If the password was modified, it gets hashed. This means you can write `user.passwordHash = "plaintext"` and Mongoose will auto-hash it.

**Instance method (password comparison):**
```javascript
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};
```

> **Interview Q:** *"Why hash passwords? Why not encrypt them?"*
> **A:** Encryption is **reversible** — if someone steals the key, they can decrypt all passwords. Hashing is **one-way** — you can never recover the original password. Even if the database is stolen, attackers can't read passwords. bcrypt adds a random **salt** to each password, so identical passwords produce different hashes.

---

#### 📄 [backend/src/models/Analysis.js](file:///d:/AI-Powered-Resume/backend/src/models/Analysis.js) — 📊 ANALYSIS RESULT SCHEMA

**Purpose:** Stores resume analysis records — the input (resume text, JD), processing status, and AI results.

**Key fields:**
```javascript
userId: ObjectId → ref: 'User'     // Which user owns this analysis
status: 'pending' | 'processing' | 'complete' | 'failed'
extractedResumeText: String        // Raw text extracted from PDF
jobDescription: String              // Target job description
result: {
  matchScore: Number,               // 0-100%
  matchedKeywords: [String],        // Skills found in both resume & JD
  missingKeywords: [String],        // JD skills missing from resume
  strengths: [String],              // What's good about the resume
  gaps: [String],                   // Areas for improvement
  suggestedBullets: [{              // AI-improved bullet points
    original: String,
    improved: String,
    reason: String
  }],
  summary: String                   // Executive summary paragraph
}
chatHistory: [{                      // AI chatbot conversation log
  sender: 'user' | 'ai',
  text: String,
  createdAt: Date
}]
```

> **Interview Q:** *"Why store extractedResumeText in the database?"*
> **A:** So the worker process (which runs separately) can access the resume text. The PDF file was in memory during the upload request — once that request completes, the buffer is gone. The extracted text persists in MongoDB for the worker, for the chat feature, and for re-analysis.

---

#### 📄 [backend/src/services/ai.service.js](file:///d:/AI-Powered-Resume/backend/src/services/ai.service.js) — 🧠 THE AI BRAIN (420 Lines)

**Purpose:** The most important file in the backend. Contains:
1. `analyzeResume()` — Main AI analysis function
2. `chatWithResume()` — AI chatbot for follow-up questions
3. `optimizeBulletPoint()` — Single bullet point rewriter
4. `generateFallbackAnalysis()` — Local fallback when AI API is down

**How `analyzeResume()` works:**

```javascript
async function analyzeResume(resumeText, jobDescription) {
  const userPrompt = `TARGET JOB DESCRIPTION:\n"${jobDescription}"\n\nRESUME TEXT:\n"${resumeText}"`;

  const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash'];  // Fallback chain

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: userPrompt,
        config: {
          systemInstruction: SYSTEM_PROMPT,        // 27-line prompt defining output schema
          responseMimeType: 'application/json'     // Force JSON output
        }
      });
      return JSON.parse(response.text);            // Parse AI response as JSON
    } catch (err) {
      console.warn(`Model ${modelName} failed. Trying next...`);
    }
  }

  // All AI models failed — use local fallback
  return generateFallbackAnalysis(resumeText, jobDescription);
}
```

**Design pattern: Model Fallback Chain**
```
Try gemini-2.0-flash
    ↓ fails?
Try gemini-1.5-flash
    ↓ fails?
Use local keyword-matching fallback
```

**The SYSTEM_PROMPT (prompt engineering):**
This is a carefully crafted prompt that tells Gemini:
1. You are an ATS screening expert
2. Analyze the resume against the job description
3. Return **ONLY valid JSON** matching this exact schema
4. Include matchScore, matchedKeywords, missingKeywords, strengths, weaknesses, suggestedBullets, summary

> **Interview Q:** *"Why use responseMimeType: 'application/json'?"*
> **A:** Without it, the AI might return markdown-formatted text, or add commentary before/after the JSON. Setting `responseMimeType` forces the model to output pure JSON, making parsing reliable.

> **Interview Q:** *"Why have a local fallback instead of just showing an error?"*
> **A:** User experience. If you used all your free Gemini API quota, or the API is temporarily down, users would see "Analysis failed." The fallback does basic keyword matching locally — it's less sophisticated but still provides value (matched/missing keywords, a score).

---

#### 📄 [backend/src/routes/analysis.routes.js](file:///d:/AI-Powered-Resume/backend/src/routes/analysis.routes.js) — 📡 CORE API ROUTES

**Purpose:** Defines all API endpoints for resume analysis operations.

**Endpoints defined:**

| Method | Path | Middleware Chain | What It Does |
|--------|------|-----------------|--------------|
| `POST` | `/` | auth → apiLimiter → checkQuota → upload.single('resume') | Upload resume + JD, start analysis |
| `GET` | `/:id` | auth | Get one analysis (polling endpoint) |
| `GET` | `/` | auth | Get all user's analyses (history) |
| `DELETE` | `/:id` | auth | Delete an analysis |
| `POST` | `/:id/chat` | auth → apiLimiter | Send chat message to AI |
| `POST` | `/optimize-bullet` | auth → apiLimiter | Optimize a single bullet point |

**The upload handler (POST /) — most complex route:**

```javascript
router.post('/', auth, apiLimiter, checkQuota, upload.single('resume'), async (req, res) => {
  // 1. Validate inputs
  if (!req.file) return res.status(400).json({ error: 'Please upload a PDF resume.' });
  if (!jobDescription) return res.status(400).json({ error: 'Job description is required.' });

  // 2. Extract text from PDF IMMEDIATELY (in-memory)
  const pdfData = await pdf(req.file.buffer);
  extractedText = pdfData.text;

  // 3. Save initial analysis record to MongoDB
  const analysis = new Analysis({
    userId: req.user.id,
    resumeFileUrl: 'memory://extracted-at-upload',
    extractedResumeText: extractedText,
    status: 'pending'
  });
  await analysis.save();

  // 4. Queue job to BullMQ (picked up by worker.js)
  const job = await queue.add('analyze', { analysisId: analysis._id.toString() });

  // 5. ALSO start processing immediately (belt-and-suspenders approach)
  setTimeout(() => {
    processAnalysisInBackground(analysis._id, extractedText, jobDescription);
  }, 100);

  // 6. Increment user's daily quota
  await User.findByIdAndUpdate(req.user.id, { $inc: { 'usage.analysesToday': 1 } });

  // 7. Return immediately (don't wait for AI to finish)
  res.json({ analysisId: analysis._id, status: 'pending' });
});
```

> **Interview Q:** *"Why both queue.add() AND setTimeout() for processing?"*
> **A:** This is a **dual-path reliability pattern**:
> - `queue.add()` puts the job in Redis for `worker.js` to process — but if the worker isn't running (during local dev), nothing happens.
> - `setTimeout()` directly calls `processAnalysisInBackground()` after 100ms as a fallback — guarantees the analysis completes even without the worker.
> In production, the first one to complete "wins" (the second attempt would find status is already "complete" and skip).

---

#### 📄 [backend/src/routes/auth.routes.js](file:///d:/AI-Powered-Resume/backend/src/routes/auth.routes.js) — 🔑 AUTHENTICATION ROUTES

**Endpoints:**

| Method | Path | Auth? | What It Does |
|--------|------|-------|-------------|
| `POST` | `/google` | No | Verify Google token, create/find user, return JWT |
| `POST` | `/signup` | No | Register with email+password, return JWT |
| `POST` | `/login` | No | Verify email+password, return JWT |
| `GET` | `/me` | Yes | Return current user's profile |
| `GET` | `/usage` | Yes | Return daily analysis usage stats |

**Google OAuth flow (POST /google):**
```javascript
// 1. Frontend sends Google's credential token
const { token } = req.body;

// 2. Backend verifies it with Google's servers
const ticket = await client.verifyIdToken({
  idToken: token,
  audience: process.env.GOOGLE_CLIENT_ID  // Must match our app
});

// 3. Extract user info from verified token
const { email, name, sub: googleId } = ticket.getPayload();

// 4. Find or create user
let user = await User.findOne({ email });
if (!user) {
  user = new User({ name, email, googleId });
  await user.save();
}

// 5. Issue our own JWT (not Google's — ours, for our API)
const jwtToken = jwt.sign(
  { id: user._id, email: user.email },
  jwtSecret,
  { expiresIn: '7d' }
);

res.json({ token: jwtToken, user: { ... } });
```

> **Interview Q:** *"Why does the backend verify the Google token instead of just trusting it?"*
> **A:** Anyone could craft a fake Google credential in Postman. The backend calls Google's `verifyIdToken()` to confirm:
> 1. The token was actually issued by Google (not forged)
> 2. It was issued for OUR application (matching `GOOGLE_CLIENT_ID`)
> 3. It hasn't expired

---

### 📁 FRONTEND FILES

---

#### 📄 [frontend/index.html](file:///d:/AI-Powered-Resume/frontend/index.html) — 🌐 SINGLE HTML PAGE

**Purpose:** The ONE and ONLY HTML file in the entire frontend. React renders everything inside `<div id="root">`.

```html
<div id="root"></div>                         <!-- React injects UI here -->
<script type="module" src="/src/main.jsx"></script>  <!-- Load React app -->
```

> This is a **Single Page Application (SPA)**. The browser loads ONE HTML file, then JavaScript handles all "page changes" by swapping components — no full page reloads.

---

#### 📄 [frontend/src/main.jsx](file:///d:/AI-Powered-Resume/frontend/src/main.jsx) — 🚀 REACT ENTRY POINT

```jsx
createRoot(document.getElementById('root')).render(
  <StrictMode>                    {/* Warns about unsafe code patterns */}
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <App />                     {/* The actual application */}
    </GoogleOAuthProvider>
  </StrictMode>
);
```

**What each wrapper does:**
- `StrictMode` — Double-renders components in dev to catch side effects
- `GoogleOAuthProvider` — Makes Google Sign-In available to all child components
- `import.meta.env.VITE_GOOGLE_CLIENT_ID` — Vite's way of accessing environment variables (only vars starting with `VITE_` are exposed to the browser)

---

#### 📄 [frontend/src/App.jsx](file:///d:/AI-Powered-Resume/frontend/src/App.jsx) — 🗺️ ROUTER & LAYOUT

**Purpose:** Defines ALL routes and wraps protected routes with authentication checks.

```jsx
const token = localStorage.getItem('token');
const isAuthenticated = !!token && token !== 'undefined' && token !== 'null';
```

**Route structure:**
```
/login              → <Login />            (public)
/signup             → <Signup />           (public)
/                   → <Sidebar><Dashboard /></Sidebar>  (public)
/result/:id         → <Sidebar><Result /></Sidebar>     (protected)
/history            → <Sidebar><History /></Sidebar>     (protected)
/coding-profile     → <Sidebar><CodingProfile /></Sidebar> (protected)
/account            → <Sidebar><Account /></Sidebar>    (protected)
```

**How protection works:**
```jsx
isAuthenticated ? (
  <Sidebar><Result /></Sidebar>
) : (
  <Navigate to="/login" />   // Redirect unauthenticated users
)
```

> **Interview Q:** *"Is checking localStorage for auth tokens secure?"*
> **A:** It's functional but not the most secure approach. localStorage is vulnerable to XSS attacks — if an attacker injects JavaScript, they can steal the token. More secure alternatives:
> 1. **httpOnly cookies** — JavaScript can't access them
> 2. **Refresh token rotation** — short-lived access tokens + long-lived refresh tokens
> This project uses localStorage for simplicity in a portfolio project.

---

#### 📄 [frontend/src/api/axios.js](file:///d:/AI-Powered-Resume/frontend/src/api/axios.js) — 📡 HTTP CLIENT

**Purpose:** Creates a configured Axios instance with automatic JWT token injection.

```javascript
const api = axios.create({
  baseURL: 'http://localhost:5000/api',  // All requests go to this base URL
});

// Interceptor: runs BEFORE every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;  // Auto-attach JWT
  }
  return config;
});
```

**Why use interceptors?** Without them, every API call would need:
```javascript
// Without interceptor (BAD — repetitive):
api.get('/analyses', { headers: { Authorization: `Bearer ${token}` } });

// With interceptor (GOOD — automatic):
api.get('/analyses');  // Token is auto-attached!
```

---

#### 📄 [frontend/src/pages/Dashboard.jsx](file:///d:/AI-Powered-Resume/frontend/src/pages/Dashboard.jsx) — 🏠 HOME PAGE

**Purpose:** The main upload form where users submit their resume + job description.

**Key features:**
1. **File upload** with drag-and-drop-style clickable area
2. **Job Description textarea** with auto-save to `sessionStorage`
3. **1-Click preset templates** (SDE-2, Frontend, Backend, AI roles)
4. **Real-time keyword detection** in the JD textarea
5. **Polling mechanism** to check analysis status

**The polling pattern (crucial interview topic):**
```javascript
const pollStatus = async (id) => {
  const res = await api.get(`/analyses/${id}`);
  if (res.data.status === 'complete') {
    navigate(`/result/${id}`);              // Done! Go to results
  } else if (res.data.status === 'failed') {
    setError('Analysis failed');            // Show error
  } else {
    setTimeout(() => pollStatus(id), 1500); // Try again in 1.5 seconds
  }
};
```

> **Interview Q:** *"Why polling instead of WebSockets?"*
> **A:** Polling is simpler to implement and good enough for this use case (analysis takes 5-15 seconds, so only 3-10 polls). WebSockets would be better for real-time features (chat, live dashboards) but add complexity:
> - Need to maintain persistent connections
> - Need to handle reconnection logic
> - Need Socket.io or similar library on both sides
> For a portfolio project, polling is the pragmatic choice.

---

#### 📄 [frontend/src/pages/Result.jsx](file:///d:/AI-Powered-Resume/frontend/src/pages/Result.jsx) — 📊 ANALYSIS RESULTS

**Purpose:** Displays the full AI analysis report with rich visualizations.

**Key features:**
1. **Circular SVG score gauge** (color-coded: green ≥80%, yellow ≥60%, red <60%)
2. **Keyword badges** (green = matched, red = missing)
3. **Strengths & Weaknesses** lists
4. **"What Can Be Added"** actionable suggestions
5. **Side-by-side bullet rewrites** (original vs improved)
6. **Interactive Bullet Optimizer** component
7. **AI Chat Assistant** component

**The SVG gauge (interview favorite):**
```jsx
<svg viewBox="0 0 176 176">
  {/* Background circle */}
  <circle cx="88" cy="88" r="72" stroke="#222226" strokeWidth="12" fill="transparent" />

  {/* Animated progress circle */}
  <circle
    cx="88" cy="88" r="72"
    stroke={strokeColor}
    strokeDasharray={2 * Math.PI * 72}        // Full circumference
    strokeDashoffset={2 * Math.PI * 72 * (1 - matchScore / 100)}  // Partial fill
    className="transition-all duration-1000"    // Smooth animation
    strokeLinecap="round"
  />
</svg>
```

> **How does strokeDasharray/strokeDashoffset work?**
> Imagine a dashed line around a circle. `strokeDasharray` is the length of the dash (set to full circumference). `strokeDashoffset` is how much to hide. If matchScore is 75%, offset hides 25% of the circle, showing 75%.

---

This concludes Steps 1-3. The remaining steps are in the next artifact.
