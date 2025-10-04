import React, { useState, useEffect } from 'react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';

const DevTools = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  const [consoleErrors, setConsoleErrors] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    // Capture console errors
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;

    console.error = (...args) => {
      setConsoleErrors(prev => [...prev, {
        type: 'error',
        message: args.join(' '),
        timestamp: new Date().toLocaleTimeString(),
        stack: new Error().stack
      }]);
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      setConsoleErrors(prev => [...prev, {
        type: 'warn',
        message: args.join(' '),
        timestamp: new Date().toLocaleTimeString()
      }]);
      originalWarn.apply(console, args);
    };

    // Capture unhandled errors
    const handleError = (event) => {
      setConsoleErrors(prev => [...prev, {
        type: 'error',
        message: event.error?.message || event.message,
        timestamp: new Date().toLocaleTimeString(),
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno
      }]);
    };

    const handleUnhandledRejection = (event) => {
      setConsoleErrors(prev => [...prev, {
        type: 'error',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      console.log = originalLog;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    if (isSelecting) {
      const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const element = e.target;
        const elementInfo = {
          tagName: element.tagName,
          className: element.className,
          id: element.id,
          textContent: element.textContent?.substring(0, 100),
          attributes: Array.from(element.attributes).map(attr => ({
            name: attr.name,
            value: attr.value
          })),
          computedStyles: window.getComputedStyle(element),
          boundingRect: element.getBoundingClientRect(),
          component: element.getAttribute('data-component-name') || 'Unknown'
        };
        
        setSelectedElement(elementInfo);
        setIsSelecting(false);
        
        // Remove highlight
        document.querySelectorAll('.dev-highlight').forEach(el => {
          el.classList.remove('dev-highlight');
        });
      };

      const handleMouseOver = (e) => {
        // Remove previous highlights
        document.querySelectorAll('.dev-highlight').forEach(el => {
          el.classList.remove('dev-highlight');
        });
        
        // Add highlight to current element
        e.target.classList.add('dev-highlight');
      };

      const handleMouseOut = (e) => {
        e.target.classList.remove('dev-highlight');
      };

      // Add event listeners to all elements
      document.addEventListener('click', handleClick, true);
      document.addEventListener('mouseover', handleMouseOver);
      document.addEventListener('mouseout', handleMouseOut);

      // Add CSS for highlighting
      const style = document.createElement('style');
      style.textContent = `
        .dev-highlight {
          outline: 2px solid #3b82f6 !important;
          outline-offset: 2px !important;
          background-color: rgba(59, 130, 246, 0.1) !important;
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.removeEventListener('click', handleClick, true);
        document.removeEventListener('mouseover', handleMouseOver);
        document.removeEventListener('mouseout', handleMouseOut);
        document.head.removeChild(style);
        
        // Clean up highlights
        document.querySelectorAll('.dev-highlight').forEach(el => {
          el.classList.remove('dev-highlight');
        });
      };
    }
  }, [isSelecting]);

  const copyElementInfo = () => {
    if (selectedElement) {
      const info = `
Element: ${selectedElement.tagName}
Class: ${selectedElement.className}
ID: ${selectedElement.id}
Component: ${selectedElement.component}
Text: ${selectedElement.textContent}
Position: ${JSON.stringify(selectedElement.boundingRect)}
Attributes: ${JSON.stringify(selectedElement.attributes, null, 2)}
      `.trim();
      
      navigator.clipboard.writeText(info);
    }
  };

  const clearErrors = () => {
    setConsoleErrors([]);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999]">
        <GlassButton
          onClick={() => setIsOpen(true)}
          variant="glass"
          size="small"
          className="shadow-lg"
        >
          🔧 Dev Tools
        </GlassButton>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-96 max-h-[80vh] overflow-hidden">
      <GlassCard variant="hero" padding="default" shadow="xl" className="overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Dev Tools</h3>
          <GlassButton
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="small"
          >
            ✕
          </GlassButton>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto glass-scrollbar">
          {/* Element Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-white/90">Element Inspector</h4>
              <GlassButton
                onClick={() => setIsSelecting(!isSelecting)}
                variant={isSelecting ? "primary" : "glass"}
                size="small"
              >
                {isSelecting ? 'Cancel' : 'Select Element'}
              </GlassButton>
            </div>
            
            {selectedElement && (
              <GlassCard 
                variant="default" 
                padding="medium"
                className="backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    <span className="text-white font-medium text-sm">
                      {selectedElement.tagName.toLowerCase()}
                      {selectedElement.className && (
                        <span className="text-blue-300">.{selectedElement.className.split(' ')[0]}</span>
                      )}
                    </span>
                  </div>
                  <GlassButton
                    onClick={copyElementInfo}
                    variant="glass"
                    size="small"
                    className="text-xs bg-white/10 hover:bg-white/20 transition-all duration-200"
                    icon="📋"
                  >
                    Copy
                  </GlassButton>
                </div>
                <div className="space-y-2 mt-3">
                  <div className="flex items-center text-sm">
                    <span className="w-24 text-white/60">Component</span>
                    <span className="text-white/90 font-mono">{selectedElement.component || 'Unknown'}</span>
                  </div>
                  <div className="flex items-start text-sm">
                    <span className="w-24 text-white/60">Class</span>
                    <span className="text-white/90 font-mono break-all">{selectedElement.className || 'none'}</span>
                  </div>
                  {selectedElement.id && (
                    <div className="flex items-center text-sm">
                      <span className="w-24 text-white/60">ID</span>
                      <span className="text-blue-300 font-mono">#{selectedElement.id}</span>
                    </div>
                  )}
                  <div className="flex items-start text-sm">
                    <span className="w-24 text-white/60">Text</span>
                    <span className="text-white/90 flex-1 break-words">
                      {selectedElement.textContent.trim() || 'Empty'}
                    </span>
                  </div>
                </div>
              </GlassCard>
            )}
          </div>

          {/* Console Errors */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-white/90">
                Console ({consoleErrors.length})
              </h4>
              <GlassButton
                onClick={clearErrors}
                variant="ghost"
                size="small"
              >
                Clear
              </GlassButton>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {consoleErrors.length === 0 ? (
                <div className="text-green-400 text-xs p-2 bg-green-500/10 rounded border border-green-500/20">
                  No errors! 🎉
                </div>
              ) : (
                consoleErrors.slice(-10).map((error, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-xs border ${
                      error.type === 'error'
                        ? 'bg-red-500/10 border-red-500/20 text-red-300'
                        : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">
                        {error.type === 'error' ? '❌' : '⚠️'} {error.type}
                      </span>
                      <span className="text-white/50">{error.timestamp}</span>
                    </div>
                    <div className="break-words">{error.message}</div>
                    {error.filename && (
                      <div className="text-white/40 mt-1">
                        {error.filename}:{error.lineno}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Performance Info */}
          <div>
            <h4 className="text-sm font-medium text-white/90 mb-2">Performance</h4>
            <div className="p-2 bg-white/5 rounded text-xs text-white/70">
              <div>Memory: {(performance.memory?.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB</div>
              <div>Navigation: {performance.navigation?.type === 0 ? 'Navigate' : 'Reload'}</div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default DevTools;
