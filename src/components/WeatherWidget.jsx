import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiSun, FiCloud, FiCloudRain, FiCloudSnow, FiEye, FiThermometer, FiWind, FiDroplet, FiLoader, FiAlertCircle } = FiIcons;

const WeatherWidget = ({ location, onWeatherData }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (location && location.lat && location.lng) {
      fetchWeatherData(location.lat, location.lng);
    }
  }, [location]);

  const fetchWeatherData = async (lat, lng) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🌤️ Fetching weather for:', lat, lng);
      
      // Using OpenWeatherMap free API (requires no key for basic current weather)
      // Alternative: wttr.in API which is completely free
      const response = await fetch(
        `https://wttr.in/${lat},${lng}?format=j1`,
        {
          method: 'GET',
          headers: {
            'User-Agent': 'WP-Photo-Uploader/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Weather data niet beschikbaar');
      }

      const data = await response.json();
      console.log('🌤️ Weather data received:', data);

      const currentWeather = data.current_condition[0];
      const weatherData = {
        temperature: parseInt(currentWeather.temp_C),
        description: currentWeather.weatherDesc[0].value,
        humidity: parseInt(currentWeather.humidity),
        windSpeed: parseInt(currentWeather.windspeedKmph),
        visibility: parseInt(currentWeather.visibility),
        icon: getWeatherIcon(currentWeather.weatherCode),
        code: currentWeather.weatherCode,
        location: data.nearest_area[0].areaName[0].value
      };

      setWeather(weatherData);
      onWeatherData(weatherData);

    } catch (err) {
      console.error('Weather fetch error:', err);
      setError(err.message);
      
      // Try fallback API
      try {
        const fallbackResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`
        );
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const weatherData = {
            temperature: Math.round(fallbackData.current.temperature_2m),
            description: getWeatherDescription(fallbackData.current.weather_code),
            humidity: fallbackData.current.relative_humidity_2m,
            windSpeed: Math.round(fallbackData.current.wind_speed_10m),
            visibility: null,
            icon: getWeatherIconFromCode(fallbackData.current.weather_code),
            code: fallbackData.current.weather_code,
            location: 'Huidige locatie'
          };
          
          setWeather(weatherData);
          onWeatherData(weatherData);
          setError(null);
        }
      } catch (fallbackErr) {
        console.error('Fallback weather API also failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (code) => {
    const weatherCode = parseInt(code);
    if (weatherCode >= 200 && weatherCode < 300) return FiCloudRain; // Thunderstorm
    if (weatherCode >= 300 && weatherCode < 400) return FiCloudRain; // Drizzle
    if (weatherCode >= 500 && weatherCode < 600) return FiCloudRain; // Rain
    if (weatherCode >= 600 && weatherCode < 700) return FiCloudSnow; // Snow
    if (weatherCode >= 700 && weatherCode < 800) return FiCloud; // Atmosphere
    if (weatherCode === 800) return FiSun; // Clear
    if (weatherCode > 800) return FiCloud; // Clouds
    return FiSun;
  };

  const getWeatherIconFromCode = (code) => {
    if (code === 0) return FiSun; // Clear sky
    if (code <= 3) return FiCloud; // Partly cloudy
    if (code <= 67) return FiCloudRain; // Rain
    if (code <= 77) return FiCloudSnow; // Snow
    if (code <= 82) return FiCloudRain; // Showers
    return FiCloud;
  };

  const getWeatherDescription = (code) => {
    const descriptions = {
      0: 'Helder',
      1: 'Grotendeels helder',
      2: 'Deels bewolkt',
      3: 'Bewolkt',
      45: 'Mist',
      48: 'Rijp mist',
      51: 'Lichte motregen',
      53: 'Matige motregen',
      55: 'Dichte motregen',
      61: 'Lichte regen',
      63: 'Matige regen',
      65: 'Zware regen',
      71: 'Lichte sneeuw',
      73: 'Matige sneeuw',
      75: 'Zware sneeuw',
      80: 'Lichte buien',
      81: 'Matige buien',
      82: 'Zware buien'
    };
    return descriptions[code] || 'Onbekend weer';
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl p-4 shadow-lg border"
      >
        <div className="flex items-center space-x-3">
          <div className="loading-spinner"></div>
          <div>
            <p className="font-medium text-gray-800">Weer ophalen...</p>
            <p className="text-sm text-gray-600">Voor huidige locatie</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (error && !weather) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl p-4 shadow-lg border border-yellow-200"
      >
        <div className="flex items-center space-x-3">
          <SafeIcon icon={FiAlertCircle} className="text-yellow-600" />
          <div>
            <p className="font-medium text-yellow-800">Weer niet beschikbaar</p>
            <p className="text-sm text-gray-600">Post wordt zonder weersinfo geüpload</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!weather) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-blue-50 to-sky-100 rounded-xl p-4 shadow-lg border border-blue-200"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <SafeIcon icon={weather.icon} className="text-blue-600 text-xl" />
          <span className="font-semibold text-blue-900">Weer Informatie</span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-900">{weather.temperature}°C</div>
          <div className="text-sm text-blue-700">{weather.description}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center space-x-2 text-blue-800">
          <SafeIcon icon={FiDroplet} className="text-blue-600" />
          <span>{weather.humidity}% vochtigheid</span>
        </div>
        <div className="flex items-center space-x-2 text-blue-800">
          <SafeIcon icon={FiWind} className="text-blue-600" />
          <span>{weather.windSpeed} km/h</span>
        </div>
        {weather.visibility && (
          <div className="flex items-center space-x-2 text-blue-800 col-span-2">
            <SafeIcon icon={FiEye} className="text-blue-600" />
            <span>Zicht: {weather.visibility} km</span>
          </div>
        )}
      </div>

      {weather.location && (
        <div className="mt-2 pt-2 border-t border-blue-200">
          <p className="text-xs text-blue-700">📍 {weather.location}</p>
        </div>
      )}
    </motion.div>
  );
};

export default WeatherWidget;