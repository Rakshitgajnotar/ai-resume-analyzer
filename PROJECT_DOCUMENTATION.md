# AI-Powered Resume Screener — Full Project Documentation

A full-stack, enterprise-grade AI Resume Screener web application built with **React (Vite)**, **Node.js (Express)**, **MongoDB Atlas**, **BullMQ + Upstash Redis**, and **Google Gemini 3.5 Flash AI**.

---

## Table of Contents

1. [Executive Overview](#1-executive-overview)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Architecture & Workflow Diagram](#3-architecture--workflow-diagram)
4. [Folder & Directory Structure](#4-folder--directory-structure)
5. [Detailed Core Functionality](#5-detailed-core-functionality)
   - [Authentication & User Management](#51-authentication--user-management)
   - [Resume Ingestion & PDF Parsing](#52-resume-ingestion--pdf-parsing)
   - [Asynchronous Queue & Worker System](#53-asynchronous-queue--worker-system)
   - [AI Screening & Gemini Prompt Engineering](#54-ai-screening--gemini-prompt-engineering)
   - [Result Dashboard & UI Visualization](#55-result-dashboard--ui-visualization)
6. [API Endpoints Documentation](#6-api-endpoints-documentation)
7. [Database Schema Models](#7-database-schema-models)
8. [Environment Variables Reference](#8-environment-variables-reference)
9. [Setup & Running Locally](#9-setup--running-locally)

---

## 1. Executive Overview

The **AI-Powered Resume Screener** solves the problem of automated candidate-to-job matching. Job seekers or recruiters can upload a PDF resume alongside a target Job Description. The system extracts raw text from the PDF in real-time, queues the task into an asynchronous Redis worker queue, and invokes the **Gemini 3.5 Flash AI** model to perform a multi-dimensional assessment:

- **Overall Match Score** (0 to 100%)
- **Matched Keywords** (skills, tools, frameworks present in both)
- **Missing Keywords** (critical JD requirements missing from the resume)
- **Resume Strengths & Gaps**
- **Actionable Bullet Point Rewrites** (Original vs. Quantified/Improved versions with rationale)

---

## 2. Tech Stack & Dependencies

### Frontend (Client)
- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS (Utility-first styling with modern glassmorphism aesthetic)
- **Routing:** React Router v6 (Client-side protected routing)
- **HTTP Client:** Axios (Configured with request/response interceptors for JWT)
- **Google OAuth:** `@react-oauth/google`

### Backend (Server & Worker)
- **Runtime:** Node.js v22+
- **Framework:** Express.js
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Queue / Caching:** BullMQ + Upstash Redis (`ioredis`)
- **PDF Extraction:** `pdf-parse` (In-memory buffer parsing)
- **File Uploads:** `multer` (Memory storage strategy)
- **Authentication:** `jsonwebtoken` (JWT), `bcrypt` (Password hashing), `google-auth-library`
- **AI Model Integration:** `@google/genai` (Gemini 3.5 Flash)

---

## 3. Architecture & Workflow Diagram

```
[User Browser (React + Vite)]
       │
       │ 1. POST /api/analyses (PDF Resume + Job Description + JWT)
       ▼
[Backend Server (Express)]
       │
       ├─► 2. Extract PDF Text in-memory (`pdf-parse`)
       │
       ├─► 3. Save Document into MongoDB (`resume.analyses` collection, status: "pending")
       │
       └─► 4. Add Job to BullMQ ("resume-analysis" queue via Upstash Redis)
               │
               ▼
   [Redis Queue (Upstash)]
               │
               │ 5. Pickup Job asynchronously
               ▼
   [Background Worker (`worker.js`)]
               │
               ├─► 6. Fetch Analysis Document from MongoDB
               │
               ├─► 7. Send Prompt + Text + JD to Gemini 3.5 Flash AI
               │
               ├─► 8. Parse Structured JSON Response
               │
               └─► 9. Update MongoDB Document (status: "complete", result payload)
                       │
                       ▼
[User Browser (React)] ◄─── 10. Poll GET /api/analyses/:id ───► Redirect to `/result/:id`
```

---

## 4. Folder & Directory Structure

```text
AI-Powered-Resume/
├── PROJECT_DOCUMENTATION.md         # Full project documentation
├── render.yaml                      # Render cloud deployment specification
│
├── backend/                         # Node.js Express API & Worker codebase
│   ├── src/
│   │   ├── controllers/             # Reserved for custom controller modules
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT Bearer token authentication guard
│   │   │   ├── rateLimit.js         # IP rate limiter & daily usage quota check
│   │   │   └── upload.js            # Multer memory storage configuration (PDF only)
│   │   ├── models/
│   │   │   ├── User.js              # Mongoose user model (OAuth & credentials)
│   │   │   └── Analysis.js          # Mongoose analysis result model
│   │   ├── routes/
│   │   │   ├── auth.routes.js       # Auth routes (/login, /signup, /google, /usage)
│   │   │   └── analysis.routes.js   # Analysis CRUD routes (/api/analyses)
│   │   ├── services/
│   │   │   ├── ai.service.js        # Gemini AI prompt engine & response parser
│   │   │   └── pdf.service.js       # PDF text extractor service
│   │   └── index.js                 # API Server entry point & Express setup
│   ├── worker.js                    # Standalone BullMQ background job worker
│   ├── .env                         # Backend environment variables
│   └── package.json                 # Backend npm dependencies & scripts
│
├── frontend/                        # React Vite frontend application
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js             # Global Axios instance with auth interceptor
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Main navigation header & user session control
│   │   │   └── ProtectedRoute.jsx   # Auth guard for client-side routing
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # Resume upload form & JD input
│   │   │   ├── History.jsx          # Past analysis history table
│   │   │   ├── Login.jsx            # Login page (Email/Password + Google Sign-In)
│   │   │   ├── Result.jsx           # Detailed analysis report page
│   │   │   └── Signup.jsx           # User registration page
│   │   ├── App.jsx                  # React Router routes & layout wrapper
│   │   ├── main.jsx                 # React root & Google OAuth provider wrapper
│   │   └── index.css                # Global Tailwind CSS imports
│   ├── .env                         # Frontend environment variables
│   └── package.json                 # Frontend npm dependencies & scripts
│
└── demo-assets/
    └── Sample_JD.txt                # Sample job description asset for testing
```

---

## 5. Detailed Core Functionality

### 5.1 Authentication & User Management
- **Local Authentication:** Users register with Name, Email, and Password. Passwords are automatically hashed using `bcrypt` (10 rounds) via Mongoose pre-save hooks.
- **Google OAuth 2.0 Integration:** Users can click "Sign in with Google". The frontend `@react-oauth/google` library retrieves a Google ID token and posts it to `/api/auth/google`. The backend verifies the token with `google-auth-library` and issues a local JWT.
- **Session Management:** Signed JWT tokens are stored in `localStorage`. The Axios client automatically attaches `Authorization: Bearer <token>` to all API requests.

### 5.2 Resume Ingestion & PDF Parsing
- **Memory Buffer Strategy:** PDF files are uploaded via `multer.memoryStorage()`. The binary PDF buffer is held in memory without saving temporary files to disk or third-party cloud storage, eliminating storage bottlenecks and access key errors.
- **PDF Text Extraction:** `pdf-parse` extracts raw textual content directly from the PDF buffer during the initial request.

### 5.3 Asynchronous Queue & Worker System
- **Job Delegation:** Upload requests do not block the HTTP thread. Express saves the initial analysis record with status `'pending'` and pushes a job `{ analysisId }` into the **BullMQ** queue (`resume-analysis`).
- **Resilient Upstash Redis Connection:** `ioredis` is configured with TCP `keepAlive`, custom reconnection backoff strategies, and silent error handling for connection resets (`ECONNRESET`).
- **Worker Execution:** `worker.js` runs as a background process. It picks up pending jobs, marks the analysis status as `'processing'`, executes the AI analysis, and saves the final result to MongoDB.

### 5.4 AI Screening & Gemini Prompt Engineering
- **Model:** `gemini-3.5-flash` via `@google/genai` SDK.
- **System Instruction:** Enforces strict JSON output without markdown backticks or commentary matching the required schema:
  - `matchScore`: 0-100 Integer
  - `matchedKeywords`: Array of string skills
  - `missingKeywords`: Array of required missing skills
  - `strengths`: Array of key applicant strengths
  - `gaps`: Array of identified resume weaknesses
  - `suggestedBullets`: Objects with `original`, `improved`, and `reason`
  - `summary`: Concise executive summary paragraph

### 5.5 Result Dashboard & UI Visualization
- **Circular Match Score Gauge:** Rendered in `Result.jsx` using SVG with an explicit `viewBox="0 0 176 176"` to prevent clipping. Color-coded (Green ≥ 80%, Yellow 50-79%, Red < 50%).
- **Keyword Badges:** Visual distinction between Matched (Green pills) and Missing (Red pills) keywords.
- **Side-by-Side Bullet Point Transformations:** Highlights original bullets alongside AI-improved, impact-driven bullet points with explanations.

---

## 6. API Endpoints Documentation

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | No | Register a new local account |
| `POST` | `/api/auth/login` | No | Authenticate local user & receive JWT |
| `POST` | `/api/auth/google` | No | Verify Google ID token & receive JWT |
| `GET` | `/api/auth/me` | Yes | Fetch current user profile |
| `GET` | `/api/auth/usage` | Yes | Fetch user daily analysis usage stats |
| `POST` | `/api/analyses` | Yes | Upload resume PDF + JD, create analysis job |
| `GET` | `/api/analyses` | Yes | Fetch user's analysis history list |
| `GET` | `/api/analyses/:id` | Yes | Fetch single analysis result & status |
| `DELETE`| `/api/analyses/:id` | Yes | Delete an analysis record |

---

## 7. Database Schema Models

### User Schema (`resume.users`)
```javascript
{
  name: String,
  email: { type: String, required: true, unique: true },
  passwordHash: String,
  googleId: String,
  planTier: { type: String, enum: ['free', 'pro'], default: 'free' },
  usage: {
    analysesToday: { type: Number, default: 0 },
    lastResetDate: { type: Date, default: Date.now }
  },
  timestamps: true
}
```

### Analysis Schema (`resume.analyses`)
```javascript
{
  userId: { type: ObjectId, ref: 'User', required: true },
  jobId: String,
  status: { type: String, enum: ['pending', 'processing', 'complete', 'failed'], default: 'pending' },
  resumeFileUrl: String,
  resumeFileName: String,
  jobDescription: { type: String, required: true },
  extractedResumeText: String,
  result: {
    matchScore: Number,
    matchedKeywords: [String],
    missingKeywords: [String],
    strengths: [String],
    gaps: [String],
    suggestedBullets: [{
      original: String,
      improved: String,
      reason: String
    }],
    summary: String
  },
  error: String,
  completedAt: Date,
  timestamps: true
}
```

---

## 8. Environment Variables Reference

### Backend `.env` (`/backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.kzwgpof.mongodb.net/resume?appName=Cluster0
JWT_SECRET=super_secret_jwt_key
GEMINI_API_KEY=AIzaSy...
REDIS_URL=rediss://default:<password>@above-wombat-172305.upstash.io:6379
GOOGLE_CLIENT_ID=907639352395-...apps.googleusercontent.com
```

### Frontend `.env` (`/frontend/.env`)
```env
VITE_GOOGLE_CLIENT_ID=907639352395-...apps.googleusercontent.com
```

---

## 9. Setup & Running Locally

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster URI
- Upstash Redis instance URI
- Google Gemini API Key

### Installation Steps

1. **Clone & Install Dependencies:**
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

2. **Configure Environment Variables:**
   Create `.env` in `backend/` and `frontend/` as described in Section 8.

3. **Start Development Servers:**
   ```bash
   # Terminal 1: Backend API
   cd backend
   npm run dev

   # Terminal 2: Background Worker
   cd backend
   node worker.js

   # Terminal 3: Frontend Web App
   cd frontend
   npm run dev
   ```

4. **Access Application:**
   Open browser at `http://localhost:5173`.
