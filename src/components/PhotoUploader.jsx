import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useWordPress } from '../context/WordPressContext';
import LocationExtractor from './LocationExtractor';
import WeatherWidget from './WeatherWidget';
import PhotoPreview from './PhotoPreview';
import PostForm from './PostForm';
import LoadingSpinner from './LoadingSpinner';
import { compressImage, createImagePreview, getImageInfo } from '../utils/imageCompression';

const { FiCamera, FiImage, FiMapPin, FiCheck, FiAlertCircle, FiExternalLink, FiClock, FiCloud, FiZap } = FiIcons;

const PhotoUploader = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalFile, setOriginalFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [locationStatus, setLocationStatus] = useState('pending');
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadedPost, setUploadedPost] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const { isAuthenticated, uploadPhoto } = useWordPress();

  const handleFileSelect = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      console.error('Invalid file type');
      return;
    }

    setIsProcessing(true);
    setUploadStatus(null);

    try {
      console.log('📁 File selected:', file.name, (file.size / 1024 / 1024).toFixed(1) + 'MB');

      // Start processing
      const startTime = Date.now();
      
      // Create preview first (fastest)
      const preview = await createImagePreview(file, 300);
      setPhotoPreview(preview);
      
      // Get image info
      const imageInfo = await getImageInfo(file);
      console.log('📊 Image info:', imageInfo);
      
      // Compress if needed
      const processedFile = await compressImage(file);
      
      const processingTime = Date.now() - startTime;
      console.log(`⚡ Processing completed in ${processingTime}ms`);

      // Set compression info if file was compressed
      if (processedFile !== file) {
        setCompressionInfo({
          originalSize: (file.size / 1024 / 1024).toFixed(1),
          compressedSize: (processedFile.size / 1024 / 1024).toFixed(1),
          reduction: ((1 - processedFile.size / file.size) * 100).toFixed(0),
          processingTime: processingTime
        });
      } else {
        setCompressionInfo(null);
      }

      // Set states
      setOriginalFile(file);
      setSelectedFile(processedFile);
      setLocation(null);
      setWeather(null);
      setLocationStatus('extracting');
      setShowForm(true);

      console.log('✅ Ready for upload:', (processedFile.size / 1024 / 1024).toFixed(1) + 'MB');
    } catch (error) {
      console.error('❌ Processing error:', error);
      setUploadStatus({
        type: 'error',
        message: `Foto kon niet worden verwerkt: ${error.message}`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLocationExtracted = (locationData) => {
    console.log('📍 Location extracted:', locationData);
    setLocation(locationData);
    setLocationStatus('found');
  };

  const handleWeatherData = (weatherData) => {
    setWeather(weatherData);
  };

  const handleSubmit = async (postData) => {
    if (!selectedFile || !isAuthenticated) return;

    setIsUploading(true);
    setUploadStatus(null);
    setUploadedPost(null);

    try {
      const uploadData = {
        ...postData,
        location: location,
        weather: weather
      };

      console.log('🚀 Starting upload:', (selectedFile.size / 1024 / 1024).toFixed(1) + 'MB');
      
      const result = await uploadPhoto(selectedFile, uploadData);
      
      setUploadedPost(result);
      
      let successFeatures = [];
      if (location) successFeatures.push('📍 locatie');
      if (weather) successFeatures.push('🌤️ weer');
      if (postData.rating > 0) successFeatures.push('⭐ beoordeling');
      if (compressionInfo) successFeatures.push('🗜️ geoptimaliseerd');
      
      const featuresText = successFeatures.length > 0 
        ? ` met ${successFeatures.join(', ')}`
        : '';

      setUploadStatus({
        type: 'success',
        message: `Foto${featuresText} succesvol geüpload!`,
        postUrl: result.link,
        postId: result.id
      });
    } catch (error) {
      console.error('Upload failed:', error);
      
      let errorMessage = 'Upload mislukt: ' + error.message;
      if (error.message.includes('413') || error.message.includes('too large')) {
        errorMessage = 'Foto te groot. Probeer een kleinere foto.';
      } else if (error.message.includes('memory')) {
        errorMessage = 'Niet genoeg geheugen. Herstart de app.';
      }
      
      setUploadStatus({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setOriginalFile(null);
    setPhotoPreview(null);
    setLocation(null);
    setWeather(null);
    setLocationStatus('pending');
    setShowForm(false);
    setUploadStatus(null);
    setUploadedPost(null);
    setCompressionInfo(null);
  };

  if (!isAuthenticated) {
    return (
      <motion.div
        className="text-center py-12"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <SafeIcon icon={FiAlertCircle} className="text-6xl text-orange-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          WordPress niet geconfigureerd
        </h2>
        <p className="text-gray-600 mb-6">
          Ga naar instellingen om je WordPress-site te configureren.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {uploadStatus && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-lg border ${
              uploadStatus.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              <SafeIcon icon={uploadStatus.type === 'success' ? FiCheck : FiAlertCircle} className="text-lg" />
              <div className="flex-1">
                <span>{uploadStatus.message}</span>
                {uploadStatus.postUrl && (
                  <div className="mt-2">
                    <a
                      href={uploadStatus.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 underline"
                    >
                      <span>Bekijk post</span>
                      <SafeIcon icon={FiExternalLink} className="text-sm" />
                    </a>
                  </div>
                )}
              </div>
            </div>
            {uploadStatus.type === 'success' && (
              <button
                onClick={resetForm}
                className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Nieuwe foto
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center space-x-3">
            <div className="loading-spinner"></div>
            <div>
              <p className="font-medium text-blue-800">Foto verwerken...</p>
              <p className="text-sm text-blue-600">Optimaliseren voor upload</p>
            </div>
          </div>
        </motion.div>
      )}

      {compressionInfo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2 mb-2">
            <SafeIcon icon={FiZap} className="text-green-600" />
            <span className="font-semibold text-green-800">Foto geoptimaliseerd!</span>
          </div>
          <div className="text-sm text-green-700 space-y-1">
            <p>Origineel: {compressionInfo.originalSize}MB → Gecomprimeerd: {compressionInfo.compressedSize}MB</p>
            <p><strong>{compressionInfo.reduction}% kleiner</strong> in {compressionInfo.processingTime}ms</p>
          </div>
        </motion.div>
      )}

      {!showForm ? (
        <motion.div
          className="bg-white rounded-2xl shadow-lg p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full instagram-gradient flex items-center justify-center">
              <SafeIcon icon={FiCamera} className="text-white text-3xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Foto Uploaden
            </h2>
            <p className="text-gray-600">
              Kies een foto om te uploaden naar WordPress
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Met automatische locatie en weer informatie
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => cameraInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <SafeIcon icon={FiCamera} className="text-xl" />
              <span>Foto Maken</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full bg-white border-2 border-gray-300 text-gray-700 py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SafeIcon icon={FiImage} className="text-xl" />
              <span>Uit Galerij</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files[0])}
            disabled={isProcessing}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files[0])}
            disabled={isProcessing}
          />

          <div className="mt-6 p-3 bg-gray-50 rounded-lg text-left">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Automatische functies:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Foto optimalisatie voor snellere uploads</li>
              <li>• GPS locatie extractie uit EXIF data</li>
              <li>• Actuele weer informatie ophalen</li>
              <li>• Sterren beoordeling systeem</li>
            </ul>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <PhotoPreview
            src={photoPreview}
            onBack={resetForm}
          />

          {originalFile && (
            <LocationExtractor
              file={originalFile}
              onLocationExtracted={handleLocationExtracted}
            />
          )}

          {location && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-4 shadow-lg border border-green-200"
            >
              <div className="flex items-center space-x-2 mb-2">
                <SafeIcon icon={FiMapPin} className="text-green-600" />
                <span className="font-semibold text-green-800">Locatie gevonden</span>
                {location.source && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    location.source === 'exif' ? 'bg-green-100 text-green-800' :
                    location.source === 'manual' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {location.source === 'exif' ? 'Foto GPS' :
                     location.source === 'manual' ? 'Handmatig' : 'Apparaat'}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {location.lat.toFixed(4)}°N, {location.lng.toFixed(4)}°E
              </p>
              <a
                href={location.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                Bekijk op kaart
              </a>
            </motion.div>
          )}

          {location && (
            <WeatherWidget
              location={location}
              onWeatherData={handleWeatherData}
            />
          )}

          <PostForm
            onSubmit={handleSubmit}
            isUploading={isUploading}
            hasLocation={!!location}
            locationStatus={locationStatus}
            hasWeather={!!weather}
            weatherData={weather}
          />
        </motion.div>
      )}

      {isUploading && <LoadingSpinner />}
    </div>
  );
};

export default PhotoUploader;