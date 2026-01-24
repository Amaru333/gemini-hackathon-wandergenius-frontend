export interface UserProfile {
  interests: string[];
  hobbies: string[];
  travelStyle: string;
  constraints: string;
}

export interface TripInput {
  startLocation: string;
  radiusOrTime: string;
  days: number;
  travelMode: 'car' | 'train' | 'flight' | 'mixed';
}

export interface Recommendation {
  id: string;
  name: string;
  region: string;
  matchReason: string;
  travelEstimate: string;
  suggestedDuration: string;
  highlights: string[];
  mapLink?: string;
}

export enum AppStep {
  ONBOARDING = 'ONBOARDING',
  TRIP_PLANNING = 'TRIP_PLANNING',
  RESULTS = 'RESULTS'
}
