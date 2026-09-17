import { ExternalLink } from 'lucide-react';

const PLATFORMS_CONFIG = [
  {
    key: 'leetcode',
    name: 'LEETCODE',
    category: 'DSA',
    borderColor: '#38BDF8',
    badgeBg: 'rgba(56,189,248,0.15)',
    textColor: '#38BDF8',
    placeholder: 'Enter LeetCode username',
    profileUrl: (user) => `https://leetcode.com/u/${user}`,
  },
  {
    key: 'codeforces',
    name: 'CODEFORCES',
    category: 'Competitive Programming',
    borderColor: '#A855F7',
    badgeBg: 'rgba(168,85,247,0.15)',
    textColor: '#C084FC',
    placeholder: 'Enter Codeforces handle',
    profileUrl: (user) => `https://codeforces.com/profile/${user}`,
  },
  {
    key: 'gfg',
    name: 'GEEKSFORGEEKS',
    category: 'DSA',
    borderColor: '#10B981',
    badgeBg: 'rgba(16,185,129,0.15)',
    textColor: '#34D399',
    placeholder: 'Enter GeeksForGeeks handle (e.g. solanki_manan)',
    profileUrl: (user) => `https://www.geeksforgeeks.org/user/${user}/`,
  },
  {
    key: 'codechef',
    name: 'CODECHEF',
    category: 'Competitive Programming',
    borderColor: '#F59E0B',
    badgeBg: 'rgba(245,158,11,0.15)',
    textColor: '#FBBF24',
    placeholder: 'Enter CodeChef username',
    profileUrl: (user) => `https://www.codechef.com/users/${user}`,
  },
  {
    key: 'github',
    name: 'GITHUB',
    category: 'Development',
    borderColor: '#94A3B8',
    badgeBg: 'rgba(148,163,184,0.15)',
    textColor: '#E2E8F0',
    placeholder: 'Enter GitHub username',
    profileUrl: (user) => `https://github.com/${user}`,
  },
];

function PlatformUrlInput({ usernames, setUsernames }) {
  const handleChange = (key, value) => {
    setUsernames((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {PLATFORMS_CONFIG.map((plat) => {
        const val = usernames[plat.key] || '';
        const cleanUser = val.replace(/^https?:\/\/[^/]+\/(u\/|profile\/|users\/|user\/)?/, '').replace(/\/$/, '').trim();

        return (
          <div
            key={plat.key}
            className="rounded-xl p-4 bg-[#151E2E] border border-[#26354A] flex flex-col justify-between transition-all duration-150 hover:border-cyan-400 shadow-md"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3 h-3 rounded-full inline-block shadow-sm"
                  style={{ backgroundColor: plat.borderColor }}
                />
                <div>
                  <h3 className="font-black text-xs tracking-wider text-white">
                    {plat.name}
                  </h3>
                  <span
                    className="text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block mt-0.5"
                    style={{ backgroundColor: plat.badgeBg, color: plat.textColor }}
                  >
                    {plat.category}
                  </span>
                </div>
              </div>

              {/* External Link Icon */}
              {cleanUser ? (
                <a
                  href={plat.profileUrl(cleanUser)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-[#080C14] hover:bg-blue-600/30 text-cyan-400 border border-[#26354A] transition-all"
                  title={`Open ${plat.name} profile`}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <span className="p-1.5 text-slate-600 opacity-40">
                  <ExternalLink className="w-4 h-4" />
                </span>
              )}
            </div>

            {/* Input Box */}
            <div className="relative mt-1">
              <input
                type="text"
                value={val}
                onChange={(e) => handleChange(plat.key, e.target.value)}
                placeholder={plat.placeholder}
                className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl bg-[#080C14] text-white placeholder-slate-500 border border-[#26354A] focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default PlatformUrlInput;
