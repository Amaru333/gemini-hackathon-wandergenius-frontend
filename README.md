# WanderGenius AI - Frontend

[![Frontend](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=flat&logo=react)](https://github.com/Amaru333/gemini-hackathon-wandergenius-frontend)
[![Backend](https://img.shields.io/badge/Backend-Node.js-339933?style=flat&logo=node.js)](https://github.com/Amaru333/gemini-hackathon-wandergenius-backend)

| Repository   | Link                                                                                                                             |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend** | [github.com/Amaru333/gemini-hackathon-wandergenius-frontend](https://github.com/Amaru333/gemini-hackathon-wandergenius-frontend) |
| **Backend**  | [github.com/Amaru333/gemini-hackathon-wandergenius-backend](https://github.com/Amaru333/gemini-hackathon-wandergenius-backend)   |

---

A modern, AI-powered travel planning application built with React 19, TypeScript, and Vite. WanderGenius helps users discover personalized travel destinations, create detailed itineraries, collaborate with fellow travelers, and document their journeys.

## Features

### Core Features

- **AI-Powered Trip Planning**: Generate personalized destination recommendations using Google's Gemini AI based on user preferences, interests, and travel style
- **Interactive Itinerary Builder**: Create day-by-day travel plans with activities, timing, and location details
- **Real-time Weather Integration**: View current weather and 5-day forecasts for destinations with °C/°F toggle
- **Interactive Maps**: Leaflet-powered maps for location selection and destination visualization

### Social & Collaboration

- **Trip Sharing**: Share trips publicly with unique URLs
- **Team Collaboration**: Invite collaborators (editors/viewers) to plan trips together
- **Activity Voting**: Vote on activities within shared itineraries
- **Trip Reviews**: Rate trips on budget, location, activities, and overall experience
- **Public Profiles**: Shareable traveler profiles with stats and badges
- **Leaderboards**: Community rankings by trips completed, states visited, and review ratings

### Trip Management

- **Budget Tracker**: Track expenses, split costs among participants, visualize spending with charts
- **Packing Lists**: Smart checklists with categories, save templates for reuse
- **Photo Journal**: Upload and organize trip photos by day with captions and locations
- **Travel Stats**: Track destinations visited, reviews written, and badges earned

### Gamification

- **Achievement Badges**: Earn badges for milestones (First Trip, Jet Setter, World Traveler, Critic, Explorer, etc.)
- **Personalized Suggestions**: AI-generated trip recommendations based on past reviews and preferences

### Offline Mode (PWA)

- **Save Trips Offline**: Download trips with full itinerary, packing list, and maps for offline access
- **Offline Maps**: Map tiles are cached for the destination area (10-15km radius)
- **Offline Indicator**: Visual feedback when you're offline with access to saved trips
- **Installable App**: Install as a Progressive Web App on mobile and desktop
- **Auto-sync**: Changes sync automatically when back online

## Tech Stack

| Technology              | Purpose                      |
| ----------------------- | ---------------------------- |
| React 19                | UI Framework                 |
| TypeScript              | Type Safety                  |
| Vite 6                  | Build Tool & Dev Server      |
| React Router 7          | Client-side Routing          |
| Tailwind CSS            | Styling (via inline classes) |
| Leaflet / React-Leaflet | Interactive Maps             |
| Recharts                | Budget Visualization Charts  |
| Lucide React            | Icon Library                 |
| React Markdown          | Markdown Rendering           |
| html-to-image           | Image Export                 |
| vite-plugin-pwa         | PWA & Service Worker         |
| idb                     | IndexedDB Wrapper            |
| workbox-window          | Service Worker Registration  |

## Project Structure

```
wandergenius-ai/
├── src/
│   ├── App.tsx                 # Main app with routing configuration
│   ├── index.tsx               # Application entry point
│   ├── types.ts                # TypeScript type definitions
│   │
│   ├── components/             # Reusable UI components
│   │   ├── AddExpenseModal.tsx # Modal for adding trip expenses
│   │   ├── BadgeCard.tsx       # Achievement badge display
│   │   ├── BudgetTracker.tsx   # Expense tracking & visualization
│   │   ├── ChatWidget.tsx      # AI chat assistant widget
│   │   ├── DestinationsMap.tsx # Map showing trip destinations
│   │   ├── InviteModal.tsx     # Team collaboration invitations
│   │   ├── Layout.tsx          # App layout with navigation
│   │   ├── LocationMap.tsx     # Location picker map
│   │   ├── PackingList.tsx     # Trip packing checklist
│   │   ├── PhotoJournal.tsx    # Trip photo management
│   │   ├── ProtectedRoute.tsx  # Auth route wrapper
│   │   ├── RecommendedTrips.tsx# Top-rated trip recommendations
│   │   ├── ReviewModal.tsx     # Trip review form
│   │   ├── ShareTripModal.tsx  # Trip sharing options
│   │   ├── StarRating.tsx      # Star rating input/display
│   │   ├── TravelStats.tsx     # User travel statistics
│   │   ├── VotingButtons.tsx       # Activity voting controls
│   │   ├── WeatherCard.tsx         # Weather display widget
│   │   ├── OfflineIndicator.tsx    # Offline status banner & badge
│   │   ├── OfflineMapTileLayer.tsx # Cached map tiles for offline
│   │   └── SaveOfflineButton.tsx   # Download trip for offline
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx     # Authentication state management
│   │   └── OfflineContext.tsx  # Offline state & IndexedDB management
│   │
│   ├── pages/                  # Route page components
│   │   ├── AcceptInvitePage.tsx    # Collaboration invite acceptance
│   │   ├── HistoryPage.tsx         # Trip history listing
│   │   ├── ItineraryPage.tsx       # Detailed trip view
│   │   ├── LandingPage.tsx         # Homepage
│   │   ├── LeaderboardPage.tsx     # Community leaderboards
│   │   ├── LoginPage.tsx           # User login
│   │   ├── PhotoAlbumPage.tsx      # Public photo album view
│   │   ├── ProfilePage.tsx         # User profile & settings
│   │   ├── PublicProfilePage.tsx   # Public traveler profile
│   │   ├── PublicTripPage.tsx      # Shared trip view
│   │   ├── RegisterPage.tsx        # User registration
│   │   ├── ResultsPage.tsx         # AI recommendation results
│   │   ├── TripPlannerPage.tsx     # Trip planning form
│   │   └── OfflineTripsPage.tsx    # Offline saved trips management
│   │
│   └── services/
│       ├── api.ts              # API client service
│       └── offlineStorage.ts   # IndexedDB offline storage
│
├── index.html                  # HTML entry point
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies & scripts
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running (see backend README)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd wandergenius-ai
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**

   Create a `.env.local` file in the root directory:

   ```env
   VITE_API_URL=http://localhost:5001/api
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

### Available Scripts

| Command           | Description                           |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Start development server on port 3000 |
| `npm run build`   | Build for production                  |
| `npm run preview` | Preview production build              |

## Configuration

### API Endpoint

The frontend connects to the backend API at `http://localhost:5001/api` by default. To change this, update the `API_URL` constant in `src/services/api.ts`.

### Environment Variables

| Variable       | Description                                         | Required |
| -------------- | --------------------------------------------------- | -------- |
| `VITE_API_URL` | Backend API URL (e.g., `http://localhost:5001/api`) | Yes      |

## Routes

### Public Routes

| Path                    | Component         | Description                 |
| ----------------------- | ----------------- | --------------------------- |
| `/`                     | LandingPage       | Homepage                    |
| `/login`                | LoginPage         | User login                  |
| `/register`             | RegisterPage      | User registration           |
| `/leaderboard`          | LeaderboardPage   | Community leaderboards      |
| `/share/:shareId`       | PublicTripPage    | Shared trip view            |
| `/album/:shareId`       | PhotoAlbumPage    | Public photo album          |
| `/profile/:shareableId` | PublicProfilePage | Public user profile         |
| `/invite/:token`        | AcceptInvitePage  | Accept collaboration invite |

### Protected Routes (Requires Authentication)

| Path               | Component       | Description              |
| ------------------ | --------------- | ------------------------ | -------------------------- |
| `/profile`         | ProfilePage     | User profile & settings  |
| `/plan`            | TripPlannerPage | Plan a new trip          |
| `/results/:tripId` | ResultsPage     | View AI recommendations  |
| `/history`         | HistoryPage     | Trip history             |
| `/itinerary/:id`   | ItineraryPage   | View/edit trip itinerary |
| `/itinerary/new`   | ItineraryPage   | Create new itinerary     |
|                    | `/offline`      | OfflineTripsPage         | Manage offline saved trips |

## Key Components

### AuthContext

Manages user authentication state, login/logout functionality, and token persistence using localStorage.

### API Service

Centralized API client (`src/services/api.ts`) handling:

- Authentication (register, login, logout)
- Trip generation and management
- Itinerary CRUD operations
- Reviews, votes, and collaboration
- Budget tracking
- Photo journal
- Leaderboards

### WeatherCard

Displays real-time weather data with:

- Current conditions (temp, humidity, wind)
- 5-day forecast
- Temperature unit toggle (°C/°F)
- Weather icons based on conditions

### BudgetTracker

Full expense tracking with:

- Participant management
- Expense categorization
- Cost splitting calculations
- Visual spending breakdown (pie chart)

## Styling

The app uses Tailwind CSS utility classes for styling with a consistent design system:

- **Primary Color**: Indigo (`indigo-600`)
- **Accent Colors**: Emerald, Amber, Purple
- **Border Radius**: Rounded corners (`rounded-xl`, `rounded-2xl`)
- **Shadows**: Subtle shadows for depth (`shadow-lg`, `shadow-xl`)
- **Typography**: Bold headings, medium body text

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.
