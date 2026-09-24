# 🎓 AI-Powered Resume Screener — Complete Interview Walkthrough (Steps 4-6)

---

## ═══════════════════════════════
## STEP 4 — COMPLETE REQUEST FLOWS
## ═══════════════════════════════

### 🔄 Flow 1: User Signup (Email/Password)

```
User clicks "Create Account" button on /signup
         │
         ▼
┌── FRONTEND: Signup.jsx ──────────────────────────┐
│  handleSubmit(e) fires                           │
│  e.preventDefault() stops page reload            │
│  setLoading(true) shows spinner                  │
│                                                  │
│  api.post('/auth/signup', { name, email, password })
└──────────────────────┬───────────────────────────┘
                       │ HTTP POST (JSON body)
                       ▼
┌── BACKEND: Express Server ───────────────────────┐
│  app.use('/api/auth', authRoutes)                │
│  Matches POST /signup route                      │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌── NO MIDDLEWARE (public route) ──────────────────┐
│  No auth needed for signup                       │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌── ROUTE: auth.routes.js → POST /signup ──────────┐
│  1. Extract { name, email, password } from body  │
│  2. Check if user already exists:                │
│     User.findOne({ email })                      │
│     → If exists: return 400 "Already registered" │
│  3. Create new user:                             │
│     new User({ name, email, passwordHash: password })
│     user.save()                                  │
│       ↓                                          │
│     TRIGGERS pre('save') hook in User.js         │
│     → bcrypt.hash(password, 10) runs             │
│     → "password123" becomes "$2b$10$xJkL..."     │
│  4. Sign JWT token:                              │
│     jwt.sign({ id: user._id, email }, secret, {expiresIn: '7d'})
│  5. Return: { token, user: { id, name, email } } │
└──────────────────────┬───────────────────────────┘
                       │ HTTP 200 + JSON response
                       ▼
┌── FRONTEND: Signup.jsx (continued) ──────────────┐
│  localStorage.setItem('token', response.data.token)
│  localStorage.setItem('user', JSON.stringify(user))
│  navigate('/') → Redirect to Dashboard          │
│  window.location.reload() → Re-render App.jsx    │
│  App.jsx now sees token → isAuthenticated = true │
└──────────────────────────────────────────────────┘
```

---

### 🔄 Flow 2: Google OAuth Login

```
User clicks Google Sign-In button on /login
         │
         ▼
┌── Google OAuth Popup ────────────────────────────┐
│  Google shows "Sign in with your Google account" │
│  User selects account → Google verifies identity │
│  Google returns: credentialResponse.credential   │
│  (this is a JWT token signed by Google)          │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌── FRONTEND: Login.jsx ───────────────────────────┐
│  handleGoogleSuccess(credentialResponse) fires   │
│  api.post('/auth/google', { token: credential }) │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌── BACKEND: auth.routes.js → POST /google ────────┐
│  1. Receive Google token from request body       │
│  2. Verify with Google's servers:                │
│     client.verifyIdToken({ idToken, audience })  │
│     ↳ Google confirms: "Yes, this is legit"      │
│  3. Extract user info from verified payload:     │
│     { email, name, sub: googleId }               │
│  4. Find or create user:                         │
│     User.findOne({ email })                      │
│     → Not found? Create new user with googleId   │
│     → Found but no googleId? Link Google account │
│  5. Issue OUR JWT token (not Google's)           │
│  6. Return { token, user }                       │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌── FRONTEND: Same as regular login ───────────────┐
│  Store token + user in localStorage              │
│  Navigate to Dashboard                           │
└──────────────────────────────────────────────────┘
```

---

### 🔄 Flow 3: Resume Upload & AI Analysis (THE CORE FLOW)

