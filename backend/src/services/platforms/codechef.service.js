async function fetchCodeChefStats(username) {
  try {
    const res = await fetch(`https://codechef-api.vercel.app/handle/${username}`);
    if (!res.ok) throw new Error(`CodeChef API returned ${res.status}`);
    const data = await res.json();

    if (data.success === false) {
      return { success: false, error: 'CodeChef user not found' };
    }

    return {
      success: true,
      data: {
        platform: 'codechef',
        username,
        currentRating: data.currentRating ?? 0,
        highestRating: data.highestRating ?? 0,
        stars: data.stars ?? null,
        globalRank: data.globalRank ?? null,
        countryRank: data.countryRank ?? null,
        totalSolved: data.totalProblemsSolved ?? 0,
        division: data.division ?? null,
        contestsParticipated: data.contestsParticipated ?? 0,
        heatMap: data.heatMap ?? [],
        ratingData: data.ratingData ?? [],
      }
    };
  } catch (err) {
    return { success: false, error: `CodeChef fetch failed: ${err.message}` };
  }
}

module.exports = { fetchCodeChefStats };
