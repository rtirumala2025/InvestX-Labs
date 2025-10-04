import React, { memo } from 'react';

const GlassButton = ({ 
  children, 
  className = '', 
  variant = 'primary',
  size = 'default',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  as: Component = 'button',
  'aria-label': ariaLabel,
  ...props 
}) => {
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/40 backdrop-blur-xl',
    secondary: 'bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/30 backdrop-blur-2xl backdrop-saturate-150 shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20',
    outline: 'bg-transparent hover:bg-white/10 text-white border-white/30 hover:border-white/50 backdrop-blur-xl hover:backdrop-blur-2xl',
    ghost: 'bg-transparent hover:bg-white/8 text-white border-transparent hover:border-white/20 backdrop-blur-lg hover:backdrop-blur-xl',
    accent: 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 hover:from-blue-500/30 hover:to-purple-600/30 text-white border-blue-200/30 hover:border-blue-200/50 backdrop-blur-2xl backdrop-saturate-150 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20',
    glass: 'bg-white/8 hover:bg-white/15 text-white border-white/20 hover:border-white/30 backdrop-blur-2xl backdrop-saturate-150 shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/20 before:to-transparent before:rounded-xl before:pointer-events-none'
  };
  
  const sizeClasses = {
    small: 'px-3 py-2 text-sm',
    default: 'px-5 py-3 text-base',
    large: 'px-6 py-4 text-lg'
  };
  
  const disabledClasses = disabled 
    ? 'opacity-50 cursor-not-allowed pointer-events-none' 
    : '';
  
  const loadingClasses = loading 
    ? 'cursor-wait' 
    : '';
  
  const classes = `
    relative inline-flex items-center justify-center overflow-hidden
    rounded-xl font-medium
    border transition-all duration-300 ease-out transform-gpu
    focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2 focus:ring-offset-transparent
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-[0.96] hover:-translate-y-1 hover:scale-[1.02]
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${disabledClasses}
    ${loadingClasses}
    ${className}
  `.trim();
  
  return (
    <Component
      type={Component === 'button' ? type : undefined}
      className={classes}
      disabled={Component === 'button' ? (disabled || loading) : undefined}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </Component>
  );
};

export default memo(GlassButton);
