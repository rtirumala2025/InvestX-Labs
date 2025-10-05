import React, { useState, useEffect } from 'react';
import { auth } from '../../../services/firebase/config';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';

const FirebaseDebug = () => {
  const [configStatus, setConfigStatus] = useState({});
  const [authState, setAuthState] = useState(null);

  useEffect(() => {
    checkFirebaseConfig();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthState(user ? 'Authenticated' : 'Not authenticated');
    });
    return () => unsubscribe();
  }, []);

  const checkFirebaseConfig = () => {
    const config = auth.app.options;
    setConfigStatus({
      apiKey: config.apiKey && config.apiKey !== 'your_firebase_api_key_here',
      authDomain: !!config.authDomain,
      projectId: !!config.projectId,
      storageBucket: !!config.storageBucket,
      messagingSenderId: !!config.messagingSenderId,
      appId: !!config.appId,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Firebase Debug</h3>
      
      <GlassCard className="p-4">
        <h4 className="font-medium text-white mb-2">Authentication State:</h4>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${authState === 'Authenticated' ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{authState || 'Checking...'}</span>
        </div>
      </GlassCard>

      <GlassCard className="p-4">
        <h4 className="font-medium text-white mb-2">Configuration Status:</h4>
        <div className="space-y-2">
          {Object.entries(configStatus).map(([key, value]) => (
            <div key={key} className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${value ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-mono text-sm">{key}: {value ? '✓ Configured' : '✗ Missing'}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="flex space-x-2">
        <GlassButton onClick={checkFirebaseConfig}>
          Refresh Status
        </GlassButton>
      </div>
    </div>
  );
};

export default FirebaseDebug;
