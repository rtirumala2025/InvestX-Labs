import React, { useState, useEffect } from 'react';
import { auth } from '../../services/firebase/config';

const FirebaseConfigChecker = ({ showDetails = false }) => {
  const [configStatus, setConfigStatus] = useState({
    isConfigured: false,
    issues: [],
    warnings: []
  });

  useEffect(() => {
    checkFirebaseConfiguration();
  }, []);

  const checkFirebaseConfiguration = () => {
    const issues = [];
    const warnings = [];
    let isConfigured = true;

    // Check if Firebase app is initialized
    if (!auth.app) {
      issues.push('Firebase app is not initialized');
      isConfigured = false;
      setConfigStatus({ isConfigured, issues, warnings });
      return;
    }

    const config = auth.app.options;

    // Check API Key
    if (!config.apiKey || config.apiKey === 'your_firebase_api_key_here') {
      issues.push('Firebase API Key is not configured or using placeholder value');
      isConfigured = false;
    }

    // Check Auth Domain
    if (!config.authDomain || config.authDomain === 'your_project_id.firebaseapp.com') {
      issues.push('Firebase Auth Domain is not configured or using placeholder value');
      isConfigured = false;
    }

    // Check Project ID
    if (!config.projectId || config.projectId === 'your_project_id_here') {
      issues.push('Firebase Project ID is not configured or using placeholder value');
      isConfigured = false;
    }

    // Check Storage Bucket
    if (!config.storageBucket || config.storageBucket === 'your_project_id.appspot.com') {
      issues.push('Firebase Storage Bucket is not configured or using placeholder value');
      isConfigured = false;
    }

    // Check Messaging Sender ID
    if (!config.messagingSenderId || config.messagingSenderId === 'your_messaging_sender_id_here') {
      issues.push('Firebase Messaging Sender ID is not configured or using placeholder value');
      isConfigured = false;
    }

    // Check App ID
    if (!config.appId || config.appId === 'your_firebase_app_id_here') {
      issues.push('Firebase App ID is not configured or using placeholder value');
      isConfigured = false;
    }

    // Check for development environment
    if (process.env.NODE_ENV === 'development') {
      warnings.push('Running in development mode - ensure localhost is authorized in Firebase');
    }

    setConfigStatus({ isConfigured, issues, warnings });
  };

  if (!showDetails && configStatus.isConfigured) {
    return null; // Don't show anything if configured and not showing details
  }

  return (
    <div className={`p-4 rounded-lg border ${
      configStatus.isConfigured 
        ? 'bg-green-50 border-green-200 text-green-800' 
        : 'bg-red-50 border-red-200 text-red-800'
    }`}>
      <div className="flex items-center">
        <div className={`w-4 h-4 rounded-full mr-3 ${
          configStatus.isConfigured ? 'bg-green-500' : 'bg-red-500'
        }`}></div>
        <h3 className="font-semibold">
          {configStatus.isConfigured ? 'Firebase Configured' : 'Firebase Configuration Issues'}
        </h3>
      </div>
      
      {configStatus.issues.length > 0 && (
        <div className="mt-3">
          <h4 className="font-medium mb-2">Issues:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {configStatus.issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
      
      {configStatus.warnings.length > 0 && (
        <div className="mt-3">
          <h4 className="font-medium mb-2">Warnings:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {configStatus.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
      
      {!configStatus.isConfigured && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>To fix:</strong> Update your <code>.env</code> file with actual Firebase configuration values. 
            See <code>GOOGLE_SIGNIN_SETUP.md</code> for detailed instructions.
          </p>
        </div>
      )}
    </div>
  );
};

export default FirebaseConfigChecker;
