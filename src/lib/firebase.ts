import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';

// Firebase configuration - using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate configuration
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error('Firebase configuration is incomplete. Please check your firebaseConfig.');
  throw new Error('Firebase configuration is missing required fields');
}

// Initialize Firebase with production configuration
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let googleProvider: GoogleAuthProvider;

try {
  // Initialize Firebase app only if it doesn't already exist
  if (getApps().length === 0) {
    console.log('Initializing Firebase app...');
    app = initializeApp(firebaseConfig);
    
    // Initialize Auth
    auth = getAuth(app);
    
    // Initialize Firestore
    db = getFirestore(app);
    
    // Enable analytics if supported
    isAnalyticsSupported().then(yes => yes && getAnalytics(app));
    
    console.log('Firebase initialized successfully with production endpoints');
  } else {
    console.log('Using existing Firebase app');
    app = getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  }
  
  // Configure Google provider
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: 'select_account',
    client_id: '641817061843-g98uvb59bd0hf4cnpjbuqo939ein50rm.apps.googleusercontent.com'
  });
  
  // Log auth state changes for debugging
  if (typeof window !== 'undefined') {
    auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('Auth state: User is signed in', { 
          uid: user.uid, 
          email: user.email,
          emailVerified: user.emailVerified,
          providerData: user.providerData
        });
      } else {
        console.log('Auth state: No user is signed in');
      }
    });
  }
  
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.error('Firebase initialization error:', error);
  throw new Error('Failed to initialize Firebase: ' + errorMessage);
}

export { auth, db, googleProvider };