```
User selects PDF + pastes JD + clicks "Analyze Resume"
         │
         ▼
┌── FRONTEND: Dashboard.jsx ───────────────────────┐
│  handleSubmit(e) fires                           │
│  Creates FormData:                               │
│    formData.append('resume', pdfFile)            │
│    formData.append('jobDescription', jdText)     │
│  api.post('/analyses', formData, {               │
│    headers: {'Content-Type': 'multipart/form-data'}
│  })                                              │
└──────────────────────┬───────────────────────────┘
                       │ HTTP POST (multipart/form-data)
                       │ Authorization: Bearer <jwt>
                       ▼
┌── MIDDLEWARE CHAIN (runs in order) ──────────────┐
│  1. auth.js      → Verify JWT → sets req.user   │
│  2. apiLimiter   → Check IP rate (200/15min)     │
│  3. checkQuota   → Check daily usage count       │
│  4. upload.single('resume') → Parse PDF from     │
│     multipart body → sets req.file (Buffer)      │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌── ROUTE: analysis.routes.js → POST / ────────────┐
│  Step 1: Validate                                │
│    if (!req.file) → 400 "Upload a PDF"           │
│    if (!jobDescription) → 400 "JD required"      │
│                                                  │
│  Step 2: Extract text from PDF buffer            │
│    const pdfData = await pdf(req.file.buffer)    │
│    extractedText = pdfData.text                  │
│    if (empty) → 400 "Could not extract text"     │
│                                                  │
│  Step 3: Save to MongoDB                         │
│    new Analysis({                                │
│      userId, extractedResumeText, jobDescription,│
│      status: 'pending'                           │
│    }).save()                                     │
│                                                  │
│  Step 4: Queue BullMQ job                        │
│    queue.add('analyze', { analysisId })           │
│    → Job goes to Redis → worker.js picks it up   │
│                                                  │
│  Step 5: Immediate backup processing             │
│    setTimeout(() =>                               │
│      processAnalysisInBackground(...)            │
│    , 100)                                        │
│                                                  │
│  Step 6: Return immediately                      │
│    res.json({ analysisId, status: 'pending' })   │
└────────┬────────────────────────┬────────────────┘
         │                        │
         ▼                        ▼
┌── WORKER.JS ──────────┐  ┌── setTimeout BACKUP ──┐
│  Picks job from Redis  │  │  Runs inline after     │
│  Finds Analysis in DB  │  │  100ms delay           │
│  Calls analyzeResume() │  │  Calls analyzeResume() │
│  Updates MongoDB:      │  │  Updates MongoDB:      │
│  status='complete'     │  │  status='complete'     │
│  result={...}          │  │  result={...}          │
└────────────────────────┘  └────────────────────────┘
         │ (First to complete wins)
         ▼
┌── FRONTEND: Polling Loop ────────────────────────┐
│  pollStatus(analysisId) starts                   │
│                                                  │
│  Every 1.5 seconds:                              │
│    api.get(`/analyses/${id}`)                    │
│      → status: 'pending'?  → poll again          │
│      → status: 'processing'? → poll again        │
│      → status: 'complete'? → navigate to result  │
│      → status: 'failed'? → show error            │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌── FRONTEND: Result.jsx ──────────────────────────┐
│  useEffect() fetches analysis by ID              │
│  Renders: score gauge, keywords, bullets, chat   │
└──────────────────────────────────────────────────┘
```

---

### 🔄 Flow 4: AI Chat with Resume

```
User types message in ResumeChat + hits Enter
         │
         ▼
┌── FRONTEND: ResumeChat.jsx ──────────────────────┐
│  handleSend() fires                              │
│  Adds user message to local state                │
│  api.post(`/analyses/${id}/chat`, { message })   │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌── BACKEND: analysis.routes.js → POST /:id/chat ──┐
│  1. Find analysis record (verify ownership)      │
│  2. Call chatWithResume(                         │
│       resumeText, JD, analysisResult,            │
│       chatHistory, userMessage                   │
│     )                                            │
│  3. chatWithResume builds system prompt with:    │
│     - Full resume text                           │
│     - Job description                            │
│     - Previous match score & keywords            │
│     - Previous chat history                      │
│  4. Sends to Gemini AI (with model fallback)     │
│  5. Saves both messages to chatHistory array     │
│  6. Returns { reply, chatHistory }               │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌── FRONTEND: Updates messages state ──────────────┐
│  setMessages(res.data.chatHistory)               │
│  Auto-scrolls to bottom                          │
└──────────────────────────────────────────────────┘
```

---

## ═══════════════════════════════
## STEP 5 — EVERY TECHNOLOGY
## ═══════════════════════════════

### ⚛️ React (v19)

| Aspect | Detail |
|--------|--------|
| **What?** | JavaScript library for building user interfaces using components |
| **Why needed?** | Declarative UI: you describe WHAT the UI looks like, React handles HOW to update the DOM |
| **How it works internally?** | Uses a Virtual DOM — a lightweight copy of the real DOM. When state changes, React diffs the Virtual DOM against the real DOM and updates only what changed |
| **If removed?** | You'd write raw HTML + vanilla JavaScript with `document.getElementById()` — painful for dynamic UIs |
| **Alternatives** | Vue.js, Angular, Svelte, Solid.js |
| **Why chosen?** | Largest ecosystem, most job postings, huge community, React 19 has concurrent rendering |

