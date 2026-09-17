async function fetchGitHubStats(username) {
  const GH_TOKEN = process.env.GITHUB_TOKEN;
  const headers = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'CodingProfileAggregator/1.0',
    ...(GH_TOKEN && { 'Authorization': `Bearer ${GH_TOKEN}` }),
  };

  try {
    const [userRes, reposRes, contribRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, { headers }),
      fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers }),
      fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`),
    ]);

    if (!userRes.ok) throw new Error(`GitHub user not found: ${userRes.status}`);
    const user = await userRes.json();
    const repos = reposRes.ok ? await reposRes.json() : [];
    const contribData = contribRes.ok ? await contribRes.json() : null;

    // Aggregate repo stats
    let totalStars = 0, totalForks = 0;
    const langMap = {};
    for (const repo of (Array.isArray(repos) ? repos : [])) {
      if (repo.fork) continue; // skip forked repos for language stats
      totalStars += repo.stargazers_count ?? 0;
      totalForks += repo.forks_count ?? 0;
      if (repo.language) langMap[repo.language] = (langMap[repo.language] ?? 0) + 1;
    }

    const languageBreakdown = Object.entries(langMap)
      .sort((a, b) => b[1] - a[1])
      .map(([language, repoCount]) => ({ language, repoCount }));

    const topRepos = (Array.isArray(repos) ? repos : [])
      .filter(r => !r.fork)
      .sort((a, b) => (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0))
      .slice(0, 5)
      .map(r => ({
        name: r.name,
        description: r.description,
        stars: r.stargazers_count ?? 0,
        forks: r.forks_count ?? 0,
        language: r.language,
        url: r.html_url,
        topics: r.topics ?? [],
      }));

    // Compute streaks from contributions
    let currentStreak = 0, longestStreak = 0, totalContributions = 0;
    let contributionCalendar = [];
    if (contribData?.contributions) {
      const days = contribData.contributions;
      totalContributions = days.reduce((sum, d) => sum + d.count, 0);
      contributionCalendar = days;

      // Longest streak
      let streak = 0;
      for (const d of days) {
        if (d.count > 0) { streak++; longestStreak = Math.max(longestStreak, streak); }
        else streak = 0;
      }
      // Current streak (from end)
      for (let i = days.length - 1; i >= 0; i--) {
        if (days[i].count > 0) currentStreak++;
        else break;
      }
    }

    return {
      success: true,
      data: {
        platform: 'github',
        username,
        name: user.name,
        bio: user.bio,
        avatar: user.avatar_url,
        followers: user.followers,
        following: user.following,
        publicRepos: user.public_repos,
        totalStars,
        totalForks,
        accountCreated: user.created_at,
        languageBreakdown,
        topRepos,
        currentStreak,
        longestStreak,
        totalContributionsLastYear: totalContributions,
        contributionCalendar,
      }
    };
  } catch (err) {
    return { success: false, error: `GitHub fetch failed: ${err.message}` };
  }
}

module.exports = { fetchGitHubStats };
