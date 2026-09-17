import { useState } from 'react';
import { Sparkles, Copy, Check, Zap, Wand2 } from 'lucide-react';
import api from '../api/axios';

function BulletOptimizer() {
  const [bulletText, setBulletText] = useState('');
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [error, setError] = useState('');

  const handleOptimize = async (e) => {
    e.preventDefault();
    if (!bulletText.trim() || loading) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await api.post('/analyses/optimize-bullet', {
        bulletText: bulletText.trim(),
        targetRole,
      });
      setResult(res.data);
    } catch (err) {
      console.error('Failed to optimize bullet point:', err);
      setError('Failed to optimize bullet point. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="bg-[#141416] border border-[#222226] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
      <div className="border-b border-[#222226] pb-4 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Wand2 className="w-3.5 h-3.5" /> Live AI Tool
          </div>
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            Interactive AI Bullet Optimizer
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Paste any bullet point from your resume to generate 3 high-impact ATS optimized variations.
          </p>
        </div>
      </div>

      <form onSubmit={handleOptimize} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-2">
            <label className="block text-xs font-black text-slate-300 uppercase tracking-wider">
              Original Resume Bullet Point
            </label>
            <input
              type="text"
              required
              placeholder='e.g. "Built a web application using React and Node.js for users"'
              value={bulletText}
              onChange={(e) => setBulletText(e.target.value)}
              className="w-full bg-[#050505] text-white text-xs font-medium px-4 py-3 rounded-xl border border-[#222226] focus:outline-none focus:border-cyan-500 transition-all placeholder-slate-600"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-300 uppercase tracking-wider">
              Target Job Context
            </label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full bg-[#050505] text-white text-xs font-bold px-4 py-3 rounded-xl border border-[#222226] focus:outline-none focus:border-cyan-500 transition-all cursor-pointer"
            >
              <option value="Software Engineer">SDE / Software Engineer</option>
              <option value="Senior Frontend Engineer">Senior Frontend Dev</option>
              <option value="Backend Architect">Backend Architect</option>
              <option value="Full-Stack Developer">Full-Stack Developer</option>
              <option value="AI / ML Engineer">AI / ML Engineer</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !bulletText.trim()}
          className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating 3 ATS Bullet Variations...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Optimize Bullet Point with AI
            </span>
          )}
        </button>
      </form>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl">
          {error}
        </div>
      )}

      {/* Output Variations List */}
      {result && (
        <div className="space-y-4 pt-4 border-t border-[#222226]">
          <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider block">
            Generated High-Impact Variations ({result.variations?.length || 0}):
          </span>

          <div className="space-y-4">
            {result.variations?.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#050505] border border-[#222226] rounded-xl p-5 space-y-3 relative group hover:border-cyan-500/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-wider">
                    <Zap className="w-3 h-3 text-cyan-400" /> {item.label}
                  </span>

                  <button
                    onClick={() => handleCopy(item.bullet, idx)}
                    className="px-3 py-1 bg-[#141416] hover:bg-[#222226] border border-[#222226] text-xs font-bold text-slate-300 hover:text-white rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy Bullet</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-white font-extrabold text-xs leading-relaxed">{item.bullet}</p>

                <div className="text-[11px] text-slate-400 font-medium pt-2 border-t border-[#222226]/50">
                  <span className="font-bold text-cyan-400">Why this works: </span>
                  {item.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BulletOptimizer;
