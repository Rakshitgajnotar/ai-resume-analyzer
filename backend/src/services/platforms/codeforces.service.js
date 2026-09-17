const CF_BASE = 'https://codeforces.com/api';
const CF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function cfFetch(endpoint, timeoutMs = 25000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${CF_BASE}/${endpoint}`, {
      headers: CF_HEADERS,
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.status !== 'OK') throw new Error(json.comment ?? 'User or data not found');
    return json.result;
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error('Codeforces API request timed out (server busy)');
    }
    throw err;
  }
}

async function fetchCodeforcesStats(rawHandle) {
  try {
    // Strip leading @, profile/ prefix, trailing spaces only (dots CAN be part of valid handles)
    let handle = rawHandle.trim().replace(/^@/, '').replace(/^profile\//i, '').split('/')[0].trim();
    if (!handle) return { success: false, error: 'Empty Codeforces handle' };

    const encodedHandle = encodeURIComponent(handle);

    // 1. Fetch user info
    let userInfo;
    try {
      userInfo = await cfFetch(`user.info?handles=${encodedHandle}`, 15000);
    } catch (err) {
      return { success: false, error: `Codeforces: ${err.message}` };
    }

    if (!userInfo || !userInfo[0]) {
      return { success: false, error: `Codeforces handle "${handle}" not found` };
    }

    const user = userInfo[0];
    const canonicalHandle = encodeURIComponent(user.handle);

    // Small delay to respect Codeforces 1-req/2-sec rate limit policy
    await sleep(250);

    // 2. Fetch rating history using canonical handle
    let ratingHistory = [];
    try {
      ratingHistory = await cfFetch(`user.rating?handle=${canonicalHandle}`, 15000);
    } catch (err) {
      console.warn(`Codeforces rating fetch warning for ${user.handle}:`, err.message);
    }

    // Small delay before fetching submission history
    await sleep(250);

    // 3. Fetch submissions (up to 10,000 for full stats coverage) using canonical handle
    let submissions = [];
    try {
      submissions = await cfFetch(`user.status?handle=${canonicalHandle}&from=1&count=10000`, 25000);
    } catch (err) {
      console.warn(`Codeforces status fetch failed for ${user.handle}, retrying...`, err.message);
      try {
        await sleep(500);
        submissions = await cfFetch(`user.status?handle=${canonicalHandle}`, 25000);
      } catch (err2) {
        console.warn(`Codeforces retry status fetch failed for ${user.handle}:`, err2.message);
      }
    }

    // Process unique accepted problems by rating brackets
    const acceptedSet = new Map();
    let rating800_1199 = 0;
    let rating1200_1499 = 0;
    let rating1500_1899 = 0;
    let rating1900Plus = 0;
    let unrated = 0;

    const tagMap = {};
    const langMap = {};

    for (const sub of submissions) {
      if (sub.verdict === 'OK' && sub.problem) {
        const key = `${sub.problem.contestId || ''}-${sub.problem.index || ''}-${sub.problem.name || ''}`;
        if (!acceptedSet.has(key)) {
          acceptedSet.set(key, sub.problem);
          
          const r = sub.problem.rating;
          if (!r) {
            unrated++;
          } else if (r < 1200) {
            rating800_1199++;
          } else if (r < 1500) {
            rating1200_1499++;
          } else if (r < 1900) {
            rating1500_1899++;
          } else {
            rating1900Plus++;
          }

          for (const tag of (sub.problem.tags ?? [])) {
            tagMap[tag] = (tagMap[tag] ?? 0) + 1;
          }
        }
      }
      const lang = sub.programmingLanguage;
      if (lang) langMap[lang] = (langMap[lang] ?? 0) + 1;
    }

    const uniqueSolved = acceptedSet.size;

    const topTags = Object.entries(tagMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    const languageStats = Object.entries(langMap)
      .sort((a, b) => b[1] - a[1])
      .map(([language, count]) => ({ language, count }));

    return {
      success: true,
      data: {
        platform: 'codeforces',
        username: user.handle || handle,
        avatar: user.titlePhoto || user.avatar || null,
        currentRating: user.rating ?? 0,
        maxRating: user.maxRating ?? 0,
        rank: user.rank ?? 'unrated',
        maxRank: user.maxRank ?? 'unrated',
        country: user.country ?? null,
        organization: user.organization ?? null,
        totalContests: ratingHistory.length,
        totalSolved: uniqueSolved,
        ratingBuckets: {
          r800_1199: rating800_1199,
          r1200_1499: rating1200_1499,
          r1500_1899: rating1500_1899,
          r1900Plus: rating1900Plus,
          unrated,
        },
        ratingHistory: ratingHistory.slice(-30).map(r => ({
          contestName: r.contestName,
          date: new Date(r.ratingUpdateTimeSeconds * 1000).toISOString(),
          oldRating: r.oldRating,
          newRating: r.newRating,
          rank: r.rank,
        })),
        topTags,
        languageStats,
      }
    };
  } catch (err) {
    return { success: false, error: err.message || 'Failed to fetch Codeforces stats' };
  }
}

module.exports = { fetchCodeforcesStats };
