import { CheckCircle2, Code2, BookOpen } from 'lucide-react';

function DSATab({ platforms }) {
  const lcData = platforms?.leetcode?.data;
  const gfgData = platforms?.gfg?.data;

  const dsaCards = [];
  if (lcData) {
    dsaCards.push({
      platform: 'LeetCode',
      icon: <Code2 className="w-4 h-4 text-cyan-400" />,
      total: lcData.totalSolved ?? 0,
      easy: lcData.easySolved ?? 0,
      medium: lcData.mediumSolved ?? 0,
      hard: lcData.hardSolved ?? 0,
    });
  }
  if (gfgData) {
    dsaCards.push({
      platform: 'GeeksForGeeks',
      icon: <BookOpen className="w-4 h-4 text-emerald-400" />,
      total: gfgData.totalSolved ?? 0,
      easy: gfgData.easySolved ?? 0,
      medium: gfgData.mediumSolved ?? 0,
      hard: gfgData.hardSolved ?? 0,
    });
  }

  const skills = lcData?.skillStats?.intermediate || [
    { tagName: 'Arrays', problemsSolved: 65 },
    { tagName: 'Dynamic Programming', problemsSolved: 42 },
    { tagName: 'Trees & Graphs', problemsSolved: 38 },
    { tagName: 'Strings', problemsSolved: 30 },
  ];

  return (
    <div className="space-y-6">
      {/* Category Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#151E2E] border border-[#26354A] shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>DSA & Problem Solving Suite</span>
          </div>
          <h3 className="text-xl font-black text-white">Algorithms & Data Structures Metrics</h3>
        </div>
        <div className="flex items-center gap-2">
          {['LeetCode', 'GFG'].map((p) => (
            <span key={p} className="px-3 py-1 rounded-full text-xs font-black bg-[#080C14] text-slate-200 border border-[#26354A]">
              ✓ {p}
            </span>
          ))}
        </div>
      </div>

      {/* Overview Cards per Platform */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {dsaCards.map((card) => {
          const ePct = card.total > 0 ? Math.round((card.easy / card.total) * 100) : 0;
          const mPct = card.total > 0 ? Math.round((card.medium / card.total) * 100) : 0;
          const hPct = card.total > 0 ? Math.round((card.hard / card.total) * 100) : 0;

          return (
            <div key={card.platform} className="rounded-xl p-5 bg-[#151E2E] border border-[#26354A] space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#080C14] border border-[#26354A]">
                    {card.icon}
                  </div>
                  <span className="text-white font-black text-sm">{card.platform}</span>
                </div>
                <span className="text-xs font-black text-white">{card.total} solved</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-[#080C14] rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-[#26354A]">
                <div style={{ width: `${ePct}%` }} className="bg-emerald-500 h-full rounded-l-full" />
                <div style={{ width: `${mPct}%` }} className="bg-amber-500 h-full" />
                <div style={{ width: `${hPct}%` }} className="bg-rose-500 h-full rounded-r-full" />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="bg-[#080C14] p-2 rounded-lg border border-emerald-500/30">
                  <span className="text-[9px] font-black text-emerald-400 block uppercase">EASY</span>
                  <span className="font-black text-white">{card.easy}</span>
                </div>
                <div className="bg-[#080C14] p-2 rounded-lg border border-amber-500/30">
                  <span className="text-[9px] font-black text-amber-400 block uppercase">MEDIUM</span>
                  <span className="font-black text-white">{card.medium}</span>
                </div>
                <div className="bg-[#080C14] p-2 rounded-lg border border-rose-500/30">
                  <span className="text-[9px] font-black text-rose-400 block uppercase">HARD</span>
                  <span className="font-black text-white">{card.hard}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DSA Topic Distribution Table */}
      {skills.length > 0 && (
        <div className="rounded-2xl p-5 bg-[#151E2E] border border-[#26354A] space-y-3 shadow-xl">
          <h4 className="text-xs font-black tracking-widest text-slate-300 uppercase">
            TOPIC MASTERY & PROBLEMS SOLVED
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {skills.slice(0, 8).map((skill) => (
              <div key={skill.tagName} className="p-3 rounded-xl bg-[#080C14] border border-[#26354A] space-y-1">
                <span className="text-xs font-bold text-white block truncate">{skill.tagName}</span>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Solved</span>
                  <span className="font-black text-cyan-400">{skill.problemsSolved}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DSATab;
