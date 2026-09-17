const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are a senior ATS (Applicant Tracking System) screening expert and technical recruiter. 
Analyze the candidate's resume text against the target job description (or role title).
Provide a detailed, highly structured evaluation.

Respond ONLY with valid JSON matching exactly this schema:
{
  "matchScore": <integer 0-100 score representing ATS fit percentage>,
  "matchedKeywords": [<array of skills, technologies, and qualifications found in both resume & job description>],
  "missingKeywords": [<array of essential skills, tools, or requirements missing from the resume>],
  "whatCanBeAdded": [<array of 3 border-breaking actionable skills, certifications, metrics, or sections to add to boost the match>],
  "strengths": [<array of 3-4 strong parts, standout accomplishments, or core technical capabilities in the resume>],
  "weaknesses": [<array of 3-4 weak parts, vague bullet points, missing metrics, or skill gaps>],
  "suggestedBullets": [
    {
      "original": <original line or sentence from candidate resume>,
      "improved": <quantified, high-impact rewrite with strong action verbs & metrics>,
      "reason": <explanation of why this rewrite improves ATS score>
    }
  ],
  "summary": <detailed 2-3 sentence executive evaluation summary>
}

Note: If the job description is short (e.g. "SDE", "Frontend Engineer", "Fullstack Developer"), infer standard industry requirements for that role and evaluate the resume accordingly.`;

// Role-based keyword expectations dictionary for short JD inputs like "SDE", "Frontend", etc.
const ROLE_EXPECTATIONS = {
  sde: ['DATA STRUCTURES', 'ALGORITHMS', 'SYSTEM DESIGN', 'OOP', 'JAVA', 'C++', 'PYTHON', 'GIT', 'SQL', 'PROBLEM SOLVING'],
  frontend: ['REACT', 'JAVASCRIPT', 'TYPESCRIPT', 'HTML', 'CSS', 'TAILWIND', 'REDUX', 'REST API', 'PERFORMANCE OPTIMIZATION'],
  backend: ['NODE.JS', 'EXPRESS', 'MONGODB', 'SQL', 'REST API', 'SYSTEM DESIGN', 'DOCKER', 'AWS', 'REDIS'],
  fullstack: ['REACT', 'NODE.JS', 'JAVASCRIPT', 'TYPESCRIPT', 'MONGODB', 'REST API', 'GIT', 'HTML', 'CSS']
};

function generateFallbackAnalysis(resumeText, jobDescription) {
  const resumeLower = resumeText.toLowerCase();
  const jdLower = jobDescription.toLowerCase();

  // Determine standard expectation keywords
  let targetKeywords = [
    'react', 'node.js', 'express', 'mongodb', 'javascript', 'typescript', 'python',
    'java', 'c++', 'sql', 'docker', 'aws', 'git', 'rest api', 'graphql',
    'system design', 'agile', 'data structures', 'algorithms'
  ];

  if (jdLower.includes('sde') || jdLower.includes('software engineer') || jdLower.includes('developer')) {
    targetKeywords = ['data structures', 'algorithms', 'system design', 'react', 'node.js', 'javascript', 'c++', 'java', 'sql', 'git', 'rest api'];
  } else if (jdLower.includes('frontend')) {
    targetKeywords = ['react', 'javascript', 'typescript', 'html', 'css', 'redux', 'rest api', 'tailwind'];
  } else if (jdLower.includes('backend')) {
    targetKeywords = ['node.js', 'express', 'mongodb', 'sql', 'rest api', 'system design', 'docker', 'redis'];
  }

  const matched = [];
  const missing = [];

  for (const kw of targetKeywords) {
    if (resumeLower.includes(kw)) {
      matched.push(kw.toUpperCase());
    } else {
      missing.push(kw.toUpperCase());
    }
  }

  const matchScore = Math.min(96, Math.max(65, Math.round((matched.length / targetKeywords.length) * 100)));

  return {
    matchScore,
    matchedKeywords: matched.slice(0, 8),
    missingKeywords: missing.slice(0, 5),
    whatCanBeAdded: [
      missing.length > 0 ? `Add explicit project or work experience mentioning ${missing.slice(0, 2).join(' and ')}.` : 'Add a dedicated Core Competencies section at the top of your resume.',
      'Quantify your accomplishments using metrics (e.g., "Increased performance by 40%", "Handled 10k+ daily users").',
      'Include links to active GitHub repositories or live deployed demo projects.'
    ],
    strengths: [
      `Demonstrates strong core skills in ${matched.slice(0, 3).join(', ')} matching expected engineering benchmarks`,
      'Solid project foundation with relevant modern software tools and frameworks',
      'Clean structure with clear technical skills section'
    ],
    weaknesses: [
      missing.length > 0 ? `Lacks explicitly listed experience in ${missing.slice(0, 2).join(' & ')} required for this target role` : 'Bullet points lack quantifiable metrics and percentage improvements',
      'Descriptions focus on duties rather than measurable results and business impact'
    ],
    suggestedBullets: [
      {
        original: 'Worked on software development and building features using web technologies',
        improved: 'Engineered high-performance software modules using ' + (matched[0] || 'React') + ' & ' + (matched[1] || 'Node.js') + ', improving user response times by 35%.',
        reason: 'Adds measurable quantitative impact and strong technical verb phrasing.'
      },
      {
        original: 'Created REST API endpoints and integrated database queries',
        improved: 'Designed scalable RESTful microservices and optimized database queries, reducing average API response latency by 42%.',
        reason: 'Demonstrates active technical leadership and quantitative performance optimizations expected in ATS resume screeners.'
      }
    ],
    summary: `Your resume demonstrates strong technical alignment for SDE/Software Development roles (${matchScore}% match). You show solid coverage in ${matched.slice(0, 4).join(', ')}. Incorporating missing keywords like ${missing.slice(0, 2).join(', ')} and adding metrics will maximize your ATS pass rates.`
  };
}

async function analyzeResume(resumeText, jobDescription) {
  const userPrompt = `TARGET JOB DESCRIPTION / ROLE:\n"""\n${jobDescription}\n"""\n\nCANDIDATE RESUME TEXT:\n"""\n${resumeText}\n"""`;

  const modelsToTry = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: userPrompt,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: 'application/json'
        }
      });

      let rawText = response.text;
      if (rawText) {
        if (rawText.startsWith('```json')) {
          rawText = rawText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        }
        return JSON.parse(rawText);
      }
    } catch (err) {
      console.warn(`Gemini model ${modelName} call missed (${err.message}). Trying next fallback...`);
    }
  }

  // Fallback ATS engine
  console.log('Using role-aware fallback ATS matcher engine...');
  return generateFallbackAnalysis(resumeText, jobDescription);
}

