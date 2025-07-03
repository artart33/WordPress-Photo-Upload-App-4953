import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useWordPress } from '../context/WordPressContext';

const { FiSettings, FiSave, FiCheckCircle, FiXCircle, FiLoader, FiEye, FiEyeOff, FiTool, FiAlertTriangle } = FiIcons;

const Settings = () => {
  const { config, saveConfig, validateConnection, isAuthenticated, testWordPressAPI, debugInfo } = useWordPress();
  const [formData, setFormData] = useState(config);
  const [isValidating, setIsValidating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsValidating(true);
    setValidationResult(null);

    try {
      // Force HTTPS if not already
      let cleanUrl = formData.siteUrl.trim();
      if (cleanUrl && !cleanUrl.startsWith('http')) {
        cleanUrl = 'https://' + cleanUrl;
      }
      
      // Update form data with cleaned URL
      const updatedFormData = { ...formData, siteUrl: cleanUrl };
      setFormData(updatedFormData);
      
      saveConfig(updatedFormData);
      const isValid = await validateConnection();
      
      setValidationResult({
        success: isValid,
        message: isValid 
          ? 'Verbinding succesvol! WordPress-configuratie opgeslagen.' 
          : 'Verbinding mislukt. Controleer je instellingen.'
      });
    } catch (error) {
      console.error('Connection error:', error);
      setValidationResult({
        success: false,
        message: 'Fout bij het testen van de verbinding: ' + error.message
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleTestAPI = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const result = await testWordPressAPI();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: 'Network error: ' + error.message
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setValidationResult(null);
    setTestResult(null);
  };

  // Check if we're on mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isSecureContext = window.location.protocol === 'https:' || window.location.hostname === 'localhost';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <SafeIcon icon={FiSettings} className="text-blue-600 text-lg" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">WordPress Instellingen</h2>
      </div>

      {/* Mobile Security Warning */}
      {isMobile && !isSecureContext && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6"
        >
          <div className="flex items-start space-x-2">
            <SafeIcon icon={FiAlertTriangle} className="text-amber-600 mt-0.5" />
            <div className="text-amber-800">
              <p className="font-medium">Mobiele Beveiliging</p>
              <p className="text-sm mt-1">
                Voor optimale beveiliging op mobile, gebruik HTTPS voor je WordPress site en deze app.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {isAuthenticated && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6"
        >
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiCheckCircle} className="text-green-600" />
            <span className="text-green-800 font-medium">
              Verbonden met WordPress
            </span>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            WordPress Site URL *
          </label>
          <input
            type="url"
            value={formData.siteUrl}
            onChange={(e) => handleInputChange('siteUrl', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="https://jouwsite.nl"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            {isMobile 
              ? '⚠️ Gebruik HTTPS voor mobiele verbindingen (begint met https://)'
              : 'De volledige URL naar je WordPress-site (bij voorkeur HTTPS)'
            }
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gebruikersnaam *
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Je WordPress gebruikersnaam"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wachtwoord / Applicatie Wachtwoord *
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Je WordPress wachtwoord"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <SafeIcon icon={showPassword ? FiEyeOff : FiEye} className="text-lg" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {isMobile 
              ? '📱 Op mobiel: Gebruik een applicatie-specifiek wachtwoord voor extra beveiliging'
              : 'Voor extra beveiliging gebruik een applicatie-specifiek wachtwoord'
            }
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isValidating}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 touch-manipulation"
          >
            {isValidating ? (
              <>
                <div className="loading-spinner border-white"></div>
                <span>Testen...</span>
              </>
            ) : (
              <>
                <SafeIcon icon={FiSave} className="text-lg" />
                <span>Opslaan & Testen</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleTestAPI}
            disabled={isTesting || !formData.siteUrl || !formData.username || !formData.password}
            className="bg-purple-600 hover:bg-purple-700 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 touch-manipulation"
          >
            {isTesting ? (
              <div className="loading-spinner border-white"></div>
            ) : (
              <SafeIcon icon={FiTool} className="text-lg" />
            )}
          </button>
        </div>
      </form>

      {validationResult && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border mt-4 ${
            validationResult.success
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            <SafeIcon icon={validationResult.success ? FiCheckCircle : FiXCircle} className="text-lg" />
            <span>{validationResult.message}</span>
          </div>
        </motion.div>
      )}

      {testResult && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border mt-4 ${
            testResult.success
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <h4 className="font-semibold mb-2">API Test Resultaat:</h4>
          {testResult.success ? (
            <div className="text-green-800">
              <p>✅ WordPress API is toegankelijk</p>
              <p>✅ Authenticatie succesvol</p>
              {testResult.user && (
                <p>👤 Ingelogd als: {testResult.user.name} ({testResult.user.roles?.join(', ')})</p>
              )}
            </div>
          ) : (
            <div className="text-red-800">
              <p>❌ API Test gefaald</p>
              <p className="text-sm mt-1">Fout: {testResult.error}</p>
              {isMobile && (
                <div className="mt-2 p-2 bg-red-100 rounded text-xs">
                  <p><strong>Mobiele Tips:</strong></p>
                  <p>• Zorg dat je WordPress site HTTPS gebruikt</p>
                  <p>• Controleer CORS instellingen</p>
                  <p>• Test eerst op desktop browser</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {debugInfo && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg border mt-4 bg-yellow-50 border-yellow-200"
        >
          <h4 className="font-semibold mb-2 text-yellow-800">Debug Informatie:</h4>
          <div className="text-sm text-yellow-700">
            {debugInfo.status && <p>Status: {debugInfo.status} {debugInfo.statusText}</p>}
            {debugInfo.error && <p>Error: {debugInfo.error}</p>}
            {debugInfo.type && <p>Type: {debugInfo.type}</p>}
          </div>
        </motion.div>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">
          {isMobile ? 'Mobiele Troubleshooting:' : 'Troubleshooting:'}
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          {isMobile ? (
            <>
              <li>• <strong>HTTPS vereist:</strong> WordPress site MOET https:// gebruiken</li>
              <li>• <strong>CORS:</strong> Controleer Cross-Origin instellingen</li>
              <li>• <strong>App wachtwoorden:</strong> Gebruik application passwords</li>
              <li>• <strong>Mobile browsers:</strong> Hebben strengere beveiligingseisen</li>
              <li>• <strong>Test eerst:</strong> Probeer verbinding op desktop</li>
              <li>• <strong>WiFi vs 4G/5G:</strong> Probeer andere internetverbinding</li>
            </>
          ) : (
            <>
              <li>• Zorg dat je WordPress-site de REST API heeft ingeschakeld</li>
              <li>• Gebruik bij voorkeur een applicatie-specifiek wachtwoord</li>
              <li>• De URL moet beginnen met https:// of http:// (geen slash aan het eind)</li>
              <li>• Controleer of je gebruiker rechten heeft om posts te maken</li>
              <li>• Test eerst met de paarse knop voor gedetailleerde foutmeldingen</li>
              <li>• Kijk in de browser console (F12) voor meer technische details</li>
            </>
          )}
        </ul>
      </div>
    </motion.div>
  );
};

export default Settings;