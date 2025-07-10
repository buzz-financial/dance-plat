"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, DocumentData, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";

const tabs = ["Home", "Book", "Upcoming", "Account"] as const;

const getTabIcon = (tab: string) => {
  switch (tab) {
    case "Home": return "🏠";
    case "Book": return "📅";
    case "Upcoming": return "⏰";
    case "Account": return "👤";
    default: return "";
  }
};

// --- Book Tab Helper Functions (move these above the first hook call!) ---
function getCurrentWeekSunday() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);
  sunday.setHours(0,0,0,0);
  return sunday;
}
function getWeekDates(sundayDate: Date) {
  const week = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sundayDate);
    d.setDate(sundayDate.getDate() + i);
    week.push(d);
  }
  return week;
}
function formatWeekRange(weekStart: Date) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${weekStart.toLocaleDateString(undefined, { month: 'long' })} ${weekStart.getDate()}-${weekEnd.getDate()}`;
  } else {
    return `${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }
}
function isCurrentWeek(currentWeekStart: Date) {
  const today = getCurrentWeekSunday();
  return currentWeekStart.getTime() === today.getTime();
}

interface LessonSlot {
  id: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:mm or HH:mm:ss
  bookedStudentIds?: string[];
  [key: string]: unknown;
}
interface UserProfile extends DocumentData {
  firstName?: string;
  lastName?: string;
  email?: string;
  dob?: string;
  skillLevel?: string;
  progress?: number;
}

// (CartItem type removed, no longer used)

// --- Practice Streak Component ---
function getTodayString() {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}
function getYesterdayString() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().slice(0, 10);
}
// PracticeStreak now uses Firestore for per-student streaks
import { doc as firestoreDoc, getDoc as firestoreGetDoc, setDoc as firestoreSetDoc } from "firebase/firestore";
function PracticeStreak() {
  const [streak, setStreak] = useState<number>(0);
  const [lastPractice, setLastPractice] = useState<string>("");
  const [practicedToday, setPracticedToday] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Get user from parent state (window.user is not reliable)
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const userRef = firestoreDoc(db, "users", user.uid);
        const userSnap = await firestoreGetDoc(userRef);
        const data = userSnap.exists() ? userSnap.data() : {};
        const streakVal = typeof data.practiceStreak === "number" ? data.practiceStreak : 0;
        const last = typeof data.lastPractice === "string" ? data.lastPractice : "";
        setStreak(streakVal);
        setLastPractice(last);
        setPracticedToday(last === getTodayString());
      } catch {
        setError("Failed to load practice streak.");
      }
      setLoading(false);
    })();
  }, [user]);

  const handlePractice = useCallback(async () => {
    if (!user) return;
    const today = getTodayString();
    let newStreak = streak;
    if (lastPractice === getYesterdayString()) {
      newStreak = streak + 1;
    } else if (lastPractice !== today) {
      newStreak = 1;
    }
    setStreak(newStreak);
    setLastPractice(today);
    setPracticedToday(true);
    try {
      const userRef = firestoreDoc(db, "users", user.uid);
      await firestoreSetDoc(userRef, { practiceStreak: newStreak, lastPractice: today }, { merge: true });
    } catch {
      setError("Failed to update practice streak.");
    }
  }, [user, streak, lastPractice]);

  if (loading) {
    return (
      <div className="group bg-white/70 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 mb-8">
        <span className="text-gray-500">Loading practice streak...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="group bg-white/70 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 mb-8">
        <span className="text-red-500">{error}</span>
      </div>
    );
  }
  return (
    <div className="group bg-white/70 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 mb-8">
      <div className="flex items-center mb-4 sm:mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-white text-lg sm:text-xl mr-3 sm:mr-4 flex-shrink-0">
          🔥
        </div>
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent leading-tight">
          Practice Streak
        </h3>
      </div>
      <div className="flex flex-col items-center mb-4">
        <span className="text-5xl font-bold text-orange-500 mb-2">{streak}</span>
        <span className="text-gray-700 font-semibold text-lg">Day Streak</span>
      </div>
      <div className="flex flex-col items-center">
        {practicedToday ? (
          <span className="text-green-600 font-semibold">You practiced today! Keep it up! 🎶</span>
        ) : (
          <button
            onClick={handlePractice}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold hover:from-yellow-500 hover:to-orange-500 shadow-lg mt-2"
          >
            Mark as Practiced Today
          </button>
        )}
      </div>
    </div>
  );
}