async function chatWithResume(resumeText, jobDescription, result, chatHistory = [], userMessage) {
  const systemInstruction = `You are ProfileIQ AI, an elite ATS screening consultant, technical career coach, and resume strategist.
Your task is to help the candidate optimize their resume, understand their job match, answer interview prep questions, and provide actionable advice.

You have access to the candidate's exact resume, the target job description, and the AI evaluation report.

CANDIDATE RESUME:
"""
${resumeText || 'Not provided'}
"""

TARGET JOB DESCRIPTION:
"""
${jobDescription || 'Not provided'}
"""

AI EVALUATION SUMMARY & METRICS:
- ATS Match Score: ${result?.matchScore || 'N/A'}%
- Matched Skills: ${result?.matchedKeywords?.join(', ') || 'None'}
- Missing Skills: ${result?.missingKeywords?.join(', ') || 'None'}
- Key Strengths: ${result?.strengths?.join('; ') || 'None'}
- Weaknesses / Gaps: ${result?.weaknesses?.join('; ') || 'None'}

CONVERSATION RULES:
1. Provide concise, clear, and direct answers in markdown format.
2. Give specific, actionable advice referencing their actual skills, projects, and missing keywords.
3. If asked to rewrite bullet points, provide high-impact, quantified versions with metrics and strong action verbs.
4. Keep a helpful, professional, encouraging, and highly technical tone.`;

  let historyPrompt = '';
  if (chatHistory && chatHistory.length > 0) {
    historyPrompt = '\n\nPAST CONVERSATION HISTORY:\n' + chatHistory.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n') + '\n';
  }

  const prompt = `${historyPrompt}\nUSER QUESTION:\n${userMessage}\n\nProvide a helpful, precise answer as ProfileIQ AI:`;

  const modelsToTry = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
        }
      });

      if (response && response.text) {
        return { text: response.text.trim(), isFallback: false };
      }
    } catch (err) {
      if (err.status === 429 || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED')) {
        console.error(`[Gemini API Quota Exhausted] Model ${modelName}:`, err.message);
      } else {
        console.warn(`Gemini chat model ${modelName} call missed (${err.message}). Trying next fallback...`);
      }
    }
  }

  // Intelligent Context-Aware Fallback Responder
  console.log('[ProfileIQ Chat] AI models unavailable/exhausted, using context-aware local fallback');
  const msgLower = userMessage.toLowerCase();
  const missing = result?.missingKeywords || [];
  const matched = result?.matchedKeywords || [];
  const score = result?.matchScore || 75;
  const strengths = result?.strengths || [];
  const weaknesses = result?.weaknesses || [];
  const whatCanBeAdded = result?.whatCanBeAdded || [];
  const summary = result?.summary || '';
  const suggestedBullets = result?.suggestedBullets || [];

  let fallbackText = '';

  // 1. Summary / Overview / Details
  if (msgLower.includes('summary') || msgLower.includes('overview') || msgLower.includes('detail') || msgLower.includes('tell me about') || msgLower.includes('describe')) {
    fallbackText = `### 📋 ProfileIQ Executive Resume Summary

${summary ? `*${summary}*` : `Your resume scores **${score}%** ATS fit for this role.`}

- **Match Rating:** ${score >= 80 ? '🟢 Tier-1 Match (Strong Candidate)' : score >= 60 ? '🟡 Tier-2 Match (Competitive with minor additions)' : '🔴 Tier-3 Match (Needs Keyword & Metric Optimization)'}
- **Core Matched Skills:** ${matched.slice(0, 5).join(', ') || 'General engineering fundamentals'}
- **Priority Gaps:** ${missing.slice(0, 3).join(', ') || 'None identified'}`;
  }
  // 2. Review / Rating / Evaluation / Is it good / Feedback
  else if (msgLower.includes('good') || msgLower.includes('review') || msgLower.includes('rate') || msgLower.includes('evaluat') || msgLower.includes('feedback') || msgLower.includes('grade') || msgLower.includes('suitable')) {
    const grade = score >= 85 ? 'A+' : score >= 75 ? 'A' : score >= 65 ? 'B' : 'C';
    fallbackText = `### 📊 Resume Evaluation & Grade: **${grade}** (${score}% ATS Match)

${score >= 75 ? '✅ **Verdict:** Your resume is strong and well-positioned for recruiter screening.' : '⚠️ **Verdict:** Your resume is decent but missing key role-specific keywords that ATS filters scan for.'}

**Top Highlights:**
${strengths.slice(0, 2).map(s => `- ${s}`).join('\n') || '- Clean technical skills foundation'}

**Critical Next Action:**
- ${whatCanBeAdded[0] || `Add missing keywords (${missing.slice(0, 3).join(', ')}) to your experience bullet points.`}`;
  }
  // 3. What to add / Recommendations / Improvements / Action Items
  else if (msgLower.includes('add') || msgLower.includes('recommend') || msgLower.includes('suggestion') || msgLower.includes('action') || msgLower.includes('boost')) {
    fallbackText = `### 🚀 Recommended Additions to Boost Your Resume

Here are the top high-impact items to add to your resume right now:

${whatCanBeAdded.map((item, idx) => `**${idx + 1}.** ${item}`).join('\n\n') || `1. Include missing keywords: **${missing.join(', ')}**\n2. Add quantifiable metrics to project descriptions.`}`;
  }
  // 4. Skills / Tech Stack / Matched vs Missing
  else if (msgLower.includes('skill') || msgLower.includes('tech') || msgLower.includes('tool') || msgLower.includes('stack') || msgLower.includes('language')) {
    fallbackText = `### 🛠️ Skills Analysis for Target Role

- **✅ Matched Keywords (${matched.length}):**
  ${matched.length > 0 ? matched.map(m => `\`${m}\``).join(', ') : 'None identified'}

