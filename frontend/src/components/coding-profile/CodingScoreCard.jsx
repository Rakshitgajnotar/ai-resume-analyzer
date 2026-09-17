import { CheckCircle2, Zap, Trophy } from 'lucide-react';

function CodingScoreCard({ aggregated, platforms }) {
  if (!aggregated) return null;

  const {
    totalProblemsSolved = 0,
    dsaTotalSolved = 0,
    cpTotalSolved = 0,
    dsaTotals = { easy: 0, medium: 0, hard: 0 },
  } = aggregated;

  const cfData = platforms?.codeforces?.data;
  const ccData = platforms?.codechef?.data;
  const lcData = platforms?.leetcode?.data;

  const cfRating = cfData?.currentRating ? `${cfData.currentRating}` : null;
  const ccRating = ccData?.currentRating ? `${ccData.currentRating}` : null;
  const lcContestRating = lcData?.contestRating ? `${lcData.contestRating}` : null;

  const linkedCount = platforms ? Object.values(platforms).filter(p => p?.linked && p?.success !== false).length : 0;

  // Difficulty percentage calculation
  const easyPct = dsaTotalSolved > 0 ? Math.round((dsaTotals.easy / dsaTotalSolved) * 100) : 0;
  const medPct  = dsaTotalSolved > 0 ? Math.round((dsaTotals.medium / dsaTotalSolved) * 100) : 0;
  const hardPct = dsaTotalSolved > 0 ? Math.round((dsaTotals.hard / dsaTotalSolved) * 100) : 0;

  return (
    <div className="rounded-2xl p-6 bg-[#141416] border border-[#222226] shadow-xl space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-[#222226]">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Developer Overview & Aggregate Metrics</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            {totalProblemsSolved.toLocaleString()}
            <span className="text-sm font-bold text-slate-400">Total Solved</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Real-time problem solving & contest stats aggregated across {linkedCount} connected platforms.
          </p>
        </div>

        {/* Aggregate KPI Badges */}
        <div className="flex flex-wrap gap-3">
          <div className="bg-[#050505] border border-[#222226] p-4 rounded-xl text-center min-w-[130px]">
            <span className="text-[10px] font-black text-emerald-400 block uppercase tracking-wider">DSA SOLVED</span>
            <span className="text-2xl font-black text-white mt-0.5 block">{(dsaTotalSolved || 0).toLocaleString()}</span>
            <span className="text-[10px] text-slate-400 font-semibold">LeetCode & GFG</span>
          </div>

          <div className="bg-[#050505] border border-[#222226] p-4 rounded-xl text-center min-w-[130px]">
            <span className="text-[10px] font-black text-purple-400 block uppercase tracking-wider">CP SOLVED</span>
            <span className="text-2xl font-black text-white mt-0.5 block">{(cpTotalSolved || 0).toLocaleString()}</span>
            <span className="text-[10px] text-slate-400 font-semibold">Codeforces, CodeChef</span>
          </div>
        </div>
      </div>

      {/* Grid Section: DSA Progress Bars vs Competitive Ratings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BOX 1: DSA Difficulty Breakdown */}
        <div className="bg-[#050505] border border-[#222226] p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              DSA Problem Difficulty
            </span>
            <span className="text-xs text-slate-400 font-bold">{dsaTotalSolved} solved</span>
          </div>

          {/* Difficulty Progress Bar */}
          <div className="w-full h-3 bg-[#141416] rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-[#222226]">
            <div style={{ width: `${easyPct}%` }} className="bg-emerald-500 h-full rounded-l-full" title={`Easy: ${dsaTotals.easy}`} />
            <div style={{ width: `${medPct}%` }} className="bg-amber-500 h-full" title={`Medium: ${dsaTotals.medium}`} />
            <div style={{ width: `${hardPct}%` }} className="bg-rose-500 h-full rounded-r-full" title={`Hard: ${dsaTotals.hard}`} />
          </div>

          {/* Cards Breakdown */}
          <div className="grid grid-cols-3 gap-3 text-center pt-1">
            <div className="bg-[#141416] border border-emerald-500/30 p-2.5 rounded-xl">
              <span className="text-[10px] font-black text-emerald-400 block uppercase">EASY</span>
              <span className="text-xl font-black text-white mt-0.5 block">{dsaTotals.easy || 0}</span>
              <span className="text-[10px] text-slate-400 font-semibold">{easyPct}%</span>
            </div>
            <div className="bg-[#141416] border border-amber-500/30 p-2.5 rounded-xl">
              <span className="text-[10px] font-black text-amber-400 block uppercase">MEDIUM</span>
              <span className="text-xl font-black text-white mt-0.5 block">{dsaTotals.medium || 0}</span>
              <span className="text-[10px] text-slate-400 font-semibold">{medPct}%</span>
            </div>
            <div className="bg-[#141416] border border-rose-500/30 p-2.5 rounded-xl">
              <span className="text-[10px] font-black text-rose-400 block uppercase">HARD</span>
              <span className="text-xl font-black text-white mt-0.5 block">{dsaTotals.hard || 0}</span>
              <span className="text-[10px] text-slate-400 font-semibold">{hardPct}%</span>
            </div>
          </div>
        </div>

        {/* BOX 2: Competitive Ratings */}
        <div className="bg-[#050505] border border-[#222226] p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-purple-400" />
              Contest Ratings & Ranks
            </span>
            <span className="text-xs text-slate-400 font-bold">Live Stats</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-[#141416] border border-purple-500/30 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-black text-purple-400 block uppercase">CODEFORCES</span>
              <div className="my-1">
                {cfRating ? (
                  <>
                    <span className="text-xl font-black text-white block">{cfRating}</span>
                    <span className="text-[10px] font-bold text-purple-300 block">{cfData?.rank || 'user'}</span>
                  </>
                ) : (
                  <span className="text-slate-500 text-xs font-semibold">Unlinked</span>
                )}
              </div>
            </div>

            <div className="bg-[#141416] border border-amber-500/30 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-black text-amber-400 block uppercase">CODECHEF</span>
              <div className="my-1">
                {ccRating ? (
                  <>
                    <span className="text-xl font-black text-white block">{ccRating}</span>
                    <span className="text-[10px] font-bold text-amber-300 block">{ccData?.stars || ''}</span>
                  </>
                ) : (
                  <span className="text-slate-500 text-xs font-semibold">Unlinked</span>
                )}
              </div>
            </div>

            <div className="bg-[#141416] border border-cyan-500/30 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-black text-cyan-400 block uppercase">LC CONTEST</span>
              <div className="my-1">
                {lcContestRating ? (
                  <>
                    <span className="text-xl font-black text-white block">{lcContestRating}</span>
                    <span className="text-[10px] font-bold text-cyan-300 block">Rating</span>
                  </>
                ) : (
                  <span className="text-slate-500 text-xs font-semibold">Unrated</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodingScoreCard;
