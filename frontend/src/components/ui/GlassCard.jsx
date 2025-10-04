import React, { memo } from 'react';

const GlassCard = ({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'default',
  shadow = 'default',
  interactive = false,
  glow = false,
  parallax = false,
  role = 'region',
  'aria-label': ariaLabel = 'glass card',
  ...props 
}) => {
  const variantClasses = {
    default: 'bg-white/10 border-white/20 backdrop-blur-2xl backdrop-saturate-150 before:bg-gradient-to-br before:from-white/20 before:to-transparent before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none',
    subtle: 'bg-white/5 border-white/10 backdrop-blur-xl backdrop-saturate-125 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none',
    muted: 'bg-white/3 border-white/8 backdrop-blur-lg backdrop-saturate-110 before:bg-gradient-to-br before:from-white/8 before:to-transparent before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none',
    accent: 'bg-gradient-to-br from-blue-500/20 to-purple-600/20 border-blue-200/30 text-white backdrop-blur-2xl backdrop-saturate-150 before:bg-gradient-to-br before:from-white/15 before:to-transparent before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none',
    dark: 'bg-black/20 border-white/10 backdrop-blur-2xl backdrop-saturate-150 text-white before:bg-gradient-to-br before:from-white/10 before:to-transparent before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none',
    hero: 'bg-white/8 border-white/15 backdrop-blur-3xl backdrop-saturate-180 before:bg-gradient-to-br before:from-white/25 before:via-white/10 before:to-transparent before:absolute before:inset-0 before:rounded-3xl before:pointer-events-none shadow-2xl shadow-black/20',
    floating: 'bg-white/12 border-white/25 backdrop-blur-2xl backdrop-saturate-150 before:bg-gradient-to-br before:from-white/30 before:via-white/15 before:to-transparent before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none'
  };
  
  const paddingClasses = {
    none: '',
    small: 'p-4',
    default: 'p-6',
    large: 'p-8',
    xl: 'p-12'
  };
  
  const shadowClasses = {
    none: '',
    small: 'shadow-lg shadow-black/5',
    default: 'shadow-xl shadow-black/10',
    large: 'shadow-2xl shadow-black/15',
    xl: 'shadow-3xl shadow-black/20'
  };
  
  const glowClasses = glow 
    ? 'after:absolute after:inset-0 after:rounded-2xl after:bg-gradient-to-r after:from-blue-500/20 after:to-purple-500/20 after:blur-xl after:-z-10 after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-500'
    : '';
  
  const parallaxClasses = parallax
    ? 'transform-gpu hover:scale-[1.02] transition-transform duration-500 ease-out'
    : '';
  
  const interactiveClasses = interactive
    ? 'cursor-pointer hover:bg-white/15 hover:border-white/30 hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-1 transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2 focus:ring-offset-transparent active:scale-[0.98] group'
    : 'transition-all duration-300 ease-out';
  
  const classes = `
    relative rounded-2xl border overflow-hidden
    ${variantClasses[variant]} 
    ${paddingClasses[padding]} 
    ${shadowClasses[shadow]} 
    ${interactiveClasses}
    ${glowClasses}
    ${parallaxClasses}
    ${className}
  `.trim();
  
  return (
    <div
      role={role}
      aria-label={ariaLabel}
      className={classes}
      tabIndex={interactive ? 0 : undefined}
      {...props}
    >
      <div className="relative z-10">
        {children}
      </div>
      {interactive && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
        </div>
      )}
    </div>
  );
};

export default memo(GlassCard);
