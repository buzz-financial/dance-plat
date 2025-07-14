"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, where, DocumentData, addDoc, updateDoc, onSnapshot, Timestamp } from "firebase/firestore";
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

function getAge(dob?: string) {
    if (!dob) return 0;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }





// --- Interfaces ---
interface LessonSlot {
  id: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:mm or HH:mm:ss
  bookedStudentIds?: string[];
  [key: string]: unknown;
}


export default function TeacherDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  // --- All state and refs at the top ---
  const [students, setStudents] = useState<Student[]>([]);
  const [lessonSlots, setLessonSlots] = useState<LessonSlot[]>([]);
  const [sessionSort, setSessionSort] = useState("date");
  const [studentSort, setStudentSort] = useState("az");
  const [slotForm, setSlotForm] = useState({ startDate: "", endDate: "", startTime: "", endTime: "", daysOfWeek: [] as number[] });
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DocumentData | null>(null);
  const [contactInfo, setContactInfo] = useState({ email: profile?.email ?? "country.dance@example.com", phone: profile?.phone ?? "555-555-5555" });
  const [contactEdit, setContactEdit] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState("");
  const [contactError, setContactError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [slotSuccess, setSlotSuccess] = useState("");
  const slotSuccessTimeout = useRef<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState("Students");
  const [rateSuccess, setRateSuccess] = useState("");
  const [rate, setRate] = useState<number>(profile?.rate ?? 300);
  const [rateEdit, setRateEdit] = useState(false);
  const [rateInput, setRateInput] = useState<string>(String(profile?.rate ?? 300));
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState("");
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotError, setSlotError] = useState("");
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [studentView, setStudentView] = useState<'card' | 'list'>('card');
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [cancelModal, setCancelModal] = useState<{ open: boolean; booking?: Booking }>({ open: false });
  const [actionLoading, setActionLoading] = useState(false);
  const [bio, setBio] = useState<string>(profile?.bio ?? "Authentic country swing and line dance lessons led by a seasoned instructor. Perfect for bars, events, and anyone looking to bring a true country vibe to their venue.");
  const [bioEdit, setBioEdit] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const [bioError, setBioError] = useState("");
  const [bioSuccess, setBioSuccess] = useState("");
  const [siteTitleEdit, setSiteTitleEdit] = useState(false);
  const [siteTitle, setSiteTitle] = useState(profile?.siteTitle ?? "COUNTRY SWING & LINE DANCE LESSONS");
  const [siteTitleLoading, setSiteTitleLoading] = useState(false);
  const [siteTitleError, setSiteTitleError] = useState("");
  const [siteTitleSuccess, setSiteTitleSuccess] = useState("");
  const [siteTaglineEdit, setSiteTaglineEdit] = useState(false);
  const [siteTagline, setSiteTagline] = useState(profile?.siteTagline ?? "Bring authentic country energy and a packed dance floor to your bar or event.");
  const [siteTaglineLoading, setSiteTaglineLoading] = useState(false);
  const [siteTaglineError, setSiteTaglineError] = useState("");
  const [siteTaglineSuccess, setSiteTaglineSuccess] = useState("");
  const router = useRouter();

  // --- Sorted Students and Sessions ---
  // Place these after all useState declarations
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      if (studentSort === "az") return a.firstName.localeCompare(b.firstName);
      if (studentSort === "progress") return (b.progress ?? 0) - (a.progress ?? 0);
      if (studentSort === "age") return getAge(b.dob) - getAge(a.dob);
      if (studentSort === "level") return (b.skillLevel ?? "").localeCompare(a.skillLevel ?? "");
      return 0;
    });
  }, [students, studentSort]);

  const sortedSessions = useMemo(() => {
    return [...lessonSlots].sort((a, b) => {
      if (sessionSort === "date") {
        return (a.date + a.time).localeCompare(b.date + b.time);
      }
      return 0;
    });
  }, [lessonSlots, sessionSort]);



  // --- Add Slot Handler and Helpers (must be inside component for state access) ---
  function getTimeInMinutes(t: string) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }
  function padTime(n: number) {
    return n.toString().padStart(2, "0");
  }
  function minutesToTimeStr(mins: number) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${padTime(h)}:${padTime(m)}`;
  }
  function parseLocalDate(dateStr: string) {
    // Parse yyyy-mm-dd as local date (not UTC)
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  async function handleAddSlot(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setSlotError("You must be logged in as a teacher to add a slot.");
      return;
    }
    setSlotLoading(true);
    setSlotError("");
    setSlotSuccess("");
    try {
      const { startDate, endDate, startTime, endTime, daysOfWeek } = slotForm;
      if (!startDate || !startTime || !endTime || daysOfWeek.length === 0) {
        setSlotError("Please fill all fields and select at least one day.");
        setSlotLoading(false);
        return;
      }
      const slotsToAdd: Omit<LessonSlot, "id">[] = [];
      const start = parseLocalDate(startDate);
      const end = endDate ? parseLocalDate(endDate) : start;
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayCopy = new Date(d);
        if (!daysOfWeek.includes(dayCopy.getDay())) continue;
        const dateStr = dayCopy.toISOString().split("T")[0];
        let tMin = getTimeInMinutes(startTime);
        const tMax = getTimeInMinutes(endTime);
        while (tMin + 60 <= tMax) {
          const slotTime = minutesToTimeStr(tMin);
          const overlap = lessonSlots.some(slot => slot.date === dateStr && slot.time === slotTime);
          if (!overlap) {
            slotsToAdd.push({
              date: dateStr,
              time: slotTime,
              teacherId: user.uid,
              bookedStudentIds: [],
              createdAt: Timestamp.now(),
            });
          }
          tMin += 60;
        }
      }
      if (slotsToAdd.length === 0) {
        setSlotError("No valid slots to add (possible overlap, no days selected, or time range too short).");
        setSlotLoading(false);
        return;
      }
      await Promise.all(slotsToAdd.map(slot => addDoc(collection(db, "lessonSlots"), slot)));
      setSlotSuccess(`${slotsToAdd.length} slot(s) added!`);
      setSlotForm({ startDate: "", endDate: "", startTime: "", endTime: "", daysOfWeek: [] });
      // Refresh slots list
      const slotsSnap = await getDocs(
        query(collection(db, "lessonSlots"), where("teacherId", "==", user.uid))
      );
      setLessonSlots(
        slotsSnap.docs.map((doc) => {
          const data = doc.data() as Omit<LessonSlot, "id">;
          return {
            id: doc.id ?? "",
            date: typeof data.date === "string" ? data.date : "",
            time: typeof data.time === "string" ? data.time : "",
            teacherId: data.teacherId,
            bookedStudentIds: Array.isArray(data.bookedStudentIds) ? data.bookedStudentIds : [],
            createdAt: data.createdAt,
          } as LessonSlot;
        })
      );
    } catch (e: unknown) {
      setSlotError((e instanceof Error && e.message) || "Failed to add slot(s).");
    } finally {
      setSlotLoading(false);
    }
  }


  // Phone input: allow only 10 digits and auto-format as (XXX) XXX-XXXX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    let formatted = digits;
    if (digits.length > 6) {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length > 3) {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else if (digits.length > 0) {
      formatted = `(${digits}`;
    }
    setContactInfo((prev) => ({ ...prev, phone: formatted }));
  };

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
        setStudents(studentsList);

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
          setBookings(bookingsData);
        });

        // --- Fetch lesson slots for this teacher (availability) ---
        const slotsQuery = query(collection(db, "lessonSlots"), where("teacherId", "==", firebaseUser.uid));
        onSnapshot(slotsQuery, (snap) => {
          // Merge booking info into lessonSlots
        const slots = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<LessonSlot, "id">) }) as LessonSlot);
        // Attach booking info to slots
        setLessonSlots(slots.map(slot => ({
          id: typeof slot.id === "string" ? slot.id : "",
          date: typeof slot.date === "string" ? slot.date : "",
          time: typeof slot.time === "string" ? slot.time : "",
          teacherId: typeof slot.teacherId === "string" ? slot.teacherId : "",
          bookedStudentIds: Array.isArray(slot.bookedStudentIds) ? slot.bookedStudentIds : [],
          createdAt: slot.createdAt,
        })));
        });
        // No cleanup needed for onAuthStateChanged itself
      } catch {
        // Handle error if needed
      }
    });
    return () => {};
  }, [router]);

  useEffect(() => {
    if (profile) {
      // Only update local state if not currently editing that field
      setContactInfo((prev) => {
        if (!contactEdit) {
          return {
            email: profile?.email || "",
            phone: profile.phone || "",
          };
        }
        return prev;
      });
      if (!bioEdit) {
        setBio(typeof profile.bio === "string" ? profile.bio : "");
      }
      if (!siteTitleEdit) {
        setSiteTitle(typeof profile.siteTitle === "string" ? profile.siteTitle : "MUSIC LESSONS");
      }
      if (!siteTaglineEdit) {
        setSiteTagline(typeof profile.siteTagline === "string" ? profile.siteTagline : "Personalized. Professional. Powerful.");
      }
      if (!rateEdit) {
        setRate(typeof profile.rate === "number" ? profile.rate : 60);
        setRateInput(String(typeof profile.rate === "number" ? profile.rate : 60));
      }
    }
  }, [profile, contactEdit, bioEdit, siteTitleEdit, siteTaglineEdit, rateEdit]);

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
  function handleDeleteStudentClick(student: Student) {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  }

  // Confirm delete student
  async function confirmDeleteStudent() {
    if (!studentToDelete) return;
    setDeleteError("");
    setDeletingStudentId(studentToDelete.id);
    try {
      await updateDoc(doc(db, "users", studentToDelete.id), { deleted: true }); // Soft delete in DB
      setStudents(students => students.filter(s => s.id !== studentToDelete.id)); // Remove from local state
      setShowDeleteModal(false);
      setStudentToDelete(null);
    } catch (e: unknown) {
      setDeleteError((e instanceof Error && e.message) || "Failed to delete student.");
    } finally {
      setDeletingStudentId(null);
    }
  }

  // --- Update Rate, Site Title, Tagline, Bio and Sync to Main Site ---
  async function handleSaveProfileField(field: 'rate' | 'siteTitle' | 'siteTagline' | 'bio', value: string | number) {
    if (!user) return;
    try {
      // Always update the teacher's user doc, not the current user's doc
      // Find the teacher's UID (role === 'teacher') for ALL profile fields
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
      // All profile fields must only update the teacher doc, never the current user doc
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
        setRateLoading(false);
      } else if (field === 'siteTitle') {
        setSiteTitleLoading(true);
        setSiteTitleError("");
        setSiteTitleSuccess("");
        await updateDoc(doc(db, "users", teacherDoc.id), { siteTitle: value });
        setSiteTitle(value);
        setSiteTitleSuccess("Site title saved!");
        setSiteTitleEdit(false);
        setSiteTitleLoading(false);
        setProfile((prev) => prev ? { ...prev, siteTitle: value } : prev);
      } else if (field === 'siteTagline') {
        setSiteTaglineLoading(true);
        setSiteTaglineError("");
        setSiteTaglineSuccess("");
        await updateDoc(doc(db, "users", teacherDoc.id), { siteTagline: value });
        setSiteTagline(value);
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

