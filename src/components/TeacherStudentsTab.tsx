import React from "react";

// Student type should match the one in page.tsx
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dob?: string;
  skillLevel?: string;
  progress?: number;
}

interface TeacherStudentsTabProps {
  students: Student[];
  viewMode: "card" | "list";
  setViewMode: (mode: "card" | "list") => void;
  sortBy: "name" | "level" | "progress";
  setSortBy: (sort: "name" | "level" | "progress") => void;
}

const TeacherStudentsTab: React.FC<TeacherStudentsTabProps> = ({
  students,
  viewMode,
  setViewMode,
  sortBy,
  setSortBy,
}) => {
  // Sort students
  const sortedStudents = [...students].sort((a, b) => {
    if (sortBy === "name") {
      return (a.firstName + " " + a.lastName).localeCompare(b.firstName + " " + b.lastName);
    } else if (sortBy === "level") {
      return (a.skillLevel || "").localeCompare(b.skillLevel || "");
    } else if (sortBy === "progress") {
      return (a.progress || 0) - (b.progress || 0);
    }
    return 0;
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* View mode and sorting controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        {/* View mode toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("card")}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${viewMode === "card" ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md" : "bg-slate-800 text-purple-200 hover:bg-slate-700"}`}
            disabled={viewMode === "card"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18M3 12h18M3 21h18M9 3v18m6-18v18" /></svg>
            Card View
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${viewMode === "list" ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md" : "bg-slate-800 text-purple-200 hover:bg-slate-700"}`}
            disabled={viewMode === "list"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" /></svg>
            List View
          </button>
        </div>
        {/* Sorting dropdown (visible in list view only) */}
        {viewMode === "list" && (
          <div className="min-w-[150px]">
            <label className="block text-purple-200 mb-2 font-medium">Sort by</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as "name" | "level" | "progress")}
              className="w-full p-3 rounded-xl bg-slate-800 border border-white/20 text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="name">Name</option>
              <option value="level">Skill Level</option>
              <option value="progress">Progress</option>
            </select>
          </div>
        )}
      </div>
      {/* Student cards or list items */}
      <div className={`grid ${viewMode === "card" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"} gap-6`}>
        {sortedStudents.length === 0 ? (
          <div className="col-span-full text-center text-purple-200 py-10">
            No students found.
          </div>
        ) : (
          sortedStudents.map(student => (
            <div key={student.id} className={`rounded-2xl overflow-hidden shadow-lg transition-transform duration-300 group ${viewMode === "card" ? "transform hover:scale-105" : ""}`}>
              <div className={`p-6 bg-gradient-to-br from-purple-500 to-indigo-500 flex flex-col h-full ${viewMode === "card" ? "gap-4" : "gap-2"}`}>
                <div className="flex-1">
                  <div className="text-white text-lg font-semibold mb-1">
                    {student.firstName} {student.lastName}
                  </div>
                  <div className="text-purple-100 text-sm mb-3">
                    🎯 {student.skillLevel || "-"} | 🎂 {(() => {
                      if (!student.dob) return "-";
                      const dobDate = new Date(student.dob);
                      const today = new Date();
                      let years = today.getFullYear() - dobDate.getFullYear();
                      const m = today.getMonth() - dobDate.getMonth();
                      if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) years--;
                      return years > 0 ? years : "-";
                    })()} years
                  </div>
                  {viewMode === "card" && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-purple-200 mb-1">
                        <span>Progress</span>
                        <span>{student.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all duration-500 shadow-lg"
                          style={{ width: `${student.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className={`flex gap-2 ${viewMode === "card" ? "flex-col" : "flex-row"} `}>
                  <button
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl text-sm font-medium shadow-lg transition"
                    // onClick={() => {}}
                  >
                    📚 Assign Homework
                  </button>
                  <button
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl text-sm font-medium shadow-lg transition"
                    // onClick={() => {}}
                  >
                    📝 Add Note
                  </button>
                  <button
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-xl text-sm font-medium shadow-lg transition"
                    // onClick={() => {}}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TeacherStudentsTab;
