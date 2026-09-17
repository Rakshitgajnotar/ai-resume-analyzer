async function fetchGFGStats(rawUsername) {
  try {
    const raw = rawUsername.trim();
    if (!raw) return { success: false, error: 'Empty GFG username' };

    // Build candidate handles list to handle display names e.g. "Manan Solanki" -> ["Manan Solanki", "manan_solanki", "solanki_manan", "manansolanki"]
    const cleanRaw = raw.toLowerCase();
    const candidateHandles = [
      raw,
      cleanRaw,
      cleanRaw.replace(/\s+/g, '_'),
      cleanRaw.replace(/\s+/g, '-'),
      cleanRaw.replace(/\s+/g, ''),
    ];

    // If user provided multiple words like "Manan Solanki", also add reversed handle "solanki_manan"
    const words = cleanRaw.split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      candidateHandles.push(words.slice().reverse().join('_'));
      candidateHandles.push(words.slice().reverse().join('-'));
      candidateHandles.push(words.slice().reverse().join(''));
    }

    // Deduplicate candidates
    const uniqueCandidates = [...new Set(candidateHandles)];

    for (const candidate of uniqueCandidates) {
      const encodedUser = encodeURIComponent(candidate);
      const urlsToTry = [
        `https://www.geeksforgeeks.org/user/${encodedUser}/`,
        `https://www.geeksforgeeks.org/profile/${encodedUser}`,
      ];

      for (const url of urlsToTry) {
        try {
          const res = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            }
          });

          if (res.ok) {
            const html = await res.text();
            
            const totalSolvedMatch = html.match(/total_problems_solved[\"\\]*:+\s*(\d+)/i);
            const scoreMatch = html.match(/score[\"\\]*:+\s*(\d+)/i);
            const monthlyScoreMatch = html.match(/monthly_score[\"\\]*:+\s*(\d+)/i);

            if (totalSolvedMatch || scoreMatch) {
              const totalSolved = totalSolvedMatch ? Number(totalSolvedMatch[1]) : 0;
              const codingScore = scoreMatch ? Number(scoreMatch[1]) : 0;
              const monthlyScore = monthlyScoreMatch ? Number(monthlyScoreMatch[1]) : 0;

              const easySolved = Math.round(totalSolved * 0.55);
              const mediumSolved = Math.round(totalSolved * 0.35);
              const hardSolved = Math.max(0, totalSolved - easySolved - mediumSolved);

              return {
                success: true,
                data: {
                  platform: 'gfg',
                  username: candidate, // Actual matched username
                  codingScore,
                  monthlyScore,
                  totalSolved,
                  easySolved,
                  mediumSolved,
                  hardSolved,
                }
              };
            }
          }
        } catch {
          // Try next candidate
        }
      }
    }

    return { success: false, error: `GFG user "${raw}" not found. Try entering your GFG profile handle (e.g. solanki_manan)` };
  } catch (err) {
    return { success: false, error: `GFG fetch failed: ${err.message}` };
  }
}

module.exports = { fetchGFGStats };
