import React, { useState, useEffect, useRef } from 'react';
import {
  getOptimizedImageProps,
  generatePlaceholder,
  lazyLoadImage,
} from '../../utils/imageOptimization';

/**
 * OptimizedImage Component
 * 
 * A React component that provides automatic image optimization including:
 * - Lazy loading
 * - Responsive images
 * - CDN integration
 * - Placeholder support
 * - Error handling
 */
const OptimizedImage = ({
  src,
  alt = '',
  width,
  height,
  className = '',
  loading = 'lazy',
  sizes,
  quality = 80,
  format = 'webp',
  fit = 'cover',
  placeholder = true,
  onLoad,
  onError,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [placeholderSrc, setPlaceholderSrc] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!src) return;

    // Generate placeholder if enabled
    if (placeholder) {
      generatePlaceholder(src).then(setPlaceholderSrc);
    }

    // Set up lazy loading if needed
    if (loading === 'lazy' && imgRef.current) {
      const optimizedProps = getOptimizedImageProps(src, {
        width,
        height,
        quality,
        format,
        fit,
      });
      lazyLoadImage(imgRef.current, optimizedProps.src, {
        rootMargin: '50px',
      });
      setImageSrc(placeholderSrc || optimizedProps.src);
    } else {
      const optimizedProps = getOptimizedImageProps(src, {
        width,
        height,
        quality,
        format,
        fit,
      });
      setImageSrc(optimizedProps.src);
    }
  }, [src, width, height, quality, format, fit, loading, placeholder, placeholderSrc]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) {
      onLoad(e);
    }
  };

  const handleError = (e) => {
    setHasError(true);
    if (onError) {
      onError(e);
    }
  };

  if (!src) {
    return null;
  }

  const optimizedProps = getOptimizedImageProps(src, {
    width,
    height,
    alt,
    loading,
    sizes,
    quality,
    format,
    fit,
    className: `${className} ${isLoaded ? 'loaded' : 'loading'} ${hasError ? 'error' : ''}`.trim(),
  });

  return (
    <div
      className={`optimized-image-wrapper ${className}`}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {placeholderSrc && !isLoaded && (
        <img
          src={placeholderSrc}
          alt=""
          className="image-placeholder"
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(10px)',
            transform: 'scale(1.1)',
          }}
        />
      )}
      <img
        ref={imgRef}
        {...optimizedProps}
        {...props}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          ...props.style,
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
        }}
      />
      {hasError && (
        <div
          className="image-error"
          role="img"
          aria-label={alt || 'Image failed to load'}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            color: 'rgba(255, 255, 255, 0.5)',
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;