---

### 🟢 Node.js (v22+)

| Aspect | Detail |
|--------|--------|
| **What?** | JavaScript runtime built on Chrome's V8 engine — lets you run JavaScript outside the browser |
| **Why needed?** | Allows writing both frontend AND backend in JavaScript (one language for everything) |
| **How it works internally?** | Single-threaded event loop with non-blocking I/O. Uses libuv for async operations (file I/O, network). When an async task completes, its callback is pushed to the event queue |
| **If removed?** | Need Python/Java/Go backend. Two different languages to maintain |
| **Alternatives** | Deno, Bun (JS runtimes); Python Flask, Java Spring, Go Gin (different languages) |
| **Why chosen?** | Same language as React frontend, npm ecosystem, non-blocking I/O perfect for API servers |

---

### 🚂 Express.js (v5)

| Aspect | Detail |
|--------|--------|
| **What?** | Minimal web framework for Node.js. Provides routing, middleware, and HTTP utilities |
| **Why needed?** | Raw Node.js `http.createServer()` requires writing response headers, body parsing, routing from scratch |
| **How it works internally?** | Maintains a stack of middleware functions. Each request flows through the stack top-to-bottom. Each middleware calls `next()` to pass control to the next one |
| **If removed?** | You'd need 100+ lines of boilerplate for basic routing and body parsing |
| **Alternatives** | Fastify (faster, schema-based), Koa (lighter, async-native), Hono, NestJS (TypeScript-first) |
| **Why chosen?** | Most popular, biggest community, simplest API, most tutorials/examples |

---

### 🍃 MongoDB + Mongoose

| Aspect | Detail |
|--------|--------|
| **What?** | **MongoDB** = NoSQL document database (stores JSON-like documents). **Mongoose** = ODM (Object Document Mapper) that adds schemas, validation, and methods |
| **Why needed?** | Store users, analyses, coding profiles. Schema-less flexibility means the `result` field can contain different structures as AI output evolves |
| **How it works internally?** | Documents (JSON objects) stored in collections (like tables). No fixed schema at DB level, but Mongoose enforces schemas in application code |
| **If removed?** | All data is lost on server restart |
| **Alternatives** | PostgreSQL (relational, strict schemas), MySQL, Firebase Firestore, Supabase |
| **Why chosen?** | Schema flexibility for AI outputs (JSON structure may change), free Atlas cloud tier, JavaScript-native (JSON in, JSON out), easy to prototype |

> **Why MongoDB over PostgreSQL for this project?**
> The AI analysis result is a nested JSON object with arrays of keywords, bullet objects, etc. In PostgreSQL, you'd need multiple related tables (analyses, keywords, bullets) with JOIN queries. MongoDB stores the entire result as a single nested document — simpler for this use case.

---

### 🔴 Redis + Upstash + BullMQ + ioredis

