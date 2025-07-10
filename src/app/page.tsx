'use client';


import Link from "next/link";
// import { useRouter } from 'next/navigation';
// import Image from "next/image";
import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";


function BarSuccessRotator() {
  const stories = [
    {
      quote: "Our Friday night line dance lessons brought in a whole new crowd. The bar's never been busier!",
      name: "Maggie",
      detail: "Bar Owner, The Rusty Spur",
    },
    {
      quote: "I never thought I'd see my regulars two-stepping with newcomers. The energy is electric!",
      name: "Tom",
      detail: "Bartender, Wild Horse Saloon",
    },
    {
      quote: "Country swing lessons turned our slowest night into our best. Folks keep coming back for more!",
      name: "Jess",
      detail: "Manager, Boot Scoot Tavern",
    },
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % stories.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [stories.length]);

  const current = stories[index];

  return (
    <section className="relative bg-gradient-to-br from-[#23272b] via-[#2d353c] to-[#3a4d4f] border-l-4 border-[#43aa8b] p-10 rounded-2xl shadow-lg mb-20 text-center max-w-3xl mx-auto transition-all duration-500 ease-in-out overflow-hidden font-sans">
      <h3 className="text-2xl font-extrabold text-[#43aa8b] mb-4 tracking-wide uppercase drop-shadow">Bar Success Stories</h3>
      <p className="text-lg italic text-[#e0eceb] mb-2">&quot;{current.quote}&quot;</p>
      <p className="font-semibold text-[#f1c40f]">— {current.name}, {current.detail}</p>
      <div className="absolute right-0 bottom-0 w-24 h-24 opacity-20 pointer-events-none select-none" style={{zIndex:0}}>
        <svg width="100%" height="100%" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="48" cy="48" r="40" stroke="#43aa8b" strokeWidth="6" fill="none" />
          <circle cx="48" cy="48" r="22" stroke="#f1c40f" strokeWidth="3" fill="none" />
        </svg>
      </div>
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
  const siteTitle = teacher?.siteTitle && teacher.siteTitle.trim() ? teacher.siteTitle : "COUNTRY SWING & LINE DANCE LESSONS";
  const siteTagline = teacher?.siteTagline && teacher.siteTagline.trim() ? teacher.siteTagline : "Bring authentic country energy and a packed dance floor to your bar or event.";
  const rate = typeof teacher?.rate === 'number' && !isNaN(teacher.rate) ? teacher.rate : 300;

  return (
    <div className="w-full min-h-screen font-sans bg-gradient-to-br from-[#23272b] via-[#2d353c] to-[#3a4d4f] text-[#e0eceb] flex flex-col items-center px-2 sm:px-6 lg:px-0 py-6">
      {/* HEADER */}
      <header className="w-full max-w-6xl flex flex-col sm:flex-row justify-between items-center mb-16 gap-6 sm:gap-0 px-6 lg:px-24 pt-10 pb-8">
        {/* Left side: title and subtitle */}
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight text-[#43aa8b] drop-shadow-md font-sans uppercase mb-2">
            {siteTitle}
          </h1>
          <p className="mt-2 text-xl text-[#f1c40f] max-w-xl font-sans italic">
            {siteTagline}
          </p>
        </div>
        {/* Right side: buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/login">
            <button className="bg-[#43aa8b] text-[#23272b] px-7 py-3 rounded-lg shadow-md hover:bg-[#f1c40f] hover:text-[#23272b] transition-shadow duration-300 font-semibold w-full sm:w-auto">
              Log In
            </button>
          </Link>
          <Link href="/login?mode=signup">
            <button className="border-2 border-[#f1c40f] text-[#f1c40f] px-7 py-3 rounded-lg shadow-md hover:bg-[#43aa8b] hover:text-[#23272b] transition-shadow duration-300 font-semibold w-full sm:w-auto">
              Sign Up
            </button>
          </Link>
        </div>
      </header>

      {/* HERO / TEACHER INTRO */}
      <section className="relative bg-[#2d353c] border-l-4 border-[#43aa8b] rounded-2xl shadow-lg p-12 flex flex-col items-center gap-10 mb-16 text-[#e0eceb] overflow-hidden w-full max-w-5xl mx-auto mt-2">
        <div className="max-w-lg space-y-4 w-full text-center relative z-10">
          <h2 className="text-4xl font-extrabold drop-shadow-lg font-sans tracking-wide text-[#43aa8b] mb-2">
            {teacher?.firstName || teacher?.lastName ? `Meet ${teacher.firstName ?? ''} ${teacher.lastName ?? ''}`.trim() : 'Meet Your Instructor'}
          </h2>
          <p className="text-lg leading-relaxed drop-shadow-md font-sans text-[#e0eceb]">
            {typeof teacher?.bio === 'string' && teacher.bio.trim().length > 0
              ? teacher.bio
              : 'Authentic country swing and line dance lessons led by a seasoned instructor. Perfect for bars, events, and anyone looking to bring a true country vibe to their venue.'}
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mb-24 text-center w-full max-w-5xl mx-auto">
        <h2 className="text-4xl font-extrabold text-[#43aa8b] mb-10 font-sans tracking-wide">How It Works</h2>
        <div className="flex flex-col md:flex-row justify-center items-center gap-10 w-full max-w-5xl mx-auto px-2">
          {/* Step 1 */}
          <div className="flex flex-col items-center bg-[#3a4d4f] rounded-xl shadow-lg p-8 w-full max-w-xs border-2 border-[#43aa8b] font-sans">
            <h3 className="text-xl font-bold mb-2 text-[#f1c40f] tracking-wide font-sans">Book a Night</h3>
            <p className="text-[#e0eceb] text-sm font-sans">Contact to schedule a country swing or line dance session at your bar or event.</p>
          </div>
          {/* Step 2 */}
          <div className="flex flex-col items-center bg-[#23272b] rounded-xl shadow-lg p-8 w-full max-w-xs border-2 border-[#43aa8b] font-sans">
            <h3 className="text-xl font-bold mb-2 text-[#f1c40f] tracking-wide font-sans">We Bring Country</h3>
            <p className="text-[#e0eceb] text-sm font-sans">Your guests learn classic moves, have a blast, and keep the dance floor full all night.</p>
          </div>
          {/* Step 3 */}
          <div className="flex flex-col items-center bg-[#2d353c] rounded-xl shadow-lg p-8 w-full max-w-xs border-2 border-[#43aa8b] font-sans">
            <h3 className="text-xl font-bold mb-2 text-[#f1c40f] tracking-wide font-sans">Your Bar Thrives</h3>
            <p className="text-[#e0eceb] text-sm font-sans">Boost attendance, drink sales, and create unforgettable nights for your patrons.</p>
          </div>
        </div>
      </section>

      <div className="w-full flex justify-center my-12">
        <BarSuccessRotator />
      </div>

      {/* PRICING + CONTACT CONTAINER */}
      <section className="flex flex-col sm:flex-row sm:justify-center sm:gap-20 mb-24 w-full max-w-5xl mx-auto px-2 sm:px-8 lg:px-24">
        {/* PRICING */}
        <div className="flex-1 max-w-md bg-[#2d353c] rounded-xl shadow-lg p-10 mb-10 sm:mb-0 text-center border-2 border-[#43aa8b] relative overflow-hidden font-sans">
          <h2 className="text-2xl font-extrabold mb-4 text-[#43aa8b] font-sans tracking-wide">Pricing</h2>
          <p className="text-lg mb-2 font-sans text-[#e0eceb]">Starting at <span className="font-bold">${rate}</span> per session. Group and event rates available.</p>
          <p className="italic text-[#f1c40f] font-sans">Contact for a custom quote for your venue or event.</p>
        </div>
        {/* CONTACT */}
        <div className="flex-1 max-w-md bg-[#3a4d4f] rounded-xl shadow-lg p-10 text-center border-2 border-[#43aa8b] relative overflow-hidden font-sans">
          <h2 className="text-2xl font-extrabold mb-6 text-[#43aa8b] font-sans tracking-wide">Contact</h2>
          <div className="space-y-4 relative z-10">
            <p className="text-lg font-sans text-[#e0eceb]">
              Email: <a href={`mailto:${teacher?.email || 'country.dance@example.com'}`} className="text-[#f1c40f] hover:underline">{teacher?.email || 'country.dance@example.com'}</a>
            </p>
            {teacher?.phone && (
              <p className="text-lg font-sans text-[#e0eceb]">
                Phone: <a href={`tel:${teacher.phone}`} className="text-[#43aa8b] hover:underline">{teacher.phone}</a>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full mt-auto py-8 text-center text-[#43aa8b] text-base sm:text-sm border-t-2 border-[#f1c40f] bg-[#23272b] font-sans">
        © 2025 Country Swing Dance
        <span className="mx-2">|</span>
        <Link href="/demodashboard/teacherdash/teacherlogin" className="text-[#f1c40f] hover:underline">Instructor Dashboard</Link>
      </footer>
    </div>
  );
}
