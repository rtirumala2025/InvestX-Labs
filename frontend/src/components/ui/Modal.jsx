import React from 'react';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'default',
  className = '' 
}) => {
  if (!isOpen) return null;
  
  const sizeClasses = {
    small: 'max-w-md',
    default: 'max-w-lg',
    large: 'max-w-2xl',
    xlarge: 'max-w-4xl'
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-xl w-full ${sizeClasses[size]} ${className}`}>
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold text-neutral-100">{title}</h2>
            <button
              onClick={onClose}
              className="text-neutral-300 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-6 text-neutral-100">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
