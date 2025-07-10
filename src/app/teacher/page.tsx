"use client";

import React, { useState } from "react";

const tabs = ["Students", "Upcoming", "Homework", "Notes", "Calendar", "Settings"];

const getTabIcon = (tab: string) => {
  switch (tab) {
    case "Students": return "👥";
    case "Upcoming": return "⏰";
    case "Homework": return "📚";
    case "Notes": return "📝";
    case "Calendar": return "📅";
    case "Settings": return "⚙️";
    default: return "";
  }
};

const skillOrder = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
};

type SkillLevel = "Beginner" | "Intermediate" | "Advanced";

type Student = {
  name: string;
  level: SkillLevel;
  ageRange: string;
  progress: number;
  profilePic: string;
};

const studentsDemo: Student[] = [
  { name: "Emma Johnson", level: "Beginner", ageRange: "8-10", progress: 60, profilePic: "/students/emma.jpg" },
  { name: "Liam Torres", level: "Intermediate", ageRange: "11-13", progress: 80, profilePic: "/students/liam.jpg" },
  { name: "Ava Chen", level: "Advanced", ageRange: "14-16", progress: 95, profilePic: "/students/ava.jpg" },
  { name: "Noah Williams", level: "Beginner", ageRange: "7-9", progress: 40, profilePic: "/students/noah.jpg" },
  { name: "Sophia Martinez", level: "Intermediate", ageRange: "12-14", progress: 70, profilePic: "/students/sophia.jpg" },
  { name: "Mason Brown", level: "Advanced", ageRange: "15-17", progress: 85, profilePic: "/students/mason.jpg" },
];

type SortOption = "name" | "age" | "skill" | "progress";

