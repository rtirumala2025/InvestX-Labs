import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCode, FiEye, FiAlertTriangle, FiZap } from 'react-icons/fi';

const DevTools = () => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('elements');

  // Handle element selection
  useEffect(() => {
    if (!isSelecting) return;

    const handleMouseOver = (e) => {
      e.stopPropagation();
      e.target.style.outline = '2px solid #3b82f6';
      e.target.style.outlineOffset = '2px';
    };

    const handleMouseOut = (e) => {
      e.target.style.outline = '';
      e.target.style.outlineOffset = '';
    };

    const handleClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setSelectedElement({
        tag: e.target.tagName.toLowerCase(),
        id: e.target.id || 'none',
        classes: e.target.className || 'none',
        width: e.target.offsetWidth,
        height: e.target.offsetHeight,
        path: getPathTo(e.target),
      });
      setIsSelecting(false);
      document.body.style.cursor = '';
    };

    if (isSelecting) {
      document.body.style.cursor = 'crosshair';
      document.addEventListener('mouseover', handleMouseOver);
      document.addEventListener('mouseout', handleMouseOut);
      document.addEventListener('click', handleClick, true);
    }

    return () => {
      document.body.style.cursor = '';
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('click', handleClick, true);
    };
  }, [isSelecting]);

  // Get CSS path to element
  const getPathTo = (element) => {
    if (!element || element.id === 'root') return '';
    if (element.id) return `#${element.id}`;
    
    let path = [];
    while (element.nodeType === Node.ELEMENT_NODE) {
      let selector = element.nodeName.toLowerCase();
      if (element.id) {
        path.unshift(`#${element.id}`);
        break;
      } else {
        let sib = element, nth = 1;
        while (sib = sib.previousElementSibling) {
          if (sib.nodeName.toLowerCase() === selector) nth++;
        }
        if (nth !== 1) selector += `:nth-of-type(${nth})`;
        path.unshift(selector);
        element = element.parentNode;
      }
    }
    return path.join(' > ');
  };

  // Capture console logs
  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    const captureLog = (type) => (...args) => {
      setConsoleLogs(prev => [...prev.slice(-50), {
        type,
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '),
        timestamp: new Date().toISOString()
      }]);
    };

    console.log = captureLog('log');
    console.error = captureLog('error');
    console.warn = captureLog('warn');

    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  // Tabs configuration
  const tabs = [
    { id: 'elements', label: 'Elements', icon: <FiEye className="mr-1" /> },
    { id: 'console', label: 'Console', icon: <FiCode className="mr-1" /> },
    { id: 'performance', label: 'Performance', icon: <FiZap className="mr-1" /> },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-900 text-gray-200">
      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`flex items-center px-4 py-2 text-sm font-medium ${
              activeTab === tab.id 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'elements' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <button
                className={`px-3 py-1 rounded text-sm ${
                  isSelecting 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
                onClick={() => setIsSelecting(!isSelecting)}
              >
                {isSelecting ? 'Cancel Selection' : 'Inspect Element'}
              </button>
              {selectedElement && (
                <button
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                  onClick={() => {
                    if (selectedElement.path) {
                      const element = document.querySelector(selectedElement.path);
                      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                >
                  Scroll to Element
                </button>
              )}
            </div>

            {selectedElement && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">Selected Element</h3>
                <div className="font-mono text-sm space-y-1">
                  <p><span className="text-gray-400">Tag:</span> &lt;{selectedElement.tag}&gt;</p>
                  <p><span className="text-gray-400">ID:</span> {selectedElement.id}</p>
                  <p><span className="text-gray-400">Classes:</span> {selectedElement.classes}</p>
                  <p><span className="text-gray-400">Dimensions:</span> {selectedElement.width}px × {selectedElement.height}px</p>
                  <p className="break-all"><span className="text-gray-400">Selector:</span> {selectedElement.path}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'console' && (
          <div className="bg-gray-900 rounded-lg overflow-hidden h-96 flex flex-col">
            <div className="flex justify-between items-center bg-gray-800 px-4 py-2">
              <h3 className="font-medium">Console</h3>
              <button 
                className="text-xs text-gray-400 hover:text-white"
                onClick={() => setConsoleLogs([])}
              >
                Clear
              </button>
            </div>
            <div className="flex-1 overflow-auto font-mono text-sm p-2 space-y-1">
              {consoleLogs.length === 0 ? (
                <p className="text-gray-500 italic">No console messages</p>
              ) : (
                consoleLogs.map((log, index) => (
                  <div 
                    key={index} 
                    className={`p-1 rounded ${
                      log.type === 'error' ? 'text-red-400' : 
                      log.type === 'warn' ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    <span className="text-gray-500 text-xs">
                      {new Date(log.timestamp).toLocaleTimeString()} 
                    </span>
                    {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-900 p-3 rounded">
                  <p className="text-sm text-gray-400">Page Load</p>
                  <p className="text-xl font-mono">
                    {performance.timing.loadEventEnd - performance.timing.navigationStart}ms
                  </p>
                </div>
                <div className="bg-gray-900 p-3 rounded">
                  <p className="text-sm text-gray-400">DOM Ready</p>
                  <p className="text-xl font-mono">
                    {performance.timing.domComplete - performance.timing.domLoading}ms
                  </p>
                </div>
                <div className="bg-gray-900 p-3 rounded">
                  <p className="text-sm text-gray-400">Memory Usage</p>
                  <p className="text-xl font-mono">
                    {(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Device Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">User Agent</p>
                  <p className="text-xs break-all">{navigator.userAgent}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Screen</p>
                  <p className="text-sm">{window.screen.width} × {window.screen.height} @ {window.devicePixelRatio}x</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DevTools;
