import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { TripPlannerPage } from './pages/TripPlannerPage';
import { ResultsPage } from './pages/ResultsPage';
import { HistoryPage } from './pages/HistoryPage';
import { ItineraryPage } from './pages/ItineraryPage';
import { PublicTripPage } from './pages/PublicTripPage';
import { AcceptInvitePage } from './pages/AcceptInvitePage';
import { PublicProfilePage } from './pages/PublicProfilePage';
import { PhotoAlbumPage } from './pages/PhotoAlbumPage';
import { LeaderboardPage } from './pages/LeaderboardPage';

const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Share Routes (Standalone) */}
      <Route path="/share/:shareId" element={<PublicTripPage />} />
      <Route path="/trip/shared/:shareId" element={<PublicTripPage />} />
      <Route path="/album/:shareId" element={<PhotoAlbumPage />} />

      {/* Main App Layout */}
      <Route element={<Layout />}>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/invite/:token" element={<AcceptInvitePage />} />
        <Route path="/profile/:shareableId" element={<PublicProfilePage />} />
        
        {/* Protected routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plan"
          element={
            <ProtectedRoute>
              <TripPlannerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/results/:tripId"
          element={
            <ProtectedRoute>
              <ResultsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/itinerary/:id"
          element={
            <ProtectedRoute>
              <ItineraryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/itinerary/new"
          element={
            <ProtectedRoute>
              <ItineraryPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
};

export default App;

