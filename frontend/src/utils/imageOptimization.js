/**
 * Image Optimization Utilities
 * 
 * Provides utilities for optimizing images, including:
 * - Lazy loading
 * - Responsive image generation
 * - CDN URL construction
 * - Format conversion
 * - Placeholder generation
 */

// CDN Configuration
const CDN_BASE_URL = process.env.REACT_APP_CDN_BASE_URL || '';
const CDN_ENABLED = Boolean(CDN_BASE_URL);

/**
 * Generate optimized image URL with CDN support
 * @param {string} src - Original image source
 * @param {Object} options - Optimization options
 * @returns {string} Optimized image URL
 */
export const getOptimizedImageUrl = (src, options = {}) => {
  if (!src) return '';
  
  const {
    width,
    height,
    quality = 80,
    format = 'webp',
    fit = 'cover',
  } = options;

  // If CDN is enabled, use CDN URL transformation
  if ((CDN_ENABLED && src.startsWith('/')) || src.startsWith('http')) {
    const params = new URLSearchParams();
    if (width) params.append('w', width);
    if (height) params.append('h', height);
    params.append('q', quality);
    params.append('f', format);
    params.append('fit', fit);
    
    const baseUrl = src.startsWith('http') ? src : `${CDN_BASE_URL}${src}`;
    return `${baseUrl}?${params.toString()}`;
  }

  // Fallback to original if CDN not configured
  return src;
};

/**
 * Generate responsive image srcset
 * @param {string} src - Base image source
 * @param {Array<number>} widths - Array of widths for srcset
 * @returns {string} srcset string
 */
export const generateSrcSet = (src, widths = [320, 640, 960, 1280, 1920]) => {
  return widths
    .map((width) => `${getOptimizedImageUrl(src, { width })} ${width}w`)
    .join(', ');
};

/**
 * Generate sizes attribute for responsive images
 * @param {string} defaultSize - Default size (e.g., '100vw' or '(max-width: 768px) 100vw, 50vw')
 * @returns {string} sizes attribute
 */
export const generateSizes = (defaultSize = '100vw') => {
  return defaultSize;
};

/**
 * Generate a low-quality placeholder (LQIP) data URL
 * @param {string} src - Image source
 * @returns {Promise<string>} Base64 data URL
 */
export const generatePlaceholder = async (src) => {
  // In a real implementation, this would fetch a low-quality version
  // For now, return a simple gradient placeholder
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM0YjU1NjMiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMxZTIxMjkiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+';
};

/**
 * Lazy load image with intersection observer
 * @param {HTMLElement} imgElement - Image element
 * @param {string} src - Image source
 * @param {Object} options - Options for intersection observer
 */
export const lazyLoadImage = (imgElement, src, options = {}) => {
  if (!imgElement || !('IntersectionObserver' in window)) {
    // Fallback: load immediately
    imgElement.src = src;
    return;
  }

  const {
    root = null,
    rootMargin = '50px',
    threshold = 0.01,
  } = options;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = src;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    },
    { root, rootMargin, threshold }
  );

  observer.observe(imgElement);
};

/**
 * Preload critical images
 * @param {Array<string>} imageUrls - Array of image URLs to preload
 */
export const preloadImages = (imageUrls) => {
  imageUrls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
};

/**
 * Optimized Image Component Props Generator
 * @param {string} src - Image source
 * @param {Object} options - Optimization options
 * @returns {Object} Props for img element
 */
export const getOptimizedImageProps = (src, options = {}) => {
  const {
    width,
    height,
    alt = '',
    loading = 'lazy',
    sizes,
    className = '',
  } = options;

  const optimizedSrc = getOptimizedImageUrl(src, options);
  const srcSet = generateSrcSet(src, options.widths);

  return {
    src: optimizedSrc,
    srcSet: srcSet || undefined,
    sizes: sizes || generateSizes(),
    width,
    height,
    alt,
    loading,
    className: `optimized-image ${className}`.trim(),
    decoding: 'async',
  };
};

/**
 * Check if WebP is supported
 * @returns {Promise<boolean>}
 */
export const supportsWebP = () => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src =
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

/**
 * Get best image format based on browser support
 * @param {string} src - Image source
 * @returns {Promise<string>} Optimized image URL with best format
 */
export const getBestFormat = async (src) => {
  const webPSupported = await supportsWebP();
  return getOptimizedImageUrl(src, {
    format: webPSupported ? 'webp' : 'jpg',
  });
};

export default {
  getOptimizedImageUrl,
  generateSrcSet,
  generateSizes,
  generatePlaceholder,
  lazyLoadImage,
  preloadImages,
  getOptimizedImageProps,
  supportsWebP,
  getBestFormat,
};

