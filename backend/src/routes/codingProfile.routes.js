const express = require('express');
const router = express.Router();
const {
  fetchCodingProfile,
  getCodingProfile,
  deleteCodingProfile,
  previewUrl,
} = require('../controllers/codingProfile.controller');

// POST /api/coding-profile/fetch — Fetch fresh stats from all provided platform URLs
router.post('/fetch', fetchCodingProfile);

// GET /api/coding-profile — Get saved coding profile from DB
router.get('/', getCodingProfile);

// DELETE /api/coding-profile — Delete saved coding profile
router.delete('/', deleteCodingProfile);

// GET /api/coding-profile/preview?url=<url> — Preview/validate a single URL
router.get('/preview', previewUrl);

module.exports = router;
