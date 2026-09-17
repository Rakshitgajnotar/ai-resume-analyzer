import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  TrendingUp,
  PlusCircle,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
} from 'lucide-react';
import api from '../api/axios';
import ResumeChat from '../components/ResumeChat';
import BulletOptimizer from '../components/BulletOptimizer';
import ReportExport from '../components/ReportExport';

function Result() {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedBulletIdx, setCopiedBulletIdx] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    let timerId;

    const fetchAnalysis = async () => {
      try {
        const res = await api.get(`/analyses/${id}`);
        setAnalysis(res.data);
        setError('');

        if (res.data.status === 'pending' || res.data.status === 'processing') {
          timerId = setTimeout(fetchAnalysis, 1500);
        } else if (res.data.status === 'failed') {
          setError(res.data.error || 'AI analysis failed for this document.');
        } else if (res.data.status === 'completed') {
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
      } catch (err) {
        console.error('Failed to load analysis:', err);
        setError(err.response?.data?.error || 'Analysis record not found or access denied.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [id]);

  const handleCopyText = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedBulletIdx(idx);
    setTimeout(() => setCopiedBulletIdx(null), 2000);
  };

  if (loading || (analysis && (analysis.status === 'pending' || analysis.status === 'processing')))
    return (
      <div className="flex flex-col items-center justify-center py-24 text-cyan-400 text-xs font-extrabold space-y-3">
        <span className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-black text-white">Analyzing Resume ATS Compatibility...</span>
        <span className="text-xs text-slate-400 font-medium">Extracting keywords, scoring skills & generating AI recommendations</span>
      </div>
    );

  if (error)
    return (
      <div className="max-w-xl mx-auto py-16 px-6 text-center space-y-4">
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 space-y-2">
          <AlertCircle className="w-8 h-8 mx-auto text-rose-400 mb-1" />
          <h3 className="text-sm font-black uppercase tracking-wider">Analysis Load Notice</h3>
          <p className="text-xs font-semibold text-rose-300">{error}</p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md"
          >
            Go to Resume Matcher
          </Link>
          <Link
            to="/history"
            className="px-4 py-2 bg-[#141416] border border-[#222226] text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all"
          >
            View Analysis History
          </Link>
        </div>
      </div>
    );

  if (!analysis || !analysis.result)
    return (
      <div className="text-center py-24 text-slate-400 text-xs font-bold">
        Analysis result not found or incomplete.
      </div>
    );

  const { result } = analysis;
  const scoreColor =
    result.matchScore >= 80
      ? 'text-emerald-400'
      : result.matchScore >= 60
      ? 'text-amber-400'
      : 'text-rose-400';
  const strokeColor =
    result.matchScore >= 80 ? '#22C55E' : result.matchScore >= 60 ? '#F59E0B' : '#EF4444';

  const strengthsList = result.strengths || [];
  const weaknessesList = result.weaknesses || result.gaps || [];
  const whatToAddList = result.whatCanBeAdded || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Back Navigation Bar & Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-extrabold text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Resume Matcher
        </Link>

        <div className="flex items-center gap-4">
          <ReportExport analysis={analysis} />
          <div className="text-xs font-semibold text-slate-400 border-l border-[#222226] pl-4 hidden sm:block">
            Analyzed on {new Date(analysis.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Main Score Hero Card */}
      <div className="bg-[#141416] p-6 sm:p-8 rounded-2xl shadow-xl border border-[#222226] flex flex-col md:flex-row gap-8 items-center">
        <div className="relative w-44 h-44 flex-shrink-0 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 176 176">
            <circle cx="88" cy="88" r="72" stroke="#222226" strokeWidth="12" fill="transparent" />
            <circle
              cx="88"
              cy="88"
              r="72"
              stroke={strokeColor}
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 72}
              strokeDashoffset={2 * Math.PI * 72 * (1 - result.matchScore / 100)}
              className="transition-all duration-1000 ease-out"
              strokeLinecap="round"
            />
          </svg>
          <div className="text-center relative z-10 flex flex-col items-center justify-center">
            <span className={`text-4xl font-black tracking-tight ${scoreColor}`}>
              {result.matchScore}%
            </span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
              ATS MATCH SCORE
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Resume Intelligence Report</span>
          </div>
          <h2 className="text-2xl font-black text-white">Match Overview</h2>
          <p className="text-slate-300 leading-relaxed text-xs sm:text-sm font-medium">
            {result.summary}
          </p>
        </div>
      </div>

      {/* Keywords Breakdown Grid (Matched vs Missing) */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Matched Keywords */}
        <div className="bg-[#141416] p-6 rounded-2xl border border-[#222226] space-y-4 shadow-xl">
          <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Matched Skills & Keywords
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.matchedKeywords?.map((kw, i) => (
              <span
                key={i}
                className="px-3 py-1.5 bg-emerald-500/10 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-500/30"
              >
                {kw}
              </span>
            ))}
            {(!result.matchedKeywords || result.matchedKeywords.length === 0) && (
              <span className="text-slate-500 text-xs font-semibold">No direct matches found</span>
            )}
          </div>
        </div>

        {/* Missing Keywords */}
        <div className="bg-[#141416] p-6 rounded-2xl border border-[#222226] space-y-4 shadow-xl">
          <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            Missing Essential Keywords
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.missingKeywords?.map((kw, i) => (
              <span
                key={i}
                className="px-3 py-1.5 bg-rose-500/10 text-rose-300 text-xs font-bold rounded-xl border border-rose-500/30"
              >
                {kw}
              </span>
            ))}
            {(!result.missingKeywords || result.missingKeywords.length === 0) && (
              <span className="text-slate-500 text-xs font-semibold">
                No missing keywords identified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Strong Part & Weak Part Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Strong Part */}
        <div className="bg-[#141416] p-6 rounded-2xl border border-[#222226] space-y-4 shadow-xl">
          <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
            <ThumbsUp className="w-4 h-4 text-blue-400" />
            Strong Parts of Resume
          </h3>
          <ul className="space-y-2.5">
            {strengthsList.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
            {strengthsList.length === 0 && (
              <li className="text-slate-500 text-xs font-semibold">No strengths recorded</li>
            )}
          </ul>
        </div>

        {/* Weak Part */}
        <div className="bg-[#141416] p-6 rounded-2xl border border-[#222226] space-y-4 shadow-xl">
          <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
            <ThumbsDown className="w-4 h-4 text-amber-400" />
            Weak Parts & Skill Gaps
          </h3>
          <ul className="space-y-2.5">
            {weaknessesList.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
            {weaknessesList.length === 0 && (
              <li className="text-slate-500 text-xs font-semibold">No major weak areas found</li>
            )}
          </ul>
        </div>
      </div>

      {/* What Can Be Added Section */}
      <div className="bg-[#141416] p-6 sm:p-8 rounded-2xl border border-[#222226] space-y-4 shadow-xl">
        <h3 className="text-base font-black text-white flex items-center gap-2 uppercase tracking-wider">
          <PlusCircle className="w-5 h-5 text-cyan-400" />
          What Can Be Added to Boost Your Score
        </h3>
        <div className="grid gap-3">
          {whatToAddList.map((tip, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-[#0D0D0E] border border-[#222226] flex items-start gap-3 text-xs font-semibold text-slate-200"
            >
              <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 font-extrabold text-xs">
                {i + 1}
              </div>
              <p className="leading-relaxed mt-0.5">{tip}</p>
            </div>
          ))}
          {whatToAddList.length === 0 && (
            <p className="text-slate-500 text-xs font-semibold">
              No specific additional items needed.
            </p>
          )}
        </div>
      </div>

      {/* Suggested Bullet Point Rewrites */}
      <div className="bg-[#141416] p-6 sm:p-8 rounded-2xl border border-[#222226] space-y-6 shadow-xl">
        <h3 className="text-xl font-black text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          Suggested Quantified Bullet Rewrites
        </h3>

        <div className="space-y-6">
          {result.suggestedBullets?.map((bullet, i) => (
            <div
              key={i}
              className="border border-[#222226] rounded-xl overflow-hidden bg-[#050505]"
            >
              <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#222226]">
                <div className="p-5 space-y-2">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Original Bullet
                  </div>
                  <p className="text-slate-300 text-xs font-medium leading-relaxed">
                    {bullet.original}
                  </p>
                </div>
                <div className="p-5 space-y-2 bg-cyan-500/5 relative group">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">
                      ATS Improved Bullet
                    </div>
                    <button
                      onClick={() => handleCopyText(bullet.improved, i)}
                      className="px-2.5 py-1 bg-[#141416] hover:bg-[#222226] border border-[#222226] text-[10px] font-bold text-slate-300 rounded-md transition-all flex items-center gap-1 cursor-pointer"
                    >
                      {copiedBulletIdx === i ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-400" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-white font-bold text-xs leading-relaxed">{bullet.improved}</p>
                </div>
              </div>
              <div className="px-5 py-3 bg-[#0D0D0E] border-t border-[#222226] text-xs text-slate-300 font-medium">
                <span className="font-bold text-cyan-400">Why this helps: </span>
                {bullet.reason}
              </div>
            </div>
          ))}
          {(!result.suggestedBullets || result.suggestedBullets.length === 0) && (
            <div className="text-slate-500 text-center py-4 text-xs font-semibold">
              No bullet improvements suggested.
            </div>
          )}
        </div>
      </div>

      {/* Interactive AI Bullet Optimizer Tool */}
      <BulletOptimizer />

      {/* AI Resume Chatbot Assistant */}
      <ResumeChat analysisId={id} initialChatHistory={analysis.chatHistory || []} />
    </div>
  );
}

export default Result;
