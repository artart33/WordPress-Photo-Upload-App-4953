import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import StarRating from './StarRating';
import { useWordPress } from '../context/WordPressContext';

const { FiSend, FiLoader, FiMapPin, FiClock, FiAlertCircle, FiStar, FiCloud } = FiIcons;

const PostForm = ({ onSubmit, isUploading, hasLocation, locationStatus, hasWeather, weatherData }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    categories: [],
    rating: 0
  });

  const { categories } = useWordPress();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title.trim()) {
      const submitData = {
        ...formData,
        weather: weatherData || null
      };
      onSubmit(submitData);
    }
  };

  const handleCategoryChange = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  const handleRatingChange = (newRating) => {
    setFormData(prev => ({
      ...prev,
      rating: newRating
    }));
  };

  const getLocationStatusMessage = () => {
    switch (locationStatus) {
      case 'extracting':
        return {
          icon: FiClock,
          text: 'Locatie wordt bepaald...',
          color: 'text-blue-600',
          bg: 'bg-blue-50'
        };
      case 'found':
        return {
          icon: FiMapPin,
          text: 'Locatie gevonden - wordt toegevoegd aan post',
          color: 'text-green-600',
          bg: 'bg-green-50'
        };
      case 'failed':
        return {
          icon: FiAlertCircle,
          text: 'Geen locatie gevonden - post wordt zonder locatie geüpload',
          color: 'text-orange-600',
          bg: 'bg-orange-50'
        };
      default:
        return null;
    }
  };

  const locationMessage = getLocationStatusMessage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      <h3 className="text-xl font-bold text-gray-800 mb-6">Post Details</h3>

      {/* Location Status */}
      {locationMessage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`flex items-center space-x-2 p-3 rounded-lg mb-4 ${locationMessage.bg}`}
        >
          <SafeIcon icon={locationMessage.icon} className={`${locationMessage.color}`} />
          <span className={`text-sm font-medium ${locationMessage.color}`}>
            {locationMessage.text}
          </span>
        </motion.div>
      )}

      {/* Weather Status */}
      {hasWeather && weatherData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center space-x-2 p-3 rounded-lg mb-4 bg-sky-50"
        >
          <SafeIcon icon={FiCloud} className="text-sky-600" />
          <span className="text-sm font-medium text-sky-600">
            Weer informatie gevonden - wordt toegevoegd aan post
          </span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Titel *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Geef je post een titel..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Beschrijving
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            placeholder="Vertel iets over je foto..."
          />
        </div>

        {/* Star Rating Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Beoordeling
          </label>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex flex-col items-center space-y-2">
              <StarRating
                rating={formData.rating}
                onRatingChange={handleRatingChange}
                size="text-3xl"
                interactive={true}
              />
              <p className="text-xs text-gray-500 text-center">
                Klik op een ster om je beoordeling te geven
              </p>
            </div>
          </div>
        </div>

        {categories.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Categorieën
            </label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map(category => (
                <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.categories.includes(category.id)}
                    onChange={() => handleCategoryChange(category.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{category.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!formData.title.trim() || isUploading}
          className="w-full upload-button text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          {isUploading ? (
            <>
              <div className="loading-spinner border-white"></div>
              <span>Uploaden...</span>
            </>
          ) : (
            <>
              <SafeIcon icon={FiSend} className="text-lg" />
              <span>
                {locationStatus === 'extracting' 
                  ? 'Publiceren (locatie wordt nog bepaald)' 
                  : hasLocation || hasWeather || formData.rating > 0
                    ? `Publiceren${hasLocation ? ' met locatie' : ''}${hasWeather ? ' en weer' : ''}${formData.rating > 0 ? ' en beoordeling' : ''}`
                    : 'Publiceren op WordPress'
                }
              </span>
            </>
          )}
        </button>

        {locationStatus === 'extracting' && (
          <p className="text-xs text-gray-500 text-center">
            💡 Je kunt nu al uploaden - locatie en weer worden automatisch toegevoegd als beschikbaar
          </p>
        )}

        {/* Summary of what will be included */}
        {(hasLocation || hasWeather || formData.rating > 0) && (
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-800 mb-1">Deze post bevat:</p>
            <div className="flex flex-wrap gap-2">
              {hasLocation && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  <SafeIcon icon={FiMapPin} className="mr-1 text-xs" />
                  Locatie
                </span>
              )}
              {hasWeather && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-sky-100 text-sky-800">
                  <SafeIcon icon={FiCloud} className="mr-1 text-xs" />
                  Weer
                </span>
              )}
              {formData.rating > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                  <SafeIcon icon={FiStar} className="mr-1 text-xs" />
                  {formData.rating}/5 sterren
                </span>
              )}
            </div>
          </div>
        )}
      </form>
    </motion.div>
  );
};

export default PostForm;