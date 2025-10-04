import React, { useState, useEffect } from 'react';
import { auth } from '../../services/firebase/config';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';

const FirebaseDebug = () => {
  const [configStatus, setConfigStatus] = useState({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    checkFirebaseConfig();
  }, []);

  const checkFirebaseConfig = () => {
    const config = auth.app.options;
    const status = {
      apiKey: config.apiKey && config.apiKey !== 'your_firebase_api_key_here',
      authDomain: !!config.authDomain,
      projectId: !!config.projectId,
      storageBucket: !!config.storageBucket,
      messagingSenderId: !!config.messagingSenderId,
      appId: !!config.appId,
      authReady: !!auth.currentUser !== undefined
    };
    
    setConfigStatus(status);
  };

  const testGoogleAuth = async () => {
    try {
      const { signInWithGoogle } = await import('../../services/firebase/auth');
      await signInWithGoogle();
      console.log('Google auth test successful');
    } catch (error) {
      console.error('Google auth test failed:', error);
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-20 right-4 z-[9998]">
        <GlassButton
          onClick={() => setIsVisible(true)}
          variant="ghost"
          size="small"
          className="opacity-50 hover:opacity-100"
        >
          🔧 Firebase Debug
        </GlassButton>
      </div>
    );
  }

  const allConfigValid = Object.values(configStatus).every(Boolean);

  return (
    <div className="fixed bottom-20 right-4 z-[9998] w-80">
      <GlassCard variant="hero" padding="default" shadow="xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Firebase Debug</h3>
          <GlassButton
            onClick={() => setIsVisible(false)}
            variant="ghost"
            size="small"
          >
            ✕
          </GlassButton>
        </div>

        <div className="space-y-3 mb-4">
          <div className="text-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/90">Configuration Status</span>
              <span className={`text-xs px-2 py-1 rounded ${
                allConfigValid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {allConfigValid ? 'Valid' : 'Issues Found'}
              </span>
            </div>
            
            <div className="space-y-1 text-xs">
              {Object.entries(configStatus).map(([key, valid]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-white/70 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className={valid ? 'text-green-400' : 'text-red-400'}>
                    {valid ? '✓' : '✗'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 pt-3">
            <div className="text-xs text-white/60 mb-2">Environment Variables</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-white/70">API Key</span>
                <span className={configStatus.apiKey ? 'text-green-400' : 'text-red-400'}>
                  {configStatus.apiKey ? 'Set' : 'Missing'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Auth Domain</span>
                <span className={configStatus.authDomain ? 'text-green-400' : 'text-red-400'}>
                  {configStatus.authDomain ? 'Set' : 'Missing'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Project ID</span>
                <span className={configStatus.projectId ? 'text-green-400' : 'text-red-400'}>
                  {configStatus.projectId ? 'Set' : 'Missing'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <GlassButton
            onClick={checkFirebaseConfig}
            variant="glass"
            size="small"
            className="w-full text-xs"
          >
            Refresh Status
          </GlassButton>
          
          <GlassButton
            onClick={testGoogleAuth}
            variant="accent"
            size="small"
            className="w-full text-xs"
            disabled={!allConfigValid}
          >
            Test Google Auth
          </GlassButton>
        </div>

        {!allConfigValid && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="text-xs text-red-300">
              <div className="font-medium mb-1">Configuration Issues:</div>
              <div>Check your .env file and ensure all Firebase environment variables are properly set.</div>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default FirebaseDebug;
