// Main export for all debug tools
import FirebaseDebug from './components/FirebaseDebug';
import DevTools from './components/DevTools';
import DebugPanel from './components/DebugPanel';

export { FirebaseDebug, DevTools, DebugPanel };

// Default export with all tools
const DebugTools = {
  FirebaseDebug,
  DevTools,
  DebugPanel,
};

export default DebugTools;
