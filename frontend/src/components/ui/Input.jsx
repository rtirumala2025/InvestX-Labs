import React from 'react';

const Input = ({ 
  label, 
  error, 
  helperText, 
  variant = 'glass',
  className = '', 
  ...props 
}) => {
  const variantClasses = {
    glass: `
      bg-white/10 border-white/20 text-white placeholder-white/50
      backdrop-blur-xl backdrop-saturate-150
      focus:bg-white/15 focus:border-white/30 focus:ring-2 focus:ring-blue-500/30
      hover:bg-white/12 hover:border-white/25
      transition-all duration-300 ease-out
    `,
    solid: `
      bg-white border-gray-300 text-gray-900 placeholder-gray-400
      focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    `,
    error: `
      bg-red-500/10 border-red-500/30 text-white placeholder-red-300/50
      backdrop-blur-xl backdrop-saturate-150
      focus:bg-red-500/15 focus:border-red-500/40 focus:ring-2 focus:ring-red-500/30
    `
  };

  const inputClasses = `
    block w-full px-4 py-3 rounded-xl shadow-sm
    focus:outline-none focus:ring-offset-2 focus:ring-offset-transparent
    disabled:opacity-50 disabled:cursor-not-allowed
    ${error ? variantClasses.error : variantClasses[variant]}
    ${className}
  `.trim();
  
  const inputId = props.id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  
  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-white/90 mb-2"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input 
          id={inputId}
          className={inputClasses} 
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props} 
        />
        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      {error && (
        <p 
          id={inputId ? `${inputId}-error` : undefined}
          className="mt-2 text-sm text-red-300 flex items-center" 
          role="alert"
        >
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p 
          id={inputId ? `${inputId}-helper` : undefined}
          className="mt-2 text-sm text-white/60"
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;
