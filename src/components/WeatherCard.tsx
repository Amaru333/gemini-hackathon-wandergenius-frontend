import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Snowflake, CloudLightning, Wind, Droplets, Loader2 } from 'lucide-react';
import { api } from '../services/api';

const getWeatherIcon = (condition: string, className: string = 'w-6 h-6') => {
  const lowerCondition = condition.toLowerCase();
  
  if (lowerCondition.includes('thunder') || lowerCondition.includes('lightning')) {
    return <CloudLightning className={`${className} text-yellow-400`} />;
  }
  if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle') || lowerCondition.includes('shower')) {
    return <CloudRain className={`${className} text-blue-400`} />;
  }
  if (lowerCondition.includes('snow') || lowerCondition.includes('sleet') || lowerCondition.includes('ice')) {
    return <Snowflake className={`${className} text-sky-300`} />;
  }
  if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) {
    return <Cloud className={`${className} text-slate-400`} />;
  }
  if (lowerCondition.includes('clear') || lowerCondition.includes('sun')) {
    return <Sun className={`${className} text-yellow-400`} />;
  }
  // Default
  return <Cloud className={`${className} text-slate-400`} />;
};

// Convert Celsius to Fahrenheit
const toFahrenheit = (celsius: number): number => Math.round((celsius * 9/5) + 32);

interface WeatherData {
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
}

interface WeatherCardProps {
  lat: number;
  lng: number;
  mode?: 'full' | 'compact';
}

export const WeatherCard: React.FC<WeatherCardProps> = ({ lat, lng, mode = 'full' }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<'C' | 'F'>(() => {
    // Load saved preference from localStorage
    const saved = localStorage.getItem('weatherUnit');
    return (saved === 'F') ? 'F' : 'C';
  });

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getWeather(lat, lng);
        setWeather(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load weather');
      } finally {
        setLoading(false);
      }
    };

    if (lat && lng) {
      fetchWeather();
    }
  }, [lat, lng]);

  const toggleUnit = () => {
    const newUnit = unit === 'C' ? 'F' : 'C';
    setUnit(newUnit);
    localStorage.setItem('weatherUnit', newUnit);
  };

  // Helper to display temperature in correct unit
  const displayTemp = (tempC: number): number => {
    return unit === 'F' ? toFahrenheit(tempC) : Math.round(tempC);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${mode === 'compact' ? 'py-2' : 'py-4'} text-slate-400`}>
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (error || !weather) {
    if (mode === 'compact') {
      return (
        <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200 text-slate-400 text-xs">
          <Cloud className="w-4 h-4" />
          <span>Weather unavailable</span>
        </div>
      );
    }
    
    // Show error in full mode
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-white/70 text-center text-sm">
        <Cloud className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>{error || 'Weather unavailable'}</p>
        <p className="text-xs mt-1 opacity-50">Check API key configuration</p>
      </div>
    );
  }

  // Unit toggle button component
  const UnitToggle = ({ className = '' }: { className?: string }) => (
    <button
      onClick={toggleUnit}
      className={`flex items-center gap-0.5 text-xs font-medium rounded-full transition-colors ${className}`}
      title={`Switch to °${unit === 'C' ? 'F' : 'C'}`}
    >
      <span className={unit === 'C' ? 'opacity-100' : 'opacity-40'}>°C</span>
      <span className="opacity-40">/</span>
      <span className={unit === 'F' ? 'opacity-100' : 'opacity-40'}>°F</span>
    </button>
  );

  if (mode === 'compact') {
    // Compact inline version for destination cards
    return (
      <div className="flex items-center gap-3 bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg px-3 py-2 border border-sky-100">
        {getWeatherIcon(weather.current.condition, 'w-5 h-5')}
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-semibold text-slate-800">{displayTemp(weather.current.temp)}°{unit}</span>
          <span className="text-xs text-slate-500 capitalize">{weather.current.description}</span>
        </div>
        <div className="flex items-center gap-2 ml-auto text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Droplets className="w-3 h-3" />{weather.current.humidity}%
          </span>
          <span className="flex items-center gap-1">
            <Wind className="w-3 h-3" />{Math.round(weather.current.windSpeed)} km/h
          </span>
          <UnitToggle className="ml-1 px-1.5 py-0.5 bg-white/80 hover:bg-white text-slate-600" />
        </div>
      </div>
    );
  }

  // Full version for itinerary header
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
      {/* Current Weather */}
      <div className="flex items-start gap-4 mb-4">
        <div className="p-3 bg-white/20 rounded-xl">
          {getWeatherIcon(weather.current.condition, 'w-10 h-10')}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">{displayTemp(weather.current.temp)}°{unit}</span>
            <span className="text-white/70 text-sm capitalize">{weather.current.description}</span>
            <UnitToggle className="ml-2 px-2 py-1 bg-white/20 hover:bg-white/30 text-white" />
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-white/60">
            <span>H: {displayTemp(weather.current.tempMax)}° L: {displayTemp(weather.current.tempMin)}°</span>
            <span className="flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5" />{weather.current.humidity}%
            </span>
            <span className="flex items-center gap-1">
              <Wind className="w-3.5 h-3.5" />{Math.round(weather.current.windSpeed)} km/h
            </span>
          </div>
        </div>
      </div>

      {/* Forecast */}
      {weather.forecast.length > 0 && (
        <div className="flex gap-2 pt-3 border-t border-white/10 overflow-x-auto">
          {weather.forecast.slice(0, 5).map((day) => (
            <div 
              key={day.date} 
              className="flex-1 min-w-[60px] text-center bg-white/10 rounded-lg py-2 px-1"
            >
              <div className="text-xs text-white/70 font-medium mb-1">{day.dayName}</div>
              <div className="flex justify-center mb-1">
                {getWeatherIcon(day.condition, 'w-5 h-5')}
              </div>
              <div className="text-sm font-semibold text-white">{displayTemp(day.temp)}°</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
