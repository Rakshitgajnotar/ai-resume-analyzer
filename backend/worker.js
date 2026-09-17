require('dotenv').config();
const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const IORedis = require('ioredis');
const Analysis = require('./src/models/Analysis');
const { analyzeResume } = require('./src/services/ai.service');

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resume')
  .then(() => console.log('Worker connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  keepAlive: 10000,
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  }
});
connection.on('error', (err) => {
  if (err.code === 'ECONNRESET' || err.message?.includes('ECONNRESET')) return;
  console.error('Worker Redis error:', err.message);
});

console.log('Worker started. Listening for jobs on "resume-analysis" queue...');

const worker = new Worker('resume-analysis', async (job) => {
  const { analysisId } = job.data;
  console.log(`Processing job for analysis ${analysisId}`);
  
  const analysis = await Analysis.findById(analysisId);
  if (!analysis) throw new Error('Analysis not found');

  analysis.status = 'processing';
  await analysis.save();

  try {
    // Text was already extracted during upload — no need to download PDF
    const text = analysis.extractedResumeText;
    if (!text || text.trim().length === 0) {
      throw new Error('No resume text available for analysis');
    }

    // Analyze using AI
    console.log(`Analyzing resume with Gemini...`);
    const aiResult = await analyzeResume(text, analysis.jobDescription);
    
    // Save Results
    analysis.result = aiResult;
    analysis.status = 'complete';
    analysis.completedAt = new Date();
    await analysis.save();
    console.log(`Job complete for analysis ${analysisId}`);
  } catch (err) {
    console.error(`Job failed for analysis ${analysisId}:`, err);
    analysis.status = 'failed';
    analysis.error = err.message;
    await analysis.save();
    throw err; // Let BullMQ know it failed
  }
}, { connection });

worker.on('failed', (job, err) => {
  console.log(`Job ${job.id} has failed with ${err.message}`);
});
