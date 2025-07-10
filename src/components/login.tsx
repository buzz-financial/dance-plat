// components/Login.tsx
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced' | ''>('');
  const [showVerifyNotice, setShowVerifyNotice] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('mode') === 'signup') {
      setIsSignUp(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setShowVerifyNotice(false);
    setResetEmailSent(false);
    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setIsLoading(false);
          return;
        }
        // signUp returns void, so we need to get the current user from auth
        await signUp(email, password, {
          firstName,
          lastName,
          dob,
          skillLevel,
          role: 'student',
        });
        // Force reload of currentUser in case it's not immediately available
        await auth.currentUser?.reload();
        if (auth.currentUser && !auth.currentUser.emailVerified) {
          await sendEmailVerification(auth.currentUser);
        }
        // Instead of showing verify notice, redirect to login form
        setIsSignUp(false);
        setShowVerifyNotice(false);
        setError('Account created! Please check your email for a verification link and log in.');
        setConfirmPassword('');
        setFirstName('');
        setLastName('');
        setDob('');
        setSkillLevel('');
        setIsLoading(false);
        return;
      } else {
        await signIn(email, password);
        await auth.currentUser?.reload();
        if (auth.currentUser && !auth.currentUser.emailVerified) {
          setShowVerifyNotice(true);
          return;
        }
        router.push('/demodashboard/studentdash/real');
      }
    } catch (error) {
      // Log error for debugging
      console.error('Auth error:', error);
      function getFriendlyErrorMessage(error: unknown): string {
        if (!error) return 'An unexpected error occurred.';
        if (typeof error === 'string') return error;
        let code = '';
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          typeof (error as { code: unknown }).code === 'string'
        ) {
          code = String((error as { code: string }).code).toLowerCase().trim();
          console.log('Firebase error code:', code); // debug
        }
        // fallback: try to extract code from message
        if (
          !code &&
          typeof error === 'object' &&
          error !== null &&
          'message' in error &&
          typeof (error as { message: unknown }).message === 'string'
        ) {
          const match = ((error as { message: string }).message).match(/auth\/[a-zA-Z0-9\-]+/);
          if (match) code = match[0].toLowerCase();
        }
        // Known error codes
        if (code.includes('auth/email-already-in-use')) return 'An account with this email already exists.';
        if (code.includes('auth/invalid-email')) return 'Please enter a valid email address.';
        if (code.includes('auth/user-not-found')) return 'No account found with this email.';
        if (code.includes('auth/wrong-password')) return 'Incorrect password. Please try again.';
        if (code.includes('auth/weak-password')) return 'Password should be at least 6 characters.';
        if (code.includes('auth/too-many-requests')) return 'Too many attempts. Please try again later.';
        if (code.includes('auth/missing-password')) return 'Please enter your password.';
        if (code.includes('auth/missing-email')) return 'Please enter your email.';
        // fallback: generic message
        return 'An unexpected error occurred. Please try again.';
      }
      setError(getFriendlyErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Password reset handler
  const handlePasswordReset = async () => {
    setError("");
    setResetEmailSent(false);
    if (!email) {
      setError("Please enter your email to reset password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
    } catch {
      setError("Failed to send password reset email.");
    }
  };

  // Demo login button for student only
  const handleDemoLogin = () => {
    router.push('/demodashboard/studentdash');
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-serif flex flex-col">
      {/* HEADER */}
      <header className="px-6 py-4">
        <Link href="/" className="text-[var(--accent)] font-semibold hover:underline">
          ← Back to Homepage
        </Link>
      </header>

      {/* FORM CONTAINER */}
      <main className="flex-grow flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full space-y-6">
          <h1 className="text-4xl font-bold text-center text-[var(--accent)]">
            {isSignUp ? 'Create Account' : 'Student Login'}
          </h1>

          {/* Demo Button */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-neutral-600 mb-3 text-center font-medium">Try the demo:</p>
            <div className="flex gap-2">
              <button
                onClick={handleDemoLogin}
                className="flex-1 bg-[var(--accent)] hover:bg-indigo-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
              >
                Student Demo
              </button>
            </div>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-neutral-500">Or continue with real account</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm text-center font-medium">
              {error}
            </div>
          )}
          {showVerifyNotice && (
            <div className="bg-yellow-100 text-yellow-800 p-3 rounded-md text-sm text-center font-medium mb-4">
              Please check your email and verify your account before logging in.
            </div>
          )}
          {resetEmailSent && (
            <div className="bg-green-100 text-green-800 p-3 rounded-md text-sm text-center font-medium mb-4">
              Password reset email sent! Please check your inbox.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    disabled={isLoading}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Skill Level
                  </label>
                  <select
                    value={skillLevel}
                    onChange={(e) => setSkillLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced' | '')}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    disabled={isLoading}
                    required
                  >
                    <option value="">Select skill level</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] pr-10"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575m2.122-2.122A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.402 3.22-1.125 4.575m-2.122 2.122A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18M9.88 9.88A3 3 0 0112 9c1.657 0 3 1.343 3 3 0 .512-.13.995-.354 1.412M6.1 6.1A9.956 9.956 0 002 12c0 5.523 4.477 10 10 10 1.657 0 3.22-.402 4.575-1.125m2.122-2.122A9.956 9.956 0 0022 12c0-5.523-4.477-10-10-10-1.657 0-3.22.402-4.575 1.125" /></svg>
                  )}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] pr-10"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575m2.122-2.122A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.402 3.22-1.125 4.575m-2.122 2.122A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18M9.88 9.88A3 3 0 0112 9c1.657 0 3 1.343 3 3 0 .512-.13.995-.354 1.412M6.1 6.1A9.956 9.956 0 002 12c0 5.523 4.477 10 10 10 1.657 0 3.22-.402 4.575-1.125m2.122-2.122A9.956 9.956 0 0022 12c0-5.523-4.477-10-10-10-1.657 0-3.22.402-4.575 1.125" /></svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-lg font-semibold text-white bg-[var(--accent)] hover:bg-indigo-700 transition ${
                isLoading ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? (isSignUp ? 'Creating Account...' : 'Logging in...') : (isSignUp ? 'Create Account' : 'Login')}
            </button>
          </form>

          <p className="text-center text-sm text-neutral-600">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[var(--accent)] hover:underline font-medium"
            >
              {isSignUp ? 'Log in here' : 'Sign up here'}
            </button>
            .
          </p>
          {!isSignUp && (
            <p className="text-center mt-2">
              <button
                type="button"
                onClick={handlePasswordReset}
                className="text-[var(--accent)] hover:underline text-sm font-medium"
              >
                Forgot password?
              </button>
            </p>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="py-6 text-center text-neutral-500 text-sm border-t border-neutral-300 mt-10">
        © 2025 Music Learning Platform
      </footer>
    </div>
  );
}