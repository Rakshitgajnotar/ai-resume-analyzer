const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobId: { type: String }, // BullMQ job id
  status: { type: String, enum: ['pending', 'processing', 'complete', 'failed'], default: 'pending' },
  resumeFileUrl: { type: String, required: true },
  resumeFileName: { type: String },
  jobDescription: { type: String, required: true },
  extractedResumeText: { type: String },
  result: {
    matchScore: Number,
    matchedKeywords: [String],
    missingKeywords: [String],
    whatCanBeAdded: [String],
    strengths: [String],
    weaknesses: [String],
    gaps: [String],
    suggestedBullets: [{
      original: String,
      improved: String,
      reason: String
    }],
    summary: String
  },
  error: String,
  chatHistory: [{
    sender: { type: String, enum: ['user', 'ai'], required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  completedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Analysis', analysisSchema);
