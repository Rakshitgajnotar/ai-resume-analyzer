import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut, Sparkles } from 'lucide-react';

function Account() {
  const navigate = useNavigate();
  const userJson = localStorage.getItem('user');
  let user = null;
  try {
    user = userJson ? JSON.parse(userJson) : null;
  } catch {
    user = null;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Account & Security Settings</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Your Account & Preferences</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">Manage profile credentials, system access, and security options.</p>
      </div>

      {/* Account Info Card */}
      <div className="bg-[#111827] border border-[#334155] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-[#334155]">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-black text-blue-400 text-2xl shadow-md">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">{user?.name || 'Developer User'}</h2>
            <p className="text-xs text-blue-400 font-semibold">{user?.email || 'user@example.com'}</p>
            <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" /> Active Developer Access
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#1E293B] p-4 rounded-xl border border-[#334155] space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Full Name</span>
            <span className="text-sm font-bold text-white block">{user?.name || 'Developer'}</span>
          </div>
          <div className="bg-[#1E293B] p-4 rounded-xl border border-[#334155] space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Email Address</span>
            <span className="text-sm font-bold text-white block">{user?.email || 'N/A'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 flex flex-wrap gap-4 border-t border-[#334155]">
          <button
            onClick={handleLogout}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sign Out of ProfileIQ
          </button>
        </div>
      </div>
    </div>
  );
}

export default Account;
