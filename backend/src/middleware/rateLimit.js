const rateLimit = require('express-rate-limit');
const User = require('../models/User');

// 1. Request-level IP Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased limit for dev & testing (200 requests per 15 mins)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

// 2. Business-level User Quota Check
const checkQuota = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let lastReset = user.usage?.lastResetDate;
    if (!lastReset) {
      lastReset = new Date(0);
    } else {
      lastReset = new Date(lastReset);
    }
    lastReset.setHours(0, 0, 0, 0);

    // If it's a new day, reset the count atomically
    if (today > lastReset) {
      await User.findByIdAndUpdate(req.user.id, {
        'usage.analysesToday': 0,
        'usage.lastResetDate': new Date()
      });
      // Refresh the user object
      const refreshed = await User.findById(req.user.id);
      req.userModel = refreshed;
    } else {
      req.userModel = user;
    }

    const currentUsage = req.userModel.usage?.analysesToday || 0;
    // Limit removed for unlimited testing
    // const DAILY_LIMIT = (req.userModel.planTier === 'pro') ? 50 : 5;

    next();
  } catch (err) {
    console.error('checkQuota error:', err);
    res.status(500).json({ error: 'Error checking quota' });
  }
};

module.exports = {
  apiLimiter,
  checkQuota
};
