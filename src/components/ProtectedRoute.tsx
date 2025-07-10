// components/ProtectedRoute.tsx
"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'teacher';
  allowDemo?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  allowDemo = false 
}: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // If no user and not allowing demo, redirect to login
      if (!user && !allowDemo) {
        router.push('/login');
        return;
      }

      // If user exists but no profile (shouldn't happen but safety check)
      if (user && !userProfile) {
        router.push('/login');
        return;
      }

      // If role is required and doesn't match, redirect appropriately
      if (user && userProfile && requiredRole && userProfile.role !== requiredRole) {
        if (userProfile.role === 'student') {
          router.push('/dashboard/student');
        } else {
          router.push('/dashboard/teacher');
        }
        return;
      }
    }
  }, [user, userProfile, loading, requiredRole, allowDemo, router]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user and demo is not allowed, don't render anything (redirect will happen)
  if (!user && !allowDemo) {
    return null;
  }

  // If user exists but role doesn't match requirement, don't render anything (redirect will happen)
  if (user && userProfile && requiredRole && userProfile.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}