import React, { createContext, useContext, useState, useEffect } from 'react';

const WordPressContext = createContext();

export const useWordPress = () => {
  const context = useContext(WordPressContext);
  if (!context) {
    throw new Error('useWordPress must be used within a WordPressProvider');
  }
  return context;
};

export const WordPressProvider = ({ children }) => {
  const [config, setConfig] = useState({
    siteUrl: localStorage.getItem('wp_site_url') || '',
    username: localStorage.getItem('wp_username') || '',
    password: localStorage.getItem('wp_password') || '',
  });
  const [categories, setCategories] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    if (config.siteUrl && config.username && config.password) {
      validateConnection();
    }
  }, [config]);

  const saveConfig = (newConfig) => {
    setConfig(newConfig);
    localStorage.setItem('wp_site_url', newConfig.siteUrl);
    localStorage.setItem('wp_username', newConfig.username);
    localStorage.setItem('wp_password', newConfig.password);
  };

  const validateConnection = async () => {
    try {
      // Clean URL (remove trailing slash and ensure https on mobile)
      let cleanUrl = config.siteUrl.replace(/\/$/, '');
      
      // Force HTTPS on mobile devices for security
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile && cleanUrl.startsWith('http://')) {
        console.warn('Converting HTTP to HTTPS for mobile security');
        cleanUrl = cleanUrl.replace('http://', 'https://');
      }

      console.log('Testing connection to:', cleanUrl);

      const response = await fetch(`${cleanUrl}/wp-json/wp/v2/categories`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${config.username}:${config.password}`)}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors', // Explicitly set CORS mode
        credentials: 'omit', // Don't send cookies
      });

      console.log('WordPress connection test:', response.status, response.statusText);

      if (response.ok) {
        const categoriesData = await response.json();
        setCategories(categoriesData);
        setIsAuthenticated(true);
        setDebugInfo(null);
        return true;
      } else {
        let errorData;
        try {
          errorData = await response.text();
        } catch (e) {
          errorData = `HTTP ${response.status}: ${response.statusText}`;
        }

        console.error('WordPress connection error:', errorData);
        setDebugInfo({
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          url: cleanUrl
        });
        setIsAuthenticated(false);
        return false;
      }
    } catch (error) {
      console.error('WordPress connection error:', error);
      
      // Provide more specific error messages for mobile issues
      let errorMessage = error.message;
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        errorMessage = 'Netwerkfout: Controleer internetverbinding en CORS instellingen';
      }

      setDebugInfo({
        error: errorMessage,
        type: 'network',
        originalError: error.name
      });
      setIsAuthenticated(false);
      return false;
    }
  };

  const uploadPhoto = async (file, postData) => {
    try {
      let cleanUrl = config.siteUrl.replace(/\/$/, '');
      
      // Force HTTPS on mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile && cleanUrl.startsWith('http://')) {
        cleanUrl = cleanUrl.replace('http://', 'https://');
      }

      console.log('Starting upload process...');
      console.log('File:', file.name, file.size, file.type);
      console.log('Post data:', postData);

      // First upload the media
      const mediaFormData = new FormData();
      mediaFormData.append('file', file);

      console.log('Uploading media to:', `${cleanUrl}/wp-json/wp/v2/media`);

      const mediaResponse = await fetch(`${cleanUrl}/wp-json/wp/v2/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${config.username}:${config.password}`)}`,
        },
        body: mediaFormData,
        mode: 'cors',
        credentials: 'omit',
      });

      console.log('Media upload response:', mediaResponse.status, mediaResponse.statusText);

      if (!mediaResponse.ok) {
        const errorText = await mediaResponse.text();
        console.error('Media upload error:', errorText);
        throw new Error(`Media upload failed: ${mediaResponse.status} - ${errorText}`);
      }

      const mediaData = await mediaResponse.json();
      console.log('Media uploaded successfully:', mediaData.id, mediaData.source_url);

      // Create post content with enhanced information
      let postContent = `<p>${postData.content || ''}</p>`;

      // Add rating if provided
      if (postData.rating > 0) {
        const starEmojis = '⭐'.repeat(postData.rating);
        const ratingText = ['', 'Slecht', 'Matig', 'Goed', 'Zeer goed', 'Uitstekend'][postData.rating];
        
        postContent += `
          <div class="rating-info" style="margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
            <h4 style="margin: 0 0 10px 0; color: #856404;">⭐ Beoordeling</h4>
            <p style="margin: 5px 0; font-size: 18px;">${starEmojis}</p>
            <p style="margin: 5px 0;"><strong>${postData.rating}/5 sterren</strong> - ${ratingText}</p>
          </div>
        `;
      }

      // Add location information if available
      if (postData.location) {
        let accuracyText = 'Onbekend';
        let locationIcon = '📍';
        
        if (postData.location.source === 'exif') {
          accuracyText = 'GPS-gegevens uit foto (zeer nauwkeurig)';
          locationIcon = '📸';
        } else if (postData.location.source === 'manual') {
          accuracyText = 'Handmatig gekozen locatie (nauwkeurig)';
          locationIcon = '🗺️';
        } else if (postData.location.source === 'device') {
          accuracyText = `Apparaat GPS (±${Math.round(postData.location.accuracy)}m nauwkeurig)`;
          locationIcon = '📱';
        }

        postContent += `
          <div class="location-info" style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-left: 4px solid #0073aa; border-radius: 4px;">
            <h4 style="margin: 0 0 10px 0; color: #0073aa;">${locationIcon} Locatie-informatie</h4>
            <p style="margin: 5px 0;"><strong>Coördinaten:</strong> ${postData.location.lat.toFixed(6)}°N, ${postData.location.lng.toFixed(6)}°E</p>
            <p style="margin: 5px 0;"><strong>Nauwkeurigheid:</strong> ${accuracyText}</p>
            ${postData.location.altitude ? `<p style="margin: 5px 0;"><strong>Hoogte:</strong> ${Math.round(postData.location.altitude)}m</p>` : ''}
            ${postData.location.name ? `<p style="margin: 5px 0;"><strong>Locatienaam:</strong> ${postData.location.name}</p>` : ''}
            <p style="margin: 10px 0 0 0;"><a href="${postData.location.mapUrl}" target="_blank" rel="noopener" style="color: #0073aa; text-decoration: none;">🗺️ Bekijk locatie op kaart →</a></p>
          </div>
        `;
      }

      // Add weather information if available
      if (postData.weather) {
        const weatherIcon = postData.weather.icon === 'FiSun' ? '☀️' : 
                           postData.weather.icon === 'FiCloud' ? '☁️' : 
                           postData.weather.icon === 'FiCloudRain' ? '🌧️' : 
                           postData.weather.icon === 'FiCloudSnow' ? '❄️' : '🌤️';

        postContent += `
          <div class="weather-info" style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 4px;">
            <h4 style="margin: 0 0 10px 0; color: #1976d2;">${weatherIcon} Weer tijdens foto</h4>
            <p style="margin: 5px 0;"><strong>Temperatuur:</strong> ${postData.weather.temperature}°C</p>
            <p style="margin: 5px 0;"><strong>Omstandigheden:</strong> ${postData.weather.description}</p>
            <p style="margin: 5px 0;"><strong>Luchtvochtigheid:</strong> ${postData.weather.humidity}%</p>
            <p style="margin: 5px 0;"><strong>Windsnelheid:</strong> ${postData.weather.windSpeed} km/h</p>
            ${postData.weather.visibility ? `<p style="margin: 5px 0;"><strong>Zicht:</strong> ${postData.weather.visibility} km</p>` : ''}
            ${postData.weather.location ? `<p style="margin: 5px 0;"><strong>Locatie:</strong> ${postData.weather.location}</p>` : ''} 
          </div>
        `;
      }

      // Create the post with the uploaded media
      const postPayload = {
        title: postData.title,
        content: postContent,
        status: 'publish',
        featured_media: mediaData.id,
        categories: postData.categories.length > 0 ? postData.categories : undefined,
      };

      console.log('Creating post with payload:', postPayload);

      const postResponse = await fetch(`${cleanUrl}/wp-json/wp/v2/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${config.username}:${config.password}`)}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postPayload),
        mode: 'cors',
        credentials: 'omit',
      });

      console.log('Post creation response:', postResponse.status, postResponse.statusText);

      if (!postResponse.ok) {
        const errorText = await postResponse.text();
        console.error('Post creation error:', errorText);
        throw new Error(`Post creation failed: ${postResponse.status} - ${errorText}`);
      }

      const postResponseData = await postResponse.json();
      console.log('Post created successfully:', postResponseData.id, postResponseData.link);

      return {
        ...postResponseData,
        media: mediaData
      };

    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const testWordPressAPI = async () => {
    try {
      let cleanUrl = config.siteUrl.replace(/\/$/, '');
      
      // Force HTTPS on mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile && cleanUrl.startsWith('http://')) {
        cleanUrl = cleanUrl.replace('http://', 'https://');
      }

      // Test basic API access
      const apiResponse = await fetch(`${cleanUrl}/wp-json/wp/v2/`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
      });

      const apiData = await apiResponse.json();
      console.log('WordPress API Info:', apiData);

      // Test authentication
      const authResponse = await fetch(`${cleanUrl}/wp-json/wp/v2/users/me`, {
        headers: {
          'Authorization': `Basic ${btoa(`${config.username}:${config.password}`)}`,
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
      });

      if (authResponse.ok) {
        const userData = await authResponse.json();
        console.log('Authenticated user:', userData);
        return {
          success: true,
          user: userData,
          apiInfo: apiData
        };
      } else {
        const errorData = await authResponse.text();
        console.error('Auth test failed:', errorData);
        return {
          success: false,
          error: `Authentication failed: ${authResponse.status} - ${errorData}`
        };
      }
    } catch (error) {
      console.error('API test error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  const value = {
    config,
    saveConfig,
    categories,
    isAuthenticated,
    validateConnection,
    uploadPhoto,
    testWordPressAPI,
    debugInfo,
  };

  return (
    <WordPressContext.Provider value={value}>
      {children}
    </WordPressContext.Provider>
  );
};