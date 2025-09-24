import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  padding = 'default',
  shadow = 'default',
  ...props 
}) => {
  const paddingClasses = {
    none: '',
    small: 'p-4',
    default: 'p-6',
    large: 'p-8'
  };
  
  const shadowClasses = {
    none: '',
    small: 'shadow-sm',
    default: 'shadow-sm',
    large: 'shadow-lg'
  };
  
  // Glass UI styles
  const glassBase = 'backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl';
  const classes = `${glassBase} ${paddingClasses[padding]} ${shadowClasses[shadow]} ${className}`;
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;
