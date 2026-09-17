const LEETCODE_GQL = 'https://leetcode.com/graphql';
const GQL_HEADERS = {
  'Content-Type': 'application/json',
  'Referer': 'https://leetcode.com',
  'User-Agent': 'Mozilla/5.0 (compatible; CodingProfileAggregator/1.0)',
};

const USER_PROFILE_QUERY = `
  query getUserProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile {
        ranking
        userAvatar
        realName
        countryName
        company
        school
        aboutMe
      }
      submitStats: submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
      }
      badges {
        id
        displayName
        icon
      }
      languageProblemCount {
        languageName
        problemsSolved
      }
      tagProblemCounts {
        advanced { tagName problemsSolved }
        intermediate { tagName problemsSolved }
        fundamental { tagName problemsSolved }
      }
      userCalendar {
        activeYears
        streak
        totalActiveDays
        submissionCalendar
      }
    }
  }
`;

const CONTEST_QUERY = `
  query getUserContestRanking($username: String!) {
    userContestRanking(username: $username) {
      attendedContestsCount
      rating
      globalRanking
      totalParticipants
      topPercentage
      badge { name }
    }
    userContestRankingHistory(username: $username) {
      attended
      trendDirection
      problemsSolved
      totalProblems
      finishTimeInSeconds
      rating
      ranking
      contest {
        title
        startTime
      }
    }
  }
`;

async function gqlFetch(query, variables) {
  const res = await fetch(LEETCODE_GQL, {
    method: 'POST',
    headers: GQL_HEADERS,
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`LeetCode GQL error: ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

async function fetchLeetCodeFromPublicApi(username) {
  try {
    const res = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== 'success') return null;

    return {
      success: true,
      data: {
        platform: 'leetcode',
        username,
        totalSolved: json.totalSolved || 0,
        easySolved: json.easySolved || 0,
        mediumSolved: json.mediumSolved || 0,
        hardSolved: json.hardSolved || 0,
        ranking: json.ranking || null,
        contestRating: null,
        contestsAttended: 0,
        submissionCalendar: json.submissionCalendar || {},
        streak: 0,
        totalActiveDays: 0,
      }
    };
  } catch {
    return null;
  }
}

async function fetchLeetCodeStats(username) {
  try {
    // Run both queries in parallel
    const [profileData, contestData] = await Promise.all([
      gqlFetch(USER_PROFILE_QUERY, { username }),
      gqlFetch(CONTEST_QUERY, { username }),
    ]);

    const user = profileData.matchedUser;
    if (!user) {
      const fallback = await fetchLeetCodeFromPublicApi(username);
      if (fallback) return fallback;
      return { success: false, error: 'LeetCode user not found' };
    }

    const solved = user.submitStats.acSubmissionNum;
    const totalSolved     = solved.find(x => x.difficulty === 'All')?.count ?? 0;
    const easySolved      = solved.find(x => x.difficulty === 'Easy')?.count ?? 0;
    const mediumSolved    = solved.find(x => x.difficulty === 'Medium')?.count ?? 0;
    const hardSolved      = solved.find(x => x.difficulty === 'Hard')?.count ?? 0;

    const contest = contestData.userContestRanking;
    const contestHistory = (contestData.userContestRankingHistory ?? [])
      .filter(h => h.attended);

    const calendar = JSON.parse(
      user.userCalendar?.submissionCalendar ?? '{}'
    );

    return {
      success: true,
      data: {
        platform: 'leetcode',
        username,
        avatar: user.profile.userAvatar,
        realName: user.profile.realName,
        ranking: user.profile.ranking,
        totalSolved,
        easySolved,
        mediumSolved,
        hardSolved,
        contestRating: contest?.rating ? Math.round(contest.rating) : null,
        contestsAttended: contest?.attendedContestsCount ?? 0,
        contestGlobalRanking: contest?.globalRanking ?? null,
        topPercentage: contest?.topPercentage ?? null,
        contestBadge: contest?.badge?.name ?? null,
        contestHistory: contestHistory.map(h => ({
          contestName: h.contest?.title ?? 'Unknown',
          date: h.contest?.startTime ? new Date(h.contest.startTime * 1000).toISOString() : null,
          rating: Math.round(h.rating),
          ranking: h.ranking,
          problemsSolved: h.problemsSolved,
          totalProblems: h.totalProblems,
        })),
        languageStats: user.languageProblemCount ?? [],
        skillStats: user.tagProblemCounts ?? {},
        badges: user.badges ?? [],
        submissionCalendar: calendar,
        streak: user.userCalendar?.streak ?? 0,
        totalActiveDays: user.userCalendar?.totalActiveDays ?? 0,
      }
    };
  } catch (err) {
    console.warn(`LeetCode GQL failed for ${username} (${err.message}). Trying public API fallback...`);
    const fallback = await fetchLeetCodeFromPublicApi(username);
    if (fallback) return fallback;
    return { success: false, error: err.message || 'LeetCode fetch failed' };
  }
}

module.exports = { fetchLeetCodeStats };
