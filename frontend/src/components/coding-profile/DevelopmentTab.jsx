import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ActivityHeatmap from './ActivityHeatmap';
import { GitBranch, Star, GitFork, Users } from 'lucide-react';

const LANG_COLORS = ['#3B82F6', '#8B5CF6', '#22C55E', '#F59E0B', '#EF4444', '#EC4899', '#A855F7', '#06B6D4', '#F97316', '#84CC16'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg px-3 py-2 text-xs shadow-xl bg-[#0B1120] border border-[#334155] text-slate-200">
      <span style={{ color: d.payload?.fill || '#3B82F6' }} className="font-bold">
        {d.payload?.language || d.name}:{' '}
      </span>
      <span className="font-black text-white">{d.value} repos</span>
    </div>
  );
};

function DevelopmentTab({ platforms }) {
  const gh = platforms?.github?.data;

  if (!gh) {
    return (
      <div className="text-center py-12 bg-[#111827] rounded-xl border border-[#334155]">
        <p className="text-slate-400 text-sm font-semibold">No GitHub profile connected.</p>
        <p className="text-slate-500 text-xs mt-1">Enter your GitHub username above to display open-source metrics.</p>
      </div>
    );
  }

  const langData = (gh.languageBreakdown ?? []).slice(0, 8).map((l, i) => ({
    language: l.language,
    repos: l.repoCount,
    fill: LANG_COLORS[i % LANG_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* GitHub Overview */}
      <div className="rounded-xl p-6 bg-[#111827] border border-[#334155] space-y-6 shadow-xl">
        <div className="flex items-center gap-4">
          {gh.avatar && (
            <img
              src={gh.avatar}
              alt={gh.username}
              className="w-14 h-14 rounded-xl border border-blue-500/30"
            />
          )}
          <div>
            <h3 className="text-white font-extrabold text-lg">{gh.name || gh.username}</h3>
            <p className="text-xs text-blue-400 font-semibold">@{gh.username}</p>
            {gh.bio && <p className="text-xs text-slate-400 mt-1 max-w-xl">{gh.bio}</p>}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Stars', value: gh.totalStars, icon: <Star className="w-4 h-4 text-amber-400" /> },
            { label: 'Public Repos', value: gh.publicRepos, icon: <GitBranch className="w-4 h-4 text-blue-400" /> },
            { label: 'Followers', value: gh.followers, icon: <Users className="w-4 h-4 text-emerald-400" /> },
            { label: 'Forks', value: gh.totalForks, icon: <GitFork className="w-4 h-4 text-purple-400" /> },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg p-3 text-center bg-[#1E293B] border border-[#334155]">
              <div className="flex justify-center mb-1">{stat.icon}</div>
              <div className="text-white font-extrabold text-base mt-1">{(stat.value ?? 0).toLocaleString()}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Language Breakdown */}
        {langData.length > 0 && (
          <div className="rounded-xl p-5 bg-[#111827] border border-[#334155] space-y-3">
            <h4 className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">
              TOP PROGRAMMING LANGUAGES
            </h4>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={langData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
                <YAxis type="category" dataKey="language" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="repos" radius={[0, 4, 4, 0]} animationDuration={800}>
                  {langData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Repositories */}
        {gh.topRepos?.length > 0 && (
          <div className="rounded-xl p-5 bg-[#111827] border border-[#334155] space-y-3">
            <h4 className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">
              FEATURED REPOSITORIES
            </h4>
            <div className="space-y-2.5">
              {gh.topRepos.map((repo) => (
                <a
                  key={repo.name}
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg p-3 bg-[#1E293B] border border-[#334155] hover:border-slate-500 transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-bold text-xs flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5 text-blue-400" /> {repo.name}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>⭐ {repo.stars}</span>
                      <span>🍴 {repo.forks}</span>
                    </div>
                  </div>
                  {repo.description && (
                    <p className="text-[11px] text-slate-400 truncate">{repo.description}</p>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contribution Heatmap */}
      {gh.contributionCalendar?.length > 0 && (
        <ActivityHeatmap data={gh.contributionCalendar} />
      )}
    </div>
  );
}

export default DevelopmentTab;
