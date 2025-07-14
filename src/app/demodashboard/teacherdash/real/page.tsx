"use client";
import { useEffect, useState, useRef } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, where, DocumentData, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";


// --- Add Slot Handler and Helpers (must be inside component for state access) ---
// ...existing code...

// Note interface removed (Notes feature deprecated)

// Define Student interface for type safety
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dob?: string;
  skillLevel?: string;
  progress?: number;
  deleted?: boolean; // <-- allow soft delete
}

interface Booking {
  id: string;
  teacherId: string;
  studentId: string;
  date: string;
  time: string;
  length?: number;
  status?: string;
  slotId?: string;
  createdAt?: string;
  rate?: number; // Per-lesson rate at time of booking
  // Add any other fields you use in bookings
}


const tabs = [
  "Students",
  "Upcoming",
  // "Notes", // Removed
  "Calendar",
  "Finance",
  "Settings",
];

const getTabIcon = (tab: string) => {
  switch (tab) {
    case "Students":
      return "👥";
    case "Upcoming":
      return "⏰";
    // case "Notes":
    //   return "📝";
    case "Calendar":
      return "📅";
    case "Finance":
      return "💵";
    case "Settings":
      return "⚙️";
    default:
      return "";
  }
};







// --- Interfaces ---
interface LessonSlot {
  id: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:mm or HH:mm:ss
  bookedStudentIds?: string[];
  [key: string]: unknown;
}


