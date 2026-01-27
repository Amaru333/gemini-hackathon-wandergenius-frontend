const API_URL = 'http://localhost:5001/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth endpoints
  async register(email: string, password: string, name?: string) {
    const data = await this.request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    this.setToken(data.token);
    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Profile endpoints
  async getProfile() {
    return this.request<any>('/profile');
  }

  async updateProfile(profile: {
    interests: string[];
    hobbies: string[];
    travelStyle: string;
    constraints?: string;
  }) {
    return this.request<any>('/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }

  // Trip endpoints
  async generateTrip(tripData: {
    startLocation: string;
    radiusOrTime: string;
    days: number;
    travelMode: string;
    customInput?: string;
    userLocation?: { latitude: number; longitude: number };
  }) {
    return this.request<{ tripId: string; text: string; groundingChunks: any[] }>('/trips/generate', {
      method: 'POST',
      body: JSON.stringify(tripData),
    });
  }

  async getTrips() {
    return this.request<any[]>('/trips');
  }

  async getTrip(id: string) {
    return this.request<any>(`/trips/${id}`);
  }

  async getTripSuggestions() {
    return this.request<{
      suggestions: Array<{
        title: string;
        description: string;
        highlights: string[];
        estimatedDays: number;
      }>;
      reviewCount: number;
    }>('/trips/suggestions');
  }

  async deleteTrip(id: string) {
    return this.request<any>(`/trips/${id}`, { method: 'DELETE' });
  }

  // Photo endpoints
  async getPlacePhoto(query: string) {
    return this.request<{ photoUrl: string | null; name?: string; placeId?: string }>(
      `/photos/search?query=${encodeURIComponent(query)}`
    );
  }

  // Itinerary endpoints
  async generateItinerary(data: {
    destination: string;
    days: number;
    startLocation: string;
    tripId?: string;
    photoUrl?: string;
    lat?: number;
    lng?: number;
  }) {
    return this.request<{
      id: string;
      destination: string;
      days: number;
      itinerary: any[];
      checklist: any[];
    }>('/itinerary/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSavedTrips() {
    return this.request<any[]>('/itinerary/saved');
  }

  async getSavedTrip(id: string) {
    return this.request<any>(`/itinerary/${id}`);
  }

  async updateChecklist(tripId: string, itemId: number, completed: boolean) {
    return this.request<{ checklist: any[] }>(`/itinerary/${tripId}/checklist`, {
      method: 'PATCH',
      body: JSON.stringify({ itemId, completed }),
    });
  }

  async deleteSavedTrip(id: string) {
    return this.request<any>(`/itinerary/${id}`, { method: 'DELETE' });
  }

  async toggleShare(tripId: string, isPublic: boolean) {
    return this.request<{ isPublic: boolean; shareId: string }>(`/itinerary/${tripId}/share`, {
      method: 'PATCH',
      body: JSON.stringify({ isPublic })
    });
  }

  async getPublicTrip(shareId: string) {
    // Note: No auth header method will be used since we won't have a token for guests
    // We'll use fetch directly to skip the auth check logic in this.request if needed, 
    // or rely on the backend to not require auth for this specific endpoint.
    // However, since this.request appends headers if token exists, we can use a raw fetch 
    // or a modified request to force no-auth if the user is logged out.
    // Assuming logged-out user has no token in service.
    // For safety, let's use raw fetch for public endpoints to avoid any auth header issues.
    const response = await fetch(`${API_URL}/itinerary/shared/${shareId}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to load shared trip');
    return response.json();
  }

  // Chat endpoints
  async sendChatMessage(message: string, context?: { destination?: string; tripDays?: number }) {
    return this.request<{ reply: string; timestamp: string }>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
  }

  async getTravelTips(topic: string, destination?: string) {
    const params = new URLSearchParams({ topic });
    if (destination) params.append('destination', destination);
    return this.request<{ tips: string[]; topic: string; destination?: string }>(
      `/chat/tips?${params.toString()}`
    );
  }

  // Weather endpoint
  async getWeather(lat: number, lng: number) {
    return this.request<{
      current: {
        temp: number;
        feelsLike: number;
        tempMin: number;
        tempMax: number;
        humidity: number;
        windSpeed: number;
        condition: string;
        description: string;
        icon: string;
      };
      location: string;
      forecast: Array<{
        date: string;
        dayName: string;
        temp: number;
        tempMin: number;
        tempMax: number;
        condition: string;
        description: string;
        icon: string;
      }>;
    }>(`/weather?lat=${lat}&lng=${lng}`);
  }

  // Budget endpoints
  async getBudget(tripId: string) {
    return this.request<any>(`/budget/${tripId}`);
  }

  async setupBudget(tripId: string, data: { totalBudget: number; currency: string; participants: string[] }) {
    return this.request<any>(`/budget/${tripId}/setup`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addExpense(tripId: string, data: { 
    amount: number; 
    category: string; 
    description: string; 
    paidById: string; 
    splitWithIds: string[];
  }) {
    return this.request<any>(`/budget/${tripId}/expense`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteExpense(tripId: string, expenseId: string) {
    return this.request<any>(`/budget/${tripId}/expense/${expenseId}`, {
      method: 'DELETE',
    });
  }

  // Collaboration endpoints
  async inviteCollaborator(tripId: string, email: string, role: string = 'editor') {
    return this.request<{
      id: string;
      email: string;
      role: string;
      status: string;
      inviteToken: string;
      inviteLink: string;
    }>(`/collaboration/${tripId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  }

  async getCollaborators(tripId: string) {
    return this.request<{
      owner: { id: string; name: string; email: string };
      collaborators: Array<{
        id: string;
        email: string;
        role: string;
        status: string;
        inviteToken?: string;
        user?: { id: string; name: string; email: string };
      }>;
    }>(`/collaboration/${tripId}/collaborators`);
  }

  async removeCollaborator(tripId: string, collaboratorId: string) {
    return this.request<{ message: string }>(
      `/collaboration/${tripId}/collaborator/${collaboratorId}`,
      { method: 'DELETE' }
    );
  }

  async getInviteDetails(token: string) {
    const response = await fetch(`${API_URL}/collaboration/invite/${token}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Failed to get invite details');
    return response.json();
  }

  async acceptInvite(token: string) {
    return this.request<{ message: string; tripId: string; role: string }>(
      `/collaboration/invite/${token}/accept`,
      { method: 'POST' }
    );
  }

  async declineInvite(token: string) {
    return this.request<{ message: string }>(
      `/collaboration/invite/${token}/decline`,
      { method: 'POST' }
    );
  }

  async voteOnActivity(tripId: string, day: number, activityIndex: number, vote: 'up' | 'down') {
    return this.request<{ action: string; vote?: string }>(
      `/collaboration/${tripId}/vote`,
      {
        method: 'POST',
        body: JSON.stringify({ day, activityIndex, vote }),
      }
    );
  }

  async getVotes(tripId: string) {
    return this.request<{
      tallies: Record<string, { up: number; down: number; voters: any[] }>;
      userVotes: Record<string, string>;
    }>(`/collaboration/${tripId}/votes`);
  }

  async importTrip(shareId: string): Promise<{ tripId: string; message: string }> {
    return this.request('/itinerary/import/' + shareId, {
      method: 'POST',
    });
  }

  async editItineraryActivity(
    tripId: string, 
    day: number, 
    activityIndex: number, 
    updates: Partial<{ time: string; activity: string; description: string; location: string }>
  ) {
    return this.request<{ itinerary: any[] }>(
      `/collaboration/${tripId}/itinerary`,
      {
        method: 'PATCH',
        body: JSON.stringify({ day, activityIndex, updates }),
      }
    );
  }

  // Review endpoints
  async createReview(tripId: string, data: {
    budgetRating: number;
    locationRating: number;
    activitiesRating: number;
    overallRating: number;
    comment?: string;
  }) {
    return this.request<{
      id: string;
      budgetRating: number;
      locationRating: number;
      activitiesRating: number;
      overallRating: number;
      comment: string | null;
      user: { id: string; name: string; email: string };
    }>(`/reviews/${tripId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getReviews(tripId: string) {
    return this.request<{
      reviews: Array<{
        id: string;
        budgetRating: number;
        locationRating: number;
        activitiesRating: number;
        overallRating: number;
        comment: string | null;
        createdAt: string;
        user: { id: string; name: string };
      }>;
      averages: {
        budgetRating: number;
        locationRating: number;
        activitiesRating: number;
        overallRating: number;
      } | null;
      totalReviews: number;
    }>(`/reviews/${tripId}`);
  }

  async getUserReview(tripId: string) {
    return this.request<{
      id: string;
      budgetRating: number;
      locationRating: number;
      activitiesRating: number;
      overallRating: number;
      comment: string | null;
    } | null>(`/reviews/${tripId}/user`);
  }

  async deleteReview(tripId: string) {
    return this.request<{ message: string }>(`/reviews/${tripId}`, {
      method: 'DELETE',
    });
  }

  async getRecommendedTrips(options?: { limit?: number; lat?: number; lng?: number }) {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.lat) params.append('lat', options.lat.toString());
    if (options?.lng) params.append('lng', options.lng.toString());
    
    const queryString = params.toString();
    return this.request<Array<{
      id: string;
      destinationName: string;
      photoUrl: string | null;
      days: number;
      shareId: string;
      distance: number | null;
      reviewCount: number;
      averageRating: {
        overall: number;
        budget: number;
        location: number;
        activities: number;
      };
    }>>(`/reviews/recommended${queryString ? `?${queryString}` : ''}`);
  }

  // Badge endpoints
  async checkBadges() {
    return this.request<{
      newBadges: Array<{
        id: string;
        badgeType: string;
        name: string;
        description: string;
        icon: string;
        earnedAt: string;
      }>;
      message: string;
    }>('/badges/check');
  }

  async getMyBadges() {
    return this.request<Array<{
      id: string;
      badgeType: string;
      name: string;
      description: string;
      icon: string;
      earnedAt: string;
    }>>('/badges/my');
  }

  async getMyStats() {
    return this.request<{
      name: string;
      shareableId: string;
      memberSince: string;
      stats: {
        tripsCompleted: number;
        reviewsWritten: number;
        collaborations: number;
        badgesEarned: number;
        destinationsVisited: number;
        destinations: string[];
      };
    }>('/badges/stats');
  }

  async getPublicProfile(shareableId: string) {
    const response = await fetch(`${API_URL}/badges/profile/${shareableId}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Failed to load profile');
    return response.json();
  }

  // Packing Template endpoints
  async getPackingTemplates() {
    return this.request<Array<{
      id: string;
      name: string;
      items: Array<{ id: number; task: string; category: string; completed: boolean }>;
      createdAt: string;
    }>>('/packing-templates');
  }

  async savePackingTemplate(name: string, items: Array<{ id: number; task: string; category: string; completed: boolean }>) {
    return this.request<{
      id: string;
      name: string;
      items: Array<{ id: number; task: string; category: string; completed: boolean }>;
      createdAt: string;
    }>('/packing-templates', {
      method: 'POST',
      body: JSON.stringify({ name, items }),
    });
  }

  async deletePackingTemplate(id: string) {
    return this.request<{ message: string }>(`/packing-templates/${id}`, {
      method: 'DELETE',
    });
  }

  async applyPackingTemplate(tripId: string, templateId: string) {
    return this.request<{ message: string; checklist: Array<{ id: number; task: string; category: string; completed: boolean }> }>(
      `/packing-templates/${templateId}/apply/${tripId}`,
      { method: 'POST' }
    );
  }

  // Photo Journal endpoints
  async getTripPhotos(tripId: string) {
    return this.request<{
      tripId: string;
      destinationName: string;
      days: number;
      totalPhotos: number;
      photosByDay: Record<number, Array<{
        id: string;
        day: number;
        imageUrl: string;
        thumbnailUrl: string | null;
        caption: string | null;
        location: string | null;
        takenAt: string | null;
        sortOrder: number;
      }>>;
    }>(`/photo-journal/${tripId}`);
  }

  async getPublicTripAlbum(shareId: string) {
    const response = await fetch(`${API_URL}/photo-journal/album/${shareId}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Failed to load trip album');
    return response.json();
  }

  async addTripPhoto(tripId: string, data: {
    day: number;
    imageUrl: string;
    thumbnailUrl?: string;
    caption?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    takenAt?: string;
  }) {
    return this.request<{
      id: string;
      day: number;
      imageUrl: string;
      thumbnailUrl: string | null;
      caption: string | null;
      location: string | null;
      sortOrder: number;
    }>(`/photo-journal/${tripId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTripPhoto(tripId: string, photoId: string, data: {
    caption?: string;
    location?: string;
    day?: number;
    sortOrder?: number;
  }) {
    return this.request<{
      id: string;
      caption: string | null;
      location: string | null;
      day: number;
    }>(`/photo-journal/${tripId}/photo/${photoId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTripPhoto(tripId: string, photoId: string) {
    return this.request<{ message: string }>(
      `/photo-journal/${tripId}/photo/${photoId}`,
      { method: 'DELETE' }
    );
  }

  async reorderTripPhotos(tripId: string, day: number, photoIds: string[]) {
    return this.request<{ message: string }>(
      `/photo-journal/${tripId}/reorder`,
      {
        method: 'PATCH',
        body: JSON.stringify({ day, photoIds }),
      }
    );
  }

  async getTripPhotoStats(tripId: string) {
    return this.request<{
      totalPhotos: number;
      photoCountByDay: Record<number, number>;
      uniqueLocations: string[];
    }>(`/photo-journal/${tripId}/stats`);
  }

  async togglePhotoAlbumShare(tripId: string, isPhotoAlbumPublic: boolean) {
    return this.request<{
      id: string;
      isPhotoAlbumPublic: boolean;
      isPublic: boolean;
      shareId: string;
    }>(`/photo-journal/${tripId}/share`, {
      method: 'PATCH',
      body: JSON.stringify({ isPhotoAlbumPublic }),
    });
  }

  // Smart Packing endpoints
  async getSmartPackingSuggestions(tripId: string) {
    return this.request<{
      suggestions: {
        items: Array<{
          id: number;
          task: string;
          category: string;
          completed: boolean;
          reason: string;
          priority: 'essential' | 'recommended' | 'optional';
          weatherRelated: boolean;
          isAiSuggested: boolean;
        }>;
        tips: string[];
        warnings: string[];
        weatherSummary: string | null;
      };
      tripInfo: {
        destination: string;
        days: number;
        activities: string[];
      };
      weather: {
        available: boolean;
        forecast?: Array<{
          date: string;
          temp: number;
          tempMin: number;
          tempMax: number;
          condition: string;
          description: string;
          humidity: number;
          windSpeed: number;
        }>;
      };
    }>('/smart-packing/optimize', {
      method: 'POST',
      body: JSON.stringify({ tripId }),
    });
  }

  async applySmartPackingSuggestions(
    tripId: string,
    items: Array<{ task: string; category: string }>,
    mode: 'merge' | 'replace' = 'merge'
  ) {
    return this.request<{
      message: string;
      checklist: Array<{ id: number; task: string; category: string; completed: boolean }>;
      itemsAdded: number;
    }>('/smart-packing/apply', {
      method: 'POST',
      body: JSON.stringify({ tripId, items, mode }),
    });
  }

  // Leaderboard endpoints (public, no auth required)
  async getLeaderboards() {
    const response = await fetch(`${API_URL}/leaderboards`, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Failed to load leaderboards');
    return response.json() as Promise<{
      mostTrips: Array<{
        userId: string;
        name: string;
        shareableId: string;
        value: number;
        rank: number;
      }>;
      mostStates: Array<{
        userId: string;
        name: string;
        shareableId: string;
        value: number;
        rank: number;
        states: string[];
      }>;
      bestReviewed: Array<{
        userId: string;
        name: string;
        shareableId: string;
        value: number;
        rank: number;
        reviewCount: number;
      }>;
    }>;
  }
}

export const api = new ApiService();

