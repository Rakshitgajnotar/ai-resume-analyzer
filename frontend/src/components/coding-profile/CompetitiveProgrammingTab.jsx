import { Trophy, Award, Code2 } from 'lucide-react';

function CompetitiveProgrammingTab({ platforms }) {
  const lcData = platforms?.leetcode?.data;
  const cfData = platforms?.codeforces?.data;
  const ccData = platforms?.codechef?.data;

  const ratingCards = [];
  if (cfData?.currentRating) {
    ratingCards.push({
      platform: 'Codeforces',
      icon: <Trophy className="w-4 h-4 text-purple-400" />,
      rating: cfData.currentRating,
      badge: cfData.rank,
      rank: cfData.maxRating ? `Max Rating: ${cfData.maxRating}` : null,
      contests: cfData.totalContests,
    });
  }
  if (ccData?.currentRating) {
    ratingCards.push({
      platform: 'CodeChef',
      icon: <Award className="w-4 h-4 text-amber-400" />,
      rating: ccData.currentRating,
      badge: ccData.stars,
      rank: ccData.globalRank ? `Global Rank: #${ccData.globalRank}` : null,
      contests: ccData.contestsParticipated,
    });
  }
  if (lcData?.contestRating) {
    ratingCards.push({
      platform: 'LeetCode Contests',
      icon: <Code2 className="w-4 h-4 text-blue-400" />,
      rating: lcData.contestRating,
      badge: lcData.contestBadge,
      rank: lcData.contestGlobalRanking ? `Global Rank: #${lcData.contestGlobalRanking.toLocaleString()}` : null,
      contests: lcData.contestsAttended,
    });
  }

  const topTags = cfData?.topTags?.slice(0, 10) ?? [];

  return (
    <div className="space-y-6">
      {/* Category Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#111827] border border-[#334155]">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Trophy className="w-3.5 h-3.5 text-purple-400" />
            <span>Competitive Programming Suite</span>
          </div>
          <h3 className="text-xl font-extrabold text-white">Contest Ratings & Ranks Overview</h3>
        </div>
        <div className="flex items-center gap-2">
          {['Codeforces', 'CodeChef', 'AtCoder'].map((p) => (
            <span key={p} className="px-3 py-1 rounded-full text-xs font-semibold bg-[#1E293B] text-slate-300 border border-[#334155]">
              ✓ {p}
            </span>
          ))}
        </div>
      </div>

      {/* Rating Cards */}
      {ratingCards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ratingCards.map((card) => (
            <div
              key={card.platform}
              className="rounded-xl p-5 bg-[#1E293B] border border-[#334155] space-y-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#0B1120] border border-[#334155]">
                    {card.icon}
                  </div>
                  <span className="text-white font-bold text-sm">{card.platform}</span>
                </div>
                {card.badge && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    {card.badge}
                  </span>
                )}
              </div>
              <div className="text-3xl font-black text-white">{card.rating}</div>
              <div className="flex flex-col gap-1 text-xs text-slate-400">
                {card.rank && <span>{card.rank}</span>}
                {card.contests != null && <span>{card.contests} contests attended</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-[#111827] rounded-xl border border-[#334155]">
          <p className="text-slate-400 text-sm font-semibold">No Competitive Programming platform data connected.</p>
          <p className="text-slate-500 text-xs mt-1">Enter your Codeforces or CodeChef handle above to fetch ratings.</p>
        </div>
      )}

      {/* Top Problem Topics */}
      {topTags.length > 0 && (
        <div className="rounded-xl p-5 bg-[#1E293B] border border-[#334155] space-y-3">
          <h4 className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">
            CODEFORCES TOP PROBLEM TOPICS
          </h4>
          <div className="flex flex-wrap gap-2">
            {topTags.map((tag) => (
              <span
                key={tag.tag}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0B1120] text-blue-300 border border-[#334155]"
              >
                {tag.tag} <span className="font-bold text-white">({tag.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CompetitiveProgrammingTab;
