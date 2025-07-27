import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut, fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Basic validation
      if (!email || !password) {
        const error = new Error('Please enter both email and password');
        (error as any).code = 'auth/missing-credentials';
        throw error;
      }

      try {
        // First check if the email exists and what auth methods are available
        const methods = await fetchSignInMethodsForEmail(auth, email);
        
        // If the email exists but only with Google auth
        if (methods.includes('google.com') && !methods.includes('password')) {
          const error = new Error('This account was created with Google. Please use the "Sign in with Google" button below.');
          (error as any).code = 'auth/google-sign-in-required';
          throw error;
        }
        
        // If email doesn't exist at all
        if (methods.length === 0) {
          const error = new Error('No account found with this email. Please sign up first.');
          (error as any).code = 'auth/user-not-found';
          throw error;
        }
        
        // Try to sign in with email/password
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        toast.success('Signed in successfully!');
        return userCredential;
        
      } catch (firebaseError: any) {
        console.error('Firebase sign in error:', {
          code: firebaseError.code,
          message: firebaseError.message,
          email: email,
          timestamp: new Date().toISOString()
        });
        
        // Handle network errors specifically
        if (firebaseError.code === 'auth/network-request-failed') {
          const networkError = new Error('Unable to connect to the authentication server. Please check your internet connection and try again.');
          (networkError as any).code = 'auth/network-request-failed';
          throw networkError;
        }
        
        throw firebaseError;
      }
      
    } catch (error: any) {
      console.error('Sign in error:', {
        code: error.code || 'unknown',
        message: error.message,
        email: email,
        timestamp: new Date().toISOString()
      });
      
      // Re-throw the error to be handled by the UI component
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast.success('Account created successfully!');
    } catch (error: any) {
      // Don't show toast here, let the component handle the error
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Ensure popup is triggered by user action to avoid popup blocking
      await signInWithPopup(auth, googleProvider);
      toast.success('Signed in with Google!');
    } catch (error: any) {
      // Handle specific popup blocked error
      if (error.code === 'auth/popup-blocked') {
        toast.error('Google sign-in popup was blocked. Please allow popups and try again.');
        throw new Error('popup-blocked');
      } else if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Google sign-in was cancelled.');
        throw error;
      } else {
        toast.error(error.message);
        throw error;
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully!');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout
  };
};