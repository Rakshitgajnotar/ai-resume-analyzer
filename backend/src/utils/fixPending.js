require('dotenv').config();
const mongoose = require('mongoose');
const Analysis = require('../models/Analysis');
const { analyzeResume } = require('../services/ai.service');

async function fixPending() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const pending = await Analysis.find({ status: { $in: ['pending', 'processing'] } });
    console.log('Found pending analyses:', pending.length);

    for (const a of pending) {
      console.log('Processing analysis ID:', a._id.toString());
      try {
        const text = a.extractedResumeText || 'Software Engineer with experience in web development';
        const jd = a.jobDescription || 'Looking for SDE';
        const result = await analyzeResume(text, jd);

        a.result = result;
        a.status = 'complete';
        a.completedAt = new Date();
        await a.save();
        console.log('Successfully completed analysis ID:', a._id.toString());
      } catch (err) {
        console.error('Error completing analysis:', err.message);
      }
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    process.exit(0);
  }
}

fixPending();
