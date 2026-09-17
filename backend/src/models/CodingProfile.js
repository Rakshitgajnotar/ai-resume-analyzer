const mongoose = require('mongoose');

const PlatformDataSchema = new mongoose.Schema({
  linked: { type: Boolean, default: false },
  username: String,
  fetchedAt: Date,
  error: String,
  data: mongoose.Schema.Types.Mixed, // flexible for each platform's data shape
}, { _id: false });

const CodingProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  platforms: {
    leetcode: PlatformDataSchema,
    codeforces: PlatformDataSchema,
    codechef: PlatformDataSchema,
    gfg: PlatformDataSchema,
    github: PlatformDataSchema,
  },
  aggregated: {
    totalProblemsSolved: { type: Number, default: 0 },
    dsaTotals: {
      easy:   { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard:   { type: Number, default: 0 },
      expert: { type: Number, default: 0 },
    },
    bestContestRating: { type: Number, default: 0 },
    totalContestsAttended: { type: Number, default: 0 },
    githubTotalStars: { type: Number, default: 0 },
    githubTotalRepos: { type: Number, default: 0 },
    githubCurrentStreak: { type: Number, default: 0 },
  },
  lastFetchedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('CodingProfile', CodingProfileSchema);
