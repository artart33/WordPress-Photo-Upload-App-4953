/**
 * Ultra-fast image compression utility for mobile photo uploads
 * Optimized for speed while maintaining quality
 */

export const compressImage = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      format = 'image/jpeg'
    } = options;

    // Quick size check
    if (file.size > 50 * 1024 * 1024) {
      reject(new Error('Foto te groot (max 50MB)'));
      return;
    }

    // Skip compression for already small files
    if (file.size < 500 * 1024) { // < 500KB
      console.log('🚀 File already small, skipping compression');
      resolve(file);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // Set a timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.log('⏰ Compression timeout, using original');
      resolve(file);
    }, 10000); // 10 second timeout

    img.onload = () => {
      clearTimeout(timeout);
      
      try {
        let { width, height } = img;
        
        // Calculate new dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const compressedFile = new File([blob], file.name, {
                type: format,
                lastModified: Date.now()
              });

              console.log('🚀 Compression successful:', {
                original: `${(file.size / 1024 / 1024).toFixed(1)}MB`,
                compressed: `${(compressedFile.size / 1024 / 1024).toFixed(1)}MB`,
                saved: `${((1 - compressedFile.size / file.size) * 100).toFixed(0)}%`,
                size: `${width}x${height}`
              });

              resolve(compressedFile);
            } else {
              console.log('🔄 Compression not beneficial, using original');
              resolve(file);
            }
          },
          format,
          quality
        );
      } catch (error) {
        clearTimeout(timeout);
        console.warn('⚠️ Compression error, using original:', error);
        resolve(file);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      console.warn('⚠️ Image load error, using original');
      resolve(file);
    };

    // Load image
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    // Cleanup
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      img.onload();
    };
  });
};

export const createImagePreview = (file, maxSize = 400) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // Preview timeout
    const timeout = setTimeout(() => {
      reject(new Error('Preview timeout'));
    }, 5000);

    img.onload = () => {
      clearTimeout(timeout);
      
      try {
        let { width, height } = img;
        
        // Calculate thumbnail size
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);

        canvas.width = width;
        canvas.height = height;

        // Draw thumbnail
        ctx.drawImage(img, 0, 0, width, height);
        
        const previewDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(previewDataUrl);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Preview kon niet worden gemaakt'));
    };

    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      img.onload();
    };
  });
};

export const getImageInfo = (file) => {
  return new Promise((resolve) => {
    // Quick timeout for image info
    const timeout = setTimeout(() => {
      resolve({
        width: 0,
        height: 0,
        size: file.size,
        type: file.type,
        name: file.name,
        fast: true
      });
    }, 3000);

    const img = new Image();
    
    img.onload = () => {
      clearTimeout(timeout);
      resolve({
        width: img.width,
        height: img.height,
        size: file.size,
        type: file.type,
        name: file.name,
        fast: false
      });
      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      resolve({
        width: 0,
        height: 0,
        size: file.size,
        type: file.type,
        name: file.name,
        error: true
      });
      URL.revokeObjectURL(img.src);
    };

    img.src = URL.createObjectURL(file);
  });
};