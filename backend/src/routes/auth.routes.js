const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;
    
    // Fallback to email prefix if Google doesn't provide a name
    const userName = name || email.split('@')[0];
    
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ name: userName, email, googleId });
      await user.save();
    } else if (!user.googleId) {
      // If user exists but no googleId, link it
      user.googleId = googleId;
      if (!user.name) user.name = userName;
      await user.save();
    }
    
    const jwtSecret = process.env.JWT_SECRET || 'fallback_jwt_secret_key_change_in_production';
    const jwtToken = jwt.sign(
      { id: user._id, email: user.email },
      jwtSecret,
      { expiresIn: '7d' }
    );
    res.json({ token: jwtToken, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(500).json({ error: 'Google login failed' });
  }
});

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: 'User already registered.' });

    user = new User({ name, email, passwordHash: password }); // pre-save hook will hash it
    await user.save();

    const jwtSecret = process.env.JWT_SECRET || 'fallback_jwt_secret_key_change_in_production';
    const token = jwt.sign(
      { id: user._id, email: user.email },
      jwtSecret,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or password.' });

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) return res.status(400).json({ error: 'Invalid email or password.' });

    const jwtSecret = process.env.JWT_SECRET || 'fallback_jwt_secret_key_change_in_production';
    const token = jwt.sign(
      { id: user._id, email: user.email },
      jwtSecret,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/usage', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Quick reset logic if they just fetch usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let lastReset = user.usage.lastResetDate;
    if (!lastReset) {
      lastReset = new Date(0);
    }
    lastReset.setHours(0, 0, 0, 0);

    if (today > lastReset) {
      user.usage.analysesToday = 0;
      user.usage.lastResetDate = new Date();
      await user.save();
    }

    res.json({
      analysesToday: user.usage.analysesToday,
      limit: 'Unlimited',
      planTier: user.planTier
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
