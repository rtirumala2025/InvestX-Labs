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
    primary: 'bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white border-0 shadow-apple hover:shadow-apple-lg',
    secondary: 'bg-white/85 hover:bg-white/95 text-neutral-700 border-white/25 backdrop-blur-xl hover:border-white/35',
    outline: 'bg-transparent hover:bg-white/10 text-neutral-700 border-neutral-300/50 hover:border-accent-300/50 hover:text-accent-700',
    ghost: 'bg-transparent hover:bg-white/10 text-neutral-700 border-transparent hover:text-accent-700',
    accent: 'bg-gradient-to-r from-accent-500/90 to-accent-600/90 hover:from-accent-600 hover:to-accent-700 text-white border-accent-200/30 backdrop-blur-xl shadow-apple hover:shadow-apple-lg'
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
    inline-flex items-center justify-center
    rounded-xl font-medium
    border transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-[0.98] hover:-translate-y-0.5
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