- **❌ Missing Target Keywords (${missing.length}):**
  ${missing.length > 0 ? missing.map(m => `\`${m}\``).join(', ') : 'None — core skills are fully covered!'}

💡 *Tip:* Highlight missing keywords in your **Technical Skills** header and active project descriptions.`;
  }
  // 5. Strengths Queries
  else if (msgLower.includes('strength') || msgLower.includes('standout') || msgLower.includes('positive') || msgLower.includes('best part')) {
    fallbackText = `### 💪 Key Strengths Identified in Your Resume

${strengths.map((s, i) => `**${i + 1}.** ${s}`).join('\n') || '- Solid overall structure and modern engineering tool stack.'}`;
  }
  // 6. Weaknesses / Gaps Queries
  else if (msgLower.includes('weak') || msgLower.includes('gap') || msgLower.includes('flaw') || msgLower.includes('issue') || msgLower.includes('lack')) {
    fallbackText = `### ⚠️ Areas for Improvement & Gaps

${weaknesses.map((w, i) => `**${i + 1}.** ${w}`).join('\n') || '- Bullet points need more quantifiable metrics (e.g. % speedup, user scale).'}`;
  }
  // 7. Projects & Portfolio Recommendations
  else if (msgLower.includes('project') || msgLower.includes('build') || msgLower.includes('portfolio') || msgLower.includes('repo') || msgLower.includes('github')) {
    const missingStr = missing.length > 0 ? missing.slice(0, 3).join(', ') : 'cloud microservices';
    const mainTech = matched[0] || 'Full-Stack Development';

    fallbackText = `### 💡 Portfolio Projects Tailored to Fill Your Skill Gaps

