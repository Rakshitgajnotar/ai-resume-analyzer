import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, ArrowRight, Sparkles, CheckCircle2, ShieldCheck, Zap, Code2 } from 'lucide-react';
import api from '../api/axios';

const SAMPLE_TEMPLATES = [
  {
    title: '🚀 SDE-2 Full-Stack',
    jd: `Role: SDE-2 Full-Stack Engineer\nRequirements: 3+ years experience with React, Node.js, Express, MongoDB, TypeScript, REST APIs, System Design, and Docker. Experience with microservices, Redis caching, CI/CD pipelines, and scalable unit tests.`,
  },
  {
    title: '⚡ Senior Frontend Dev',
    jd: `Role: Senior Frontend Engineer\nRequirements: 4+ years building high-performance web applications using React 19, JavaScript (ES6+), TypeScript, Tailwind CSS, Redux/Zustand, and Next.js. Expertise in web performance, responsive UI, and REST/GraphQL API integration.`,
  },
  {
    title: '🛡️ Backend Architect',
    jd: `Role: Backend Systems Engineer\nRequirements: Deep proficiency in Node.js, Python, PostgreSQL/MongoDB, Redis caching, microservices architecture, System Design, Docker, Kubernetes, AWS, and REST API development.`,
  },
  {
    title: '🧠 AI / Full-Stack Engineer',
    jd: `Role: AI Full-Stack Engineer\nRequirements: Experience building applications with React, Python, Node.js, LLM APIs (Gemini, OpenAI), Vector Databases, REST APIs, and Cloud deployments (AWS/Vercel).`,
  },
];

const TECH_KEYWORDS = [
  'React',
  'Node.js',
  'Express',
  'MongoDB',
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'C++',
  'SQL',
  'Docker',
  'AWS',
  'Redis',
  'GraphQL',
  'System Design',
  'Git',
  'Tailwind',
  'Redux',
  'Kubernetes',
  'REST API',
];

