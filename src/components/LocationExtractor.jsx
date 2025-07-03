import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import LocationPicker from './LocationPicker';
import EXIF from 'exif-js';

const { FiMapPin, FiLoader, FiAlertCircle, FiCamera, FiSmartphone, FiCheck, FiClock, FiMap } = FiIcons;

const LocationExtractor = ({ file, onLocationExtracted }) => {
  const [status, setStatus] = useState('extracting');
  const [error, setError] = useState(null);
  const [locationSource, setLocationSource] = useState(null);
  const [extractionDetails, setExtractionDetails] = useState(null);
  const [timeoutWarning, setTimeoutWarning] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    extractLocation();
  }, [file]);

  const extractLocation = async () => {
    try {
      setStatus('extracting');
      setError(null);
      setLocationSource(null);
      setExtractionDetails(null);
      setTimeoutWarning(false);

      console.log('🔍 Starting optimized location extraction for:', file.name);

      // Set a timeout warning for slow EXIF extraction
      const timeoutWarningTimer = setTimeout(() => {
        setTimeoutWarning(true);
      }, 3000);

      // Start both EXIF and device location simultaneously for speed
      const [exifLocation, deviceLocation] = await Promise.allSettled([
        getExifLocationFast(file),
        getCurrentLocationFast()
      ]);

      clearTimeout(timeoutWarningTimer);

      // Prioritize EXIF if available and successful
      if (exifLocation.status === 'fulfilled' && exifLocation.value) {
        console.log('✅ EXIF GPS data found:', exifLocation.value);
        const locationData = {
          ...exifLocation.value,
          mapUrl: `https://maps.google.com/?q=${exifLocation.value.lat},${exifLocation.value.lng}`,
          source: 'exif',
          accuracy: 'high'
        };
        setCurrentLocation(locationData);
        setLocationSource('exif');
        setExtractionDetails({
          method: 'EXIF GPS Data',
          accuracy: 'Zeer hoog (van camera)',
          timestamp: exifLocation.value.timestamp || 'Onbekend'
        });
        onLocationExtracted(locationData);
        setStatus('success');
        return;
      }

      // Use device location as fallback
      if (deviceLocation.status === 'fulfilled' && deviceLocation.value) {
        console.log('✅ Device GPS location found:', deviceLocation.value);
        const locationData = {
          ...deviceLocation.value,
          mapUrl: `https://maps.google.com/?q=${deviceLocation.value.lat},${deviceLocation.value.lng}`,
          source: 'device',
          accuracy: deviceLocation.value.accuracy < 10 ? 'high' : 
                   deviceLocation.value.accuracy < 100 ? 'medium' : 'low'
        };
        setCurrentLocation(locationData);
        setLocationSource('device');
        setExtractionDetails({
          method: 'Apparaat GPS',
          accuracy: `±${Math.round(deviceLocation.value.accuracy)}m`,
          timestamp: new Date().toLocaleString('nl-NL')
        });
        onLocationExtracted(locationData);
        setStatus('success');
        return;
      }

      // Both methods failed
      console.log('❌ No automatic location data available');
      setStatus('failed');
      let errorMsg = 'Geen GPS-gegevens gevonden';
      if (exifLocation.status === 'rejected') {
        errorMsg += ' in foto';
      }
      if (deviceLocation.status === 'rejected') {
        errorMsg += exifLocation.status === 'rejected' ? ' en apparaatlocatie niet beschikbaar' : 'Apparaatlocatie niet beschikbaar';
      }
      setError(errorMsg);
    } catch (err) {
      console.error('Location extraction error:', err);
      setStatus('failed');
      setError(err.message);
    }
  };

  const getExifLocationFast = (file) => {
    return new Promise((resolve, reject) => {
      console.log('📋 Fast EXIF extraction starting...');
      
      // Set a timeout for EXIF extraction (max 5 seconds)
      const timeout = setTimeout(() => {
        console.log('⏰ EXIF extraction timeout');
        resolve(null); // Changed from reject to resolve(null)
      }, 5000);

      try {
        EXIF.getData(file, function() {
          try {
            clearTimeout(timeout);
            const lat = EXIF.getTag(this, 'GPSLatitude');
            const latRef = EXIF.getTag(this, 'GPSLatitudeRef');
            const lon = EXIF.getTag(this, 'GPSLongitude');
            const lonRef = EXIF.getTag(this, 'GPSLongitudeRef');
            const altitude = EXIF.getTag(this, 'GPSAltitude');
            const timestamp = EXIF.getTag(this, 'GPSTimeStamp');
            const dateStamp = EXIF.getTag(this, 'GPSDateStamp');

            console.log('📊 EXIF GPS data:', { lat, latRef, lon, lonRef });

            if (lat && lon && latRef && lonRef) {
              const decimalLat = convertDMSToDD(lat, latRef);
              const decimalLon = convertDMSToDD(lon, lonRef);

              console.log('🎯 Converted coordinates:', { lat: decimalLat, lng: decimalLon });

              if (decimalLat >= -90 && decimalLat <= 90 && decimalLon >= -180 && decimalLon <= 180) {
                let timestampString = null;
                if (dateStamp && timestamp) {
                  try {
                    timestampString = `${dateStamp} ${timestamp[0]}:${timestamp[1]}:${timestamp[2]}`;
                  } catch (e) {
                    console.log('Could not parse GPS timestamp');
                  }
                }

                resolve({
                  lat: decimalLat,
                  lng: decimalLon,
                  altitude: altitude || null,
                  timestamp: timestampString,
                  accuracy: 5
                });
                return;
              }
            }

            resolve(null);
          } catch (error) {
            clearTimeout(timeout);
            console.error('Error parsing EXIF GPS data:', error);
            resolve(null); // Changed from reject to resolve(null)
          }
        });
      } catch (error) {
        clearTimeout(timeout);
        console.error('EXIF getData error:', error);
        resolve(null); // Changed from reject to resolve(null)
      }
    });
  };

  const getCurrentLocationFast = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        resolve(null); // Changed from reject to resolve(null)
        return;
      }

      console.log('🎯 Requesting device GPS location...');

      const options = {
        enableHighAccuracy: true,
        timeout: 8000, // Reduced timeout to 8 seconds
        maximumAge: 30000 // Accept cached location up to 30 seconds old
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('📍 Device GPS position received:', {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            timestamp: position.timestamp
          });
        },
        (error) => {
          let errorMessage = 'Locatie kon niet worden bepaald';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Locatietoegang geweigerd';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Locatie niet beschikbaar';
              break;
            case error.TIMEOUT:
              errorMessage = 'Locatie timeout';
              break;
          }
          console.error('Device GPS error:', errorMessage, error);
          resolve(null); // Changed from reject to resolve(null)
        },
        options
      );
    });
  };

  const convertDMSToDD = (dms, ref) => {
    if (!dms || dms.length < 3) return 0;
    let dd = dms[0] + dms[1]/60 + dms[2]/3600;
    if (ref === 'S' || ref === 'W') {
      dd = dd * -1;
    }
    return dd;
  };

  const handleManualLocationSelected = (locationData) => {
    console.log('✅ Manual location selected (override):', locationData);
    setCurrentLocation(locationData);
    setLocationSource('manual');
    setExtractionDetails({
      method: 'Handmatig gekozen (override)',
      accuracy: 'Hoog (gebruiker geselecteerd)',
      timestamp: locationData.timestamp
    });
    onLocationExtracted(locationData);
    setStatus('success');
    setShowLocationPicker(false);
  };

  const getAccuracyColor = () => {
    if (!extractionDetails) return 'text-gray-600';
    if (locationSource === 'exif') return 'text-green-600';
    if (locationSource === 'manual') return 'text-blue-600';
    if (locationSource === 'device') {
      const accuracy = parseInt(extractionDetails.accuracy.replace(/[^\d]/g, ''));
      if (accuracy < 10) return 'text-green-600';
      if (accuracy < 100) return 'text-yellow-600';
      return 'text-orange-600';
    }
    return 'text-gray-600';
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'extracting': return FiLoader;
      case 'success': return locationSource === 'exif' ? FiCamera : 
                            locationSource === 'manual' ? FiMap : FiSmartphone;
      case 'failed': return FiAlertCircle;
      default: return FiMapPin;
    }
  };

  const getButtonText = () => {
    if (status === 'extracting') {
      return 'Locatie handmatig kiezen';
    }
    if (status === 'success') {
      return locationSource === 'manual' ? 'Andere locatie kiezen' : 'Locatie wijzigen';
    }
    return 'Locatie handmatig kiezen';
  };

  const handleLocationPickerClick = () => {
    console.log('🗺️ Opening location picker, current status:', status);
    console.log('🗺️ Current location:', currentLocation);
    setShowLocationPicker(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-4 shadow-lg border"
      >
        <div className="flex items-center space-x-3">
          {status === 'extracting' && (
            <>
              <div className="loading-spinner"></div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">Locatie bepalen...</p>
                {timeoutWarning ? (
                  <div className="text-sm space-y-1">
                    <p className="text-amber-600 flex items-center space-x-1">
                      <SafeIcon icon={FiClock} className="text-xs" />
                      <span>EXIF verwerking duurt lang, proberen apparaatlocatie...</span>
                    </p>
                    <p className="text-gray-500">💡 Tip: Je kunt ook handmatig een locatie kiezen hieronder</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    Gelijktijdig EXIF en apparaatlocatie controleren
                  </p>
                )}
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <SafeIcon icon={getStatusIcon()} className={`text-xl ${getAccuracyColor()}`} />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <p className="font-medium text-green-800">Locatie gevonden!</p>
                  <SafeIcon icon={FiCheck} className="text-green-600 text-sm" />
                </div>
                {extractionDetails && (
                  <div className="text-sm text-gray-600 mt-1 space-y-1">
                    <p><strong>Methode:</strong> {extractionDetails.method}</p>
                    <p><strong>Nauwkeurigheid:</strong> {extractionDetails.accuracy}</p>
                    <p><strong>Tijdstip:</strong> {extractionDetails.timestamp}</p>
                  </div>
                )}
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    locationSource === 'exif' ? 'bg-green-100 text-green-800' :
                    locationSource === 'manual' ? 'bg-blue-100 text-blue-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {locationSource === 'exif' ? (
                      <>
                        <SafeIcon icon={FiCamera} className="mr-1 text-xs" />
                        Foto GPS
                      </>
                    ) : locationSource === 'manual' ? (
                      <>
                        <SafeIcon icon={FiMap} className="mr-1 text-xs" />
                        Handmatig
                      </>
                    ) : (
                      <>
                        <SafeIcon icon={FiSmartphone} className="mr-1 text-xs" />
                        Apparaat GPS
                      </>
                    )}
                  </span>
                </div>
              </div>
            </>
          )}

          {status === 'failed' && (
            <>
              <SafeIcon icon={FiAlertCircle} className="text-orange-600 text-xl" />
              <div className="flex-1">
                <p className="font-medium text-orange-800">Geen automatische locatie gevonden</p>
                <p className="text-sm text-gray-600">{error}</p>
                <div className="text-xs text-gray-500 mt-2 space-y-1">
                  <p>💡 Je kunt nog steeds uploaden zonder locatie</p>
                  <p>🔒 Zorg dat locatietoestemming aan staat</p>
                  <p>📍 Of kies handmatig een locatie hieronder</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Manual Location Selection Button - ALWAYS AVAILABLE */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleLocationPickerClick}
            className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center space-x-2 transition-all duration-300 touch-manipulation ${
              status === 'success' && locationSource === 'manual'
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
            }`}
          >
            <SafeIcon icon={FiMap} className="text-lg" />
            <span>{getButtonText()}</span>
          </button>
          
          {/* Helper text */}
          <p className="text-xs text-gray-500 text-center mt-2">
            {status === 'success' 
              ? '🗺️ Kies een andere locatie of corrigeer de huidige locatie'
              : status === 'extracting'
              ? '⏱️ Wacht niet - kies nu handmatig een locatie!'
              : '📍 Kies handmatig een locatie op de interactieve kaart'
            }
          </p>
        </div>
      </motion.div>

      {/* Location Picker Modal */}
      <AnimatePresence>
        {showLocationPicker && (
          <LocationPicker
            onLocationSelected={handleManualLocationSelected}
            onClose={() => setShowLocationPicker(false)}
            currentLocation={currentLocation}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default LocationExtractor;