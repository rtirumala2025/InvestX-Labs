import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Validate required environment variables
const requiredEnvVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  throw new Error(`Missing required Firebase environment variables: ${missingVars.join(', ')}`);
}

// Firebase configuration for InvestX Labs - using only environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Firestore with modern cache settings
let db;
try {
  // Use initializeFirestore for better control over cache settings
  db = initializeFirestore(app, {
    cache: {
      // Enable offline persistence with modern API
      sizeBytes: 50 * 1024 * 1024, // 50MB cache size
      garbageCollection: 'lru' // Use LRU garbage collection
    },
    // Enable offline persistence
    localCache: {
      kind: 'persistent'
    }
  });
} catch (error) {
  // Fallback to regular getFirestore if initializeFirestore fails
  console.warn('Failed to initialize Firestore with custom settings, using default:', error);
  db = getFirestore(app);
}

const functions = getFunctions(app);

console.log('Firebase initialized successfully for InvestX Labs');

export { auth, db, functions };
export default app;
