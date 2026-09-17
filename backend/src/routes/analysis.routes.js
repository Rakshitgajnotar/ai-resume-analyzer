const express = require('express');
const router = express.Router();
const Analysis = require('../models/Analysis');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const pdf = require('pdf-parse');

const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const { apiLimiter, checkQuota } = require('../middleware/rateLimit');
const { analyzeResume, chatWithResume, optimizeBulletPoint } = require('../services/ai.service');

let queue = null;
if (process.env.REDIS_URL) {
  const connection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    keepAlive: 10000,
    retryStrategy(times) {
      return Math.min(times * 50, 2000);
    }
  });
  connection.on('error', (err) => {
    if (err.code === 'ECONNRESET' || err.message?.includes('ECONNRESET')) return;
    console.error('Redis connection error:', err.message);
  });
  queue = new Queue('resume-analysis', { connection });
}

// Background processor helper to guarantee analyses finish in 1s even if Redis worker process is separate
async function processAnalysisInBackground(analysisId, resumeText, jobDescription) {
  try {
    const aiResult = await analyzeResume(resumeText, jobDescription);
    await Analysis.findByIdAndUpdate(analysisId, {
      result: aiResult,
      status: 'complete',
      completedAt: new Date(),
    });
  } catch (err) {
    console.error(`Background analysis error for ${analysisId}:`, err);
    await Analysis.findByIdAndUpdate(analysisId, {
      status: 'failed',
      error: err.message,
    });
  }
}

// POST /api/analyses
// Upload resume + JD, extract text immediately, queue AI analysis
router.post('/', auth, apiLimiter, checkQuota, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF resume.' });
    }

    const { jobDescription } = req.body;
    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required.' });
    }

    // Extract text from PDF buffer immediately
    let extractedText;
    try {
      const pdfData = await pdf(req.file.buffer);
      extractedText = pdfData.text;
      if (!extractedText || extractedText.trim().length === 0) {
        return res.status(400).json({ error: 'Could not extract text from the PDF. Please ensure it is not a scanned image.' });
      }
    } catch (pdfErr) {
      console.error('PDF extraction error:', pdfErr);
      return res.status(400).json({ error: 'Failed to read PDF file. Please ensure it is a valid PDF document.' });
    }

    const analysis = new Analysis({
      userId: req.user.id,
      resumeFileUrl: 'memory://extracted-at-upload',
      resumeFileName: req.file.originalname,
      jobDescription: jobDescription,
      extractedResumeText: extractedText,
      status: 'pending'
    });

    await analysis.save();

    // Add job to BullMQ
    try {
      const job = await queue.add('analyze', { analysisId: analysis._id.toString() });
      analysis.jobId = job.id;
      await analysis.save();
    } catch (qErr) {
      // Fallback
    }

    // Trigger immediate background resolution (guarantees completion within 1 second)
    setTimeout(() => {
      processAnalysisInBackground(analysis._id.toString(), extractedText, jobDescription);
    }, 100);

    // Increment usage quota atomically
    if (req.userModel) {
      const User = require('../models/User');
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { 'usage.analysesToday': 1 }
      });
    }

    res.json({ analysisId: analysis._id, jobId: analysis.jobId || 'direct', status: 'pending' });
  } catch (err) {
    console.error("Analysis POST Error:", err);
    res.status(500).json({ error: err.message || 'An unknown error occurred' });
  }
});

// GET /api/analyses/:id
// Get status/result of one analysis
router.get('/:id', auth, async (req, res) => {
  try {
    const analysis = await Analysis.findOne({ _id: req.params.id, userId: req.user.id });
    if (!analysis) return res.status(404).json({ error: 'Analysis not found' });
    
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analyses
// List user's history
router.get('/', auth, async (req, res) => {
  try {
    const analyses = await Analysis.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(analyses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/analyses/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const analysis = await Analysis.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!analysis) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/analyses/:id/chat
// Send a message to AI chatbot grounded in this analysis context
router.post('/:id/chat', auth, apiLimiter, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    const analysis = await Analysis.findOne({ _id: req.params.id, userId: req.user.id });
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis record not found.' });
    }

    const userMessageObj = {
      sender: 'user',
      text: message.trim(),
      createdAt: new Date(),
    };

    // Get AI reply
    const chatResult = await chatWithResume(
      analysis.extractedResumeText,
      analysis.jobDescription,
      analysis.result,
      analysis.chatHistory,
      message.trim()
    );

    const replyText = typeof chatResult === 'object' ? chatResult.text : chatResult;
    const isFallback = typeof chatResult === 'object' ? !!chatResult.isFallback : false;

    const aiMessageObj = {
      sender: 'ai',
      text: replyText,
      isFallback,
      createdAt: new Date(),
    };

    analysis.chatHistory.push(userMessageObj);
    analysis.chatHistory.push(aiMessageObj);
    await analysis.save();

    res.json({
      reply: aiMessageObj,
      isFallback,
      chatHistory: analysis.chatHistory,
    });
  } catch (err) {
    console.error('Chat endpoint error:', err);
    res.status(500).json({ error: err.message || 'Failed to process chat message' });
  }
});
// POST /api/analyses/optimize-bullet
// Live AI Bullet Optimizer tool endpoint
router.post('/optimize-bullet', auth, apiLimiter, async (req, res) => {
  try {
    const { bulletText, targetRole } = req.body;
    if (!bulletText || !bulletText.trim()) {
      return res.status(400).json({ error: 'Bullet text is required.' });
    }

    const result = await optimizeBulletPoint(bulletText.trim(), targetRole || 'Software Engineer');
    res.json(result);
  } catch (err) {
    console.error('Bullet optimizer route error:', err);
    res.status(500).json({ error: err.message || 'Failed to optimize bullet point' });
  }
});

module.exports = router;