| Aspect | Detail |
|--------|--------|
| **What?** | **Redis** = In-memory key-value data store (extremely fast). **Upstash** = Serverless Redis hosting. **BullMQ** = Redis-based job queue. **ioredis** = Node.js Redis client |
| **Why needed?** | Queue AI analysis jobs for async processing; cache coding profile data |
| **How it works internally?** | BullMQ pushes jobs to a Redis list. Workers listen for new items. When a job arrives, the worker picks it up, processes it, and marks it complete |
| **If removed?** | Every analysis would block the HTTP thread. 10 simultaneous users would make the server unresponsive |
| **Alternatives** | RabbitMQ, AWS SQS, PostgreSQL-based queues (pg-boss), in-memory array (won't survive restarts) |
| **Why chosen?** | BullMQ is the most popular Node.js queue, Upstash offers free tier with zero config, Redis doubles as cache |

---

### 🔑 JWT (jsonwebtoken)

| Aspect | Detail |
|--------|--------|
| **What?** | JSON Web Token — a compact, self-contained token for authentication |
| **Why needed?** | Stateless authentication: server doesn't need to store sessions in memory or database |
| **How it works?** | Token has 3 parts: `base64(header).base64(payload).signature`. Server verifies signature using JWT_SECRET to confirm token wasn't tampered with |
| **If removed?** | Need server-side sessions (stored in Redis/DB), or cookie-based auth |
| **Alternatives** | Session cookies (with Redis store), OAuth2 access tokens, Passport.js sessions |
| **Why chosen?** | Stateless = no session storage needed, works seamlessly with REST APIs, scales horizontally |

---

### 🔒 bcrypt

| Aspect | Detail |
|--------|--------|
| **What?** | Password hashing library using the bcrypt algorithm |
| **Why needed?** | NEVER store plain-text passwords. If database is breached, hashed passwords can't be reversed |
| **How it works?** | Adds a random salt, then applies the Blowfish cipher multiple times (2^rounds). 10 rounds ≈ ~10ms per hash |
| **If removed?** | Database breach = all user passwords exposed in plain text |
| **Alternatives** | argon2 (newer, memory-hard), scrypt, PBKDF2 |
| **Why chosen?** | Battle-tested, widely used in Node.js, good balance of security vs. speed |

---

### 📎 Multer

| Aspect | Detail |
|--------|--------|
| **What?** | Middleware for handling `multipart/form-data` (file uploads) |
| **Why needed?** | Express doesn't parse file uploads natively. Multer extracts files from the request body |
| **Memory storage vs disk?** | This project uses `memoryStorage()` — file stays in RAM as a Buffer, not saved to disk |
| **If removed?** | Can't accept PDF file uploads |
| **Alternatives** | formidable, busboy (lower-level), express-fileupload |

---

### 🧠 Google Gemini AI (@google/genai)

| Aspect | Detail |
|--------|--------|
| **What?** | Google's generative AI model API. Gemini 2.0 Flash is used for fast, structured responses |
| **Why needed?** | The core intelligence — analyzes resume vs JD and provides match score, keywords, rewrites |
| **How it works?** | Send text prompt → Gemini processes with LLM → Returns structured JSON |
| **If removed?** | Falls back to basic keyword-matching (the `generateFallbackAnalysis()` function) |
| **Alternatives** | OpenAI GPT-4, Anthropic Claude, open-source LLMs (Llama, Mistral via Ollama) |
| **Why chosen?** | Generous free tier (15 req/min), native JSON output mode, fast response times |

---

### ⚡ Vite (v8)

| Aspect | Detail |
|--------|--------|
| **What?** | Next-generation frontend build tool and dev server |
| **Why needed?** | Bundling, transpiling JSX, hot module replacement (changes appear instantly without page reload) |
| **How it works?** | Dev: serves files as native ES modules (no bundling = instant startup). Build: uses Rollup for optimized production bundles |
| **If removed?** | Browsers can't directly understand JSX, Tailwind, or ES module imports |
| **Alternatives** | Webpack (slower, more config), Parcel, Turbopack, esbuild |
| **Why chosen?** | 10-100x faster than Webpack, zero config for React, official React template |

---

### 🎨 Tailwind CSS (v4)

| Aspect | Detail |
|--------|--------|
| **What?** | Utility-first CSS framework — style elements using class names directly |
| **Why needed?** | Rapid UI development without writing custom CSS files |
| **How it works?** | Scans your HTML/JSX for class names, generates only the CSS you actually use (tree-shaking) |
| **If removed?** | Need to write hundreds of lines of custom CSS |
| **Alternatives** | Bootstrap, Material UI, Chakra UI, plain CSS, CSS Modules, Styled Components |
| **Why chosen?** | Full design control (not opinionated like Bootstrap), tiny production bundle, great with React |

---

### 🔄 Axios

| Aspect | Detail |
|--------|--------|
| **What?** | Promise-based HTTP client for browser and Node.js |
| **Why needed?** | Make API calls from frontend to backend |
| **Key features used?** | `interceptors` (auto-attach JWT), `baseURL` (don't repeat server URL), `multipart/form-data` support |
| **If removed?** | Could use native `fetch()` but lose interceptors, auto JSON parsing, and error handling |
| **Alternatives** | Native `fetch()` API, ky, got (Node.js only), superagent |
| **Why chosen?** | Interceptors make JWT management trivial, better error handling than fetch |

---

## ═══════════════════════════════
## STEP 6 — INTERVIEW PREPARATION
## ═══════════════════════════════

### 🎯 Feature: Authentication

**Beginner:**

**Q: What is authentication vs authorization?**
> **A:** Authentication = "Who are you?" (verifying identity with email/password). Authorization = "What can you do?" (checking if user has permission to access a resource). In this project, JWT handles authentication; checking `userId` on analyses handles authorization (users can only see their own data).
> **What interviewers test:** Understanding of basic security concepts.

**Q: Where is the JWT token stored in this project?**
> **A:** In `localStorage`. It's set after login (`localStorage.setItem('token', token)`) and automatically attached to every API request via the Axios interceptor.
> **What interviewers test:** Understanding of client-side storage.

**Intermediate:**

**Q: How would you implement password reset functionality?**
> **A:** 1) User enters email → Backend generates a random token + stores it with expiry in DB → Sends email with reset link containing the token. 2) User clicks link → Frontend shows "new password" form. 3) Frontend POST /reset-password with token + new password → Backend verifies token hasn't expired → Updates passwordHash → Invalidates token.
> **What interviewers test:** End-to-end feature design thinking.