function Dashboard() {
  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const userStr = localStorage.getItem('user');
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch {
    user = null;
  }

  useEffect(() => {
    fetchUsage();
    const saved = sessionStorage.getItem('profileiq_jd_draft');
    if (saved) setJobDescription(saved);
  }, []);

  const handleJdChange = (val) => {
    setJobDescription(val);
    sessionStorage.setItem('profileiq_jd_draft', val);
  };

  const applyTemplate = (jdText) => {
    setJobDescription(jdText);
    sessionStorage.setItem('profileiq_jd_draft', jdText);
  };

  const fetchUsage = async () => {
    try {
      const res = await api.get('/auth/usage');
      setUsage(res.data);
    } catch (err) {
      console.error('Failed to fetch usage', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null') {
      navigate('/login');
      return;
    }

    if (!resume || !jobDescription) {
      setError('Please select a PDF resume and paste the target job description.');
      return;
    }

    setLoading(true);
    setError('');
    setStatusText('Uploading & parsing resume...');

    const formData = new FormData();
    formData.append('resume', resume);
    formData.append('jobDescription', jobDescription);

    try {
      const response = await api.post('/analyses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { analysisId } = response.data;
      pollStatus(analysisId);
    } catch (err) {
      console.error('Analysis submission error:', err);
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to start analysis.');
      setLoading(false);
    }
  };

  const pollStatus = async (id) => {
    try {
      const res = await api.get(`/analyses/${id}`);
      const status = res.data.status;

      if (status === 'complete') {
        navigate(`/result/${id}`);
      } else if (status === 'failed') {
        setError('Analysis failed: ' + res.data.error);
        setLoading(false);
      } else {
        setStatusText(`Analyzing with AI model: ${status}...`);
        setTimeout(() => pollStatus(id), 1500);
      }
    } catch (err) {
      console.error('Error checking status:', err);
      setError('Error checking analysis status.');
      setLoading(false);
    }
  };

  const extractedSkills = TECH_KEYWORDS.filter((kw) =>
    jobDescription.toLowerCase().includes(kw.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 sm:p-8 rounded-2xl bg-[#141416] border border-[#222226] shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Resume Screener & ATS Matcher</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Welcome back, <span className="text-cyan-400">{user?.name || 'Developer'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl font-medium">
            Upload your resume and paste a job description to get instant AI feedback, keyword coverage analysis, and detailed ATS match scoring.
          </p>
        </div>

        {usage && (
          <div className="bg-[#050505] border border-[#222226] p-4 rounded-xl text-center min-w-[180px]">
            <span className="text-[10px] font-black text-purple-400 block uppercase tracking-wider">
              ANALYSES TODAY
            </span>
            <span className="text-2xl font-black text-white mt-1 block">{usage.analysesToday}</span>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center justify-center gap-1 mt-1">
              <ShieldCheck className="w-3 h-3" /> Unlimited Quota
            </span>
          </div>
        )}
      </div>

      {/* New Analysis Upload Form */}
      <div className="bg-[#141416] border border-[#222226] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="border-b border-[#222226] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Run AI Resume Matcher
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Upload your resume PDF and paste the target job description to generate detailed ATS match scoring and skill suggestions.
            </p>
          </div>
        </div>

        {/* 1-Click Preset Templates Bar */}
        <div className="bg-[#080809] p-4 rounded-xl border border-[#222226] space-y-2">
          <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3 h-3" /> 1-Click Sample Job Presets:
          </span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyTemplate(tmpl.jd)}
                className="px-3 py-1.5 bg-[#141416] hover:bg-cyan-500/10 hover:border-cyan-500/30 text-slate-300 hover:text-cyan-300 border border-[#222226] text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                {tmpl.title}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-xs font-bold">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Step 1: Clickable Upload Box */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                <span>1.</span> SELECT RESUME (PDF)
              </label>

              <label
                htmlFor="resume-upload-input"
                className="border-2 border-dashed border-[#222226] hover:border-cyan-400 rounded-2xl p-8 text-center bg-[#050505] transition-all cursor-pointer block group min-h-[220px] flex flex-col items-center justify-center"
              >
                <input
                  id="resume-upload-input"
                  type="file"
                  accept=".pdf"
                  ref={fileInputRef}
                  onChange={(e) => setResume(e.target.files[0])}
                  className="hidden"
                />

                <Upload className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform mb-3" />

                <div className="space-y-1">
                  <span className="px-4 py-2 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-500 transition-all inline-block shadow-md">
                    Choose PDF Resume File
                  </span>
                  <p className="text-[11px] text-slate-400 mt-2 font-medium">
                    Click anywhere inside this box to select your PDF resume
                  </p>
                </div>

                {resume && (
                  <div className="mt-4 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-extrabold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Selected: {resume.name}
                  </div>
                )}
              </label>
            </div>

            {/* Step 2: Target Job Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1">
                  <span>2.</span> TARGET JOB DESCRIPTION / ROLE
                </label>
                {jobDescription && (
                  <span className="text-[10px] text-slate-500 font-bold">Auto-saved draft</span>
                )}
              </div>
              <textarea
                required
                rows="7"
                className="w-full px-4 py-3.5 bg-[#050505] text-slate-100 placeholder-slate-500 border-2 border-[#222226] rounded-2xl focus:outline-none focus:border-purple-500 text-xs font-mono transition-all min-h-[220px]"
                placeholder="Paste the full job description text or role title here (e.g. SDE, Frontend Developer, or full JD)..."
                value={jobDescription}
                onChange={(e) => handleJdChange(e.target.value)}
              />
            </div>
          </div>

          {/* Real-time Extracted Skill Keywords Preview */}
          {extractedSkills.length > 0 && (
            <div className="p-4 rounded-xl bg-[#050505] border border-[#222226] space-y-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Code2 className="w-3.5 h-3.5 text-cyan-400" /> Detected Target Skills in Job Description ({extractedSkills.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {extractedSkills.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-bold rounded-lg"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-2xl text-sm font-black text-white transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
              loading
                ? 'bg-blue-600/50 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {statusText}
              </span>
            ) : (
              <span className="flex items-center gap-2 uppercase tracking-wider">
                Analyze Resume ATS Compatibility <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Dashboard;
