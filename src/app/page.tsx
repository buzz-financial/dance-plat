'use client';


import Link from "next/link";
// import { useRouter } from 'next/navigation';
// import Image from "next/image";
import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";


function StudentSuccessRotator() {
  const testimonials = [
    {
      quote: "After just a few months with Jane, I was confidently performing on the piano for my friends and family!",
      name: "Huey",
      detail: "beginner piano student",
    },
    {
      quote: "Jane's teaching method helped me finally understand piano theory. She's amazing!",
      name: "Dewey",
      detail: "intermediate piano student",
    },
    {
      quote: "I used to be terrified of recitals. Now I look forward to playing piano on stage!",
      name: "Louis",
      detail: "advanced piano student",
    },
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000); // change every 5 seconds
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const current = testimonials[index];

  return (
    <section className="bg-white p-8 rounded-xl shadow-md mb-20 text-center max-w-3xl mx-auto transition-all duration-500 ease-in-out">
      <h3 className="text-2xl font-semibold text-[var(--accent)] mb-4">Student Success</h3>
      <p className="text-lg text-neutral-700 italic transition-opacity duration-500">
        &quot;{current.quote}&quot;
      </p>
      <p className="mt-2 font-semibold">— {current.name}, {current.detail}</p>
    </section>
  );
}

export default function Home() {

  // State for teacher info, including site title/tagline
  const [teacher, setTeacher] = useState<{
    firstName?: string;
    lastName?: string;
    bio?: string;
    email?: string;
    phone?: string;
    photo?: string;
    id?: string;
    siteTitle?: string;
    siteTagline?: string;
    rate?: number;
  } | null>(null);

  useEffect(() => {
    // Listen for the first teacher in real time
    const q = query(collection(db, "users"), where("role", "==", "teacher"));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        setTeacher({
          id: docSnap.id,
          firstName: docSnap.data().firstName,
          lastName: docSnap.data().lastName,
          bio: docSnap.data().bio,
          email: docSnap.data().email,
          phone: docSnap.data().phone,
          photo: docSnap.data().photo || undefined,
          siteTitle: docSnap.data().siteTitle,
          siteTagline: docSnap.data().siteTagline,
          rate: docSnap.data().rate,
        });
      }
    });
    return () => unsub();
  }, []);


  // Fallbacks for title/tagline and rate
  const siteTitle = teacher?.siteTitle && teacher.siteTitle.trim() ? teacher.siteTitle : "MUSIC LESSONS";
  const siteTagline = teacher?.siteTagline && teacher.siteTagline.trim() ? teacher.siteTagline : "Personalized. Professional. Powerful.";
  const rate = typeof teacher?.rate === 'number' && !isNaN(teacher.rate) ? teacher.rate : 60;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 sm:py-12 font-serif bg-[var(--background)] text-[var(--foreground)] min-h-screen flex flex-col">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row justify-between items-center mb-16 gap-6 sm:gap-0">
        {/* Left side: title and subtitle */}
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight text-[var(--accent)] drop-shadow-md">
            {siteTitle}
          </h1>
          <p className="mt-2 text-xl text-neutral-600 max-w-md">
            {siteTagline}
          </p>
        </div>
        {/* Right side: buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/login">
            <button className="btn-accent px-7 py-3 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 font-semibold w-full sm:w-auto">
              Log In
            </button>
          </Link>
          <Link href="/login?mode=signup">
            <button className="btn-outline px-7 py-3 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 font-semibold w-full sm:w-auto">
              Sign Up
            </button>
          </Link>
        </div>
      </header>

      {/* HERO / TEACHER INTRO */}
      <section className="bg-gradient-to-r from-[var(--accent)] to-indigo-600 rounded-2xl shadow-lg p-10 flex flex-col items-center gap-10 mb-16 text-white">
        <div className="max-w-lg space-y-4 w-full text-center">
          <h2 className="text-4xl font-bold drop-shadow-lg">
            {teacher?.firstName || teacher?.lastName ? `Meet ${teacher.firstName ?? ''} ${teacher.lastName ?? ''}`.trim() : 'Meet Your Teacher'}
          </h2>
          <p className="text-lg leading-relaxed drop-shadow-md">
            {typeof teacher?.bio === 'string' && teacher.bio.trim().length > 0
              ? teacher.bio
              : 'Teacher Bio Here'}
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mb-24 text-center">
        <h2 className="text-4xl font-bold text-[var(--accent)] mb-10">How It Works</h2>
        <div className="flex flex-col md:flex-row justify-center items-center gap-8 max-w-5xl mx-auto px-4">
          {/* Step 1 */}
          <div className="flex flex-col items-center bg-white rounded-xl shadow-md p-6 w-full max-w-xs">
            <span className="text-4xl mb-4">📝</span>
            <h3 className="text-xl font-semibold mb-2">Sign Up</h3>
            <p className="text-neutral-600 text-sm">Create your account to get started and explore your dashboard.</p>
          </div>
          {/* Step 2 */}
          <div className="flex flex-col items-center bg-white rounded-xl shadow-md p-6 w-full max-w-xs">
            <span className="text-4xl mb-4">📅</span>
            <h3 className="text-xl font-semibold mb-2">Book a Time</h3>
            <p className="text-neutral-600 text-sm">Reserve your lesson slot with our easy booking tool.</p>
          </div>
          {/* Step 3 */}
          <div className="flex flex-col items-center bg-white rounded-xl shadow-md p-6 w-full max-w-xs">
            <span className="text-4xl mb-4">🎵</span>
            <h3 className="text-xl font-semibold mb-2">Start Learning</h3>
            <p className="text-neutral-600 text-sm">Join your lessons and grow your skills with personalized guidance.</p>
          </div>
        </div>
      </section>


      <StudentSuccessRotator />

      {/* PRICING + CONTACT CONTAINER */}
      <section className="flex flex-col sm:flex-row sm:justify-center sm:gap-20 mb-24 max-w-6xl mx-auto px-4">
        {/* PRICING */}
        <div className="flex-1 max-w-md bg-white rounded-xl shadow-md p-8 mb-10 sm:mb-0 text-center">
          <h2 className="text-2xl font-semibold mb-4 text-[var(--accent)]">Pricing</h2>
          <p className="text-lg mb-2">Starting at <span className="font-bold">${rate}</span> per hour session.</p>
          <p className="italic text-neutral-600">Contact for any questions.</p>
        </div>
        {/* CONTACT */}
        <div className="flex-1 max-w-md bg-white rounded-xl shadow-md p-8 text-center">
          <h2 className="text-2xl font-semibold mb-6 text-[var(--accent)]">Contact</h2>
          <div className="space-y-4">
            <p className="text-lg">
              📧 Email: <a href={`mailto:${teacher?.email || 'music.teacher@example.com'}`} className="text-indigo-600 hover:underline">{teacher?.email || 'music.teacher@example.com'}</a>
            </p>
            {teacher?.phone && (
              <p className="text-lg">
                📞 Phone: <a href={`tel:${teacher.phone}`} className="text-indigo-600 hover:underline">{teacher.phone}</a>
              </p>
            )}
          </div>
        </div>
      </section>


      {/* FOOTER */}
      <footer className="mt-auto py-6 text-center text-neutral-500 text-base sm:text-sm border-t border-neutral-300">
        © 2025 Buzz Financial
        <span className="mx-2">|</span>
        <Link href="/demodashboard/teacherdash/teacherlogin" className="text-indigo-600 hover:underline">Teacher Dashboard</Link>
      </footer>
    </div>
  );
}
