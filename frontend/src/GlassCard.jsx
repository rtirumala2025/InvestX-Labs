import React, { memo } from 'react';

const GlassCard = ({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'default',
  shadow = 'default',
  interactive = false,
  role = 'region',
  'aria-label': ariaLabel = 'glass card',
  ...props 
}) => {
  const variantClasses = {
    default: 'bg-white/85 border-white/25 backdrop-blur-xl',
    subtle: 'bg-white/70 border-white/15 backdrop-blur-lg',
    muted: 'bg-white/50 border-white/08 backdrop-blur-md',
    accent: 'bg-gradient-to-br from-accent-500/90 to-accent-600/90 border-accent-200/30 text-white backdrop-blur-xl',
    dark: 'bg-neutral-900/85 border-neutral-700/25 backdrop-blur-xl text-white'
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
    small: 'shadow-apple',
    default: 'shadow-apple',
    large: 'shadow-apple-lg',
    xl: 'shadow-apple-xl'
  };
  
  const interactiveClasses = interactive
    ? 'cursor-pointer hover:shadow-apple-lg transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:ring-offset-2 active:scale-[0.98]'
    : '';
  
  const classes = `
    rounded-2xl 
    backdrop-blur-xl 
    ${variantClasses[variant]} 
    ${paddingClasses[padding]} 
    ${shadowClasses[shadow]} 
    ${interactiveClasses}
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
      {children}
    </div>
  );
};

export default memo(GlassCard);
