// context/AuthContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile // <-- Add this import
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserProfile {
  uid: string;
  email: string;
  role: 'student' | 'teacher';
  firstName: string;
  lastName: string;
  createdAt: Date;
  teacherId?: string; // For students - links them to their teacher
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<UserProfile> & { dob?: string; skillLevel?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Fetch user profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile({ uid: user.uid, ...userDoc.data() } as UserProfile);
          // If user is on login/signup page, redirect to dashboard
          if (typeof window !== 'undefined' && (window.location.pathname === '/login' || window.location.pathname === '/signup')) {
            window.location.href = '/demodashboard/studentdash/real';
          }
        }
      } else {
        setUser(null);
        setUserProfile(null);
        // If not logged in and on a protected page, redirect to login
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/demodashboard/studentdash/real')) {
          window.location.href = '/login';
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log('Signed in user:', result.user);
    // Fetch user profile from Firestore to determine role
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    let role = 'student';
    if (userDoc.exists()) {
      const data = userDoc.data();
      role = data.role || 'student';
    }
    // Redirect based on login form path
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/demodashboard/teacherdash/teacherlogin')) {
        window.location.href = '/demodashboard/teacherdash/real';
      } else if (role === 'teacher') {
        window.location.href = '/demodashboard/teacherdash/real';
      } else {
        window.location.href = '/demodashboard/studentdash/real';
      }
    }
    // User profile will be loaded by the auth state listener
  };

  const signUp = async (email: string, password: string, userData: Partial<UserProfile> & { dob?: string; skillLevel?: string }) => {
    // Allow both student and teacher sign up (role comes from userData, default to 'student')
    const result = await createUserWithEmailAndPassword(auth, email, password);

    // Optionally set displayName in Firebase Auth
    if (userData.firstName || userData.lastName) {
      try {
        await updateProfile(result.user, {
          displayName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        });
      } catch (e) {
        console.error("Error updating Firebase displayName:", e);
      }
    }

    // Debug: log userData and userProfile
    console.log('signUp userData:', userData);


    // Build userProfile object without using 'any' type
    const userProfileBase = {
      uid: result.user.uid,
      email: result.user.email!,
      role: userData.role || 'student',
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      dob: userData.dob || '',
      skillLevel: userData.skillLevel || '',
      createdAt: new Date(),
    };
    // Conditionally add teacherId if defined
    const userProfile: UserProfile & { dob?: string; skillLevel?: string } =
      userData.teacherId !== undefined
        ? { ...userProfileBase, teacherId: userData.teacherId }
        : userProfileBase;

    console.log('signUp userProfile:', userProfile);

    try {
      await setDoc(doc(db, 'users', result.user.uid), userProfile);
      console.log('setDoc success');
      setUserProfile(userProfile as UserProfile);
    } catch (e) {
      console.error("Error writing user profile to Firestore:", e);
      throw e;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};