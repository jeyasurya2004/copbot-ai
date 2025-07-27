import { useState, FormEvent, FC } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Shield, Mail, Lock } from 'lucide-react';

// Using custom FirebaseError interface to avoid conflict with firebase/app types
interface FirebaseAuthError extends Error {
  code: string;
  message: string;
}

interface AuthFormProps {
  isSignUp: boolean;
  setIsSignUp: (isSignUp: boolean) => void;
}

const AuthForm: FC<AuthFormProps> = ({ isSignUp, setIsSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    // Additional email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        console.log('Attempting to sign up with:', email);
        await signUp(email, password);
        // Clear form after successful sign up
        setEmail('');
        setPassword('');
      } else {
        console.log('Attempting to sign in with:', email);
        await signIn(email, password);
      }
    } catch (err) {
      const error = err as FirebaseAuthError;
      console.error('Authentication error:', error);
      
      if (error?.code) {
        // Handle Firebase auth errors with specific codes
        switch (error.code) {
          case 'auth/invalid-email':
            setError('The email address is badly formatted.');
            break;
          case 'auth/user-disabled':
            setError('This account has been disabled. Please contact support.');
            break;
          case 'auth/user-not-found':
            setError('No account found with this email. Please sign up first.');
            break;
          case 'auth/wrong-password':
            setError('Incorrect password. Please try again or reset your password.');
            break;
          case 'auth/email-already-in-use':
            setError('An account with this email already exists. Please sign in instead.');
            break;
          case 'auth/weak-password':
            setError('Password is too weak. Please use at least 6 characters.');
            break;
          case 'auth/too-many-requests':
            setError('Too many failed login attempts. Please try again later or reset your password.');
            break;
          case 'auth/operation-not-allowed':
            setError('Email/password authentication is not enabled. Please contact support.');
            break;
          case 'auth/network-request-failed':
            setError('Network error. Please check your internet connection and try again.');
            break;
          case 'auth/invalid-credential':
            setError('Invalid email or password. Please check your credentials and try again.');
            break;
          case 'auth/google-sign-in-required':
            setError('This account was created with Google. Please use the "Sign in with Google" button.');
            break;
          default:
            console.warn('Unhandled auth error code:', error.code);
            setError(`Authentication failed: ${error.message || 'Please try again later.'}`);
        }
      } else {
        console.error('Authentication error without code:', error);
        setError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      const error = err as FirebaseAuthError;
      console.error('Google sign in error:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        setError('Popup was blocked. Please allow popups for this site and try again.');
      } else {
        setError(`Google sign in failed: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-md">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-indigo-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isSignUp ? 'Create an account' : 'Sign in to your account'}
          </h2>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                'Processing...'
              ) : isSignUp ? (
                'Sign up'
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="w-5 h-5 mr-2"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path
                    fill="#4285F4"
                    d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.28426 53.749 C -8.52426 55.229 -9.21677 56.479 -10.0802 57.329 L -10.0802 60.609 L -6.27596 60.609 C -4.09504 58.620 -3.264 55.399 -3.264 51.509 Z"
                  />
                  <path
                    fill="#34A853"
                    d="M -14.754 63.239 C -11.514 63.239 -8.80451 62.159 -6.71396 60.619 L -10.0852 57.329 C -11.1252 58.189 -12.545 58.749 -14.249 58.749 C -17.229 58.749 -19.764 56.639 -20.694 53.889 L -24.999 53.889 L -24.999 57.219 C -23.009 61.269 -19.134 63.239 -14.754 63.239 Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M -20.694 53.889 C -20.994 52.979 -21.154 52.009 -21.154 51.009 C -21.154 50.009 -20.994 49.039 -20.684 48.129 L -20.684 44.799 L -24.274 44.799 C -25.324 46.989 -25.864 49.429 -25.864 51.009 C -25.864 52.589 -25.324 55.029 -24.274 57.219 L -20.684 53.889 L -20.694 53.889 Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.0852 45.789 L -6.71396 42.5 C -8.80451 40.58 -11.514 39.749 -14.754 39.749 C -19.134 39.749 -23.009 41.719 -24.999 45.769 L -20.684 49.099 C -19.764 46.349 -17.229 44.239 -14.754 44.239"
                  />
                </g>
              </svg>
              {loading ? 'Processing...' : 'Continue with Google'}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none"
            disabled={loading}
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;