**Q: What happens if the JWT_SECRET is compromised?**
> **A:** An attacker could forge tokens for ANY user. Mitigation: 1) Rotate the secret immediately — all existing tokens become invalid. 2) Use different secrets for different token types. 3) Consider asymmetric keys (RS256) so only the server can sign.
> **What interviewers test:** Security awareness and incident response thinking.

**Senior:**

**Q: The current auth checks `localStorage` in App.jsx — this is evaluated once on render. What's the bug?**
> **A:** If the token EXPIRES while the user has the app open, they won't be redirected to login until they refresh. Fix: add an Axios response interceptor that catches 401 errors and redirects:
> ```javascript
> api.interceptors.response.use(res => res, err => {
>   if (err.response?.status === 401) {
>     localStorage.removeItem('token');
>     window.location.href = '/login';
>   }
>   return Promise.reject(err);
> });
> ```
> **What interviewers test:** Edge case thinking, production-readiness.

---

### 🎯 Feature: Resume Analysis

**Beginner:**

**Q: Why extract PDF text on the backend instead of the frontend?**
> **A:** 1) Security — processing untrusted files on the server isolates risk. 2) Consistency — same extraction library/version always used. 3) The text needs to go to the database and AI service, both on the backend.
> **What interviewers test:** Architecture reasoning.

**Intermediate:**

**Q: Explain the dual-path processing (BullMQ + setTimeout). Could they conflict?**
> **A:** Both paths try to update the same Analysis document. The first to complete sets `status: 'complete'` and saves the result. The second would either: (a) find the document already complete and skip, or (b) overwrite with an equivalent result. There's no conflict because both call the same `analyzeResume()` function. In practice, the setTimeout usually wins (runs in-process), and the worker finds it already complete.
> **What interviewers test:** Concurrency understanding, idempotency.

**Q: What would happen if a user uploads a scanned image PDF (no selectable text)?**
> **A:** `pdf-parse` would return empty text. The route checks: `if (!extractedText || extractedText.trim().length === 0)` and returns a 400 error: "Could not extract text from the PDF. Please ensure it is not a scanned image." To support scanned PDFs, you'd need OCR (Optical Character Recognition) like Tesseract.js or Google Vision API.
> **What interviewers test:** Edge case handling, real-world awareness.

**Senior:**

**Q: The AI service has a model fallback chain. How would you add observability to track which model was used and response latency?**
> **A:** 1) Add structured logging: `console.log(JSON.stringify({ model: modelName, latency: Date.now() - startTime, fallback: false }))`. 2) Send metrics to a monitoring service (Datadog, Prometheus). 3) Track fallback rates — if the primary model fails >5% of the time, alert the team. 4) Store the model name in the Analysis document for debugging.
> **What interviewers test:** Production engineering, observability mindset.

---

### 🎯 Feature: Background Processing (Queue System)

**Beginner:**

**Q: What is a message queue? Why not just process everything immediately?**
> **A:** A message queue is like a to-do list that multiple workers can pull tasks from. Think of a restaurant kitchen: when a customer orders food (HTTP request), the waiter writes the order on a ticket and puts it in the queue. The cook (worker) picks up tickets one at a time. The waiter doesn't wait in the kitchen — they go serve other customers.
> **What interviewers test:** Understanding async processing.

**Intermediate:**

**Q: What happens if the worker crashes mid-processing?**
> **A:** BullMQ marks the job as "active." If the worker crashes, after a timeout, BullMQ moves the job back to "waiting" so another worker instance can pick it up. The Analysis document stays in status "processing" — the worker checks status before processing, so duplicate work is handled.
> **What interviewers test:** Fault tolerance understanding.

**Senior:**

**Q: How would you handle rate limits from the Gemini API (e.g., 15 requests/minute)?**
> **A:** 1) Configure BullMQ `limiter: { max: 14, duration: 60000 }` to throttle job processing. 2) Use exponential backoff on 429 errors. 3) Queue priority — paid users get processed first. 4) Consider a token bucket algorithm at the service level.
> **What interviewers test:** Rate limiting strategies, distributed systems thinking.

