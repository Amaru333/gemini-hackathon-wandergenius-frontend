import React from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Compass, User, LogOut, History, Map, Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ChatWidget } from './ChatWidget';

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-slate-900">
                WanderGenius <span className="text-indigo-600">AI</span>
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/plan"
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
                      isActive('/plan')
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Map className="w-4 h-4" />
                    <span className="hidden sm:inline">Plan Trip</span>
                  </Link>
                  <Link
                    to="/history"
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
                      isActive('/history')
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <History className="w-4 h-4" />
                    <span className="hidden sm:inline">History</span>
                  </Link>
                  <Link
                    to="/profile"
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
                      isActive('/profile')
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">{user?.name || 'Profile'}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-all"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children || <Outlet />}</main>

      {/* Footer */}
      <footer className="py-12 mt-20 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-4">
          <div className="flex items-center justify-center gap-6">
            <div className="h-px bg-slate-200 flex-grow max-w-[100px]"></div>
            <Compass className="text-slate-300 w-6 h-6" />
            <div className="h-px bg-slate-200 flex-grow max-w-[100px]"></div>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/leaderboard"
              className="flex items-center gap-2 text-slate-500 hover:text-amber-600 transition-colors font-medium"
            >
              <Trophy className="w-4 h-4" />
              Leaderboard
            </Link>
          </div>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">
            © 2024 WanderGenius AI Labs • Global Travel Intelligence
          </p>
        </div>
      </footer>

      {/* Chat Widget - Only for authenticated users */}
      {isAuthenticated && <ChatWidget />}
    </div>
  );
};
