import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Trash2, Eye, Plus, Sparkles, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import api from '../api/axios';

function History() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/analyses');
      setAnalyses(res.data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
      setError('Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this analysis record?')) return;
    try {
      await api.delete(`/analyses/${id}`);
      setAnalyses(analyses.filter(a => a._id !== id));
    } catch (err) {
      console.error('Failed to delete analysis:', err);
      alert('Failed to delete analysis');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-slate-400 text-sm">
      <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
      Loading analysis history...
    </div>
  );

  if (error) return (
    <div className="max-w-xl mx-auto p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold text-center">
      {error}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#111827] border border-[#334155] shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Analysis Archive</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Resume ATS Analysis History</h1>
          <p className="text-xs text-slate-400 mt-1">Review past AI ATS match reports and job description scores.</p>
        </div>

        <Link
          to="/"
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Analysis
        </Link>
      </div>

      {analyses.length === 0 ? (
        <div className="bg-[#111827] border border-[#334155] rounded-2xl p-12 text-center space-y-4 shadow-xl">
          <FileText className="w-12 h-12 text-slate-500 mx-auto opacity-40" />
          <h3 className="text-base font-bold text-white">No Resume Analyses Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Upload your resume PDF along with a target job description to generate your first ATS match report.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all"
          >
            <Plus className="w-4 h-4" /> Start First Analysis
          </Link>
        </div>
      ) : (
        <div className="bg-[#111827] border border-[#334155] rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#1E293B] text-slate-400 uppercase font-extrabold text-[10px] tracking-wider border-b border-[#334155]">
                <tr>
                  <th className="px-6 py-4">Resume File</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Match Score</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]">
                {analyses.map((analysis) => (
                  <tr key={analysis._id} className="hover:bg-[#1E293B]/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-white flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span className="truncate max-w-xs">{analysis.resumeFileName}</span>
                    </td>
                    <td className="px-6 py-4">
                      {analysis.status === 'complete' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Complete
                        </span>
                      ) : analysis.status === 'failed' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Failed
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 animate-spin" /> Processing
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-black text-white text-sm">
                      {analysis.status === 'complete' ? (
                        <span className="text-blue-400 font-extrabold">{analysis.result?.matchScore} / 100</span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(analysis.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link
                        to={`/result/${analysis._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </Link>
                      <button
                        onClick={() => handleDelete(analysis._id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default History;
