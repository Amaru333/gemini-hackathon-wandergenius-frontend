import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Sparkles, 
  Loader2, 
  MapPin, 
  Clock, 
  Target, 
  Check,
  Compass, 
  ExternalLink,
  Map as MapIcon,
  ChevronRight,
  CalendarDays,
  Image as ImageIcon,
  DollarSign
} from 'lucide-react';
import { api } from '../services/api';
import { DestinationsMap } from '../components/DestinationsMap';
import { WeatherCard } from '../components/WeatherCard';

interface Destination {
  name: string;
  lat: number;
  lng: number;
  cardIndex: number; // Index of the card this corresponds to
}

interface ParsedCard {
  title: string;
  whyFits: string;
  travelInfo: string;
  duration: string;
  budgetEstimate: string;
  highlights: string[];
}

export const ResultsPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startCoords, setStartCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [destinationCards, setDestinationCards] = useState<ParsedCard[]>([]);
  const [photos, setPhotos] = useState<Record<number, string | null>>({});
  const [generatingItinerary, setGeneratingItinerary] = useState<number | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (tripId) {
      loadTrip(tripId);
    }
    const stored = sessionStorage.getItem('tripStartCoords');
    if (stored) {
      setStartCoords(JSON.parse(stored));
    }
  }, [tripId]);

  const loadTrip = async (id: string) => {
    try {
      const data = await api.getTrip(id);
      setTrip(data);
      
      // Parse recommendations first
      const recommendations = typeof data.recommendations === 'string' 
        ? data.recommendations 
        : JSON.stringify(data.recommendations);
      const cards = parseRecommendations(recommendations);
      setDestinationCards(cards);
      
      // Extract destinations based on card titles for proper mapping
      await extractDestinations(cards);
      
      // Load photos for each destination
      loadPhotos(cards);
    } catch (err: any) {
      setError(err.message || 'Failed to load trip');
    } finally {
      setLoading(false);
    }
  };

  const extractDestinations = async (cards: ParsedCard[]) => {
    const dests: Destination[] = [];
    
    // Geocode each card title sequentially to avoid rate limiting
    for (let i = 0; i < Math.min(cards.length, 5); i++) {
      const card = cards[i];
      if (card.title) {
        // Wait between requests to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
        const result = await geocodeLocation(card.title);
        if (result) {
          // Store the card index so marker number matches card number
          dests.push({ ...result, cardIndex: i });
        }
      }
    }
    
    console.log(`Geocoded ${dests.length} of ${cards.length} destinations`);
    setDestinations(dests);
  };

  const geocodeLocation = async (name: string): Promise<{ name: string; lat: number; lng: number } | null> => {
    try {
      // Use backend Google Maps geocoding API
      const response = await fetch(
        `http://localhost:5001/api/geocode/geocode?address=${encodeURIComponent(name)}`
      );
      
      if (!response.ok) {
        console.error('Geocoding API error:', response.status);
        return null;
      }
      
      const data = await response.json();
      if (data.lat && data.lng) {
        return {
          name: data.name || cleanText(name.split(',')[0]),
          lat: data.lat,
          lng: data.lng
        };
      }
      
      console.warn('No geocoding results for:', name);
    } catch (err) {
      console.error('Geocoding failed for:', name, err);
    }
    return null;
  };

  // Clean all markdown and formatting from text
  const cleanText = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^#+\s*/gm, '')
      .replace(/^\s*[-*]\s*/gm, '')
      .trim();
  };

  const parseRecommendations = (text: string): ParsedCard[] => {
    if (!text || text.toLowerCase().includes("no recommendations found")) return [];
    
    // Find the first ## or ### heading and only process content from there
    const firstHeadingIndex = text.search(/^#{2,3}\s+/m);
    if (firstHeadingIndex === -1) return [];
    
    // Remove everything before the first ## heading (intro text)
    const contentFromHeadings = text.substring(firstHeadingIndex);
    
    // Split by ## or ### headings
    const sections = contentFromHeadings.split(/^#{2,3}\s+/m).filter(p => p.trim().length > 0);
    
    // Filter out any remaining intro-like sections (shouldn't be any, but just in case)
    const destinationSections = sections.filter(section => {
      const firstLine = section.split('\n')[0].toLowerCase();
      // Skip if it looks like intro text
      const isIntro = firstLine.includes('here are') || 
                      firstLine.includes('destinations for') ||
                      firstLine.includes('following destinations') ||
                      firstLine.includes('recommendations');
      // Skip if title is too long (real destinations are usually short names)
      const isTooLong = firstLine.length > 100;
      return !isIntro && !isTooLong;
    });
    
    return destinationSections.map(section => {
      const lines = section.split('\n');
      const title = cleanText(lines[0]);
      const content = lines.slice(1).join('\n');
      
      // Extract structured data
      let whyFits = '';
      let travelInfo = '';
      let duration = '';
      const highlights: string[] = [];
      
      // Parse why it fits
      const whyMatch = content.match(/\*\*Why it fits[:\*]*\*\*\s*([^*]+?)(?=\*\*|$)/is);
      if (whyMatch) {
        whyFits = cleanText(whyMatch[1]);
      }
      
      // Parse travel info
      const travelMatch = content.match(/\*\*Travel Info[:\*]*\*\*\s*([^*]+?)(?=\*\*|$)/is);
      if (travelMatch) {
        travelInfo = cleanText(travelMatch[1]);
      }
      
      // Parse duration
      const durationMatch = content.match(/\*\*Suggested Duration[:\*]*\*\*\s*([^*]+?)(?=\*\*|$)/is);
      if (durationMatch) {
        duration = cleanText(durationMatch[1]);
      }
      
      // Parse budget estimate
      let budgetEstimate = '';
      const budgetMatch = content.match(/\*\*Budget Estimate[:\*]*\*\*\s*([^*]+?)(?=\*\*|$)/is);
      if (budgetMatch) {
        budgetEstimate = cleanText(budgetMatch[1]);
      }
      
      // Parse highlights (bullet points)
      const highlightsMatch = content.match(/\*\*Key Highlights[:\*]*\*\*\s*([\s\S]*?)(?=\*\*|$)/is);
      if (highlightsMatch) {
        const bulletLines = highlightsMatch[1].split('\n');
        for (const line of bulletLines) {
          const cleaned = cleanText(line);
          if (cleaned.length > 5 && !cleaned.toLowerCase().includes('suggested duration') && !cleaned.toLowerCase().includes('travel info')) {
            highlights.push(cleaned);
          }
        }
      }
      
      // Also get any other bullet points
      const allBullets = content.match(/^\s*[\*\-]\s+(.+)$/gm);
      if (allBullets) {
        for (const bullet of allBullets) {
          const cleaned = cleanText(bullet);
          if (cleaned.length > 5 && !highlights.includes(cleaned) && highlights.length < 6) {
            // Skip if it's a label like "Why it fits:" etc
            if (!cleaned.toLowerCase().match(/^(why|travel|suggested|key)/)) {
              highlights.push(cleaned);
            }
          }
        }
      }

      return { 
        title, 
        whyFits,
        travelInfo,
        duration,
        budgetEstimate,
        highlights: highlights.slice(0, 4)
      };
    });
  };

  const handleMarkerClick = (index: number) => {
    setActiveIndex(index);
    cardRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleCardClick = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const loadPhotos = async (cards: ParsedCard[]) => {
    // Load photos for each destination in parallel
    const photoPromises = cards.slice(0, 5).map(async (card, index) => {
      try {
        const result = await api.getPlacePhoto(card.title);
        return { index, photoUrl: result.photoUrl };
      } catch {
        return { index, photoUrl: null };
      }
    });

    const results = await Promise.all(photoPromises);
    const photoMap: Record<number, string | null> = {};
    results.forEach(r => {
      photoMap[r.index] = r.photoUrl;
    });
    setPhotos(photoMap);
  };

  const handlePlanTrip = async (e: React.MouseEvent, cardIndex: number) => {
    e.stopPropagation(); // Prevent card expansion
    
    if (!trip || generatingItinerary !== null) return;
    
    const card = destinationCards[cardIndex];
    const dest = destinations.find(d => d.cardIndex === cardIndex);
    
    setGeneratingItinerary(cardIndex);
    
    // Navigate to itinerary page with generation data
    navigate('/itinerary/new', {
      state: {
        generating: true,
        data: {
          destination: card.title,
          days: trip.days,
          startLocation: trip.startLocation,
          tripId: tripId,
          photoUrl: photos[cardIndex] || null,
          lat: dest?.lat,
          lng: dest?.lng
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-slate-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-slate-50 rounded-xl p-10 border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Trip Not Found</h2>
          <p className="text-slate-500 mb-6 text-sm">{error || 'This trip could not be loaded.'}</p>
          <Link
            to="/plan"
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Plan a New Trip
          </Link>
        </div>
      </div>
    );
  }

  const groundingChunks = trip.groundingChunks || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <Link
          to="/plan"
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> New Search
        </Link>
        <div className="bg-slate-100 px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" /> AI Generated
        </div>
      </div>

      {/* Trip Summary */}
      <div className="bg-slate-50 rounded-lg p-4 mb-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-slate-400" /> 
          <span className="font-medium">{trip.startLocation}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-slate-400" /> 
          {trip.days} days
        </span>
        <span className="capitalize">{trip.travelMode}</span>
      </div>

      {/* Map Section */}
      {destinations.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <MapIcon className="w-5 h-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">Route Overview</h2>
          </div>
          <DestinationsMap
            startLocation={startCoords ? { lat: startCoords.lat, lng: startCoords.lng, name: trip.startLocation } : undefined}
            destinations={destinations}
            onMarkerClick={handleMarkerClick}
            activeIndex={activeIndex}
          />
          <p className="text-xs text-slate-400 mt-2 text-center">
            Click markers to highlight destinations below
          </p>
        </section>
      )}

      {/* Destination List */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Compass className="w-5 h-5 text-slate-700" />
          <h2 className="text-lg font-semibold text-slate-900">Recommended Destinations</h2>
          <span className="text-sm text-slate-400 ml-auto">{destinationCards.length} places</span>
        </div>
        
        <div className="space-y-4">
          {destinationCards.length > 0 ? (
            destinationCards.map((dest, i) => (
              <div 
                key={i} 
                ref={el => { cardRefs.current[i] = el; }}
                onClick={() => handleCardClick(i)}
                className={`bg-white border rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                  activeIndex === i 
                    ? 'border-slate-900 shadow-lg ring-1 ring-slate-900' 
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                {/* Photo Banner */}
                {photos[i] && (
                  <div className="h-32 overflow-hidden bg-slate-100">
                    <img 
                      src={photos[i]!} 
                      alt={dest.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="p-5">
                  {/* Card Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                      activeIndex === i ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">
                        {dest.title}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        {dest.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {dest.duration}
                          </span>
                        )}
                        {dest.travelInfo && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {dest.travelInfo}
                          </span>
                        )}
                        {dest.budgetEstimate && (
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${
                            dest.budgetEstimate.toLowerCase().includes('budget') 
                              ? 'bg-emerald-100 text-emerald-700'
                              : dest.budgetEstimate.toLowerCase().includes('luxury')
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            <DollarSign className="w-3 h-3" /> {dest.budgetEstimate}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${activeIndex === i ? 'rotate-90' : ''}`} />
                  </div>
                  
                  {/* Card Content - Expandable */}
                  <div className={`grid gap-4 transition-all duration-200 ${activeIndex === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-60'}`}>
                    <div className="overflow-hidden">
                      {dest.whyFits && (
                        <div className="bg-slate-50 p-4 rounded-md mb-4">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                            <Target className="w-3.5 h-3.5" /> Why This Fits You
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {dest.whyFits}
                          </p>
                        </div>
                      )}
                      
                      {dest.highlights.length > 0 && (
                        <div className="mb-4">
                          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                            Key Highlights
                          </div>
                          <ul className="space-y-1.5">
                            {dest.highlights.map((h, hi) => (
                              <li key={hi} className="flex items-start gap-2 text-sm text-slate-600">
                                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <span>{h}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Weather Card */}
                      {destinations.find(d => d.cardIndex === i) && (
                        <div className="mb-4">
                          <WeatherCard 
                            lat={destinations.find(d => d.cardIndex === i)!.lat} 
                            lng={destinations.find(d => d.cardIndex === i)!.lng}
                            mode="compact"
                          />
                        </div>
                      )}

                      {/* Plan This Trip Button */}
                      <button
                        onClick={(e) => handlePlanTrip(e, i)}
                        disabled={generatingItinerary !== null}
                        className="w-full mt-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white py-3 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        {generatingItinerary === i ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creating Itinerary...
                          </>
                        ) : (
                          <>
                            <CalendarDays className="w-4 h-4" />
                            Plan This Trip
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <Compass className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-medium text-slate-700 mb-1">No Destinations Found</h3>
              <p className="text-sm text-slate-500">
                Try adjusting your search parameters.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Quick Links */}
      {groundingChunks.length > 0 && (
        <section className="mt-10 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <ExternalLink className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Quick Links</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {groundingChunks.slice(0, 6).map((chunk: any, i: number) => (
              chunk.maps && (
                <a 
                  key={i}
                  href={chunk.maps.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
                >
                  {cleanText(chunk.maps.title?.split(',')[0] || 'View on Maps')}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
