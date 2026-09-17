import { CheckCircle2, AlertTriangle, Code, Trophy, BookOpen, GitBranch, Award } from 'lucide-react';

const PLATFORM_CONFIG = [
  { key: 'leetcode',   name: 'LeetCode',     color: '#38BDF8', icon: <Code className="w-4 h-4 text-cyan-400" /> },
  { key: 'codeforces', name: 'Codeforces',   color: '#A855F7', icon: <Trophy className="w-4 h-4 text-purple-400" /> },
  { key: 'codechef',   name: 'CodeChef',     color: '#F59E0B', icon: <Award className="w-4 h-4 text-amber-400" /> },
  { key: 'gfg',        name: 'GeeksForGeeks', color: '#10B981', icon: <BookOpen className="w-4 h-4 text-emerald-400" /> },
  { key: 'github',     name: 'GitHub',       color: '#94A3B8', icon: <GitBranch className="w-4 h-4 text-slate-300" /> },
];

function PlatformCard({ platform, info }) {
  if (!info?.linked) return null;
  
  const config = PLATFORM_CONFIG.find(p => p.key === platform);
  if (!config) return null;
  
  const data = info.data;
  const hasError = !info.success || info.error;

  const cf800  = data?.ratingBuckets?.r800_1199 ?? data?.easySolved ?? 0;
  const cf1200 = data?.ratingBuckets?.r1200_1499 ?? data?.mediumSolved ?? 0;
  const cf1500 = data?.ratingBuckets?.r1500_1899 ?? data?.hardSolved ?? 0;
  const cf1900 = data?.ratingBuckets?.r1900Plus ?? data?.expertSolved ?? 0;

  return (
    <div className="rounded-xl p-5 bg-[#151E2E] border border-[#26354A] shadow-md transition-all duration-150 hover:border-cyan-400 space-y-4">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#26354A]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#080C14] border border-[#26354A]">
            {config.icon}
          </div>
          <div>
            <h3 className="text-white font-black text-sm tracking-wide">{config.name}</h3>
            <span className="text-[11px] font-bold text-slate-300 block">
              @{info.username}
            </span>
          </div>
        </div>

        {hasError ? (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Error
          </span>
        ) : (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Connected
          </span>
        )}
      </div>

      {hasError ? (
        <p className="text-rose-400 text-xs font-semibold py-2">{info.error}</p>
      ) : (
        <div className="space-y-3">
          {/* LEETCODE */}
          {platform === 'leetcode' && data && (
            <>
              <div className="bg-[#080C14] rounded-xl p-3 border border-[#26354A] space-y-2">
                <div className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">DSA Breakdown</div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#151E2E] border border-emerald-500/30 rounded-lg p-2 text-center">
                    <span className="text-[9px] font-black text-emerald-400 block">EASY</span>
                    <span className="text-emerald-300 font-black text-sm">{data.easySolved}</span>
                  </div>
                  <div className="bg-[#151E2E] border border-amber-500/30 rounded-lg p-2 text-center">
                    <span className="text-[9px] font-black text-amber-400 block">MEDIUM</span>
                    <span className="text-amber-300 font-black text-sm">{data.mediumSolved}</span>
                  </div>
                  <div className="bg-[#151E2E] border border-rose-500/30 rounded-lg p-2 text-center">
                    <span className="text-[9px] font-black text-rose-400 block">HARD</span>
                    <span className="text-rose-300 font-black text-sm">{data.hardSolved}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1 px-1 text-xs">
                  <span className="text-slate-300 font-semibold">Total Solved</span>
                  <span className="text-white font-black text-sm">{data.totalSolved}</span>
                </div>
              </div>

              <div className="bg-[#080C14] rounded-xl p-3 border border-[#26354A] space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-semibold">Contest Rating</span>
                  <span className="font-extrabold text-amber-400">{data.contestRating || 'Unrated'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-semibold">Global Rank</span>
                  <span className="font-extrabold text-white">
                    {data.contestGlobalRanking ? `#${data.contestGlobalRanking.toLocaleString()}` : (data.ranking ? `#${data.ranking.toLocaleString()}` : 'N/A')}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* CODEFORCES */}
          {platform === 'codeforces' && data && (
            <>
              <div className="bg-[#080C14] rounded-xl p-3 border border-[#26354A] space-y-2">
                <div className="text-[10px] font-black text-purple-400 uppercase tracking-wider">Problems by Rating</div>
                
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-[#151E2E] border border-emerald-500/30 rounded-lg p-2">
                    <span className="text-[9px] font-black text-emerald-400 block">800 - 1199</span>
                    <span className="text-emerald-300 font-bold text-xs">{cf800}</span>
                  </div>
                  <div className="bg-[#151E2E] border border-cyan-500/30 rounded-lg p-2">
                    <span className="text-[9px] font-black text-cyan-400 block">1200 - 1499</span>
                    <span className="text-cyan-300 font-bold text-xs">{cf1200}</span>
                  </div>
                  <div className="bg-[#151E2E] border border-purple-500/30 rounded-lg p-2">
                    <span className="text-[9px] font-black text-purple-400 block">1500 - 1899</span>
                    <span className="text-purple-300 font-bold text-xs">{cf1500}</span>
                  </div>
                  <div className="bg-[#151E2E] border border-rose-500/30 rounded-lg p-2">
                    <span className="text-[9px] font-black text-rose-400 block">1900+</span>
                    <span className="text-rose-300 font-bold text-xs">{cf1900}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1 px-1 text-xs">
                  <span className="text-slate-300 font-semibold">Total Solved</span>
                  <span className="text-white font-black text-sm">{data.totalSolved}</span>
                </div>
              </div>

              <div className="bg-[#080C14] rounded-xl p-3 border border-[#26354A] space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-semibold">Current Rating</span>
                  <span className="font-extrabold text-cyan-400">
                    {data.currentRating ? `${data.currentRating} (${data.rank})` : 'Unrated'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-semibold">Max Rating</span>
                  <span className="font-extrabold text-white">
                    {data.maxRating ? `${data.maxRank ? `${data.maxRating} (${data.maxRank})` : data.maxRating}` : 'Unrated'}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* CODECHEF */}
          {platform === 'codechef' && data && (
            <div className="bg-[#080C14] rounded-xl p-3 border border-[#26354A] space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-semibold">Total Solved</span>
                <span className="text-white font-black">{data.totalSolved}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-semibold">Rating</span>
                <span className="font-extrabold text-amber-400">{data.currentRating} {data.stars && `(${data.stars})`}</span>
              </div>
            </div>
          )}

          {/* GFG */}
          {platform === 'gfg' && data && (
            <div className="bg-[#080C14] rounded-xl p-3 border border-[#26354A] space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-semibold">Coding Score</span>
                <span className="text-emerald-400 font-black">{data.codingScore}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-semibold">Total Solved</span>
                <span className="text-white font-black">{data.totalSolved}</span>
              </div>
            </div>
          )}

          {/* GITHUB */}
          {platform === 'github' && data && (
            <div className="bg-[#080C14] rounded-xl p-3 border border-[#26354A] space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-semibold">Public Repos</span>
                <span className="text-white font-black">{data.publicRepos}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-semibold">Total Stars</span>
                <span className="text-purple-400 font-black">⭐ {data.totalStars}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PlatformCard;
