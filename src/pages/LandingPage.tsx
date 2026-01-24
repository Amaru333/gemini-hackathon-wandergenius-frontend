import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, MapPin, Sparkles, User, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      {/* Hero Section */}
      <div className="text-center mb-20 space-y-6">
        <div className="inline-flex items-center justify-center p-5 bg-indigo-600 rounded-3xl text-white shadow-2xl mb-6 transform hover:scale-110 transition-transform">
          <Compass className="w-12 h-12" />
        </div>
        <h1 className="text-6xl font-extrabold text-slate-900 tracking-tight">
          WanderGenius <span className="text-indigo-600">AI</span>
        </h1>
        <p className="text-slate-600 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
          Discover your perfect destination with AI-powered travel intelligence 
          tailored to your unique interests, hobbies, and travel style.
        </p>
        <div className="flex items-center justify-center gap-4 pt-6">
          {isAuthenticated ? (
            <Link
              to="/plan"
              className="flex items-center gap-3 bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-bold hover:bg-indigo-700 transition-all shadow-2xl group"
            >
              Start Planning
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="flex items-center gap-3 bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-bold hover:bg-indigo-700 transition-all shadow-2xl group"
              >
                Get Started Free
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-3 bg-white text-slate-700 px-10 py-5 rounded-[2rem] font-bold hover:bg-slate-100 transition-all border-2 border-slate-100"
              >
                Log In
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow">
          <div className="p-3 bg-indigo-100 rounded-xl w-fit mb-4">
            <User className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Personalized Profiles</h3>
          <p className="text-slate-600">
            Tell us your interests, hobbies, and travel style. We remember your preferences for every trip.
          </p>
        </div>
        <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow">
          <div className="p-3 bg-emerald-100 rounded-xl w-fit mb-4">
            <Sparkles className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">AI-Powered Insights</h3>
          <p className="text-slate-600">
            Our Gemini AI analyzes destinations and matches them perfectly to your unique travel personality.
          </p>
        </div>
        <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow">
          <div className="p-3 bg-amber-100 rounded-xl w-fit mb-4">
            <MapPin className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Trip History</h3>
          <p className="text-slate-600">
            Save and revisit your travel plans anytime. Your adventure history is always one click away.
          </p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-slate-900 rounded-[3rem] p-12 text-center text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/20 blur-[100px] -ml-32 -mb-32"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-4">Ready to explore?</h2>
          <p className="text-slate-300 max-w-lg mx-auto mb-8">
            Join thousands of travelers who have discovered their perfect destinations with WanderGenius AI.
          </p>
          <Link
            to={isAuthenticated ? "/plan" : "/register"}
            className="inline-flex items-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-2xl font-bold hover:bg-slate-100 transition-all"
          >
            {isAuthenticated ? "Plan Your Next Adventure" : "Create Free Account"}
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
