import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FileCheck, Code, History, Cpu, Settings, LogOut, LogIn, Menu, X } from 'lucide-react';

function Sidebar({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const navItems = [
    {
      to: '/',
      label: 'Resume Matcher',
      icon: <FileCheck className="w-4 h-4 text-cyan-400" />,
    },
    {
      to: '/coding-profile',
      label: 'Coding Profile',
      icon: <Code className="w-4 h-4 text-blue-400" />,
    },
    {
      to: '/history',
      label: 'Analysis History',
      icon: <History className="w-4 h-4 text-purple-400" />,
    },
    {
      to: '/account',
      label: 'Your Account',
      icon: <Settings className="w-4 h-4 text-amber-400" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#050505] text-slate-100 font-sans">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0D0D0E] border-b border-[#222226] sticky top-0 z-40">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
            <Cpu className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-white text-sm tracking-tight">ProfileIQ AI</span>
        </NavLink>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl text-slate-300 hover:text-white bg-[#141416] border border-[#222226]"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-[#0D0D0E] border-r border-[#222226] flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Header */}
          <div className="px-5 py-5 border-b border-[#222226] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-white text-sm tracking-tight">ProfileIQ Suite</h1>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mt-0.5">Developer Platform</span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="px-3 py-5 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              Navigation
            </div>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                    isActive
                      ? 'bg-[#141416] border border-blue-500/40 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-[#141416]/60'
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer User Info */}
        <div className="p-4 border-t border-[#222226] bg-[#050505]/80 space-y-3">
          {user ? (
            <>
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#141416] border border-[#222226]">
                <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center font-extrabold text-cyan-300 text-xs">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">{user.name || 'Developer'}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Sign Up</span>
            </NavLink>
          )}
        </div>
      </aside>

      {/* Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Main Content Container */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

export default Sidebar;
