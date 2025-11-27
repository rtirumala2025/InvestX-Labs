/**
 * CDN Configuration
 * 
 * Configuration for Content Delivery Network (CDN) integration.
 * This file should be configured based on your CDN provider.
 * 
 * Supported CDN Providers:
 * - Cloudflare
 * - AWS CloudFront
 * - Vercel
 * - Netlify
 * - Custom CDN
 */

const CDN_CONFIG = {
  // Enable/disable CDN
  enabled: process.env.REACT_APP_CDN_ENABLED === 'true',
  
  // Base URL for CDN
  baseUrl: process.env.REACT_APP_CDN_BASE_URL || '',
  
  // CDN Provider (cloudflare, cloudfront, vercel, netlify, custom)
  provider: process.env.REACT_APP_CDN_PROVIDER || 'custom',
  
  // Image optimization settings
  images: {
    // Default quality (1-100)
    quality: parseInt(process.env.REACT_APP_IMAGE_QUALITY || '80', 10),
    
    // Default format (webp, avif, jpg, png)
    format: process.env.REACT_APP_IMAGE_FORMAT || 'webp',
    
    // Responsive breakpoints
    breakpoints: [320, 640, 768, 1024, 1280, 1920],
    
    // Enable lazy loading by default
    lazyLoad: process.env.REACT_APP_IMAGE_LAZY_LOAD !== 'false',
    
    // Enable placeholder generation
    placeholder: process.env.REACT_APP_IMAGE_PLACEHOLDER !== 'false',
  },
  
  // Asset optimization
  assets: {
    // Enable compression
    compression: process.env.REACT_APP_ASSET_COMPRESSION !== 'false',
    
    // Cache control
    cacheControl: process.env.REACT_APP_CACHE_CONTROL || 'public, max-age=31536000, immutable',
  },
  
  // Provider-specific configurations
  providers: {
    cloudflare: {
      // Cloudflare Image Resizing API
      imageApi: 'https://imagedelivery.net',
      // Transform parameters
      transform: (url, options) => {
        const params = new URLSearchParams();
        if (options.width) params.append('w', options.width);
        if (options.height) params.append('h', options.height);
        if (options.quality) params.append('q', options.quality);
        if (options.format) params.append('f', options.format);
        return `${url}?${params.toString()}`;
      },
    },
    cloudfront: {
      // AWS CloudFront with Lambda@Edge
      transform: (url, options) => {
        const params = new URLSearchParams();
        if (options.width) params.append('w', options.width);
        if (options.height) params.append('h', options.height);
        if (options.quality) params.append('q', options.quality);
        if (options.format) params.append('f', options.format);
        return `${url}?${params.toString()}`;
      },
    },
    vercel: {
      // Vercel Image Optimization API
      imageApi: '/_next/image',
      transform: (url, options) => {
        const params = new URLSearchParams();
        params.append('url', url);
        if (options.width) params.append('w', options.width);
        if (options.height) params.append('h', options.height);
        if (options.quality) params.append('q', options.quality);
        return `/_next/image?${params.toString()}`;
      },
    },
    netlify: {
      // Netlify Image Optimization
      transform: (url, options) => {
        const params = new URLSearchParams();
        if (options.width) params.append('w', options.width);
        if (options.height) params.append('h', options.height);
        if (options.quality) params.append('q', options.quality);
        if (options.format) params.append('f', options.format);
        return `${url}?${params.toString()}`;
      },
    },
    custom: {
      // Custom CDN configuration
      transform: (url, options) => {
        const params = new URLSearchParams();
        if (options.width) params.append('w', options.width);
        if (options.height) params.append('h', options.height);
        if (options.quality) params.append('q', options.quality);
        if (options.format) params.append('f', options.format);
        if (options.fit) params.append('fit', options.fit);
        return `${url}?${params.toString()}`;
      },
    },
  },
};

/**
 * Get optimized URL based on provider
 */
export const getOptimizedUrl = (url, options = {}) => {
  if (!CDN_CONFIG.enabled || !url) {
    return url;
  }

  const provider = CDN_CONFIG.providers[CDN_CONFIG.provider] || CDN_CONFIG.providers.custom;
  const baseUrl = CDN_CONFIG.baseUrl || '';
  
  // Construct full URL if relative
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  
  // Apply provider-specific transformation
  return provider.transform(fullUrl, {
    quality: options.quality || CDN_CONFIG.images.quality,
    format: options.format || CDN_CONFIG.images.format,
    width: options.width,
    height: options.height,
    fit: options.fit || 'cover',
  });
};

/**
 * Generate srcset for responsive images
 */
export const generateSrcSet = (url, widths = CDN_CONFIG.images.breakpoints) => {
  return widths
    .map((width) => `${getOptimizedUrl(url, { width })} ${width}w`)
    .join(', ');
};

export default CDN_CONFIG;

