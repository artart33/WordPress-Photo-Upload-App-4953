import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiMap, FiMapPin, FiSearch, FiCheck, FiX, FiLoader, FiRefreshCw } = FiIcons;

const LocationPicker = ({ onLocationSelected, onClose, currentLocation }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 52.3676, lng: 4.9041 }); // Amsterdam default

  // Get user's current location for better map centering
  useEffect(() => {
    // If there's a current location, center the map on it
    if (currentLocation && currentLocation.lat && currentLocation.lng) {
      setMapCenter({
        lat: currentLocation.lat,
        lng: currentLocation.lng
      });
      console.log('🗺️ Centering map on current location:', currentLocation);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Could not get current location for map centering:', error);
        }
      );
    }
  }, [currentLocation]);

  const handleMapClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert pixel coordinates to lat/lng (simplified calculation)
    const mapWidth = rect.width;
    const mapHeight = rect.height;
    
    // Simple projection (not accurate for all zoom levels, but good enough for demo)
    const lat = mapCenter.lat + ((mapHeight / 2 - y) / mapHeight) * 0.1;
    const lng = mapCenter.lng + ((x - mapWidth / 2) / mapWidth) * 0.1;
    
    const location = {
      lat: lat,
      lng: lng,
      accuracy: 10, // Manual selection is considered high accuracy
      source: 'manual',
      name: `Handmatig geselecteerd (${lat.toFixed(4)}, ${lng.toFixed(4)})`
    };
    
    setSelectedLocation(location);
  };

  const searchLocation = async (query) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      // Using Nominatim (OpenStreetMap) geocoding service - free and no API key needed
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=nl&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'WP-Photo-Uploader/1.0'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const results = data.map(item => ({
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          name: item.display_name,
          accuracy: 50, // Search results are medium accuracy
          source: 'search'
        }));
        setSearchResults(results);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    searchLocation(searchQuery);
  };

  const selectSearchResult = (location) => {
    setSelectedLocation(location);
    setMapCenter({ lat: location.lat, lng: location.lng });
    setSearchResults([]);
    setSearchQuery('');
  };

  const useCurrentLocation = () => {
    if (currentLocation) {
      setSelectedLocation({
        ...currentLocation,
        source: 'manual', // Mark as manual selection even though it's current
        name: `Huidige locatie (${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)})`
      });
      setMapCenter({
        lat: currentLocation.lat,
        lng: currentLocation.lng
      });
    }
  };

  const confirmLocation = () => {
    if (selectedLocation) {
      const locationData = {
        ...selectedLocation,
        mapUrl: `https://maps.google.com/?q=${selectedLocation.lat},${selectedLocation.lng}`,
        timestamp: new Date().toLocaleString('nl-NL')
      };
      onLocationSelected(locationData);
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiMap} className="text-xl" />
              <h3 className="text-lg font-semibold">
                {currentLocation ? 'Locatie Wijzigen' : 'Locatie Kiezen'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <SafeIcon icon={FiX} className="text-lg" />
            </button>
          </div>
          {currentLocation && (
            <p className="text-sm text-blue-100 mt-1">
              Huidige: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
            </p>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Current Location Button */}
          {currentLocation && (
            <div className="bg-blue-50 rounded-lg p-3">
              <button
                onClick={useCurrentLocation}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <SafeIcon icon={FiRefreshCw} className="text-sm" />
                <span>Huidige locatie behouden</span>
              </button>
            </div>
          )}

          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="space-y-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Zoek een locatie (bijv. 'Amsterdam Centraal')"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <button
              type="submit"
              disabled={!searchQuery.trim() || isSearching}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSearching ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="loading-spinner border-white"></div>
                  <span>Zoeken...</span>
                </div>
              ) : (
                'Zoeken'
              )}
            </button>
          </form>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Zoekresultaten:</h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => selectSearchResult(result)}
                    className="w-full text-left p-2 hover:bg-gray-50 rounded-lg border border-gray-200 text-sm"
                  >
                    <div className="font-medium text-gray-800 truncate">{result.name}</div>
                    <div className="text-xs text-gray-500">
                      {result.lat.toFixed(4)}, {result.lng.toFixed(4)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Map */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">
              Of klik op de kaart om een locatie te kiezen:
            </h4>
            <div
              onClick={handleMapClick}
              className="relative w-full h-48 bg-gradient-to-br from-green-100 to-blue-100 rounded-xl border-2 border-dashed border-gray-300 cursor-crosshair hover:border-blue-400 transition-colors"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234f46e5' fill-opacity='0.1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <SafeIcon icon={FiMapPin} className="text-4xl text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 font-medium">
                    Klik hier om locatie te kiezen
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Centrum: {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)}
                  </p>
                </div>
              </div>
              
              {/* Current location indicator */}
              {currentLocation && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2"
                >
                  <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg opacity-60">
                    <div className="w-full h-full rounded-full bg-green-400 animate-pulse"></div>
                  </div>
                </motion.div>
              )}
              
              {/* Selected location marker */}
              {selectedLocation && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                >
                  <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                    <SafeIcon icon={FiMapPin} className="text-white text-xs" />
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Selected Location Info */}
          {selectedLocation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 rounded-lg p-3"
            >
              <div className="flex items-center space-x-2 mb-2">
                <SafeIcon icon={FiMapPin} className="text-green-600" />
                <span className="font-medium text-green-800">Nieuwe locatie geselecteerd</span>
              </div>
              <div className="text-sm text-gray-700">
                <p><strong>Coördinaten:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</p>
                <p><strong>Bron:</strong> {
                  selectedLocation.source === 'manual' ? 'Handmatig gekozen' : 
                  selectedLocation.source === 'search' ? 'Zoekresultaat' : 'Huidige locatie'
                }</p>
                {selectedLocation.name && (
                  <p><strong>Naam:</strong> {selectedLocation.name}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={confirmLocation}
              disabled={!selectedLocation}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              <SafeIcon icon={FiCheck} className="text-lg" />
              <span>
                {currentLocation ? 'Wijzig Locatie' : 'Bevestigen'}
              </span>
            </button>
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            <p><strong>💡 Tips:</strong></p>
            <p>• Zoek eerst een locatie voor betere precisie</p>
            <p>• Klik op de kaart om een exacte positie te kiezen</p>
            {currentLocation && (
              <p>• Groene stip = huidige locatie, rode pin = nieuwe selectie</p>
            )}
            <p>• Deze wijziging overschrijft de automatisch gevonden locatie</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LocationPicker;