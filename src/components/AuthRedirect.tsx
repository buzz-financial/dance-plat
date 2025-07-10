// components/AuthRedirect.tsx
"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthRedirect() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user && userProfile) {
        // Redirect based on user role
        if (userProfile.role === 'student') {
          router.push('/dashboard/student');
        } else if (userProfile.role === 'teacher') {
          router.push('/dashboard/teacher');
        }
      } else {
        // No user, stay on login page or redirect to login
        router.push('/login');
      }
    }
  }, [user, userProfile, loading, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500">
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}