export default function TeacherDemoDashboard() {
  const [activeTab, setActiveTab] = useState<string>("Students");
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [contactInfo, setContactInfo] = useState({
    email: "",
    phone: "",
    address: "",
  });

  function getMinAge(ageRange: string) {
    const parts = ageRange.split("-");
    return parts.length === 2 ? parseInt(parts[0], 10) : 0;
  }

  const sortedStudents = [...studentsDemo].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "age":
        return getMinAge(a.ageRange) - getMinAge(b.ageRange);
      case "skill":
        return (skillOrder[a.level] || 0) - (skillOrder[b.level] || 0);
      case "progress":
        return a.progress - b.progress;
      default:
        return 0;
    }
  });

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarDates = Array.from({ length: daysInMonth }, (_, i) => {
    return new Date(year, month, i + 1);
  });

  function toggleBlockDate(dateStr: string) {
    setBlockedDates((prev) =>
      prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr]
    );
  }

  function handleContactChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setContactInfo((prev) => ({ ...prev, [name]: value }));
  }

  const getLevelColor = (level: SkillLevel) => {
    switch (level) {
      case "Beginner": return "bg-gradient-to-r from-green-400 to-emerald-500";
      case "Intermediate": return "bg-gradient-to-r from-yellow-400 to-orange-500";
      case "Advanced": return "bg-gradient-to-r from-purple-500 to-pink-500";
      default: return "bg-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.6s ease-out;
        }
        .animate-pulse-gentle {
          animation: pulse 2s infinite;
        }
        .glass-effect {
          backdrop-filter: blur(16px);
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }
      `}</style>
      
      <div className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-8 rounded-3xl shadow-2xl text-white overflow-hidden animate-fadeIn">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/90 to-indigo-600/90"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
            
            <div className="relative z-10 text-center">
              <h1 className="text-4xl font-bold mb-4 animate-slideInLeft">
                🎵 Teacher Studio Dashboard 🎵
              </h1>
              <p className="text-xl text-purple-100 animate-slideInLeft">
                Manage your music students with style and efficiency
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap justify-center gap-2 animate-fadeIn">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`group relative px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25"
                    : "glass-effect text-white hover:bg-white/20"
                }`}
              >
                <span className="text-xl mr-2">{getTabIcon(tab)}</span>
                {tab}
                {activeTab === tab && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse-gentle"></div>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="glass-effect p-8 rounded-3xl shadow-2xl min-h-[500px] animate-fadeIn">
            {/* Students Tab */}
            {activeTab === "Students" && (
              <div className="space-y-6">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    👥 Your Students
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="flex bg-white/10 rounded-2xl p-1">
                      <button
                        onClick={() => setViewMode("card")}
                        className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                          viewMode === "card"
                            ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg"
                            : "text-gray-300 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        🎴 Cards
                      </button>
                      <button
                        onClick={() => setViewMode("list")}
                        className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                          viewMode === "list"
                            ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg"
                            : "text-gray-300 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        📋 List
                      </button>
                    </div>

                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="name" className="text-black">📝 Alphabetical</option>
                      <option value="age" className="text-black">🎂 Age Range</option>
                      <option value="skill" className="text-black">⭐ Skill Level</option>
                      <option value="progress" className="text-black">📈 Progress</option>
                    </select>
                  </div>
                </div>

                {viewMode === "card" ? (
                  <div className="grid lg:grid-cols-2 gap-6">
                    {sortedStudents.map((student, index) => (
                      <div key={index} className="glass-effect rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 transform hover:scale-105 border border-white/20">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white/30 shadow-xl">
                              <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-2xl text-white font-bold">
                                {student.name.split(' ').map(n => n[0]).join('')}
                              </div>
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${getLevelColor(student.level)} flex items-center justify-center text-xs font-bold text-white shadow-lg`}>
                              {student.level === "Beginner" ? "B" : student.level === "Intermediate" ? "I" : "A"}
                            </div>
                          </div>

                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-1">{student.name}</h3>
                            <p className="text-purple-200 text-sm mb-3">
                              🎯 {student.level} | 🎂 {student.ageRange} years
                            </p>

                            <div className="mb-4">
                              <div className="flex justify-between text-sm text-purple-200 mb-1">
                                <span>Progress</span>
                                <span>{student.progress}%</span>
                              </div>
                              <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all duration-500 shadow-lg"
                                  style={{ width: `${student.progress}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-3 py-2 rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 text-sm font-medium shadow-lg">
                                📚 Homework
                              </button>
                              <button className="flex-1 bg-gradient-to-r from-slate-600 to-slate-700 text-white px-3 py-2 rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all duration-300 text-sm font-medium shadow-lg">
                                📝 Note
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedStudents.map((student, index) => (
                      <div key={index} className="glass-effect rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 border border-white/20">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                          <div className="flex items-center gap-4 lg:w-1/3">
                            <div className="relative">
                              <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white/30 shadow-xl">
                                <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-lg text-white font-bold">
                                  {student.name.split(' ').map(n => n[0]).join('')}
                                </div>
                              </div>
                              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${getLevelColor(student.level)} flex items-center justify-center text-xs font-bold text-white shadow-lg`}>
                                {student.level === "Beginner" ? "B" : student.level === "Intermediate" ? "I" : "A"}
                              </div>
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">{student.name}</h3>
                              <p className="text-purple-200 text-sm">
                                🎯 {student.level} | 🎂 {student.ageRange} years
                              </p>
                            </div>
                          </div>

                          <div className="lg:w-1/3">
                            <div className="flex justify-between text-sm text-purple-200 mb-1">
                              <span>Progress</span>
                              <span>{student.progress}%</span>
                            </div>
                            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all duration-500 shadow-lg"
                                style={{ width: `${student.progress}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex gap-2 lg:w-1/3 lg:justify-end">
                            <button className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-2 rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 text-sm font-medium shadow-lg">
                              📚 Homework
                            </button>
                            <button className="bg-gradient-to-r from-slate-600 to-slate-700 text-white px-4 py-2 rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all duration-300 text-sm font-medium shadow-lg">
                              📝 Note
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Upcoming Tab */}
            {activeTab === "Upcoming" && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  ⏰ Upcoming Lessons
                </h2>
                <div className="space-y-4">
                  {[
                    { day: "Mon, June 10", time: "3:00 PM", student: "Emma Johnson", color: "from-blue-500 to-cyan-500" },
                    { day: "Tue, June 11", time: "4:00 PM", student: "Liam Torres", color: "from-purple-500 to-pink-500" },
                    { day: "Wed, June 12", time: "5:30 PM", student: "Ava Chen", color: "from-green-500 to-emerald-500" },
                  ].map((lesson, index) => (
                    <div key={index} className={`bg-gradient-to-r ${lesson.color} p-6 rounded-2xl text-white shadow-xl transform hover:scale-105 transition-all duration-300`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold">{lesson.student}</h3>
                          <p className="text-white/80">{lesson.day} at {lesson.time}</p>
                        </div>
                        <div className="text-3xl animate-pulse-gentle">🎵</div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-purple-200 text-sm">✨ Full calendar integration coming in the complete dashboard</p>
              </div>
            )}

            {/* Homework Tab */}
            {activeTab === "Homework" && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  📚 Homework Assignments
                </h2>
                <div className="space-y-4">
                  {[
                    { student: "Emma Johnson", task: "Practice scales - 15 minutes", status: "pending", color: "from-yellow-500 to-orange-500" },
                    { student: "Liam Torres", task: "Learn Song A - 3 pages", status: "in-progress", color: "from-blue-500 to-cyan-500" },
                    { student: "Ava Chen", task: "Sight reading exercises", status: "completed", color: "from-green-500 to-emerald-500" },
                  ].map((hw, index) => (
                    <div key={index} className="glass-effect p-6 rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300">
                      <div className="flex items-center gap-4">
                        <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${hw.color} shadow-lg`}></div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white">{hw.student}</h3>
                          <p className="text-purple-200">{hw.task}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${hw.color} text-white shadow-lg`}>
                          {hw.status === "completed" ? "✅ Done" : hw.status === "in-progress" ? "⏳ In Progress" : "📝 Pending"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === "Notes" && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  📝 Student Notes
                </h2>
                <div className="space-y-4">
                  {[
                    { student: "Emma Johnson", note: "Needs to focus on timing", priority: "high" },
                    { student: "Liam Torres", note: "Great improvement in rhythm", priority: "low" },
                    { student: "Ava Chen", note: "Ready for advanced theory", priority: "medium" },
                  ].map((note, index) => (
                    <div key={index} className="glass-effect p-6 rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300">
                      <div className="flex items-start gap-4">
                        <div className={`w-3 h-3 rounded-full mt-2 ${
                          note.priority === "high" ? "bg-red-500" : 
                          note.priority === "medium" ? "bg-yellow-500" : "bg-green-500"
                        } shadow-lg`}></div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white mb-1">{note.student}</h3>
                          <p className="text-purple-200">{note.note}</p>
                        </div>
                        <button className="text-purple-300 hover:text-white transition-colors duration-200">
                          ✏️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Calendar Tab */}
            {activeTab === "Calendar" && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  📅 Calendar Management
                </h2>
                <p className="text-purple-200">Click days to block them out. Blocked days appear in red.</p>

                <div className="glass-effect p-6 rounded-2xl border border-white/20">
                  <div className="grid grid-cols-7 gap-2 text-center mb-4">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="text-lg font-bold text-purple-300 p-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {Array(new Date(year, month, 1).getDay())
                      .fill(null)
                      .map((_, i) => (
                        <div key={"empty" + i} />
                      ))}

                    {calendarDates.map((date) => {
                      const dateStr = date.toISOString().split("T")[0];
                      const isBlocked = blockedDates.includes(dateStr);
                      const isToday = dateStr === today.toISOString().split("T")[0];

                      return (
                        <button
                          key={dateStr}
                          onClick={() => toggleBlockDate(dateStr)}
                          className={`p-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-110 ${
                            isBlocked
                              ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg"
                              : "glass-effect text-white hover:bg-white/20 border border-white/20"
                          } ${isToday ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-transparent" : ""}`}
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "Settings" && (
              <div className="space-y-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  ⚙️ Settings
                </h2>

                {/* Profile Section */}
                <div className="glass-effect p-6 rounded-2xl border border-white/20">
                  <h3 className="text-xl font-bold text-white mb-6">👤 Personal Profile</h3>
                  
                  <div className="flex items-center gap-6 mb-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-2xl text-white font-bold shadow-xl">
                        👩‍🏫
                      </div>
                      <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform duration-200">
                        📷
                      </button>
                    </div>
                    
                    <div className="flex-1">
                      <label className="block text-purple-200 mb-2 font-medium">Bio</label>
                      <textarea
                        rows={3}
                        className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        placeholder="Tell your students about yourself..."
                        defaultValue="Passionate music teacher with 10+ years of experience..."
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="glass-effect p-6 rounded-2xl border border-white/20">
                  <h3 className="text-xl font-bold text-white mb-6">📞 Contact Information</h3>
                  
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-purple-200 mb-2 font-medium">📧 Email</label>
                      <input
                        type="email"
                        value={contactInfo.email}
                        onChange={handleContactChange}
                        name="email"
                        className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="teacher@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-purple-200 mb-2 font-medium">📱 Phone</label>
                      <input
                        type="tel"
                        value={contactInfo.phone}
                        onChange={handleContactChange}
                        name="phone"
                        className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="(123) 456-7890"
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <label className="block text-purple-200 mb-2 font-medium">🏠 Address</label>
                      <textarea
                        value={contactInfo.address}
                        onChange={handleContactChange}
                        name="address"
                        rows={2}
                        className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        placeholder="123 Music Street, Harmony City, HC 12345"
                      />
                    </div>
                  </div>
                </div>

                {/* Rate Settings */}
                <div className="glass-effect p-6 rounded-2xl border border-white/20">
                  <h3 className="text-xl font-bold text-white mb-4">💰 Teaching Rate</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-200">Current hourly rate</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                        $50/hour
                      </p>
                    </div>
                    <button className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 font-medium shadow-lg transform hover:scale-105">
                      💲 Update Rate
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}