---

### 🎯 Feature: AI Prompt Engineering

**Beginner:**

**Q: What is prompt engineering?**
> **A:** It's the art of crafting input text to an AI model to get the desired output. Like giving clear instructions to a very capable but literal assistant. Our SYSTEM_PROMPT tells Gemini: "You are an ATS expert. Respond ONLY with valid JSON matching this exact schema." Without good prompts, the AI might return conversational text instead of structured data.
> **What interviewers test:** AI literacy.

**Intermediate:**

**Q: Why does the system prompt say "respond ONLY with valid JSON"?**
> **A:** LLMs naturally respond conversationally: "Sure! Here's the analysis: ```json {...}```". This makes parsing unreliable. By enforcing JSON-only output (+ `responseMimeType: 'application/json'`), we get clean, parseable responses every time.
> **What interviewers test:** LLM integration patterns.

**Senior:**

**Q: How would you evaluate the quality of AI responses? How do you know the match scores are accurate?**
> **A:** 1) **Ground truth dataset:** Create 50+ resume-JD pairs with manually scored matches. Compare AI scores to human scores. 2) **A/B testing:** Show users two analyses (AI vs keyword-match) and collect feedback. 3) **Calibration:** If AI consistently scores 10% too high, add a correction factor. 4) **Prompt iteration:** Track user satisfaction metrics, refine prompts based on poor results.
> **What interviewers test:** ML evaluation methodology, product thinking.

---

### 🎯 Feature: Coding Profile Aggregator

**Beginner:**

**Q: How does the app fetch data from LeetCode/Codeforces without a password?**
> **A:** These platforms have public APIs or public profile pages. For example, LeetCode has a GraphQL API that returns stats for any username. No authentication needed because the data is publicly visible on their websites.
> **What interviewers test:** Understanding of public APIs.

**Intermediate:**

**Q: Why cache coding profile data in Redis for 6 hours?**
> **A:** 1) Rate limiting — platforms may block frequent requests. 2) Speed — Redis response is <1ms vs. 500ms+ for external API calls. 3) Cost — reduce API usage. 6 hours is a balance: long enough to avoid redundant fetches, short enough that data stays relatively fresh.
> **What interviewers test:** Caching strategy reasoning.

**Senior:**

**Q: What if one platform API is down but others work?**
> **A:** The code uses `Promise.allSettled()` instead of `Promise.all()`. `allSettled` waits for ALL promises to complete (whether fulfilled or rejected) and returns the result of each. So if LeetCode fails but GitHub succeeds, the user still sees their GitHub data. Each platform result independently records success/error.
> **What interviewers test:** Error handling patterns, graceful degradation.

---

### 🎯 General Architecture Questions

**Q: Explain the full tech stack of this project in 30 seconds.**
> **A:** "It's a full-stack application with a React 19 frontend built with Vite, Tailwind CSS for styling, and React Router for navigation. The backend is Node.js with Express, using MongoDB Atlas for data storage and Mongoose as the ODM. Authentication uses JWT tokens with bcrypt password hashing and Google OAuth. Resume PDFs are uploaded via Multer, parsed in-memory using pdf-parse, and queued for AI analysis via BullMQ backed by Upstash Redis. Google Gemini AI performs the resume-to-JD matching. The app is deployed on Render with a separate worker process."

**Q: What design patterns does this project use?**
> **A:**
> 1. **MVC** — Models (Mongoose schemas), Views (React components), Controllers (route handlers)
> 2. **Middleware Pattern** — Express middleware chain (auth → rateLimit → upload → handler)
> 3. **Strategy Pattern** — Multer storage strategy (memory vs disk vs cloud)
> 4. **Observer Pattern** — React's state management (setState triggers re-renders)
> 5. **Fallback/Chain of Responsibility** — AI model fallback chain
> 6. **Producer-Consumer** — BullMQ queue (routes produce jobs, worker consumes them)
> 7. **Singleton** — Redis connection instance, Axios instance

**Q: If you could improve one thing about this project, what would it be?**
> **A:** "I'd add TypeScript. The codebase has complex data structures (AI response objects, nested analysis results) that would benefit from type safety. TypeScript catches bugs at compile time — for example, accessing `result.matchScore` when `result` might be null. It also serves as documentation: function signatures clearly show what data flows in and out."
