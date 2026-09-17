import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, User, LogOut, Code2, Cpu, ChevronDown } from 'lucide-react';

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const isAuthenticated = !!token && token !== 'undefined' && token !== 'null';
  
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch {
    user = null;
  }

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setShowProfileMenu(false);
    navigate('/login');
  };

  return (
    <header className="h-16 bg-[#0D0D0E] border-b border-[#222226] sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between">
      {/* Brand / Logo */}
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 ring-1 ring-white/20 group-hover:scale-105 transition-transform">
            <Cpu className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-white font-black tracking-tight text-base block leading-none">
              ProfileIQ <span className="text-cyan-400 font-extrabold text-xs ml-0.5">AI</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 block mt-0.5 uppercase tracking-wider">Developer Platform</span>
          </div>
        </Link>
      </div>

      {/* Global Search Input */}
      <div className="hidden md:flex items-center relative max-w-md w-full mx-8">
        <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search candidates, DSA topics, platforms..."
          className="w-full bg-[#141416] text-white placeholder-slate-500 text-xs font-bold pl-10 pr-12 py-2 rounded-xl border border-[#222226] focus:outline-none focus:border-blue-500 transition-all"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#050505] text-slate-400 text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#222226]">
          ⌘K
        </kbd>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <>
            {/* Notification Bell */}
            <button
              className="relative p-2 rounded-xl bg-[#141416] text-slate-300 hover:text-white border border-[#222226] hover:border-slate-500 transition-all"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl bg-[#141416] border border-[#222226] hover:border-slate-500 transition-all cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-cyan-300 text-xs font-black uppercase">
                  {user?.name ? user.name[0] : 'U'}
                </div>
                <span className="hidden sm:inline text-xs font-bold text-white">
                  {user?.name || 'Developer'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-[#141416] border border-[#222226] rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-4 py-2.5 border-b border-[#222226]">
                    <p className="text-xs font-black text-white truncate">{user?.name || 'Developer'}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email || 'dev@example.com'}</p>
                  </div>

                  <Link
                    to="/account"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-200 hover:bg-[#222226] hover:text-white transition-colors font-bold"
                  >
                    <User className="w-4 h-4 text-cyan-400" />
                    <span>Your Account</span>
                  </Link>

                  <Link
                    to="/coding-profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-200 hover:bg-[#222226] hover:text-white transition-colors font-bold"
                  >
                    <Code2 className="w-4 h-4 text-purple-400" />
                    <span>Coding Profiles</span>
                  </Link>

                  <div className="my-1 border-t border-[#222226]" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left font-bold cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="text-xs font-black text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl transition-all shadow-md"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
