"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, where, DocumentData, addDoc, updateDoc, deleteDoc, onSnapshot, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

// --- Calendar Tab Helpers and Constants ---
// Used in Calendar tab rendering
const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// Only allow hour increments from 8:00 to 20:00 (8am to 8pm)
const timeOptions: { value: string; label: string }[] = Array.from({ length: 13 }, (_, i) => {
  const h = 8 + i;
  const value = `${h.toString().padStart(2, "0")}:00`;
  const label = `${((h % 12) || 12)}:00 ${h < 12 ? "AM" : "PM"}`;
  return { value, label };
});
const today = new Date();

function formatAvailability(slot: LessonSlot) {
  // slot.date is yyyy-mm-dd, slot.time is HH:mm
  const [year, month, day] = slot.date.split("-").map(Number);
  const [hour, minute] = slot.time.split(":").map(Number);
  const dateObj = new Date(year, month - 1, day, hour, minute);
  // Format: July 3 at 2 PM
  const monthName = dateObj.toLocaleString('default', { month: 'long' });
  const dayNum = dateObj.getDate();
  let hour12 = dateObj.getHours() % 12;
  if (hour12 === 0) hour12 = 12;
  const ampm = dateObj.getHours() < 12 ? 'AM' : 'PM';
  return `${monthName} ${dayNum} at ${hour12} ${ampm}`;
}

function getStudentInfo(slot: LessonSlot, students: Student[]) {
  if (!slot.bookedStudentIds || slot.bookedStudentIds.length === 0) return null;
  const names = slot.bookedStudentIds
    .map(id => {
      const s = students.find(stu => stu.id === id);
      return s ? `${s.firstName} ${s.lastName}` : id;
    })
    .join(", ");
  return `Booked by: ${names}`;
}

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

// Define Homework interface for type safety
interface Homework {
  id: string;
  title: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  studentId: string;
  teacherId: string;
  done: boolean;
}

const tabs = [
  "Students",
  "Upcoming",
  "Homework",
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
    case "Homework":
      return "📚";
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



// Add TeacherHomeworkTab component above main component so it is defined before use
function TeacherHomeworkTab({ students, teacherId, selectedStudentId, clearSelectedStudentId }: { students: Student[]; teacherId: string; selectedStudentId?: string; clearSelectedStudentId?: () => void }) {
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [listLoading, setListLoading] = useState(true);

  // Auto-hide success message after 3 seconds (Homework)
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  // Helper: today's date in YYYY-MM-DD
  const todayStr = new Date().toISOString().split("T")[0];

  // Fetch all homework assigned by this teacher
  useEffect(() => {
    let ignore = false;
    async function fetchHomework() {
      setListLoading(true);
      try {
        const q = query(collection(db, "homework"), where("teacherId", "==", teacherId));
        const snap = await getDocs(q);
        if (!ignore) {
          setHomeworkList(
            snap.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id ?? "", // Always a string
                title: data.title || '',
                description: data.description || '',
                assignedDate: data.assignedDate || '',
                dueDate: data.dueDate || '',
                studentId: data.studentId || '',
                teacherId: data.teacherId || '',
                done: typeof data.done === 'boolean' ? data.done : false,
              } as Homework;
            }).sort((a, b) => (b.assignedDate || '').localeCompare(a.assignedDate || ''))
          );
        }
      } catch {
        if (!ignore) setHomeworkList([]);
      }
      setListLoading(false);
    }
    fetchHomework();
    return () => { ignore = true; };
  }, [teacherId, success]);

  // Removed unused toggleDone function (was for marking homework as done/undone)

  // Delete homework handler
  async function handleDeleteHomework(hwId: string) {
    try {
      await deleteDoc(doc(db, "homework", hwId));
      setHomeworkList(list => list.filter(hw => hw.id !== hwId));
    } catch {
      // Optionally show error
    }
  }

  // Helper: calculate days left until due date
  function getDaysLeft(dueDate: string) {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    // Zero out time for both
    due.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    const diff = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff > 1) return `${diff} days left`;
    if (diff === 1) return `1 day left`;
    if (diff === 0) return `Due today`;
    if (diff === -1) return `Overdue by 1 day`;
    if (diff < -1) return `Overdue by ${Math.abs(diff)} days`;
    return null;
  }

  const handleAssign = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    // Prevent assigning to past due date
    if (!dueDate || dueDate < todayStr) {
      setError("Due date cannot be in the past.");
      setLoading(false);
      return;
    }
    try {
      await addDoc(collection(db, "homework"), {
        title,
        description,
        assignedDate: new Date().toISOString().split("T")[0],
        dueDate,
        studentId: selectedStudent,
        teacherId,
        done: false,
      });
      setSuccess("Homework assigned!");
      setTitle("");
      setDescription("");
      setDueDate("");
      setSelectedStudent("");
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Failed to assign homework.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper to get student name by id
  function getStudentName(id: string) {
    const s = students.find(stu => stu.id === id);
    return s ? `${s.firstName} ${s.lastName}` : "Unknown Student";
  }

  useEffect(() => {
    if (selectedStudentId) setSelectedStudent(selectedStudentId);
    if (selectedStudentId && clearSelectedStudentId) clearSelectedStudentId();
    // eslint-disable-next-line
  }, [selectedStudentId]);

  // Render JSX for the Homework tab
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent text-center flex items-center justify-center mb-4">
        📚 Assign Homework
      </h2>
      <div className="glass-effect p-6 rounded-2xl border border-white/20 mb-8 max-w-2xl mx-auto">
        <h3 className="text-xl font-bold text-white mb-4">Add Homework</h3>
        <form onSubmit={e => { e.preventDefault(); handleAssign(); }} className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <div className="flex-1">
              <label className="block text-purple-200 mb-1 font-medium">Student</label>
              <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} className="w-full p-2 rounded bg-slate-800 border border-white/20 text-white" required>
                <option value="">Select Student</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{getStudentName(s.id)}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-purple-200 mb-1 font-medium">Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="w-full p-2 rounded bg-slate-800 border border-white/20 text-white" required />
            </div>
            <div className="flex-1">
              <label className="block text-purple-200 mb-1 font-medium">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} min={todayStr} className="w-full p-2 rounded bg-slate-800 border border-white/20 text-white" required />
            </div>
          </div>
          <div>
            <label className="block text-purple-200 mb-1 font-medium">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description"
              rows={2}
              className="w-full p-2 rounded bg-slate-800 border border-white/20 text-white resize-none"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="mt-2 py-2 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-indigo-500 hover:bg-indigo-700 transition disabled:opacity-60 self-end md:self-start w-full md:w-auto">
            {loading ? "Assigning..." : "Add Homework"}
          </button>
        </form>
        {error && <div className="text-red-400 font-medium mt-2">{error}</div>}
        {success && <div className="text-green-400 font-medium mt-2">{success}</div>}
      </div>
      <div className="mt-8">
        <h3 className="text-xl font-bold text-white mb-4">Assigned</h3>
        {listLoading ? (
          <div className="text-purple-200">Loading...</div>
        ) : homeworkList.length === 0 ? (
          <div className="text-purple-200">No homework assigned yet.</div>
        ) : (
          <ul className="space-y-2">
            {homeworkList.map(hw => (
              <li key={hw.id} className="flex flex-col md:flex-row md:items-center justify-between bg-white/10 rounded-xl p-4 text-white relative group border-2 border-transparent">
                <div>
                  <div className="font-bold text-lg">{hw.title}</div>
                  <div className="text-purple-200 text-sm">{hw.description}</div>
                  <div className="text-purple-200 text-xs">Due: {hw.dueDate} ({getDaysLeft(hw.dueDate)})</div>
                  <div className="text-purple-200 text-xs">Student: {getStudentName(hw.studentId)}</div>
                </div>
                <div className="flex gap-2 mt-2 md:mt-0 items-center">
                  <span className={`px-4 py-2 rounded-xl font-medium shadow-lg text-white ${hw.done ? 'bg-green-500' : 'bg-slate-700'}`}>{hw.done ? 'Completed' : 'Not Completed'}</span>
                  <button onClick={() => handleDeleteHomework(hw.id)} className="px-4 py-2 rounded-xl font-medium shadow-lg bg-gradient-to-r from-red-500 to-pink-500 text-white">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}




// --- Calendar/Book Tab Helpers ---
// Removed unused getCurrentWeekSunday helper
// ...existing code...

// --- Practice Streak Helpers ---
// ...existing code...

// --- Interfaces ---
interface LessonSlot {
  id: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:mm or HH:mm:ss
  bookedStudentIds?: string[];
  [key: string]: unknown;
}
// ...existing code...


export default function TeacherDashboard() {
  // --- All state and refs at the top ---
  const [lessonSlots, setLessonSlots] = useState<LessonSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [slotForm, setSlotForm] = useState({ startDate: "", endDate: "", startTime: "", endTime: "", daysOfWeek: [] as number[] });
  const [contactInfo, setContactInfo] = useState({ email: "", phone: "" });
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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DocumentData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [rateSuccess, setRateSuccess] = useState("");
  const [rate, setRate] = useState<number>(profile?.rate ?? 60);
  const [rateEdit, setRateEdit] = useState(false);
  const [rateInput, setRateInput] = useState<string>(String(profile?.rate ?? 60));
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState("");
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotError, setSlotError] = useState("");
  const [sessionSort, setSessionSort] = useState("date");
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [studentView, setStudentView] = useState<'card' | 'list'>('card');
  const [studentSort, setStudentSort] = useState('az');
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [cancelModal, setCancelModal] = useState<{ open: boolean; booking?: Booking }>({ open: false });
  const [actionLoading, setActionLoading] = useState(false);
  const [bio, setBio] = useState<string>(profile?.bio ?? "");
  const [bioEdit, setBioEdit] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const [bioError, setBioError] = useState("");
  const [bioSuccess, setBioSuccess] = useState("");
  const [siteTitleEdit, setSiteTitleEdit] = useState(false);
  const [siteTitle, setSiteTitle] = useState(profile?.siteTitle ?? "MUSIC LESSONS");
  const [siteTitleLoading, setSiteTitleLoading] = useState(false);
  const [siteTitleError, setSiteTitleError] = useState("");
  const [siteTitleSuccess, setSiteTitleSuccess] = useState("");
  const [siteTaglineEdit, setSiteTaglineEdit] = useState(false);
  const [siteTagline, setSiteTagline] = useState(profile?.siteTagline ?? "Personalized. Professional. Powerful.");
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
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 max-w-screen overflow-x-hidden">
      {/* Sidebar Navigation - responsive, now with dashboard title at the top */}
      <aside className="hidden md:flex flex-col gap-3 pl-6 pr-4 py-6 min-w-[200px] max-w-[260px] fixed top-0 left-0 z-40 h-full bg-gradient-to-b from-slate-900/80 to-purple-900/60 border-r border-purple-900/40 shadow-xl" style={{ height: '100vh' }}>
        <div className="mb-6 mt-2 flex flex-col items-center">
          <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent text-center flex items-center justify-center">
            🎵 Teacher Dashboard
          </h1>
          <p className="hidden xs:block text-xs xs:text-sm sm:text-base text-purple-100 text-center mt-1">
            Welcome, {profile?.firstName ? `${profile.firstName} ${profile.lastName}` : user?.email ?? ""}
          </p>
        </div>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-2 py-2 rounded-xl font-semibold text-sm lg:text-base transition-all duration-200 text-left shadow-md ${
              activeTab === tab
                ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25"
                : "glass-effect text-white hover:bg-white/20"
            }`}
            style={{ width: '100%' }}
          >
            <span className="text-xl lg:text-2xl">{getTabIcon(tab)}</span>
            <span className="hidden sm:inline">{tab}</span>
          </button>
        ))}
      </aside>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col w-full min-w-0 max-w-screen overflow-x-hidden md:pl-[260px]">
        {/* Main Content (Tab Content) */}
        <div className="flex-1 flex flex-col w-full p-2 xs:p-4 sm:p-6 md:p-10 min-w-0 max-w-screen overflow-x-hidden pt-[30px] xs:pt-[40px] sm:pt-[50px] pb-[80px] xs:pb-[100px] sm:pb-[130px]"> {/* Add top and bottom padding for fixed header and nav */}
          {/* Bottom Navigation Bar for Mobile/Tablet (md and below) */}
          <nav
            className="fixed left-0 bottom-0 w-full z-50 flex md:hidden bg-gradient-to-t from-slate-900/95 to-slate-900/80 border-t border-purple-900/40 shadow-2xl h-16 xs:h-20 sm:h-24 rounded-t-2xl m-0 p-0"
            style={{ margin: 0, padding: 0 }}
          >
            {["Students", "Upcoming", "Homework", "Calendar", "Finance", "Settings"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 flex flex-col items-center justify-center py-2 xs:py-3 sm:py-4 text-2xl xs:text-3xl sm:text-4xl transition-all duration-200 relative ${activeTab === tab ? "text-indigo-400" : "text-purple-200 hover:text-indigo-300"}`}
                aria-label={tab}
                style={{ minWidth: 0 }}
              >
                <span className={`mb-0 flex items-center justify-center w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 ${activeTab === tab ? "bg-gradient-to-t from-indigo-900/60 to-slate-900/80 rounded-2xl shadow-lg" : ""}`}>{getTabIcon(tab)}</span>
                {/* Hide tab text on mobile, show only on xs+ screens */}
                <span className="hidden xs:inline text-[11px] xs:text-xs sm:text-sm mt-0.5">{tab}</span>
              </button>
            ))}
          </nav>
          {/* Tab Content */}
          <div className="glass-effect p-1 xs:p-2 sm:p-4 md:p-8 lg:p-12 xl:p-16 rounded-2xl shadow-2xl min-h-[300px] xs:min-h-[400px] sm:min-h-[500px] animate-fadeIn overflow-y-auto w-full flex flex-col items-center max-w-screen overflow-x-hidden pb-[90px] xs:pb-[110px] sm:pb-[130px] lg:max-w-7xl xl:max-w-8xl mx-auto">
            {/* Students Tab */}
            {activeTab === "Students" && (
              <div className="space-y-6 pt-4 xs:pt-6 sm:pt-8 w-full max-w-full lg:max-w-4xl xl:max-w-5xl mx-auto">
                {/* Standardized header */}
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent text-center flex items-center justify-center mb-4">
                  👥 Students
                </h2>
                {/* Card/List View Toggle and Sorting Controls - INLINE ON DESKTOP */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 xs:gap-4 mb-4 w-full">
                  <div className="flex gap-2 xs:gap-3 justify-center items-center w-full md:w-auto">
                    <button
                      className={`px-2 xs:px-3 py-1 md:px-2 md:py-1 rounded-lg text-xs xs:text-sm md:text-base font-semibold transition-colors duration-200 ${studentView === 'card' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-purple-200 border border-white/20'}`}
                      onClick={() => setStudentView('card')}
                    >
                      <span className="inline xs:hidden">🗂️</span><span className="hidden xs:inline">🗂️ Card View</span>
                    </button>
                    <button
                      className={`px-2 xs:px-3 py-1 md:px-2 md:py-1 rounded-lg text-xs xs:text-sm md:text-base font-semibold transition-colors duration-200 ${studentView === 'list' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-purple-200 border border-white/20'}`}
                      onClick={() => setStudentView('list')}
                    >
                      <span className="inline xs:hidden">📋</span><span className="hidden xs:inline">📋 List View</span>
                    </button>
                  </div>
                  <div className="flex gap-2 xs:gap-3 justify-center items-center w-full md:w-auto mt-1 md:mt-0">
                    <select
                      value={studentSort}
                      onChange={e => setStudentSort(e.target.value)}
                      className="p-1 xs:p-2 md:p-2 rounded bg-slate-800 border border-white/20 text-white text-xs xs:text-sm md:text-base"
                    >
                      <option value="az">A-Z</option>
                      <option value="progress">Progress</option>
                      <option value="age">Age</option>
                      <option value="level">Level</option>
                    </select>
                  </div>
                </div>
                {deleteError && <div className="text-red-400 font-medium mb-2 text-xs xs:text-sm md:text-base">{deleteError}</div>}
                {sortedStudents.length === 0 ? (
                  <p className="text-purple-200 text-xs xs:text-sm md:text-base">No students found.</p>
                ) : (
                  studentView === 'card' ? (
                    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-2 gap-2 xs:gap-4 md:gap-6 w-full">
                      {sortedStudents.map((student) => (
                        <div key={student.id} className="glass-effect rounded-2xl p-2 xs:p-4 md:p-6 border border-white/20 w-full max-w-full flex flex-col justify-center">
                          <div className="flex flex-col items-center gap-1 xs:gap-2 md:gap-4 md:flex-row md:items-center">
                            <div className="w-10 h-10 xs:w-16 xs:h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-base xs:text-xl md:text-2xl text-white font-bold">
                              {student.firstName?.[0]}{student.lastName?.[0]}
                            </div>
                            <div className="flex-1 w-full min-w-0">
                              <h3 className="text-base xs:text-lg md:text-xl font-bold text-white mb-1 text-center md:text-left">{student.firstName} {student.lastName}</h3>
                              <div className="flex flex-wrap gap-1 xs:gap-2 md:gap-3 justify-center md:justify-start text-purple-200 text-xs xs:text-sm md:text-base mb-2 xs:mb-3">
                                <span>🎯 {student.skillLevel || '-'}</span>
                                <span>🎂 {student.dob ? getAge(student.dob) + ' yrs' : '-'}</span>
                                <span>📈 {student.progress ?? 0}%</span>
                              </div>
                              <div className="mb-2 xs:mb-4 md:mb-5">
                                <div className="w-full bg-white/20 rounded-full h-1 xs:h-2 md:h-3 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all duration-500 shadow-lg"
                                    style={{ width: `${student.progress || 0}%` }}
                                  />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1 xs:gap-2 md:flex-row">
                                <button
                                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-400 text-white px-1 xs:px-2 md:px-3 py-1 rounded-xl text-xs xs:text-sm md:text-base font-bold shadow-lg"
                                  onClick={() => { setActiveTab('Homework'); setSelectedStudentId(student.id); }}
                                  type="button"
                                >
                                  <span className="inline xs:hidden">📚</span><span className="hidden xs:inline bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">📚 Assign Homework</span>
                                </button>
                                {/* Notes button removed as per user request */}
                                <button
                                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white px-1 xs:px-2 md:px-3 py-1 rounded-xl text-xs xs:text-sm md:text-base font-medium shadow-lg"
                                  onClick={() => handleDeleteStudentClick(student)}
                                  type="button"
                                >
                                  <span className="inline xs:hidden">🗑️</span><span className="hidden xs:inline">🗑️ Delete</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1 xs:gap-2 md:gap-3 w-full">
                      {sortedStudents.map(student => (
                        <div key={student.id} className="glass-effect rounded-2xl border border-white/20 px-1 xs:px-2 md:px-4 py-1 xs:py-2 md:py-3 flex items-center gap-1 xs:gap-2 md:gap-4 w-full max-w-2xl mx-auto">
                          <div className="w-8 h-8 xs:w-10 xs:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-xs xs:text-base md:text-lg text-white font-bold">
                            {student.firstName?.[0]}{student.lastName?.[0]}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="font-bold text-white text-xs xs:text-sm md:text-base truncate">{student.firstName} {student.lastName}</div>
                            <div className="flex flex-wrap gap-1 xs:gap-2 md:gap-3 text-purple-200 text-[10px] xs:text-xs md:text-sm mt-1">
                              <span>🎯 {student.skillLevel || '-'}</span>
                              <span>🎂 {student.dob ? getAge(student.dob) + ' yrs' : '-'}</span>
                              <span>📈 {student.progress ?? 0}%</span>
                            </div>
                            <div className="w-full bg-white/20 rounded-full h-0.5 xs:h-1 md:h-2 mt-1 xs:mt-2 md:mt-3">
                              <div
                                className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all duration-500 shadow-lg"
                                style={{ width: `${student.progress || 0}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-0.5 xs:gap-1 md:gap-2 min-w-[60px] xs:min-w-[80px] md:min-w-[110px]">
                            <button
                              className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-0.5 xs:px-1 md:px-2 py-0.5 xs:py-1 md:py-2 rounded-xl text-[10px] xs:text-xs md:text-sm font-medium shadow-lg"
                              onClick={() => { setActiveTab('Homework'); setSelectedStudentId(student.id); }}
                            >
                              <span className="inline xs:hidden">📚</span><span className="hidden xs:inline">📚</span>
                            </button>
                            {/* Notes button removed as per user request */}
                            <button
                              className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-0.5 xs:px-1 md:px-2 py-0.5 xs:py-1 md:py-2 rounded-xl text-[10px] xs:text-xs md:text-sm font-medium shadow-lg"
                              onClick={() => handleDeleteStudentClick(student)}
                              type="button"
                            >
                              <span className="inline xs:hidden">🗑️</span><span className="hidden xs:inline">🗑️</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
                {/* Delete Student Modal */}
                {showDeleteModal && studentToDelete && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 rounded-3xl shadow-2xl max-w-md w-full relative animate-fadeIn">
                      <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                        <span>🗑️</span> Delete Student
                      </h3>
                      <p className="text-purple-200 mb-6">Are you sure you want to delete <span className="font-bold text-white">{studentToDelete.firstName} {studentToDelete.lastName}</span>? This cannot be undone.</p>
                      <div className="flex flex-col items-center w-full">
                        <div className="flex gap-4 justify-center w-full">
                          <button
                            className="px-5 py-2 rounded-xl font-semibold bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:bg-slate-700 transition"
                            onClick={() => { setShowDeleteModal(false); setStudentToDelete(null); }}
                            disabled={deletingStudentId === studentToDelete.id}
                          >
                            Cancel
                          </button>
                          <button
                            className="px-5 py-2 rounded-xl font-semibold bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg disabled:opacity-60"
                            onClick={confirmDeleteStudent}
                            disabled={deletingStudentId === studentToDelete.id}
                          >
                            {deletingStudentId === studentToDelete.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Upcoming Tab */}
            {activeTab === "Upcoming" && (
              <div className="space-y-6 pt-4 xs:pt-6 sm:pt-8 w-full max-w-full lg:max-w-3xl xl:max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent text-center flex items-center justify-center mb-4">
                  ⏰ Upcoming Lessons
                </h2>
                {bookings.length === 0 ? (
                  <p className="text-purple-200">No upcoming lessons.</p>
                ) : (
                  <div className="space-y-4">
                    {[...bookings]
                      .filter(b => new Date(b.date + ' ' + b.time) > new Date())
                      .sort((a, b) => new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime())
                      .map(booking => (
                        <div key={booking.id} className="p-4 sm:p-5 rounded-xl border-l-4 bg-gradient-to-r from-slate-800 via-purple-900 to-slate-900 border-purple-600 shadow-lg text-white">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                <h4 className="text-lg sm:text-xl font-bold text-white">{`Lesson on ${new Date(booking.date + ' ' + booking.time).toLocaleString()}`}</h4>
                              </div>
                              <p className="text-purple-200 text-sm sm:text-base mb-3 leading-relaxed">{`Duration: ${booking.length || 60} minutes`}</p>
                              <div className="flex flex-col sm:flex-row gap-2 text-xs sm:text-sm text-purple-300">
                                <span><strong>Student:</strong> {students.find(s => s.id === booking.studentId)?.firstName || 'Unknown'} {students.find(s => s.id === booking.studentId)?.lastName || ''}</span>
                                <span><strong>Status:</strong> {booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Booked'}</span>
                                <span><strong>Rate:</strong> {typeof booking.rate === 'number' ? `$${booking.rate}/lesson` : <span className="text-red-400">N/A</span>}</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 min-w-[120px] items-end">
                              <button
                                className="px-4 py-2 rounded-lg font-bold text-xs shadow bg-red-400 text-white hover:bg-red-600 transition"
                                onClick={() => setCancelModal({ open: true, booking })}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
                {/* Cancel Confirmation Modal */}
                {cancelModal.open && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                      <h3 className="text-xl font-bold mb-4 text-red-700">Cancel Lesson?</h3>
                      <p className="mb-4 text-gray-700">Are you sure you want to cancel this lesson? This cannot be undone.</p>
                      <div className="mb-4 font-semibold text-gray-800">
                        {cancelModal.booking && new Date(cancelModal.booking.date + ' ' + cancelModal.booking.time).toLocaleString()}
                      </div>
                      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6">
                        <button
                          className="px-6 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg"
                          onClick={async () => {
                            if (!cancelModal.booking) return;
                            setActionLoading(true);
                            try {
                              const firestore = await import("firebase/firestore");
                              await firestore.deleteDoc(firestore.doc(collection(db, "bookings"), cancelModal.booking.id));
                              const slotRef = firestore.doc(collection(db, "lessonSlots"), cancelModal.booking.slotId);
                              await firestore.updateDoc(slotRef, {
                                bookedStudentIds: firestore.arrayRemove(cancelModal.booking.studentId)
                              });
                              setCancelModal({ open: false });
                            } catch {
                              // Optionally show error
                            }
                            setActionLoading(false);
                          }}
                          disabled={actionLoading}
                        >
                          {actionLoading ? 'Cancelling...' : 'Yes, Cancel'}
                        </button>
                        <button
                          onClick={() => setCancelModal({ open: false })}
                          className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
                          disabled={actionLoading}
                        >
                          No, Go Back
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Homework Tab */}
            {activeTab === "Homework" && (
              <TeacherHomeworkTab
                students={students}
                teacherId={user?.uid || ""}
                selectedStudentId={selectedStudentId}
                clearSelectedStudentId={() => setSelectedStudentId("")}
              />
            )}
            {/* Notes Tab fully removed as per user request */}
            {/* Calendar Tab */}
            {activeTab === "Calendar" && (
              <div className="space-y-6 pt-4 xs:pt-6 sm:pt-8 w-full max-w-full lg:max-w-4xl xl:max-w-5xl mx-auto">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent text-center flex items-center justify-center mb-4">📅 Calendar</h2>
                {/* Add Availability Form */}
                <div className="glass-effect p-6 lg:p-10 xl:p-14 rounded-2xl border border-white/20 mb-8 w-full max-w-full lg:max-w-3xl xl:max-w-4xl mx-auto">
                  <h3 className="text-xl font-bold text-white mb-4">Add Availability</h3>
                  <form onSubmit={handleAddSlot} className="flex flex-col gap-4 w-full">
                    <div className="flex flex-col md:flex-row gap-4 w-full">
                      <div className="flex-1">
                        <label className="block text-purple-200 mb-1 font-medium">Start Date</label>
                        <input type="date" value={slotForm.startDate} min={today.toISOString().split('T')[0]} onChange={e => setSlotForm(f => ({ ...f, startDate: e.target.value }))} className="w-full p-2 rounded bg-slate-800 border border-white/20 text-white" required />
                      </div>
                      <div className="flex-1">
                        <label className="block text-purple-200 mb-1 font-medium">End Date <span className="text-purple-300 text-xs">(optional for single date)</span></label>
                        <input type="date" value={slotForm.endDate} min={slotForm.startDate || today.toISOString().split('T')[0]} onChange={e => setSlotForm(f => ({ ...f, endDate: e.target.value }))} className="w-full p-2 rounded bg-slate-800 border border-white/20 text-white" />
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 w-full">
                      <div className="flex-1">
                        <label className="block text-purple-200 mb-1 font-medium">Days of Week</label>
                        <div className="flex flex-row flex-wrap gap-2 p-0 m-0">
                          {weekdayNames.map((day: string, idx: number) => (
                            <button
                              type="button"
                              key={day}
                              className={`px-2 py-1 rounded-lg border text-sm font-semibold ${slotForm.daysOfWeek.includes(idx) ? "bg-purple-500 text-white" : "bg-slate-800 text-purple-200 border-white/20"}`}
                              onClick={() => setSlotForm(f => ({ ...f, daysOfWeek: f.daysOfWeek.includes(idx) ? f.daysOfWeek.filter(d => d !== idx) : [...f.daysOfWeek, idx] }))}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col gap-4 md:gap-0 md:flex-row">
                        <div className="flex-1">
                          <label className="block text-purple-200 mb-1 font-medium">Start Time</label>
                          <select
                            value={slotForm.startTime}
                            onChange={e => setSlotForm(f => ({ ...f, startTime: e.target.value }))}
                            className="w-full p-2 rounded bg-slate-800 border border-white/20 text-white"
                            required
                          >
                            <option value="">Start time</option>
                            {timeOptions.map((t) => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="block text-purple-200 mb-1 font-medium">End Time</label>
                          <select
                            value={slotForm.endTime}
                            onChange={e => setSlotForm(f => ({ ...f, endTime: e.target.value }))}
                            className="w-full p-2 rounded bg-slate-800 border border-white/20 text-white"
                            required
                          >
                            <option value="">End time</option>
                            {timeOptions.map((t) => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    <button type="submit" disabled={slotLoading} className="mt-2 py-2 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-indigo-500 hover:bg-indigo-700 transition disabled:opacity-60 self-end md:self-start w-full md:w-auto">
                      {slotLoading ? "Adding..." : "Add Availability"}
                    </button>
                  </form>
                  {slotError && <div className="text-red-400 font-medium mt-2">{slotError}</div>}
                  {slotSuccess && <div className="text-green-400 font-medium mt-2">{slotSuccess}</div>}
                </div>
                {/* Sorting Controls moved into Available Times box */}
                {/* Availability List with multi-select and bulk delete */}
                <div className="glass-effect p-6 lg:p-10 xl:p-14 rounded-2xl border border-white/20 mb-8 w-full max-w-full lg:max-w-3xl xl:max-w-4xl mx-auto">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <h3 className="text-xl font-bold text-white">Available Times</h3>
                    <select
                      value={sessionSort}
                      onChange={e => setSessionSort(e.target.value)}
                      className="p-2 rounded bg-slate-800 border border-white/20 text-white w-full sm:w-auto"
                    >
                      <option value="date">Date</option>
                    </select>
                  </div>
                  {lessonSlots.length === 0 ? (
                  <p className="text-purple-200">No available times yet.</p>
                ) : (
                  <>
                    <div className="mb-4 flex flex-wrap gap-4 items-center">
                      <button
                        className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-2 rounded-xl font-medium shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-60"
                        disabled={selectedSessionIds.length === 0}
                        onClick={() => setShowBulkDeleteModal(true)}
                        type="button"
                      >
                        Delete Selected ({selectedSessionIds.length})
                      </button>
                {/* Bulk Delete Confirmation Modal */}
                {showBulkDeleteModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                      <h3 className="text-xl font-bold mb-4 text-red-700">Delete Selected Slots?</h3>
                      <p className="mb-4 text-gray-700">Are you sure you want to delete <b>{selectedSessionIds.length}</b> selected slot{selectedSessionIds.length !== 1 ? 's' : ''}? This cannot be undone.</p>
                      <div className="flex justify-end mt-6">
                        <button
                          className="px-6 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg"
                          onClick={async () => {
                            setBulkDeleteLoading(true);
                            await Promise.all(selectedSessionIds.map(async (id) => {
                              await deleteDoc(doc(db, "lessonSlots", id));
                            }));
                            setLessonSlots(slots => slots.filter(s => !selectedSessionIds.includes(s.id ?? "")));
                            setSelectedSessionIds([]);
                            setShowBulkDeleteModal(false);
                            setBulkDeleteLoading(false);
                          }}
                          disabled={bulkDeleteLoading}
                        >
                          {bulkDeleteLoading ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                        <button
                          onClick={() => setShowBulkDeleteModal(false)}
                          className="ml-4 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
                          disabled={bulkDeleteLoading}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                      {selectedSessionIds.length > 0 && (
                        <button
                          className="ml-2 px-4 py-2 rounded-xl font-medium bg-slate-700 text-white hover:bg-slate-800 transition-all duration-200"
                          onClick={() => setSelectedSessionIds([])}
                          type="button"
                        >
                          Clear Selection
                        </button>
                      )}
                    </div>
                    <ul className="space-y-2">
                      {sortedSessions.map(slot => {
                        // Find bookings for this slot
                        const slotBookings = bookings.filter(b => b.slotId === slot.id);
                        const isBooked = slotBookings.length > 0;
                        return (
                          <li
                            key={slot.id}
                            className={`flex flex-col md:flex-row md:items-center justify-between bg-white/10 rounded-xl p-4 text-white relative group border-2 transition-all duration-200 ${selectedSessionIds.includes(slot.id ?? "") ? 'border-pink-400 bg-pink-900/20' : 'border-transparent'}`}
                            onClick={() => {
                              if (!slot.id) return;
                              setSelectedSessionIds(ids =>
                                ids.includes(slot.id!)
                                  ? ids.filter(id => id !== slot.id)
                                  : [...ids, slot.id!]
                              );
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            <div>
                              <div className="font-bold text-lg">{formatAvailability(slot)}</div>
                              <div className="text-purple-200 text-sm">
                                {getStudentInfo(slot, students)}
                                {isBooked && (
                                  <span className="ml-2 px-2 py-1 rounded bg-green-600 text-white text-xs font-bold">Booked</span>
                                )}
                              </div>
                            </div>
                            {selectedSessionIds.includes(slot.id ?? "") && (
                              <span className="ml-4 mt-4 md:mt-0 px-4 py-2 rounded-xl font-medium bg-pink-500 text-white shadow-lg">Selected</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
                </div>
              </div>
            )}

            {/* Finance Tab (NEW, after Calendar) */}
            {activeTab === "Finance" && (
              <div className="space-y-6 pt-4 xs:pt-6 sm:pt-8 w-full max-w-full lg:max-w-4xl xl:max-w-5xl mx-auto">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent text-center flex items-center justify-center mb-4">
                  💵 Finance
                </h2>
                {/* Rate Settings Box moved here */}
                <div className="glass-effect p-8 rounded-2xl border border-white/20 w-full max-w-full lg:max-w-2xl xl:max-w-3xl mx-auto text-center mb-8">
                  <h3 className="text-xl font-bold text-white mb-4">Lesson Rate</h3>
                  {!rateEdit ? (
                    <div className="flex items-center gap-4 justify-center">
                      <span className="text-white text-lg">${rate}/lesson</span>
                      <button
                        className="ml-2 px-4 py-1 rounded-xl font-medium bg-slate-700 text-white hover:bg-slate-800 transition-all duration-200"
                        onClick={() => setRateEdit(true)}
                        type="button"
                      >
                        Edit
                      </button>
                    </div>
                  ) : (
                    <form
                      className="flex flex-col gap-2 items-center"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const parsed = parseFloat(rateInput);
                        if (isNaN(parsed) || parsed <= 0) {
                          setRateError("Please enter a valid rate.");
                          return;
                        }
                        await handleSaveProfileField('rate', parsed);
                        setRateEdit(false);
                      }}
                    >
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className="w-32 p-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-center"
                        placeholder="Rate"
                        value={rateInput}
                        onChange={e => setRateInput(e.target.value)}
                        disabled={rateLoading}
                      />
                      <div className="flex gap-2 mt-2 justify-center">
                        <button
                          type="submit"
                          className="px-4 py-1 rounded-xl font-medium bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:bg-indigo-700 transition-all duration-200 disabled:opacity-60"
                          disabled={rateLoading}
                        >
                          {rateLoading ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          className="px-4 py-1 rounded-xl font-medium bg-slate-700 text-white hover:bg-slate-800 transition-all duration-200"
                          onClick={() => { setRateEdit(false); setRateInput(String(rate)); setRateError(""); }}
                          disabled={rateLoading}
                        >
                          Cancel
                        </button>
                      </div>
                      {rateError && <div className="text-red-400 font-medium mt-2">{rateError}</div>}
                      {rateSuccess && <div className="text-green-400 font-medium mt-2">{rateSuccess}</div>}
                    </form>
                  )}
                </div>
                {/* Placeholder for future finance dashboard features */}
                <div className="glass-effect p-8 rounded-2xl border border-white/20 w-full max-w-full lg:max-w-2xl xl:max-w-3xl mx-auto text-center">
                  <p className="text-purple-200 text-lg">Finance dashboard coming soon.</p>
                </div>
              </div>
            )}
            {/* Settings Tab */}
            {activeTab === "Settings" && (
              <div className="space-y-8 pt-4 xs:pt-6 sm:pt-8 pb-12 xs:pb-16 sm:pb-20 w-full max-w-full lg:max-w-3xl xl:max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent text-center flex items-center justify-center mb-4">
                  ⚙️ Settings
                </h2>
                {/* Profile Section */}
                <div className="glass-effect p-6 lg:p-10 xl:p-14 rounded-2xl border border-white/20 w-full max-w-full lg:max-w-2xl xl:max-w-3xl mx-auto">
                  <h3 className="text-xl font-bold text-white mb-6">👤 Personal Profile</h3>
                  {/* Profile visual removed, keep only bio section */}
                  <div className="mb-6"></div>
                  {/* Editable Site Title */}
                  <div className="flex-1 mb-6">
                    <label className="block text-purple-200 mb-2 font-medium">Site Title</label>
                    {!siteTitleEdit ? (
                      <div className="flex items-center gap-4">
                        <span className="text-white text-base">{siteTitle}</span>
                        <button
                          className="ml-2 px-4 py-1 rounded-xl font-medium bg-slate-700 text-white hover:bg-slate-800 transition-all duration-200"
                          onClick={() => setSiteTitleEdit(true)}
                          type="button"
                        >
                          Edit
                        </button>
                      </div>
                    ) : (
                      <form
                        className="flex flex-col gap-2"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          await handleSaveProfileField('siteTitle', siteTitle);
                        }}
                      >
                        <input
                          type="text"
                          className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="MUSIC LESSONS"
                          value={siteTitle}
                          onChange={e => setSiteTitle(e.target.value)}
                          disabled={siteTitleLoading}
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            type="submit"
                            className="px-5 py-2 rounded-xl font-semibold bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg disabled:opacity-60"
                            disabled={siteTitleLoading}
                          >
                            {siteTitleLoading ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            className="px-5 py-2 rounded-xl font-semibold bg-slate-600 text-white hover:bg-slate-700 transition"
                            onClick={() => { setSiteTitleEdit(false); setSiteTitle(profile?.siteTitle ?? "MUSIC LESSONS"); setSiteTitleError(""); }}
                            disabled={siteTitleLoading}
                          >
                            Cancel
                          </button>
                        </div>
                        {siteTitleError && <div className="text-red-400 font-medium mt-2">{siteTitleError}</div>}
                        {siteTitleSuccess && <div className="text-green-400 font-medium mt-2">{siteTitleSuccess}</div>}
                      </form>
                    )}
                  </div>
                  {/* Editable Site Tagline */}
                  <div className="flex-1 mb-6">
                    <label className="block text-purple-200 mb-2 font-medium">Site Tagline</label>
                    {!siteTaglineEdit ? (
                      <div className="flex items-center gap-4">
                        <span className="text-white text-base">{siteTagline}</span>
                        <button
                          className="ml-2 px-4 py-1 rounded-xl font-medium bg-slate-700 text-white hover:bg-slate-800 transition-all duration-200"
                          onClick={() => setSiteTaglineEdit(true)}
                          type="button"
                        >
                          Edit
                        </button>
                      </div>
                    ) : (
                      <form
                        className="flex flex-col gap-2"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          await handleSaveProfileField('siteTagline', siteTagline);
                        }}
                      >
                        <input
                          type="text"
                          className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Personalized. Professional. Powerful."
                          value={siteTagline}
                          onChange={e => setSiteTagline(e.target.value)}
                          disabled={siteTaglineLoading}
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            type="submit"
                            className="px-5 py-2 rounded-xl font-semibold bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg disabled:opacity-60"
                            disabled={siteTaglineLoading}
                          >
                            {siteTaglineLoading ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            className="px-5 py-2 rounded-xl font-semibold bg-slate-600 text-white hover:bg-slate-700 transition"
                            onClick={() => { setSiteTaglineEdit(false); setSiteTagline(profile?.siteTagline ?? "Personalized. Professional. Powerful."); setSiteTaglineError(""); }}
                            disabled={siteTaglineLoading}
                          >
                            Cancel
                          </button>
                        </div>
                        {siteTaglineError && <div className="text-red-400 font-medium mt-2">{siteTaglineError}</div>}
                        {siteTaglineSuccess && <div className="text-green-400 font-medium mt-2">{siteTaglineSuccess}</div>}
                      </form>
                    )}
                  </div>
                  {/* Bio Section */}
                  <div className="flex-1">
                    <label className="block text-purple-200 mb-2 font-medium">Bio</label>
                    {!bioEdit ? (
                      <div className="flex items-center gap-4">
                        <span className="text-white text-base">{bio?.trim() ? bio : "Teacher Bio Here"}</span>
                        <button
                          className="ml-2 px-4 py-1 rounded-xl font-medium bg-slate-700 text-white hover:bg-slate-800 transition-all duration-200"
                          onClick={() => setBioEdit(true)}
                          type="button"
                        >
                          Edit
                        </button>
                      </div>
                    ) : (
                      <form
                        className="flex flex-col gap-2"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          await handleSaveProfileField('bio', bio);
                        }}
                      >
                        <textarea
                          rows={3}
                          className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                          placeholder="Tell your students about yourself..."
                          value={bio}
                          onChange={e => setBio(e.target.value)}
                          disabled={bioLoading}
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            type="submit"
                            className="px-5 py-2 rounded-xl font-semibold bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg disabled:opacity-60"
                            disabled={bioLoading}
                          >
                            {bioLoading ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            className="px-5 py-2 rounded-xl font-semibold bg-slate-600 text-white hover:bg-slate-700 transition"
                            onClick={() => { setBioEdit(false); setBio(profile?.bio || ""); setBioError(""); }}
                            disabled={bioLoading}
                          >
                            Cancel
                          </button>
                        </div>
                        {bioError && <div className="text-red-400 font-medium mt-2">{bioError}</div>}
                        {bioSuccess && <div className="text-green-400 font-medium mt-2">{bioSuccess}</div>}
                      </form>
                    )}
                  </div>
                </div>
                {/* Contact Info */}
                <div className="glass-effect p-6 lg:p-10 xl:p-14 rounded-2xl border border-white/20 w-full max-w-full lg:max-w-2xl xl:max-w-3xl mx-auto">
                  <h3 className="text-xl font-bold text-white mb-6">📞 Contact Information</h3>
                  {!contactEdit ? (
                    <div className="grid lg:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-purple-200 mb-2 font-medium">📧 Email</label>
                        <div className="flex items-center gap-2">
                          <span className="text-white">{contactInfo.email || <span className="italic text-purple-300">Not set</span>}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-purple-200 mb-2 font-medium">📱 Phone</label>
                        <div className="flex items-center gap-2">
                          <span className="text-white">{contactInfo.phone || <span className="italic text-purple-300">Not set</span>}</span>
                        </div>
                      </div>
                      <div className="lg:col-span-2 flex gap-2 mt-4">
                        <button
                          className="px-5 py-2 rounded-xl font-semibold bg-slate-600 text-white hover:bg-slate-700 transition"
                          onClick={() => { setContactEdit(true); setContactError(""); setContactSuccess(""); }}
                          type="button"
                        >
                          Edit
                        </button>
                        {contactSuccess && <div className="text-green-400 font-medium ml-4">{contactSuccess}</div>}
                        {contactError && <div className="text-red-400 font-medium ml-4">{contactError}</div>}
                      </div>
                    </div>
                  ) : (
                    <form
                      className="grid lg:grid-cols-2 gap-6"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setContactLoading(true);
                        setContactError("");
                        setContactSuccess("");
                        try {
                          if (!user) throw new Error("Not logged in");
                          await updateDoc(doc(db, "users", user.uid), {
                            email: contactInfo.email,
                            phone: contactInfo.phone
                          });
                          setContactSuccess("Contact info saved!");
                          setContactEdit(false);
                        } catch (err) {
                          setContactError((err instanceof Error && err.message) || "Failed to save contact info.");
                        } finally {
                          setContactLoading(false);
                        }
                      }}
                    >
                      <div>
                        <label className="block text-purple-200 mb-2 font-medium">📧 Email</label>
                        <input
                          type="email"
                          value={contactInfo.email}
                          onChange={e => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                          name="email"
                          className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="teacher@example.com"
                          disabled={contactLoading}
                        />
                      </div>
                      <div>
                        <label className="block text-purple-200 mb-2 font-medium">📱 Phone</label>
                        <input
                          type="tel"
                          value={contactInfo.phone}
                          onChange={handlePhoneChange}
                          name="phone"
                          className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="(123) 456-7890"
                          disabled={contactLoading}
                          maxLength={14}
                          inputMode="tel"
                        />
                        <div className="text-purple-300 text-xs mt-1">Enter 10 digits, auto-formats as (XXX) XXX-XXXX</div>
                      </div>
                      <div className="lg:col-span-2 flex gap-2 mt-4">
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl font-semibold bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg disabled:opacity-60"
                          disabled={contactLoading}
                        >
                          {contactLoading ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          className="px-5 py-2 rounded-xl font-semibold bg-slate-600 text-white hover:bg-slate-700 transition"
                          onClick={() => { setContactEdit(false); setContactError(""); setContactSuccess(""); }}
                          disabled={contactLoading}
                        >
                          Cancel
                        </button>
                        {contactError && <div className="text-red-400 font-medium ml-4">{contactError}</div>}
                        {contactSuccess && <div className="text-green-400 font-medium ml-4">{contactSuccess}</div>}
                      </div>
                    </form>
                  )}
                </div>
                {/* Rate Settings removed: now only in Finance tab */}
                {/* Log Out Button */}
                <div className="flex justify-end">
                  <button
                    className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:scale-105 transition-all duration-200"
                    onClick={async () => {
                      await auth.signOut();
                      router.push("/");
                    }}
                    type="button"
                  >
                    🚪 Log Out
                  </button>
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

  );

}

// --- TeacherNotesTab removed (Notes feature deprecated) ---
// Helper to parse date string as local date (not UTC)
// Removed unused parseLocalDate helper

