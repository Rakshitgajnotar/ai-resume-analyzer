import { useState, useEffect } from 'react';
import { fetchCodingProfile, getCodingProfile } from '../api/codingProfile.api';
import PlatformUrlInput from '../components/coding-profile/PlatformUrlInput';
import CodingScoreCard from '../components/coding-profile/CodingScoreCard';
import PlatformCard from '../components/coding-profile/PlatformCard';
import DSATab from '../components/coding-profile/DSATab';
import CompetitiveProgrammingTab from '../components/coding-profile/CompetitiveProgrammingTab';
import DevelopmentTab from '../components/coding-profile/DevelopmentTab';
import ActivityHeatmap from '../components/coding-profile/ActivityHeatmap';
import { Zap, RefreshCw, Code2, Trophy, GitBranch, Layers, Cpu } from 'lucide-react';

const TABS = [
  { id: 'dsa', label: 'DSA Problems', icon: <Code2 className="w-4 h-4 text-blue-400" /> },
  { id: 'cp', label: 'Competitive Programming', icon: <Trophy className="w-4 h-4 text-purple-400" /> },
  { id: 'dev', label: 'Development (GitHub)', icon: <GitBranch className="w-4 h-4 text-slate-400" /> },
];

function SkeletonCard() {
  return (
    <div className="rounded-xl p-6 bg-[#111827] border border-[#334155] animate-pulse space-y-4">
      <div className="h-4 rounded bg-[#1E293B] w-40" />
      <div className="h-8 rounded bg-[#1E293B] w-32" />
      <div className="h-3 rounded bg-[#1E293B] w-full" />
    </div>
  );
}

function CodingProfile() {
  const [usernames, setUsernames] = useState({
    leetcode: '',
    codeforces: '',
    gfg: '',
    codechef: '',
    github: '',
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [activeTab, setActiveTab] = useState('dsa');
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    loadExistingProfile();
  }, []);

  async function loadExistingProfile() {
    try {
      const res = await getCodingProfile();
      if (res.data?.success && res.data?.platforms && res.data?.exists !== false) {
        setProfileData(res.data);
        setFromCache(res.data.fromCache);

        const initial = { leetcode: '', codeforces: '', gfg: '', codechef: '', github: '' };
        for (const [k, v] of Object.entries(res.data.platforms)) {
          if (v?.username) initial[k] = v.username;
        }
        setUsernames(initial);
        localStorage.setItem('profileiq_handles', JSON.stringify(initial));
      } else {
        const localSaved = localStorage.getItem('profileiq_handles');
        if (localSaved) {
          try {
            setUsernames(JSON.parse(localSaved));
          } catch {}
        }
      }
    } catch {
      const localSaved = localStorage.getItem('profileiq_handles');
      if (localSaved) {
        try {
          setUsernames(JSON.parse(localSaved));
        } catch {}
      }
    } finally {
      setInitialLoading(false);
    }
  }

  async function handleFetch(forceRefresh = false) {
    const hasAnyInput = Object.values(usernames).some((val) => val && val.trim());
    if (!hasAnyInput) {
      setError('Please enter at least one platform username.');
      return;
    }

    setLoading(true);
    setError(null);
    localStorage.setItem('profileiq_handles', JSON.stringify(usernames));

    try {
      const res = await fetchCodingProfile(usernames, forceRefresh);
      if (res.data?.success) {
        setProfileData(res.data);
        setFromCache(res.data.fromCache);
      } else {
        setError(res.data?.error || 'Failed to fetch coding profile.');
      }
    } catch (err) {
      console.error('Coding profile fetch error:', err);
      const msg = err.response?.data?.error || (err.message === 'Network Error' ? 'Network error connecting to platform. Please try again.' : err.message) || 'Something went wrong.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const platforms = profileData?.platforms;
  const aggregated = profileData?.aggregated;
  const SUPPORTED = ['leetcode', 'codeforces', 'codechef', 'gfg', 'github'];
  const linkedPlatforms = platforms ? Object.entries(platforms).filter(([k, v]) => v?.linked && SUPPORTED.includes(k)) : [];

  const lcCalendar = platforms?.leetcode?.data?.submissionCalendar;
  const ghCalendar = platforms?.github?.data?.contributionCalendar;
  const calendarData = lcCalendar || ghCalendar || [];
  const lcStreak = platforms?.leetcode?.data?.streak || 0;
  const lcActiveDays = platforms?.leetcode?.data?.totalActiveDays || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>Unified Developer Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Coding Profile & DSA Aggregator
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Connect LeetCode, Codeforces, GeeksForGeeks, CodeChef, and GitHub into a single developer dashboard.
          </p>
        </div>

        {linkedPlatforms.length > 0 && (
          <button
            onClick={() => handleFetch(true)}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Syncing Profiles...' : '1-Click Sync All Profiles'}</span>
          </button>
        )}
      </div>

      {/* Input Platform Section */}
      <div className="bg-[#111827] border border-[#334155] rounded-2xl p-5 sm:p-7 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#334155] pb-3">
          <h2 className="text-xs font-extrabold tracking-wider text-slate-300 uppercase flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            Connect Platform Handles
          </h2>
          <span className="text-xs text-blue-400 font-semibold">Username or Profile URL</span>
        </div>

        <PlatformUrlInput usernames={usernames} setUsernames={setUsernames} />

        {error && (
          <div className="p-3.5 rounded-xl text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-400">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => handleFetch(false)}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Fetching Platform Data...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 fill-white" /> Fetch My Stats
              </span>
            )}
          </button>

          {profileData && (
            <button
              onClick={() => handleFetch(true)}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-[#1E293B] hover:bg-slate-700 border border-[#334155] transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          )}
        </div>

        {profileData?.lastFetchedAt && (
          <p className="text-[11px] text-slate-400">
            {fromCache ? '📦 Cached result · ' : ''}
            Last updated: {new Date(profileData.lastFetchedAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* Skeleton Loading */}
      {(loading || initialLoading) && !profileData && (
        <div className="space-y-6">
          <SkeletonCard />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      )}

      {/* Profile Dashboard Data */}
      {profileData && aggregated && (
        <div className="space-y-8">
          {/* Summary Overview Banner */}
          <CodingScoreCard aggregated={aggregated} platforms={platforms} />

          {/* Connected Platform Breakdown Cards */}
          {linkedPlatforms.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-extrabold tracking-wider text-slate-400 uppercase">
                CONNECTED PLATFORMS
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {linkedPlatforms.map(([platform, info]) => (
                  <PlatformCard key={platform} platform={platform} info={info} />
                ))}
              </div>
            </div>
          )}

          {/* Active Days Submission Calendar */}
          <ActivityHeatmap
            data={calendarData}
            activeDaysCount={lcActiveDays}
            currentStreak={lcStreak}
          />

          {/* Category Tabs Section */}
          <div className="space-y-6">
            <div className="flex gap-2 p-1.5 rounded-xl bg-[#111827] border border-[#334155] inline-flex flex-wrap">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#1E293B]'
                  }`}
                >
                  {tab.icon} <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Views */}
            <div>
              {activeTab === 'dsa' && (
                <DSATab platforms={platforms} aggregated={aggregated} />
              )}
              {activeTab === 'cp' && (
                <CompetitiveProgrammingTab platforms={platforms} />
              )}
              {activeTab === 'dev' && (
                <DevelopmentTab platforms={platforms} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CodingProfile;