export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState("Students");
  // Restore required state for logic and effects
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DocumentData | null>(null);
  // Removed unused students, bookings, lessonSlots state
  // Remove unused UI state: contactInfo, contactEdit, bio, bioEdit, siteTitle, siteTitleEdit, siteTagline, siteTaglineEdit, rate, rateEdit, rateInput
  const [slotSuccess, setSlotSuccess] = useState("");
  const slotSuccessTimeout = useRef<NodeJS.Timeout | null>(null);
  const [rateSuccess, setRateSuccess] = useState("");

  // --- Sorted Students and Sessions ---
  // Place these after all useState declarations




  // --- Add Slot Handler and Helpers (must be inside component for state access) ---


  // --- EFFECTS ---
  useEffect(() => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/login");
        return;
      }
      setUser(firebaseUser);
      try {
        // Fetch teacher profile
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        setProfile(userDoc.exists() ? userDoc.data() : null);

        // --- Fetch ALL students (not just those with bookings) ---
        // Fetch all students with role: "student" and filter out deleted in JS (handles missing field)
        const studentsSnap = await getDocs(query(collection(db, "users"), where("role", "==", "student")));
        const studentsList = studentsSnap.docs
          .map(doc => ({ id: doc.id, ...(doc.data() as Omit<Student, "id">) }))
          .filter(student => student.deleted !== true); // Exclude only if deleted === true
        // setStudents removed (state not tracked)

        // --- Fetch ALL bookings (real-time, single teacher app) ---
        const bookingsQuery = collection(db, "bookings");
        onSnapshot(bookingsQuery, (snap) => {
          const bookingsData: Booking[] = snap.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              teacherId: data.teacherId ?? "",
              studentId: data.studentId ?? "",
              date: data.date ?? "",
              time: data.time ?? "",
              length: data.length,
              status: data.status,
              slotId: data.slotId,
              createdAt: data.createdAt,
              rate: data.rate,
            } as Booking;
          });
          // setBookings removed (state not tracked)
        });

        // --- Fetch lesson slots for this teacher (availability) ---
        const slotsQuery = query(collection(db, "lessonSlots"), where("teacherId", "==", firebaseUser.uid));
        onSnapshot(slotsQuery, (snap) => {
          // Merge booking info into lessonSlots
        const slots = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<LessonSlot, "id">) }) as LessonSlot);
        // Attach booking info to slots
        // setLessonSlots removed (state not tracked)
        });
        // No cleanup needed for onAuthStateChanged itself
      } catch {
        // Handle error if needed
      }
    });
    return () => {};
  }, [router]);

  // Removed effect for updating unused UI state

  // Auto-hide slotSuccess after 3 seconds
  useEffect(() => {
    if (slotSuccess) {
      if (slotSuccessTimeout.current) clearTimeout(slotSuccessTimeout.current);
      slotSuccessTimeout.current = setTimeout(() => setSlotSuccess("") , 3000);
    }
    return () => {
      if (slotSuccessTimeout.current) clearTimeout(slotSuccessTimeout.current);
    };
  }, [slotSuccess]);

  // Auto-hide rateSuccess after 3 seconds
  useEffect(() => {
    if (rateSuccess) {
      const t = setTimeout(() => setRateSuccess("") , 3000);
      return () => clearTimeout(t);
    }
  }, [rateSuccess]);

  

  // Delete student handler (opens modal)


  // Helper: format availability display
  // Removed unused formatAvailability helper

  // Helper to get student info for a slot
  // Removed unused getStudentInfo helper

  // Helper: get calendar dates
  // Removed unused today variable

  // Helper: generate 15-min increment times ("14:00", "14:15", ...)
  // Removed unused timeOptions variable

  // Helper: weekday names
  // Removed unused weekdayNames variable

  // Contact info change handler
  // function handleContactChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
  //   const { name, value } = e.target;
  //   setContactInfo((prev) => ({ ...prev, [name]: value }));
  // }

  // Enhanced: Add slots for a time range (auto-generate 60-min slots)
  // Removed unused getTimeInMinutes, padTime, and minutesToTimeStr helpers
  // Removed unused handleAddSlot function

  // UI rendering (structure and styles adapted from demo dashboard)
  // UI rendering (structure and styles adapted from demo dashboard)
  return (
    <>
      <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-[#0a232e] via-[#1a2d36] to-[#1a2328] max-w-screen overflow-x-hidden font-sans" style={{fontFamily: 'Inter, Segoe UI, Arial, Georgia, serif'}}>
        {/* Sidebar Navigation - responsive, now with dashboard title at the top */}
        <aside className="hidden md:flex flex-col gap-3 pl-6 pr-4 py-6 min-w-[200px] max-w-[260px] fixed top-0 left-0 z-40 h-full bg-gradient-to-b from-[#14232b]/90 to-[#1a2d36]/70 border-r border-[#bfa76a]/30 shadow-2xl" style={{ height: '100vh', fontFamily: 'Inter, Segoe UI, Arial, Georgia, serif' }}>
          <div className="mb-6 mt-2 flex flex-col items-center">
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-[#bfa76a] to-[#1fc2b7] bg-clip-text text-transparent text-center flex items-center justify-center tracking-wide drop-shadow-lg">
              Dashboard
            </h1>
            <p className="hidden xs:block text-xs xs:text-sm sm:text-base text-[#e9e6d7] text-center mt-1 font-mono">
              Welcome, {profile?.firstName ? `${profile.firstName} ${profile.lastName}` : user?.email ?? ""}
            </p>
          </div>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-2 py-2 rounded-xl font-semibold text-sm lg:text-base transition-all duration-200 text-left shadow-md border-2 ${
                activeTab === tab
                  ? "bg-gradient-to-r from-[#bfa76a]/90 to-[#1fc2b7]/80 text-[#1a2328] border-[#bfa76a] shadow-lg"
                  : "glass-effect text-[#e9e6d7] border-transparent hover:border-[#1fc2b7]/60 hover:bg-[#1fc2b7]/10"
              }`}
              style={{ width: '100%', fontFamily: 'inherit' }}
            >
              <span className="text-xl lg:text-2xl">{getTabIcon(tab)}</span>
              <span className="hidden sm:inline tracking-wide">{tab}</span>
            </button>
          ))}
        </aside>
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col w-full min-w-0 max-w-screen overflow-x-hidden md:pl-[260px]" style={{fontFamily: 'inherit'}}>
          {/* Main Content (Tab Content) */}
          <div className="flex-1 flex flex-col w-full p-2 xs:p-4 sm:p-6 md:p-10 min-w-0 max-w-screen overflow-x-hidden pt-[30px] xs:pt-[40px] sm:pt-[50px] pb-[80px] xs:pb-[100px] sm:pb-[130px]" style={{background: 'linear-gradient(135deg, #0a232e 0%, #1a2d36 60%, #1a2328 100%)'}}>
            {/* Bottom Navigation Bar for Mobile/Tablet (md and below) */}
            <nav
              className="fixed left-0 bottom-0 w-full z-50 flex md:hidden bg-gradient-to-t from-[#0a232e]/95 to-[#1a2d36]/90 border-t border-[#bfa76a]/30 shadow-2xl h-16 xs:h-20 sm:h-24 rounded-t-2xl m-0 p-0"
              style={{ margin: 0, padding: 0, fontFamily: 'inherit' }}
            >
              {[
                "Students", "Upcoming", "Calendar", "Finance", "Settings"
              ].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 flex flex-col items-center justify-center py-2 xs:py-3 sm:py-4 text-2xl xs:text-3xl sm:text-4xl transition-all duration-200 relative ${activeTab === tab ? "text-[#bfa76a]" : "text-[#e9e6d7] hover:text-[#1fc2b7]"}`}
                  aria-label={tab}
                  style={{ minWidth: 0, fontFamily: 'inherit' }}
                >
                  <span className={`mb-0 flex items-center justify-center w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 ${activeTab === tab ? "bg-gradient-to-t from-[#bfa76a]/30 to-[#1fc2b7]/20 rounded-2xl shadow-lg" : ""}`}>{getTabIcon(tab)}</span>
                  {/* Hide tab text on mobile, show only on xs+ screens */}
                  <span className="hidden xs:inline text-[11px] xs:text-xs sm:text-sm mt-0.5 tracking-wide">{tab}</span>
                </button>
              ))}
            </nav>
            {/* Tab Content */}
            <div className="glass-effect p-1 xs:p-2 sm:p-4 md:p-8 lg:p-12 xl:p-16 rounded-2xl shadow-2xl min-h-[300px] xs:min-h-[400px] sm:min-h-[500px] animate-fadeIn overflow-y-auto w-full flex flex-col items-center max-w-screen overflow-x-hidden pb-[90px] xs:pb-[110px] sm:pb-[130px] lg:max-w-7xl xl:max-w-8xl mx-auto border-2 border-[#bfa76a]/30 bg-gradient-to-br from-[#1a2d36]/80 to-[#0a232e]/90" style={{backdropFilter: 'blur(8px)', fontFamily: 'inherit'}}>
              {/* ...existing tab content code... */}
            </div>
            {/* Extra mobile tweaks: make everything more touch-friendly and less cluttered */}
            <style jsx global>{`
              @media (max-width: 640px) {
                /* ...existing code... */
                /* Override for Days of Week buttons to keep them compact on mobile */
                .calendar-days-row button.px-2.py-1.text-sm {
                  font-size: 0.85rem !important;
                  padding-left: 0.4em !important;
                  padding-right: 0.4em !important;
                  padding-top: 0.18em !important;
                  padding-bottom: 0.18em !important;
                  min-width: 0 !important;
                  min-height: 0 !important;
                  height: 28px !important;
                  line-height: 1.1 !important;
                }
              }
              /* ...existing code... */
            `}</style>
          </div>
        </div>
      </div>
    </>
  );

}

// --- TeacherNotesTab removed (Notes feature deprecated) ---
// Helper to parse date string as local date (not UTC)
// Removed unused parseLocalDate helper

