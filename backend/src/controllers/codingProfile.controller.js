const { parseProfileInput } = require('../utils/urlParser');
const { fetchLeetCodeStats } = require('../services/platforms/leetcode.service');
const { fetchCodeforcesStats } = require('../services/platforms/codeforces.service');
const { fetchCodeChefStats } = require('../services/platforms/codechef.service');
const { fetchGFGStats } = require('../services/platforms/gfg.service');
const { fetchGitHubStats } = require('../services/platforms/github.service');
const CodingProfile = require('../models/CodingProfile');
const redis = require('../config/redis');

const FETCHER_MAP = {
  leetcode:   fetchLeetCodeStats,
  codeforces: fetchCodeforcesStats,
  codechef:   fetchCodeChefStats,
  gfg:        fetchGFGStats,
  github:     fetchGitHubStats,
};

const CACHE_TTL_SECONDS = 6 * 60 * 60; // 6 hours
const RATE_LIMIT_TTL = 30 * 60;         // 30 minutes

/**
 * POST /api/coding-profile/fetch
 */
async function fetchCodingProfile(req, res) {
  try {
    const { urls, profiles, forceRefresh = false } = req.body;
    const userId = req.user._id?.toString?.() ?? req.user.id?.toString?.();
    const cacheKey = `coding:${userId}`;
    const rateLimitKey = `coding:ratelimit:${userId}`;

    // Collect items: { platform, input }
    const itemsToProcess = [];

    if (profiles && typeof profiles === 'object') {
      for (const [plat, val] of Object.entries(profiles)) {
        if (val && typeof val === 'string' && val.trim()) {
          itemsToProcess.push({ platform: plat, input: val.trim() });
        }
      }
    }

    if (urls && Array.isArray(urls)) {
      for (const u of urls) {
        if (u && typeof u === 'string' && u.trim()) {
          itemsToProcess.push({ platform: null, input: u.trim() });
        }
      }
    }

    if (itemsToProcess.length === 0) {
      return res.status(400).json({ success: false, error: 'Please provide at least one platform username or URL' });
    }

    const parsed = [];
    const parseErrors = [];
    const seenPlatforms = new Set();

    for (const item of itemsToProcess) {
      const result = parseProfileInput(item.input, item.platform);
      if (result.error) {
        parseErrors.push({ input: item.input, error: result.error });
      } else if (result.platform === 'atcoder') {
        parseErrors.push({ input: item.input, error: 'AtCoder support coming soon.' });
      } else if (seenPlatforms.has(result.platform)) {
        // Skip duplicate
      } else {
        seenPlatforms.add(result.platform);
        parsed.push(result);
      }
    }

    if (parsed.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid platform usernames or URLs provided.',
        parseErrors,
      });
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          const cachedObj = JSON.parse(cached);
          const cachedPlatforms = Object.keys(cachedObj.platforms || {});
          
          const allMatch = parsed.every(p => {
            const pInfo = cachedObj.platforms?.[p.platform];
            const cachedUser = pInfo?.username;
            const isSuccess = pInfo && pInfo.success !== false && !pInfo.error;
            return isSuccess && cachedUser && cachedUser.toLowerCase() === p.username.toLowerCase();
          }) && (cachedPlatforms.length === parsed.length);

          // Data quality check: skip cache if any platform has 0 solved but a rating (stale data)
          const hasStaleData = cachedPlatforms.some(key => {
            const d = cachedObj.platforms?.[key]?.data;
            return d && d.totalSolved === 0 && (d.currentRating > 0 || d.rating > 0 || d.maxRating > 0);
          });

          if (allMatch && !hasStaleData) {
            return res.json({ success: true, fromCache: true, ...cachedObj });
          }

          // Delete stale cache so it doesn't keep being checked
          if (hasStaleData) {
            await redis.del(cacheKey);
          }
        }
      } catch (redisErr) {
        console.error('Redis cache read failed:', redisErr.message);
      }
    }

    const results = await Promise.allSettled(
      parsed.map(({ platform, username }) =>
        FETCHER_MAP[platform]?.(username) ?? Promise.resolve({ success: false, error: 'Unsupported platform' })
      )
    );

    const platformResults = {};
    for (let i = 0; i < parsed.length; i++) {
      const { platform, username } = parsed[i];
      const result = results[i];
      if (result.status === 'fulfilled') {
        platformResults[platform] = {
          linked: true,
          username,
          fetchedAt: new Date().toISOString(),
          ...result.value,
        };
      } else {
        platformResults[platform] = {
          linked: true,
          username,
          fetchedAt: new Date().toISOString(),
          success: false,
          error: result.reason?.message ?? 'Unknown error',
          data: null,
        };
      }
    }

    const aggregated = computeAggregated(platformResults);

    try {
      await CodingProfile.findOneAndUpdate(
        { userId },
        { platforms: platformResults, aggregated, lastFetchedAt: new Date() },
        { upsert: true, returnDocument: 'after' }
      );
    } catch (dbErr) {
      console.error('MongoDB save failed:', dbErr.message);
    }

    const responseData = {
      platforms: platformResults,
      aggregated,
      lastFetchedAt: new Date().toISOString(),
      parseErrors: parseErrors.length > 0 ? parseErrors : undefined,
    };

    try {
      await redis.set(cacheKey, JSON.stringify(responseData), 'EX', CACHE_TTL_SECONDS);
      if (forceRefresh) {
        await redis.set(rateLimitKey, '1', 'EX', RATE_LIMIT_TTL);
      }
    } catch (redisErr) {
      console.error('Redis cache write failed:', redisErr.message);
    }

    return res.json({ success: true, fromCache: false, ...responseData });
  } catch (err) {
    console.error('fetchCodingProfile error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * GET /api/coding-profile
 */
async function getCodingProfile(req, res) {
  try {
    const userId = req.user._id?.toString?.() ?? req.user.id?.toString?.();

    try {
      const cached = await redis.get(`coding:${userId}`);
      if (cached) {
        const cachedObj = JSON.parse(cached);
        if (cachedObj.platforms?.tuf) delete cachedObj.platforms.tuf;
        return res.json({ success: true, fromCache: true, ...cachedObj });
      }
    } catch (redisErr) {
      console.error('Redis cache read failed:', redisErr.message);
    }

    const profile = await CodingProfile.findOne({ userId }).lean();
    if (!profile) {
      return res.json({ success: true, exists: false, message: 'No coding profile found.' });
    }

    if (profile.platforms?.tuf) {
      delete profile.platforms.tuf;
    }

    return res.json({
      success: true,
      fromCache: false,
      platforms: profile.platforms,
      aggregated: profile.aggregated,
      lastFetchedAt: profile.lastFetchedAt?.toISOString() ?? null,
    });
  } catch (err) {
    console.error('getCodingProfile error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * DELETE /api/coding-profile
 */
async function deleteCodingProfile(req, res) {
  try {
    const userId = req.user._id?.toString?.() ?? req.user.id?.toString?.();
    await CodingProfile.findOneAndDelete({ userId });

    try {
      await redis.del(`coding:${userId}`);
    } catch (redisErr) {
      console.error('Redis cache delete failed:', redisErr.message);
    }

    return res.json({ success: true, message: 'Coding profile deleted.' });
  } catch (err) {
    console.error('deleteCodingProfile error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * GET /api/coding-profile/preview
 */
async function previewUrl(req, res) {
  try {
    const { url, platform } = req.query;
    if (!url) return res.status(400).json({ success: false, error: 'Input is required' });

    const result = parseProfileInput(url, platform);
    if (result.error) {
      return res.json({ success: false, error: result.error });
    }

    return res.json({ success: true, platform: result.platform, username: result.username });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * Compute aggregated stats from all platform data
 * SEPARATES DSA (LeetCode, GFG) and CP (Codeforces, CodeChef) completely!
 */
function computeAggregated(platforms) {
  const lc = platforms.leetcode?.data;
  const cf = platforms.codeforces?.data;
  const cc = platforms.codechef?.data;
  const gfg = platforms.gfg?.data;
  const gh = platforms.github?.data;

  // 1. DSA Solved: LeetCode + GeeksForGeeks ONLY
  const dsaTotalSolved = (lc?.totalSolved ?? 0) + (gfg?.totalSolved ?? 0);
  const dsaTotals = {
    easy:   (lc?.easySolved ?? 0) + (gfg?.easySolved ?? 0),
    medium: (lc?.mediumSolved ?? 0) + (gfg?.mediumSolved ?? 0),
    hard:   (lc?.hardSolved ?? 0) + (gfg?.hardSolved ?? 0),
  };

  // 2. Competitive Programming: Codeforces + CodeChef
  const cpTotalSolved = (cf?.totalSolved ?? 0) + (cc?.totalSolved ?? 0);

  // Ratings per platform
  const cfRating = cf?.currentRating ?? 0;
  const cfMaxRating = cf?.maxRating ?? 0;
  const ccRating = cc?.currentRating ?? 0;
  const lcContestRating = lc?.contestRating ?? 0;

  const totalSolved = dsaTotalSolved + cpTotalSolved;

  return {
    totalProblemsSolved: totalSolved,
    dsaTotalSolved,
    dsaTotals,
    cpTotalSolved,
    cpRatings: {
      codeforces: cfRating,
      codeforcesMax: cfMaxRating,
      codechef: ccRating,
      leetcodeContest: lcContestRating,
    },
    githubTotalStars: gh?.totalStars ?? 0,
    githubTotalRepos: gh?.publicRepos ?? 0,
    githubCurrentStreak: gh?.currentStreak ?? (lc?.streak ?? 0),
  };
}

module.exports = {
  fetchCodingProfile,
  getCodingProfile,
  deleteCodingProfile,
  previewUrl,
};
