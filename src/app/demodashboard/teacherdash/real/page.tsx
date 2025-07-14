"use client";
import { useEffect, useState, useRef } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, where, DocumentData, onSnapshot, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";


// --- Add Slot Handler and Helpers (must be inside component for state access) ---
// ...existing code...

// Note interface removed (Notes feature deprecated)

// --- Interfaces ---
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  dob?: string;
  skillLevel?: string;
  progress?: number;
  deleted?: boolean;
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
  rate?: number;
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



export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState<string>("Students");
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DocumentData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [slotSuccess, setSlotSuccess] = useState("");
  const slotSuccessTimeout = useRef<NodeJS.Timeout | null>(null);
  const [rateSuccess, setRateSuccess] = useState("");
  // Settings/profile state
  const [contactInfo, setContactInfo] = useState<{ email: string; phone: string }>({ email: "", phone: "" });
  const [contactEdit, setContactEdit] = useState<boolean>(false);
  const [contactLoading, setContactLoading] = useState<boolean>(false);
  const [contactSuccess, setContactSuccess] = useState<string>("");
  const [contactError, setContactError] = useState<string>("");
  const [rate, setRate] = useState<number>(profile?.rate ?? 300);
  const [rateEdit, setRateEdit] = useState<boolean>(false);
  const [rateInput, setRateInput] = useState<string>(String(profile?.rate ?? 300));
  const [rateLoading, setRateLoading] = useState<boolean>(false);
  const [rateError, setRateError] = useState<string>("");
  const [bio, setBio] = useState<string>(profile?.bio ?? "");
  const [bioEdit, setBioEdit] = useState<boolean>(false);
  const [bioLoading, setBioLoading] = useState<boolean>(false);
  const [bioError, setBioError] = useState<string>("");
  const [bioSuccess, setBioSuccess] = useState<string>("");
  const [siteTitleEdit, setSiteTitleEdit] = useState<boolean>(false);
  const [siteTitle, setSiteTitle] = useState<string>(profile?.siteTitle ?? "DANCE LESSONS");
  const [siteTitleLoading, setSiteTitleLoading] = useState<boolean>(false);
  const [siteTitleError, setSiteTitleError] = useState<string>("");
  const [siteTitleSuccess, setSiteTitleSuccess] = useState<string>("");
  const [siteTaglineEdit, setSiteTaglineEdit] = useState<boolean>(false);
  const [siteTagline, setSiteTagline] = useState<string>(profile?.siteTagline ?? "Personalized. Professional. Powerful.");
  const [siteTaglineLoading, setSiteTaglineLoading] = useState<boolean>(false);
  const [siteTaglineError, setSiteTaglineError] = useState<string>("");
  const [siteTaglineSuccess, setSiteTaglineSuccess] = useState<string>("");

  // --- Sorted Students and Sessions ---
  // Place these after all useState declarations




  // --- Add Slot Handler and Helpers (must be inside component for state access) ---


  // --- EFFECTS ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/login");
        return;
      }
      setUser(firebaseUser);
      try {
        // Fetch teacher profile
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        setProfile(userDoc.exists() ? userDoc.data() : null);

        // Fetch all students (not deleted)
        const studentsSnap = await getDocs(query(collection(db, "users"), where("role", "==", "student")));
        setStudents(studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)).filter(s => !s.deleted));

        // Real-time bookings
        const bookingsQuery = query(collection(db, "bookings"), where("teacherId", "==", firebaseUser.uid));
        const unsubBookings = onSnapshot(bookingsQuery, (snap) => {
          setBookings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
        });

        // Cleanup
        return () => {
          unsubBookings();
        };
      } catch {
        // Handle error if needed
      }
    });
    return () => { unsub(); };
  }, [router]);

  // Sync profile fields to local state when profile changes
  useEffect(() => {
    if (profile) {
      setContactInfo((prev) => {
        if (!contactEdit) {
          return {
            email:
              typeof profile.email === "string" && profile.email.trim()
                ? profile.email
                : "country.dance@example.com",
            phone:
              typeof profile.phone === "string" && profile.phone.trim()
                ? profile.phone
                : "555-555-5555",
          };
        }
        return prev;
      });
      if (!bioEdit) {
        setBio(
          typeof profile.bio === "string" && profile.bio.trim().length > 0
            ? profile.bio
            : "Authentic country swing and line dance lessons led by a seasoned instructor. Perfect for bars, events, and anyone looking to bring a true country vibe to their venue."
        );
      }
      if (!siteTitleEdit) {
        setSiteTitle(
          typeof profile.siteTitle === "string" && profile.siteTitle.trim()
            ? profile.siteTitle
            : "COUNTRY SWING & LINE DANCE LESSONS"
        );
      }
      if (!siteTaglineEdit) {
        setSiteTagline(
          typeof profile.siteTagline === "string" && profile.siteTagline.trim()
            ? profile.siteTagline
            : "Bring authentic country energy and a packed dance floor to your bar or event."
        );
      }
      if (!rateEdit) {
        setRate(
          typeof profile.rate === "number" && !isNaN(profile.rate)
            ? profile.rate
            : 300
        );
        setRateInput(
          typeof profile.rate === "number" && !isNaN(profile.rate)
            ? String(profile.rate)
            : "300"
        );
      }
    }
  }, [profile, contactEdit, bioEdit, siteTitleEdit, siteTaglineEdit, rateEdit]);
  // Save profile field handler (rate, siteTitle, siteTagline, bio)
  async function handleSaveProfileField(field: 'rate' | 'siteTitle' | 'siteTagline' | 'bio', value: string | number) {
    if (!user) return;
    try {
      // Always update the teacher's user doc, not the current user's doc
      const teacherQuery = query(collection(db, "users"), where("role", "==", "teacher"));
      const teacherSnap = await getDocs(teacherQuery);
      if (teacherSnap.empty) {
        if (field === 'rate') setRateError("No teacher account found.");
        if (field === 'siteTitle') setSiteTitleError("No teacher account found.");
        if (field === 'siteTagline') setSiteTaglineError("No teacher account found.");
        if (field === 'bio') setBioError("No teacher account found.");
        if (field === 'rate') setRateLoading(false);
        if (field === 'siteTitle') setSiteTitleLoading(false);
        if (field === 'siteTagline') setSiteTaglineLoading(false);
        if (field === 'bio') setBioLoading(false);
        return;
      }
      const teacherDoc = teacherSnap.docs[0];
      if (field === 'rate') {
        setRateLoading(true);
        setRateError("");
        setRateSuccess("");
        await updateDoc(doc(db, "users", teacherDoc.id), { rate: value });
        const parsedRate = typeof value === 'number' ? value : parseFloat(String(value));
        setRate(parsedRate);
        setRateInput(String(parsedRate));
        setRateSuccess("Rate updated!");
        setRateEdit(false);
        setProfile((prev) => prev ? { ...prev, rate: parsedRate } : prev);
      } else if (field === 'siteTitle') {
        setSiteTitleLoading(true);
        setSiteTitleError("");
        setSiteTitleSuccess("");
        await updateDoc(doc(db, "users", teacherDoc.id), { siteTitle: value });
        setSiteTitle(String(value));
        setSiteTitleSuccess("Site title saved!");
        setSiteTitleEdit(false);
        setSiteTitleLoading(false);
        setProfile((prev) => prev ? { ...prev, siteTitle: value } : prev);
      } else if (field === 'siteTagline') {
        setSiteTaglineLoading(true);
        setSiteTaglineError("");
        setSiteTaglineSuccess("");
        await updateDoc(doc(db, "users", teacherDoc.id), { siteTagline: value });
        setSiteTagline(String(value));
        setSiteTaglineSuccess("Site tagline saved!");
        setSiteTaglineEdit(false);
        setSiteTaglineLoading(false);
        setProfile((prev) => prev ? { ...prev, siteTagline: value } : prev);
      } else if (field === 'bio') {
        setBioLoading(true);
        setBioError("");
        setBioSuccess("");
        await updateDoc(doc(db, "users", teacherDoc.id), { bio: value });
        setBio(typeof value === 'string' ? value : String(value));
        setBioSuccess("Bio saved!");
        setBioEdit(false);
        setBioLoading(false);
        setProfile((prev) => prev ? { ...prev, bio: value } : prev);
      }
    } catch (err) {
      if (field === 'rate') setRateError((err instanceof Error && err.message) || "Failed to update rate.");
      if (field === 'siteTitle') setSiteTitleError((err instanceof Error && err.message) || "Failed to save site title.");
      if (field === 'siteTagline') setSiteTaglineError((err instanceof Error && err.message) || "Failed to save site tagline.");
      if (field === 'bio') setBioError((err instanceof Error && err.message) || "Failed to save bio.");
    } finally {
      if (field === 'rate') setRateLoading(false);
      if (field === 'siteTitle') setSiteTitleLoading(false);
      if (field === 'siteTagline') setSiteTaglineLoading(false);
      if (field === 'bio') setBioLoading(false);
    }
  }

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
              {activeTab === "Students" && (
                <div className="w-full flex flex-col items-center">
                  <h2 className="text-2xl font-bold mb-4 text-[#bfa76a]">Students</h2>
                  {students.length === 0 ? (
                    <p className="text-[#e9e6d7]">No students found.</p>
                  ) : (
                    <ul className="w-full max-w-2xl divide-y divide-[#bfa76a]/30 bg-[#1a2328]/60 rounded-xl shadow-lg">
                      {students.map((student) => (
                        <li key={student.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3">
                          <div>
                            <span className="font-semibold text-[#bfa76a]">{student.firstName} {student.lastName}</span>
                            {student.email && <span className="ml-2 text-xs text-[#e9e6d7]/70">{student.email}</span>}
                          </div>
                          {student.skillLevel && <span className="text-xs text-[#1fc2b7] mt-1 sm:mt-0">Level: {student.skillLevel}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {activeTab === "Upcoming" && (
                <div className="w-full flex flex-col items-center">
                  <h2 className="text-2xl font-bold mb-4 text-[#bfa76a]">Upcoming Sessions</h2>
                  {bookings.length === 0 ? (
                    <p className="text-[#e9e6d7]">No upcoming bookings.</p>
                  ) : (
                    <ul className="w-full max-w-2xl divide-y divide-[#bfa76a]/30 bg-[#1a2328]/60 rounded-xl shadow-lg">
                      {bookings
                        .filter(b => b.date && new Date(b.date + 'T' + (b.time || '00:00')) > new Date())
                        .sort((a, b) => new Date(a.date + 'T' + (a.time || '00:00')).getTime() - new Date(b.date + 'T' + (b.time || '00:00')).getTime())
                        .map((booking) => (
                          <li key={booking.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3">
                            <div>
                              <span className="font-semibold text-[#bfa76a]">{booking.date} {booking.time}</span>
                              {booking.studentId && <span className="ml-2 text-xs text-[#e9e6d7]/70">Student: {booking.studentId}</span>}
                            </div>
                            {booking.status && <span className="text-xs text-[#1fc2b7] mt-1 sm:mt-0">Status: {booking.status}</span>}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              )}
              {activeTab === "Calendar" && (
                <div className="w-full flex flex-col items-center">
                  <h2 className="text-2xl font-bold mb-4 text-[#bfa76a]">Calendar</h2>
                  {bookings.length === 0 ? (
                    <p className="text-[#e9e6d7]">No sessions found.</p>
                  ) : (
                    <div className="w-full max-w-3xl">
                      {Object.entries(
                        bookings
                          .slice()
                          .sort((a, b) => new Date(a.date + 'T' + (a.time || '00:00')).getTime() - new Date(b.date + 'T' + (b.time || '00:00')).getTime())
                          .reduce((acc, booking) => {
                            (acc[booking.date] = acc[booking.date] || []).push(booking);
                            return acc;
                          }, {} as Record<string, Booking[]>)
                      ).map(([date, dayBookings]) => (
                        <div key={date} className="mb-6">
                          <div className="font-bold text-[#1fc2b7] text-lg mb-2">{date}</div>
                          <ul className="divide-y divide-[#bfa76a]/20 bg-[#1a2328]/60 rounded-xl shadow">
                            {dayBookings.map((booking: Booking) => {
                              const student = students.find(s => s.id === booking.studentId);
                              return (
                                <li key={booking.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3">
                                  <div>
                                    <span className="font-semibold text-[#bfa76a]">{booking.time}</span>
                                    {student && <span className="ml-2 text-xs text-[#e9e6d7]/70">{student.firstName} {student.lastName}</span>}
                                  </div>
                                  {booking.status && <span className="text-xs text-[#1fc2b7] mt-1 sm:mt-0">Status: {booking.status}</span>}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {activeTab === "Finance" && (
                <div className="w-full flex flex-col items-center">
                  <h2 className="text-2xl font-bold mb-4 text-[#bfa76a]">Finance</h2>
                  {bookings.length === 0 ? (
                    <p className="text-[#e9e6d7]">No payment data available.</p>
                  ) : (
                    <div className="w-full max-w-2xl space-y-6">
                      {/* Earnings summary */}
                      <div className="bg-[#1a2328]/70 rounded-xl p-4 border border-[#bfa76a]/20 flex flex-col gap-2">
                        <div className="text-lg font-bold text-[#bfa76a]">Earnings Summary</div>
                        <div className="flex flex-wrap gap-6 mt-2">
                          <div className="flex flex-col"><span className="text-[#e9e6d7] text-2xl font-bold">${bookings.reduce((sum, b) => sum + (b.rate || 0), 0).toFixed(2)}</span><span className="text-xs text-[#bfa76a]">Total Earned</span></div>
                          <div className="flex flex-col"><span className="text-[#e9e6d7] text-2xl font-bold">{bookings.length}</span><span className="text-xs text-[#bfa76a]">Sessions</span></div>
                        </div>
                      </div>
                      {/* Recent payments/bookings */}
                      <div className="bg-[#1a2328]/70 rounded-xl p-4 border border-[#bfa76a]/20">
                        <div className="text-lg font-bold text-[#bfa76a] mb-2">Recent Payments</div>
                        <ul className="divide-y divide-[#bfa76a]/20">
                          {bookings
                            .slice()
                            .sort((a, b) => new Date(b.date + 'T' + (b.time || '00:00')).getTime() - new Date(a.date + 'T' + (a.time || '00:00')).getTime())
                            .slice(0, 10)
                            .map((booking) => {
                              const student = students.find(s => s.id === booking.studentId);
                              return (
                                <li key={booking.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-2 py-2">
                                  <div>
                                    <span className="font-semibold text-[#bfa76a]">{booking.date} {booking.time}</span>
                                    {student && <span className="ml-2 text-xs text-[#e9e6d7]/70">{student.firstName} {student.lastName}</span>}
                                  </div>
                                  <div className="flex flex-col items-end">
                                    <span className="text-[#1fc2b7] font-bold">${booking.rate ? booking.rate.toFixed(2) : '0.00'}</span>
                                    {booking.status && <span className="text-xs text-[#bfa76a]">{booking.status}</span>}
                                  </div>
                                </li>
                              );
                            })}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {activeTab === "Settings" && (
                <div className="w-full flex flex-col items-center">
                  <h2 className="text-2xl font-bold mb-4 text-[#bfa76a]">Settings</h2>
                  <div className="w-full max-w-2xl space-y-8">
                    {/* Site Title */}
                    <div className="bg-[#1a2328]/70 rounded-xl p-4 border border-[#bfa76a]/20">
                      <label className="block text-[#bfa76a] font-semibold mb-1">Site Title</label>
                      {siteTitleEdit ? (
                        <div className="flex gap-2 items-center">
                          <input
                            className="rounded px-2 py-1 bg-[#0a232e] text-[#e9e6d7] border border-[#bfa76a]/40 flex-1"
                            value={siteTitle}
                            onChange={e => setSiteTitle(e.target.value)}
                            disabled={siteTitleLoading}
                          />
                          <button className="px-3 py-1 rounded bg-[#bfa76a] text-[#1a2328] font-bold" onClick={() => handleSaveProfileField('siteTitle', siteTitle)} disabled={siteTitleLoading}>Save</button>
                          <button className="px-2 py-1 rounded text-[#e9e6d7]" onClick={() => { setSiteTitleEdit(false); setSiteTitle(profile?.siteTitle ?? "DANCE LESSONS"); }}>Cancel</button>
                        </div>
                      ) : (
                        <div className="flex gap-2 items-center">
                          <span className="text-[#e9e6d7] flex-1">{siteTitle}</span>
                          <button className="px-2 py-1 rounded text-[#bfa76a] underline" onClick={() => setSiteTitleEdit(true)}>Edit</button>
                        </div>
                      )}
                      {siteTitleError && <div className="text-red-400 text-xs mt-1">{siteTitleError}</div>}
                      {siteTitleSuccess && <div className="text-green-400 text-xs mt-1">{siteTitleSuccess}</div>}
                    </div>
                    {/* Site Tagline */}
                    <div className="bg-[#1a2328]/70 rounded-xl p-4 border border-[#bfa76a]/20">
                      <label className="block text-[#bfa76a] font-semibold mb-1">Site Tagline</label>
                      {siteTaglineEdit ? (
                        <div className="flex gap-2 items-center">
                          <input
                            className="rounded px-2 py-1 bg-[#0a232e] text-[#e9e6d7] border border-[#bfa76a]/40 flex-1"
                            value={siteTagline}
                            onChange={e => setSiteTagline(e.target.value)}
                            disabled={siteTaglineLoading}
                          />
                          <button className="px-3 py-1 rounded bg-[#bfa76a] text-[#1a2328] font-bold" onClick={() => handleSaveProfileField('siteTagline', siteTagline)} disabled={siteTaglineLoading}>Save</button>
                          <button className="px-2 py-1 rounded text-[#e9e6d7]" onClick={() => { setSiteTaglineEdit(false); setSiteTagline(profile?.siteTagline ?? "Personalized. Professional. Powerful."); }}>Cancel</button>
                        </div>
                      ) : (
                        <div className="flex gap-2 items-center">
                          <span className="text-[#e9e6d7] flex-1">{siteTagline}</span>
                          <button className="px-2 py-1 rounded text-[#bfa76a] underline" onClick={() => setSiteTaglineEdit(true)}>Edit</button>
                        </div>
                      )}
                      {siteTaglineError && <div className="text-red-400 text-xs mt-1">{siteTaglineError}</div>}
                      {siteTaglineSuccess && <div className="text-green-400 text-xs mt-1">{siteTaglineSuccess}</div>}
                    </div>
                    {/* Rate */}
                    <div className="bg-[#1a2328]/70 rounded-xl p-4 border border-[#bfa76a]/20">
                      <label className="block text-[#bfa76a] font-semibold mb-1">Lesson Rate ($/hr)</label>
                      {rateEdit ? (
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            className="rounded px-2 py-1 bg-[#0a232e] text-[#e9e6d7] border border-[#bfa76a]/40 flex-1"
                            value={rateInput}
                            onChange={e => setRateInput(e.target.value)}
                            disabled={rateLoading}
                          />
                          <button className="px-3 py-1 rounded bg-[#bfa76a] text-[#1a2328] font-bold" onClick={() => handleSaveProfileField('rate', parseFloat(rateInput))} disabled={rateLoading}>Save</button>
                          <button className="px-2 py-1 rounded text-[#e9e6d7]" onClick={() => { setRateEdit(false); setRateInput(String(profile?.rate ?? 60)); }}>Cancel</button>
                        </div>
                      ) : (
                        <div className="flex gap-2 items-center">
                          <span className="text-[#e9e6d7] flex-1">${rate}</span>
                          <button className="px-2 py-1 rounded text-[#bfa76a] underline" onClick={() => setRateEdit(true)}>Edit</button>
                        </div>
                      )}
                      {rateError && <div className="text-red-400 text-xs mt-1">{rateError}</div>}
                      {rateSuccess && <div className="text-green-400 text-xs mt-1">{rateSuccess}</div>}
                    </div>
                    {/* Bio */}
                    <div className="bg-[#1a2328]/70 rounded-xl p-4 border border-[#bfa76a]/20">
                      <label className="block text-[#bfa76a] font-semibold mb-1">Bio</label>
                      {bioEdit ? (
                        <div className="flex flex-col gap-2">
                          <textarea
                            className="rounded px-2 py-1 bg-[#0a232e] text-[#e9e6d7] border border-[#bfa76a]/40 min-h-[60px]"
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                            disabled={bioLoading}
                          />
                          <div className="flex gap-2">
                            <button className="px-3 py-1 rounded bg-[#bfa76a] text-[#1a2328] font-bold" onClick={() => handleSaveProfileField('bio', bio)} disabled={bioLoading}>Save</button>
                            <button className="px-2 py-1 rounded text-[#e9e6d7]" onClick={() => { setBioEdit(false); setBio(profile?.bio ?? ""); }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 items-center">
                          <span className="text-[#e9e6d7] flex-1">{bio || <span className="italic text-[#e9e6d7]/60">No bio set.</span>}</span>
                          <button className="px-2 py-1 rounded text-[#bfa76a] underline" onClick={() => setBioEdit(true)}>Edit</button>
                        </div>
                      )}
                      {bioError && <div className="text-red-400 text-xs mt-1">{bioError}</div>}
                      {bioSuccess && <div className="text-green-400 text-xs mt-1">{bioSuccess}</div>}
                    </div>
                    {/* Contact Info */}
                    <div className="bg-[#1a2328]/70 rounded-xl p-4 border border-[#bfa76a]/20">
                      <label className="block text-[#bfa76a] font-semibold mb-1">Contact Info</label>
                      {contactEdit ? (
                        <div className="flex flex-col gap-2">
                          <input
                            className="rounded px-2 py-1 bg-[#0a232e] text-[#e9e6d7] border border-[#bfa76a]/40"
                            value={contactInfo.email}
                            onChange={e => setContactInfo((prev) => ({ ...prev, email: e.target.value }))}
                            placeholder="Email"
                            disabled={contactLoading}
                          />
                          <input
                            className="rounded px-2 py-1 bg-[#0a232e] text-[#e9e6d7] border border-[#bfa76a]/40"
                            value={contactInfo.phone}
                            onChange={e => setContactInfo((prev) => ({ ...prev, phone: e.target.value }))}
                            placeholder="Phone"
                            disabled={contactLoading}
                          />
                          <div className="flex gap-2">
                            <button
                              className="px-3 py-1 rounded bg-[#bfa76a] text-[#1a2328] font-bold"
                              onClick={async () => {
                                setContactLoading(true);
                                setContactError("");
                                setContactSuccess("");
                                try {
                                  if (!user) throw new Error("Not logged in");
                                  const teacherQuery = query(collection(db, "users"), where("role", "==", "teacher"));
                                  const teacherSnap = await getDocs(teacherQuery);
                                  if (teacherSnap.empty) throw new Error("No teacher account found.");
                                  const teacherDoc = teacherSnap.docs[0];
                                  await updateDoc(doc(db, "users", teacherDoc.id), {
                                    email: contactInfo.email,
                                    phone: contactInfo.phone,
                                  });
                                  setContactSuccess("Contact info updated!");
                                  setContactEdit(false);
                                  setProfile((prev) => prev ? { ...prev, email: contactInfo.email, phone: contactInfo.phone } : prev);
                                } catch (e) {
                                  setContactError((e instanceof Error && e.message) || "Failed to update contact info.");
                                } finally {
                                  setContactLoading(false);
                                }
                              }}
                              disabled={contactLoading}
                            >Save</button>
                            <button className="px-2 py-1 rounded text-[#e9e6d7]" onClick={() => { setContactEdit(false); setContactInfo({ email: profile?.email ?? "", phone: profile?.phone ?? "" }); }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 items-center">
                          <span className="text-[#e9e6d7] flex-1">{contactInfo.email || <span className="italic text-[#e9e6d7]/60">No email set.</span>} | {contactInfo.phone || <span className="italic text-[#e9e6d7]/60">No phone set.</span>}</span>
                          <button className="px-2 py-1 rounded text-[#bfa76a] underline" onClick={() => setContactEdit(true)}>Edit</button>
                        </div>
                      )}
                      {contactError && <div className="text-red-400 text-xs mt-1">{contactError}</div>}
                      {contactSuccess && <div className="text-green-400 text-xs mt-1">{contactSuccess}</div>}
                    </div>
                  </div>
                </div>
              )}
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