1. **Full-Stack ${missing[0] || 'Cloud API'} Platform**:
   - Combine **${mainTech}** with missing target skills: **${missingStr}**.
   - Feature automated testing, database indexing, and user auth.

2. **Microservice with ${missing[1] || 'REST & Redis'}**:
   - Lightweight microservice featuring caching, rate-limiting, and Docker.

💡 *Resume Tip:* Phrase project bullets with impact: *"Engineered scalable backend service using ${missing[0] || 'Node.js'}, reducing API latency by 35%."*`;
  }
  // 8. Bullet Point Rewrites & Phrasing
  else if (msgLower.includes('bullet') || msgLower.includes('rewrite') || msgLower.includes('experience') || msgLower.includes('phrase') || msgLower.includes('work') || msgLower.includes('point')) {
    const suggested = suggestedBullets[0];
    if (suggested) {
      fallbackText = `### 📝 Customized Bullet Point Rewrite

**Original Bullet:**
> "${suggested.original}"

**ATS-Optimized Version:**
> "${suggested.improved}"

💡 *Why this works:* ${suggested.reason}`;
    } else {
      fallbackText = `### 📝 How to Rewrite Bullets (Google XYZ Formula)

Use: **“Accomplished [X], as measured by [Y], by doing [Z]”**

**Example Rewrite:**
- *"Engineered high-concurrency modules using ${matched[0] || 'React'} and ${matched[1] || 'Node.js'}, reducing API latency by 42% and serving 10,000+ daily active users."*`;
    }
  }
  // 9. Interview Preparation
  else if (msgLower.includes('interview') || msgLower.includes('question') || msgLower.includes('prep') || msgLower.includes('round') || msgLower.includes('hiring')) {
    fallbackText = `### 🎯 Expected Technical Interview Questions

Based on your resume and target role:

1. **Stack Deep-Dive:** *"Walk us through how you built features using ${matched[0] || 'your core stack'} and handled edge cases."*
2. **Skill Gap Strategy:** *"How do you quickly learn and deploy missing tools like ${missing[0] || 'new cloud services'} in production?"*
3. **Performance Optimization:** *"How do you measure and optimize API latency or database queries under load?"*`;
  }
  // 10. Formatting / ATS Layout / Structure
  else if (msgLower.includes('format') || msgLower.includes('layout') || msgLower.includes('parser') || msgLower.includes('template') || msgLower.includes('pdf') || msgLower.includes('structure')) {
    fallbackText = `### 📄 ATS Layout & Formatting Guidelines

- **Single-Column Layout:** Always use a single-column layout so ATS parsers read sections top-to-bottom accurately.
- **Standard Section Headers:** Use standard headers like \`Work Experience\`, \`Projects\`, \`Technical Skills\`, and \`Education\`.
- **File Format:** Export as clean PDF or DOCX without tables, graphics, or text boxes inside headers/footers.`;
  }
  // 11. Dynamic Tailored Response (Unique Default Fallback)
  else {
    fallbackText = `### 💡 ProfileIQ Contextual Analysis

*Regarding: "${userMessage.trim()}"*

Based on your candidate profile for this target role:
- **Current ATS Match Score:** **${score}%**
- **Strongest Matched Skills:** ${matched.slice(0, 4).join(', ') || 'Core technical stack'}
- **Primary Missing Keywords:** ${missing.slice(0, 3).join(', ') || 'None — strong coverage'}

**Recommended Focus:**
${whatCanBeAdded[0] || `Add missing keywords (${missing.slice(0, 2).join(', ')}) into your experience bullet points to maximize your ATS pass rate.`}

*Feel free to ask for specific bullet point rewrites, project ideas, or interview prep questions!*`;
  }

  return { text: fallbackText, isFallback: true };
}

async function optimizeBulletPoint(bulletText, targetRole = 'Software Engineer') {
  const prompt = `You are a world-class technical resume editor. 
Original Bullet Point: "${bulletText}"
Target Role/Context: "${targetRole}"

Generate 3 distinct high-impact ATS bullet point rewrites responding in JSON format:
{
  "original": "${bulletText}",
  "variations": [
    {
      "label": "Metrics & Impact (Google XYZ)",
      "bullet": "quantified bullet with metrics like %, latency reduction, user counts",
      "reason": "why this bullet stands out"
    },
    {
      "label": "Technical & Architecture Depth",
      "bullet": "bullet highlighting system architecture, microservices, frameworks",
      "reason": "why this bullet demonstrates technical depth"
    },
    {
      "label": "Leadership & Business Value",
      "bullet": "bullet highlighting ownership, cross-functional impact, delivery",
      "reason": "why this bullet demonstrates leadership"
    }
  ]
}`;

  const modelsToTry = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      if (response && response.text) {
        let rawText = response.text;
        if (rawText.startsWith('```json')) {
          rawText = rawText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        }
        return JSON.parse(rawText);
      }
    } catch (err) {
      console.warn(`Bullet optimizer model ${modelName} call failed (${err.message}). Trying fallback...`);
    }
  }

  // Fallback
  return {
    original: bulletText,
    variations: [
      {
        label: 'Metrics & Impact (Google XYZ)',
        bullet: `Engineered high-performance modules for "${bulletText}", reducing latency by 35% and improving throughput for 10,000+ users.`,
        reason: 'Quantifies performance gains using measurable impact metrics.'
      },
      {
        label: 'Technical & Architecture Depth',
        bullet: `Architected scalable microservice endpoints for "${bulletText}" using RESTful APIs, caching, and automated unit testing.`,
        reason: 'Highlights software architecture and engineering best practices.'
      },
      {
        label: 'Leadership & Business Value',
        bullet: `Led end-to-end development of "${bulletText}", collaborating across teams to accelerate feature delivery by 2 weeks.`,
        reason: 'Demonstrates project ownership and cross-functional leadership.'
      }
    ]
  };
}

module.exports = {
  analyzeResume,
  chatWithResume,
  optimizeBulletPoint
};
