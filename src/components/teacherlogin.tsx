// components/teacherlogin.tsx
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

function TeacherLoginInner() {
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
  const [showVerifyNotice, setShowVerifyNotice] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const { signIn, signUp } = useAuth();
  console.log('useAuth signUp:', signUp);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('mode') === 'signup') {
      setIsSignUp(true);
    }
    if (searchParams.get('created') === '1') {
      setIsSignUp(false);
      setError('Account created! Please check your email for a verification link and log in.');
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
        await signUp(email, password, {
          firstName,
          lastName,
          role: 'teacher',
        });
        await auth.currentUser?.reload();
        if (auth.currentUser && !auth.currentUser.emailVerified) {
          await sendEmailVerification(auth.currentUser);
        }
        // Switch to login form and show success message, just like clicking 'Sign in here'
        setIsSignUp(false);
        setShowVerifyNotice(false);
        setError('Account created! Please check your email for a verification link and log in.');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setFirstName('');
        setLastName('');
        setIsLoading(false);
        return;
      } else {
        await signIn(email, password);
        await auth.currentUser?.reload();
        if (auth.currentUser && !auth.currentUser.emailVerified) {
          setShowVerifyNotice(true);
          return;
        }
        router.push('/demodashboard/teacherdash/real');
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred.');
      }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#23272b] via-[#2d353c] to-[#3a4d4f] text-[#e0eceb] font-sans flex flex-col">
      <header className="px-8 py-6 w-full max-w-7xl mx-auto flex items-center">
        <Link href="/" className="text-[#43aa8b] font-semibold hover:underline text-lg tracking-wide">
          ← Back to Homepage
        </Link>
      </header>
      <main className="flex-grow flex items-center justify-center px-2">
        <div className="w-full max-w-5xl flex flex-col md:flex-row bg-[#23272b] rounded-3xl shadow-2xl overflow-hidden border-2 border-[#43aa8b]">
          {/* Left side: Welcome/Branding */}
          <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-[#2d353c] via-[#3a4d4f] to-[#23272b] p-12 w-1/2 min-h-[600px] border-r-2 border-[#43aa8b]">
            <h2 className="text-4xl font-extrabold text-[#f1c40f] mb-4 tracking-wider font-serif uppercase drop-shadow-lg text-center">Instructor Portal</h2>
            <p className="text-lg text-[#e0eceb] mb-8 text-center max-w-xs font-mono">Manage your bookings, rates, and bar dance nights in one place.</p>
            <div className="w-24 h-24 opacity-30">
              <svg width="100%" height="100%" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="48" cy="48" r="40" stroke="#43aa8b" strokeWidth="6" fill="none" />
                <circle cx="48" cy="48" r="22" stroke="#f1c40f" strokeWidth="3" fill="none" />
              </svg>
            </div>
          </div>
          {/* Right side: Form */}
          <div className="flex-1 flex flex-col justify-center p-8 md:p-12 bg-[#23272b]">
            <h1 className="text-3xl md:text-4xl font-bold text-center text-[#43aa8b] mb-8 font-serif tracking-wide">
              {isSignUp ? 'Teacher Sign Up' : 'Teacher Login'}
            </h1>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#e0eceb] mb-1">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-2 border border-[#43aa8b] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#43aa8b] bg-[#2d353c] text-[#e0eceb]"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#e0eceb] mb-1">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-2 border border-[#43aa8b] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#43aa8b] bg-[#2d353c] text-[#e0eceb]"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-[#e0eceb] mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-[#43aa8b] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#43aa8b] bg-[#2d353c] text-[#e0eceb]"
                  disabled={isLoading}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#e0eceb] mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-[#43aa8b] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#43aa8b] bg-[#2d353c] text-[#e0eceb] pr-10"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#43aa8b] hover:text-[#f1c40f]"
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
                  <label className="block text-sm font-medium text-[#e0eceb] mb-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-[#43aa8b] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#43aa8b] bg-[#2d353c] text-[#e0eceb] pr-10"
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#43aa8b] hover:text-[#f1c40f]"
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
                className={`w-full py-3 rounded-lg font-semibold text-[#23272b] bg-[#43aa8b] hover:bg-[#f1c40f] transition ${
                  isLoading ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? (isSignUp ? 'Creating Account...' : 'Logging in...') : (isSignUp ? 'Create Account' : 'Login')}
              </button>
            </form>
            <p className="text-center text-sm text-[#e0eceb] mt-4">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[#43aa8b] hover:underline font-medium"
              >
                {isSignUp ? 'Sign in here' : 'Sign up here'}
              </button>
              .
            </p>
            {!isSignUp && (
              <p className="text-center mt-2">
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="text-[#43aa8b] hover:underline text-sm font-medium"
                >
                  Forgot password?
                </button>
              </p>
            )}
          </div>
        </div>
      </main>
      <footer className="py-8 text-center text-[#43aa8b] text-base border-t-2 border-[#43aa8b] bg-[#23272b] mt-10">
        © 2025 Country Dance Platform
      </footer>
    </div>
  );
}

export default TeacherLoginInner;