export default function StudentDashReal() {
  // --- All hooks at the top, in a fixed order ---
  const [activeTab, setActiveTab] = useState<"Home" | "Book" | "Buy" | "Upcoming" | "Account">("Home");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accountCreatedAt, setAccountCreatedAt] = useState<string>("");
  const [homework, setHomework] = useState<DocumentData[]>([]);
  const [bookings, setBookings] = useState<DocumentData[]>([]);
  const [cancelModal, setCancelModal] = useState<{ open: boolean; booking?: DocumentData }>({ open: false });
  const [rescheduleModal, setRescheduleModal] = useState<{ open: boolean; booking?: DocumentData }>({ open: false });
  const [rescheduleSlot, setRescheduleSlot] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(getCurrentWeekSunday());
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  // --- Buy as you book state (hour-long sessions only) ---
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [bookingToBuy, setBookingToBuy] = useState<string[]>([]); // slot ids being booked
  // --- Payment Modal State ---
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Always get the session price from the teacher's current rate (universal for all students)
  const [teacherRate, setTeacherRate] = useState<number>(60);
  // Listen for the first teacher in real time (match homepage logic)
  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "teacher"));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const teacherData = docSnap.data();
        if (teacherData && typeof teacherData.rate === 'number') {
          setTeacherRate(teacherData.rate);
        }
      }
    });
    return () => unsub();
  }, []);
  // (getSessionPrice removed, use teacherRate directly everywhere)
  // --- Firestore booking logic ---
  const handleConfirmBuyAndBook = async () => {
    setShowBuyModal(false);
    if (!user || !profile) return;
    try {
      // For each selected slot, create a booking and update the slot as booked
      const firestore = await import("firebase/firestore");
      const batchPromises = bookingToBuy.map(async (slotId) => {
        const slot = availableSlots.find(s => s.id === slotId);
        if (!slot) return null;
        // 1. Create booking document in Firestore
        const bookingRef = firestore.doc(collection(db, "bookings"));
        await firestore.setDoc(bookingRef, {
          studentId: user.uid,
          studentName: (profile.firstName || "") + " " + (profile.lastName || ""),
          slotId: slot.id,
          date: slot.date,
          time: slot.time,
          length: 60,
          status: "booked",
          createdAt: new Date().toISOString(),
          rate: teacherRate, // Always use the current teacher rate
        });
        // 2. Update lesson slot to mark as booked
        const slotRef = firestore.doc(collection(db, "lessonSlots"), slot.id);
        await firestore.updateDoc(slotRef, {
          bookedStudentIds: firestore.arrayUnion(user.uid)
        });
        return true;
      });
      await Promise.all(batchPromises);
      setSelectedSlots([]);
      setBookingToBuy([]);
      setBookingSuccess(true);
      // No alert here; rely on modal for confirmation
    } catch {
      setError("Failed to book lessons. Please try again.");
    }
  };
  // --- Book Tab State ---
  const [availableSlots, setAvailableSlots] = useState<LessonSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  // --- Booking Modal State (restored) ---
  // Removed unused: showConfirm, bookingInProgress, bookingError
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // --- Cancel Booking Logic ---
  const handleCancelBooking = async (booking: DocumentData) => {
    setActionLoading(true);
    try {
      const firestore = await import("firebase/firestore");
      // 1. Delete booking
      await firestore.deleteDoc(firestore.doc(collection(db, "bookings"), booking.id));
      // 2. Update lesson slot to remove student
      const slotRef = firestore.doc(collection(db, "lessonSlots"), booking.slotId);
      await firestore.updateDoc(slotRef, {
        bookedStudentIds: firestore.arrayRemove(user?.uid)
      });
      setBookings(prev => prev.filter(b => b.id !== booking.id));
      setCancelModal({ open: false });
    } catch {
      setError("Failed to cancel lesson. Please try again.");
    }
    setActionLoading(false);
  };

  // --- Reschedule Booking Logic ---
  const handleRescheduleBooking = async (booking: DocumentData, newSlotId: string) => {
    setActionLoading(true);
    try {
      const firestore = await import("firebase/firestore");
      // 1. Cancel original booking
      await firestore.deleteDoc(firestore.doc(collection(db, "bookings"), booking.id));
      const oldSlotRef = firestore.doc(collection(db, "lessonSlots"), booking.slotId);
      await firestore.updateDoc(oldSlotRef, {
        bookedStudentIds: firestore.arrayRemove(user?.uid)
      });
      // 2. Book new slot (same as booking logic)
      const slot = availableSlots.find(s => s.id === newSlotId);
      if (!slot) throw new Error("Selected slot not found");
      const bookingRef = firestore.doc(collection(db, "bookings"));
      await firestore.setDoc(bookingRef, {
        studentId: user?.uid,
        studentName: (profile?.firstName || "") + " " + (profile?.lastName || ""),
        slotId: slot.id,
        date: slot.date,
        time: slot.time,
        length: 60,
        status: "booked",
        createdAt: new Date().toISOString(),
      });
      const slotRef = firestore.doc(collection(db, "lessonSlots"), slot.id);
      await firestore.updateDoc(slotRef, {
        bookedStudentIds: firestore.arrayUnion(user?.uid)
      });
      setRescheduleModal({ open: false });
      setRescheduleSlot("");
    } catch {
      setError("Failed to reschedule lesson. Please try again.");
    }
    setActionLoading(false);
  };

  // --- Memo and router ---
  const router = useRouter();
  const weekDates = useMemo(() => getWeekDates(currentWeekStart), [currentWeekStart]);

  // --- Helper: group slots by day for BookAvailableTimes ---
  const slotsByDay = useMemo(() => {
    const map: { [date: string]: LessonSlot[] } = {};
    for (const slot of availableSlots) {
      if (!map[slot.date]) map[slot.date] = [];
      map[slot.date].push(slot);
    }
    // Sort slots for each day by time
    Object.values(map).forEach(arr => arr.sort((a, b) => a.time.localeCompare(b.time)));
    return map;
  }, [availableSlots]);

  useEffect(() => {
    let unsubscribeHomework: (() => void) | undefined;
    let unsubscribeBookings: (() => void) | undefined;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/login");
        return;
      }
      setUser(firebaseUser);
      try {
        // Fetch user profile
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : null;
        // Defensive: If firstName/lastName are missing but displayName exists, use it
        if (userData && (!userData.firstName || !userData.lastName) && firebaseUser.displayName) {
          const [first, ...rest] = firebaseUser.displayName.split(" ");
          userData.firstName = userData.firstName || first;
          userData.lastName = userData.lastName || rest.join(" ");
        }
        setProfile(userData);
        // Set account creation date (from Firebase Auth metadata)
        if (firebaseUser.metadata && firebaseUser.metadata.creationTime) {
          setAccountCreatedAt(firebaseUser.metadata.creationTime);
        } else if (userData && userData.createdAt) {
          setAccountCreatedAt(userData.createdAt);
        }
        // Real-time listener for homework assignments
        const hwQuery = query(collection(db, "homework"), where("studentId", "==", firebaseUser.uid));
        unsubscribeHomework = onSnapshot(hwQuery, (hwSnap) => {
          setHomework(hwSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        // Real-time listener for bookings
        const bookingsQuery = query(collection(db, "bookings"), where("studentId", "==", firebaseUser.uid));
        unsubscribeBookings = onSnapshot(bookingsQuery, (bookingSnap) => {
          setBookings(bookingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
      } catch {
        setError("Failed to load dashboard data.");
      }
      setLoading(false);
    });
    return () => {
      unsubscribe();
      if (typeof unsubscribeHomework === 'function') unsubscribeHomework();
      if (typeof unsubscribeBookings === 'function') unsubscribeBookings();
    };
  }, [router]);

  // Real-time listener for lesson slots and teacher rate
  useEffect(() => {
    setSlotsLoading(true);
    // Listen for slots
    const q = query(collection(db, "lessonSlots"));
    const unsubscribeSlots = onSnapshot(q, (snapshot) => {
      setAvailableSlots(
        snapshot.docs
          .map(doc => {
            const data = doc.data() as LessonSlot;
            return { ...data, id: doc.id };
          })
          .filter(slot => Array.isArray(slot.bookedStudentIds) && slot.bookedStudentIds.length === 0)
      );
      setSlotsLoading(false);
    }, () => {
      setAvailableSlots([]);
      setSlotsLoading(false);
    });
    return () => {
      unsubscribeSlots();
    };
  }, []);

  // --- Lesson Option (hour-long only) ---
  const lessonOption = { length: 60, price: 0, icon: '🎶', desc: 'Full 1-hour private lesson.' };

  // Only after all hooks, do early returns:
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100">
      <div className="flex flex-col items-center">
        <div className="animate-spin-slow text-6xl mb-4">🎵</div>
        <p className="text-lg text-purple-700 font-semibold">Loading your dashboard...</p>
      </div>
      <style jsx>{`
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
      `}</style>
    </div>
  );
  if (error) return <p className="text-red-500">{error}</p>;
  if (!user) return null;

  // Helper: get next lesson
  const nextLesson = bookings
    .filter(b => new Date(b.date + ' ' + b.time) > new Date())
    .sort((a, b) => new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime())[0];

  // Helper: format slot time only (no day)
  function formatSlotTime(slot: LessonSlot | undefined) {
    if (!slot?.time) return slot?.id || '';
    const dateObj = new Date(slot.date + 'T' + slot.time);
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // --- Book Tab UI Components (scoped inside main component) ---
  function BookWeekNav() {
    // Book week nav with smaller arrow buttons and better fit
    return (
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50 p-3 sm:p-4 rounded-2xl border-2 border-purple-200 shadow-lg space-y-4 sm:space-y-0 md:gap-8">
        <div className="flex space-x-1 sm:space-x-0 sm:block order-2 sm:order-1 md:space-x-2">
          <button
            onClick={() => setCurrentWeekStart(new Date(currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000))}
            className="group flex items-center px-2 py-1 sm:px-3 sm:py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 border-2 border-purple-200 text-xs sm:text-sm md:text-base"
            type="button"
            aria-label="Previous Week"
          >
            <span className="group-hover:animate-bounce inline-block mr-0.5 sm:mr-1 text-base sm:text-lg md:text-xl">⬅️</span>
          </button>
          <button
            onClick={() => setCurrentWeekStart(new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000))}
            className="group flex items-center px-2 py-1 sm:px-3 sm:py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 border-2 border-purple-200 text-xs sm:text-sm md:text-base sm:hidden"
            type="button"
            aria-label="Next Week"
          >
            <span className="group-hover:animate-bounce inline-block ml-0.5 text-base md:text-xl">➡️</span>
          </button>
        </div>
        <div className="text-center order-1 sm:order-2 min-w-[120px] md:min-w-[180px]">
          <h3 className="text-base sm:text-xl md:text-2xl font-bold text-purple-800 mb-1">
            {formatWeekRange(currentWeekStart)}
          </h3>
          {!isCurrentWeek && (
            <button
              onClick={() => setCurrentWeekStart(getCurrentWeekSunday())}
              className="text-xs sm:text-sm md:text-base text-purple-600 hover:text-purple-800 font-medium"
            >
              Go to Current Week
            </button>
          )}
          {isCurrentWeek(currentWeekStart) && (
            <span className="text-xs sm:text-sm md:text-base text-purple-600 font-medium bg-purple-100 px-2 sm:px-3 md:px-4 py-1 rounded-full">
              📍 Current Week
            </span>
          )}
        </div>
        <button
          onClick={() => setCurrentWeekStart(new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000))}
          className="group flex items-center px-2 py-1 sm:px-3 sm:py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 border-2 border-purple-200 hidden sm:flex order-3 text-xs sm:text-sm md:text-base"
          type="button"
          aria-label="Next Week"
        >
          <span className="group-hover:animate-bounce inline-block ml-1 text-base md:text-xl">➡️</span>
        </button>
      </div>
    );
  }

  function BookSelectionSummary() {
    if (selectedSlots.length === 0) return null;
    return (
      <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl shadow-lg animate-slideInDown">
        <div className="flex items-center mb-3 sm:mb-4">
          <span className="text-xl sm:text-2xl mr-2 sm:mr-3">✨</span>
          <h3 className="font-bold text-amber-800 text-lg sm:text-xl">
            Selected Sessions ({selectedSlots.length})
          </h3>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {selectedSlots.map((slotId) => {
            const slot = availableSlots.find(s => s.id === slotId);
            return (
              <span key={slotId} className="px-3 py-1 bg-white rounded-full border border-amber-300 text-amber-800 text-xs font-semibold">
                {/* Only show time, not day */}
                {formatSlotTime(slot)}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  function BookAvailableTimes() {
    if (slotsLoading) return <div className="text-purple-600 font-semibold">Loading available times...</div>;
    if (availableSlots.length === 0) return <div className="text-gray-500">No available times at the moment.</div>;
    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDates.map((dateObj, idx) => {
          const dateStr = dateObj.toISOString().slice(0, 10);
          const slots = slotsByDay[dateStr] || [];
          return (
            <div key={dateStr} className="flex flex-col">
              <div className={`font-bold text-center mb-2 rounded-lg px-2 py-1 ${idx === 0 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>{dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
              {slots.length === 0 ? (
                <div className="text-xs text-gray-400 text-center py-2">No slots</div>
              ) : (
                slots.map(slot => {
                  const isSelected = selectedSlots.includes(slot.id);
                  return (
                    <button
                      key={slot.id}
                      onClick={() => {
                        setBookingSuccess(false);
                        setSelectedSlots(prev => isSelected ? prev.filter(s => s !== slot.id) : [...prev, slot.id]);
                      }}
                      className={`w-full px-2 py-2 mb-2 rounded-xl font-semibold border-2 transition-all duration-200 shadow text-xs ${isSelected ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-purple-500' : 'bg-white text-purple-700 border-purple-200 hover:bg-purple-50 hover:border-purple-400'}`}
                    >
                      {/* Only show time, not day */}
                      {formatSlotTime(slot)}
                    </button>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // --- Book Now Section ---
  function BookNowSection() {
    if (selectedSlots.length === 0) return null;
    return (
      <div className="mt-8 sm:mt-10 text-center animate-slideInUp">
        <p className="mb-4 sm:mb-6 text-gray-700 font-semibold text-lg sm:text-xl">
          {selectedSlots.length === 1
            ? `🎯 You have selected 1 session`
            : `🎯 You have selected ${selectedSlots.length} sessions`}
        </p>
        {/* List selected slots with date and time */}
        <div className="mb-4 flex flex-col items-center gap-2">
          {selectedSlots.map((slotId) => {
            const slot = availableSlots.find(s => s.id === slotId);
            if (!slot) return null;
            const dateObj = new Date(slot.date + 'T' + slot.time);
            return (
              <div key={slotId} className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-purple-200 shadow text-purple-800 text-sm font-semibold">
                <span className="text-lg">{lessonOption.icon}</span>
                <span>{dateObj.toLocaleDateString()} at {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            );
          })}
        </div>
        <div className="mb-4 text-xl font-bold text-indigo-700">
          Total: ${
            (selectedSlots.length * teacherRate).toFixed(2)
          }
        </div>
        <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-6">
          <button
            onClick={() => setSelectedSlots([])}
            className="group px-6 py-3 sm:px-8 sm:py-4 bg-gray-200 text-gray-700 rounded-2xl hover:bg-gray-300 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 text-sm sm:text-base"
          >
            Clear All
          </button>
          <button
            onClick={() => {
              setBookingSuccess(false);
              setBookingToBuy(selectedSlots);
              setShowBuyModal(true);
            }}
            className="group px-8 py-3 sm:px-10 sm:py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-bold shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105 active:scale-95 text-sm sm:text-base"
          >
            Buy & Book {selectedSlots.length === 1 ? 'Session' : 'Sessions'}
          </button>
        </div>
        {/* Buy Modal (hour-long sessions only) */}
        {showBuyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
              <h3 className="text-xl font-bold mb-4 text-indigo-700">Buy & Book</h3>
              <p className="mb-4 text-gray-700">You are booking <b>{bookingToBuy.length}</b> session{bookingToBuy.length !== 1 ? 's' : ''}.</p>
              <div className="mb-6 flex flex-col items-center gap-2">
                {bookingToBuy.map((slotId) => {
                  const slot = availableSlots.find(s => s.id === slotId);
                  if (!slot) return null;
                  const dateObj = new Date(slot.date + 'T' + slot.time);
                  return (
                    <div key={slotId} className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-purple-200 shadow text-purple-800 text-sm font-semibold">
                      <span className="text-lg">{lessonOption.icon}</span>
                      <span>{dateObj.toLocaleDateString()} at {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mb-4 text-xl font-bold text-indigo-700">
                Total: ${
                  (bookingToBuy.length * teacherRate).toFixed(2)
                }
              </div>
              <div className="flex justify-end mt-6">
                <button
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:from-indigo-700 hover:to-purple-700 shadow-lg"
                  onClick={handleConfirmBuyAndBook}
                >
                  Confirm & Book
                </button>
                <button
                  onClick={() => { setShowBuyModal(false); setBookingToBuy([]); }}
                  className="ml-4 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Removed unused: handleBookConfirm

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100">
      {/* Booking Success Modal (only after confirmation) */}
      {bookingSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <h3 className="text-xl font-bold mb-4 text-green-700">Booking Confirmed!</h3>
            <p className="mb-4 text-gray-700">Your sessions have been booked and will appear in your upcoming lessons.</p>
            <button
              onClick={() => setBookingSuccess(false)}
              className="px-6 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* Sidebar Navigation */}
      <nav className="hidden md:flex fixed top-0 left-0 h-full z-30 w-56 lg:w-72 backdrop-blur-lg bg-white/80 border-r border-white/20 p-4 lg:p-6 flex-col space-y-3 shadow-2xl transition-all duration-300" style={{maxHeight:'100vh',overflowY:'auto'}}>
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full text-2xl text-white shadow-lg">
            🎵
          </div>
          <p className="text-sm text-gray-700 font-semibold">Student Portal</p>
        </div>
        {tabs.map((tab, index) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`group relative py-4 px-7 rounded-xl text-left font-semibold transition-all duration-300 transform hover:scale-105 w-full ${activeTab === tab ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25" : "text-gray-700 hover:bg-white/60 hover:text-purple-600 hover:shadow-lg"}`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between gap-4 w-full">
              <span className="text-lg flex-shrink-0">{getTabIcon(tab)}</span>
              <span className="ml-2 text-base truncate text-left w-full">{tab}</span>
            </div>
          </button>
        ))}
      </nav>
      {/* Bottom Navigation Bar for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex md:hidden bg-white/90 border-t border-gray-200 shadow-2xl">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex flex-col items-center justify-center py-2 transition-all duration-200 ${activeTab === tab ? "text-indigo-600 font-bold bg-gradient-to-t from-indigo-50 to-white" : "text-gray-500 hover:text-indigo-500"}`}
            aria-label={tab}
          >
            <span className="text-xl mb-0.5">{getTabIcon(tab)}</span>
            <span className="text-xs leading-tight">{tab}</span>
          </button>
        ))}
      </nav>
      {/* Main Content */}
      <main className="relative z-10 flex-1 p-8 overflow-auto pb-20 md:pb-0 md:ml-56 lg:ml-72 transition-all duration-300">
        {activeTab === "Home" && (
          <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto animate-fadeIn px-4 sm:px-6 lg:px-8">
            <div className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-2xl text-white overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 animate-slideInLeft leading-tight">
                  Welcome Back, {profile && (profile.firstName || profile.lastName) ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() : user.email}! 🎉
                </h2>
                {nextLesson && (
                  <div className="animate-slideInLeft animation-delay-200">
                    <p className="text-base sm:text-lg lg:text-xl text-purple-100 mb-2">
                      Your next session is on
                    </p>
                    <span className="inline-block font-bold text-yellow-300 px-3 py-2 bg-white/20 rounded-full text-sm sm:text-base">
                      {new Date(nextLesson.date + ' ' + nextLesson.time).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {/* Personal Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <div className="group bg-white/70 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="flex items-center mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-lg sm:text-xl mr-3 sm:mr-4 flex-shrink-0">
                    👤
                  </div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent leading-tight">
                    Personal Info
                  </h3>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  {profile && (() => {
                    // Calculate age from DOB
                    let age = '';
                    if (profile.dob) {
                      const dobDate = new Date(profile.dob);
                      const today = new Date();
                      let years = today.getFullYear() - dobDate.getFullYear();
                      const m = today.getMonth() - dobDate.getMonth();
                      if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
                        years--;
                      }
                      age = years > 0 ? `${years}` : '';
                    }
                    const info = {
                      "Name": (profile.firstName + ' ' + profile.lastName).trim(),
                      "Email": profile.email,
                      "Date of Birth": profile.dob ? `${profile.dob}${age ? ` (Age: ${age})` : ''}` : '',
                      "Skill Level": profile.skillLevel || '',
                    };
                    return Object.entries(info).map(([key, value]) => (
                      <div key={key} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:from-purple-50 hover:to-indigo-50 transition-all duration-300 space-y-1 sm:space-y-0">
                        <span className="font-semibold text-gray-700 text-sm sm:text-base">{key}:</span>
                        <span className="text-gray-800 font-medium text-sm sm:text-base break-words">{value}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
              {/* Streak (Practice Tracker) */}
              <PracticeStreak />
            </div>
            {/* Homework Section */}
            <div className="bg-white/70 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 mb-8 sm:mb-10 lg:mb-12">
              <div className="flex items-center mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-lg sm:text-xl mr-3 sm:mr-4 flex-shrink-0">
                  📚
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent leading-tight">
                  Homework Assignments
                </h3>
              </div>
              {/* Progress Tracker */}
              {homework.length > 0 && (
                <div className="mb-4 flex items-center gap-4">
                  <span className="font-semibold text-orange-700">Progress:</span>
                  <div className="flex-1 bg-orange-100 rounded-full h-4 relative">
                    <div
                      className="bg-gradient-to-r from-orange-400 to-red-400 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${Math.round((homework.filter(h => h.done).length / homework.length) * 100)}%` }}
                    />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-orange-900">
                      {Math.round((homework.filter(h => h.done).length / homework.length) * 100)}%
                    </span>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                {homework.length === 0 ? (
                  <p className="text-gray-500">No homework assignments yet.</p>
                ) : (
                  homework.map((assignment) => (
                    <div key={assignment.id} className="p-4 sm:p-5 rounded-xl border-l-4 bg-gradient-to-r from-orange-50 to-red-50 border-orange-500">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <h4 className="text-lg sm:text-xl font-bold text-gray-800">{assignment.title}</h4>
                          </div>
                          <p className="text-gray-700 text-sm sm:text-base mb-3 leading-relaxed">{assignment.description}</p>
                          <div className="flex flex-col sm:flex-row gap-2 text-xs sm:text-sm text-gray-600">
                            <span><strong>Assigned:</strong> {assignment.assignedDate}</span>
                            <span><strong>Due:</strong> {assignment.dueDate}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 min-w-[120px]">
                          <button
                            className={`px-4 py-2 rounded-lg font-bold text-xs shadow transition-all duration-200 ${assignment.done ? 'bg-green-400 text-white hover:bg-green-500' : 'bg-gray-200 text-gray-700 hover:bg-orange-200'}`}
                            onClick={async () => {
                              const firestore = await import("firebase/firestore");
                              const hwRef = firestore.doc(collection(db, "homework"), assignment.id);
                              await firestore.updateDoc(hwRef, { done: !assignment.done });
                              // No need to update local state, onSnapshot will handle it
                            }}
                          >
                            {assignment.done ? 'Completed' : 'Mark Complete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === "Book" && (
          <div className="bg-white/80 backdrop-blur-lg p-4 sm:p-8 rounded-3xl shadow-2xl border border-white/30 max-w-full mx-auto animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-center mb-6 sm:mb-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl mb-4 sm:mb-0 sm:mr-6 shadow-lg">
                📅
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Book Lessons
                </h2>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">Select your preferred available times</p>
              </div>
            </div>

            {/* Week Navigation */}
            {BookWeekNav()}

            {/* Week Calendar View of Available Times */}
            {BookAvailableTimes()}

            {/* Selection Summary (moved below calendar) */}
            {BookSelectionSummary()}

            {/* Book Now Section */}
            {BookNowSection()}
          </div>
        )}
        {/** Buy tab removed for buy-as-you-book flow */}
        {activeTab === "Upcoming" && (
          <div className="bg-white/80 backdrop-blur-lg p-4 sm:p-6 lg:p-8 rounded-3xl shadow-2xl border border-white/30 animate-fadeIn max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-purple-700">Upcoming Lessons</h2>
            {bookings.length === 0 ? (
              <p className="text-center text-gray-500 py-10">
                You have no upcoming lessons. Book some lessons now!
              </p>
            ) : (
              <div className="space-y-4">
            {bookings
              .filter(b => new Date(b.date + ' ' + b.time) > new Date())
              .sort((a, b) => new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime())
              .map(booking => {
                const lessonDate = new Date(booking.date + ' ' + booking.time);
                const now = new Date();
                const diffDays = Math.floor((lessonDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const canReschedule = diffDays >= 7;
                return (
                  <div key={booking.id} className="p-4 sm:p-5 rounded-xl border-l-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-500">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <h4 className="text-lg sm:text-xl font-bold text-gray-800">{`Lesson on ${lessonDate.toLocaleString()}`}</h4>
                        </div>
                        <p className="text-gray-700 text-sm sm:text-base mb-3 leading-relaxed">{`Duration: ${booking.length} minutes`}</p>
                        <div className="flex flex-col sm:flex-row gap-2 text-xs sm:text-sm text-gray-600">
                          <span><strong>Status:</strong> {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
                          <span><strong>Rate:</strong> {typeof booking.rate === 'number' ? `$${booking.rate}/lesson` : 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[120px] items-end">
                        <button
                          className="px-4 py-2 rounded-lg font-bold text-xs shadow bg-red-200 text-red-700 hover:bg-red-300 transition"
                          onClick={() => setCancelModal({ open: true, booking })}
                        >
                          Cancel
                        </button>
                        {canReschedule && (
                          <button
                            className="px-4 py-2 rounded-lg font-bold text-xs shadow bg-blue-200 text-blue-700 hover:bg-blue-300 transition"
                            onClick={() => setRescheduleModal({ open: true, booking })}
                          >
                            Reschedule
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
                {/* Cancel Confirmation Modal */}
                {cancelModal.open && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                      <h3 className="text-xl font-bold mb-4 text-red-700">Cancel Lesson?</h3>
                      <p className="mb-4 text-gray-700">Are you sure you want to cancel this lesson? This cannot be undone.</p>
                      <div className="mb-4 font-semibold text-gray-800">
                        {cancelModal.booking && new Date(cancelModal.booking.date + ' ' + cancelModal.booking.time).toLocaleString()}
                      </div>
                      <div className="flex justify-end mt-6">
                        <button
                          className="px-6 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg"
                          onClick={() => cancelModal.booking && handleCancelBooking(cancelModal.booking)}
                          disabled={actionLoading}
                        >
                          {actionLoading ? 'Cancelling...' : 'Yes, Cancel'}
                        </button>
                        <button
                          onClick={() => setCancelModal({ open: false })}
                          className="ml-4 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
                          disabled={actionLoading}
                        >
                          No, Go Back
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Reschedule Modal */}
                {rescheduleModal.open && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                      <h3 className="text-xl font-bold mb-4 text-blue-700">Reschedule Lesson</h3>
                      <p className="mb-4 text-gray-700">Select a new available time for your lesson.</p>
                      <div className="mb-6 flex flex-col items-center gap-2 max-h-48 overflow-y-auto">
                        {availableSlots.length === 0 && <div className="text-gray-500">No available times.</div>}
                        {availableSlots.map(slot => (
                          <button
                            key={slot.id}
                            className={`w-full px-4 py-2 mb-2 rounded-xl font-semibold border-2 transition-all duration-200 shadow text-xs ${rescheduleSlot === slot.id ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-blue-500' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50 hover:border-blue-400'}`}
                            onClick={() => setRescheduleSlot(slot.id)}
                            disabled={actionLoading}
                          >
                            {new Date(slot.date + 'T' + slot.time).toLocaleString()}
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-end mt-6">
                        <button
                          className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg"
                          onClick={() => rescheduleModal.booking && rescheduleSlot && handleRescheduleBooking(rescheduleModal.booking, rescheduleSlot)}
                          disabled={!rescheduleSlot || actionLoading}
                        >
                          {actionLoading ? 'Rescheduling...' : 'Confirm Reschedule'}
                        </button>
                        <button
                          onClick={() => { setRescheduleModal({ open: false }); setRescheduleSlot(""); }}
                          className="ml-4 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
                          disabled={actionLoading}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {activeTab === "Account" && (
          <div className="bg-white/80 backdrop-blur-lg p-4 sm:p-6 lg:p-8 rounded-3xl shadow-2xl border border-white/30 animate-fadeIn max-w-2xl mx-auto flex flex-col items-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-purple-700">Account</h2>
            <div className="flex flex-col gap-6 w-full">
                {/** Account details and actions here */}
              <div className="w-full p-4 sm:p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl shadow-md">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
                  Account Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium text-gray-800">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium text-gray-800">{profile?.firstName} {profile?.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member since:</span>
                    <span className="font-medium text-gray-800">{accountCreatedAt ? new Date(accountCreatedAt).toLocaleDateString() : ''}</span>
                  </div>
                </div>
              </div>
              <div className="w-full flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Payment Method
                </button>
              </div>
            </div>
                {/* Payment Method Modal */}
            {showPaymentModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                  <h3 className="text-xl font-bold mb-4 text-indigo-700">Add Payment Method</h3>
                  <p className="mb-4 text-gray-700">Payment integration coming soon! For now, this is a placeholder modal.</p>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:from-indigo-700 hover:to-purple-700 shadow-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
