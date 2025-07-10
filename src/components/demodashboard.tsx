//components/demodashboard.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from 'next/navigation';

const tabs = ["Home", "Book", "Upcoming", "Account"];

const timeSlots = [
  "9:00 AM",
  "10:00 AM", 
  "11:00 AM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
];

const getTabIcon = (tab: string) => {
  switch (tab) {
    case "Home": return "🏠";
    case "Book": return "📅";
    case "Upcoming": return "⏰";
    case "Account": return "👤";
    default: return "";
  }
};

// TypeScript interfaces
interface CartItem {
  id: string;
  name: string;
  price: string;
  priceValue: number;
  desc: string;
  category: string;
  quantity: number;
  popular?: boolean;
  features?: string[];
  duration?: string;
}

interface Quantities {
  [key: string]: number;
}

// Generate demo data for multiple weeks
const generateDemoSlotData = () => {
  const data: Record<string, { booked: number; skill: string; ageGroup: string }> = {};
  const skills = ["Beginner", "Intermediate", "Advanced"];
  const ageGroups = ["12-14", "15-17", "Adult"];
  
  // Generate data for 8 weeks (4 past, current, 3 future)
  const today = new Date();
  for (let weekOffset = -4; weekOffset <= 3; weekOffset++) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + (weekOffset * 7));
    
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + dayOffset);
      
      // Skip weekends for bookings
      if (day.getDay() === 0 || day.getDay() === 6) continue;
      
      // Randomly add some bookings (about 30% of slots)
      timeSlots.forEach(time => {
        if (Math.random() < 0.3) {
          const key = `${day.toDateString()}-${time}`;
          data[key] = {
            booked: Math.floor(Math.random() * 8) + 1,
            skill: skills[Math.floor(Math.random() * skills.length)],
            ageGroup: ageGroups[Math.floor(Math.random() * ageGroups.length)]
          };
        }
      });
    }
  }
  
  return data;
};

const demoSlotData = generateDemoSlotData();

// Get week dates starting from a specific Sunday
function getWeekDates(sundayDate: Date) {
  const week = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sundayDate);
    d.setDate(sundayDate.getDate() + i);
    week.push(d);
  }
  return week;
}

// Get Sunday of current week
function getCurrentWeekSunday() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);
  return sunday;
}

// SINGLE MERGED COMPONENT - Remove the duplicate!
export default function DemoDashboard() {
  const router = useRouter();
  // All state in one place
  const [activeTab, setActiveTab] = useState("Home");
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(getCurrentWeekSunday());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quantities, setQuantities] = useState<Quantities>({});
  const [showCart, setShowCart] = useState<boolean>(false);

  // Helper functions - moved inside the single component
  const updateQuantity = (itemId: string, quantity: number): void => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: quantity
    }));
  };

  // Function to add items to cart
  const addToCart = (item: Omit<CartItem, 'quantity'>): void => {
    const quantity = quantities[item.id] || 0;
    if (quantity <= 0) return;

    setCart(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        // Update existing item quantity
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
      } else {
        // Add new item to cart
        return [...prev, { ...item, quantity }];
      }
    });

    // Reset the quantity selector for this item
    setQuantities(prev => ({
      ...prev,
      [item.id]: 0
    }));

    // Show cart briefly after adding
    setShowCart(true);
  };

  // Function to update cart item quantities
  const updateCartItemQuantity = (itemId: string, newQuantity: number): void => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // Function to remove items from cart
  const removeFromCart = (itemId: string): void => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  // Function to clear entire cart
  const clearCart = (): void => {
    setCart([]);
    setQuantities({});
  };

  // Function to calculate cart total
  const getCartTotal = (): string => {
    return cart.reduce((total, item) => {
      return total + (item.priceValue * item.quantity);
    }, 0).toFixed(2);
  };

  // Example kid user info
  const personalInfo = {
    name: "Timmy Turner",
    dob: "2011-09-15",
    ageGroup: "12-14",
    skillLevel: "Beginner",
    email: "timmy.turner@example.com",
    progress: 40,
  };

// Define the homework assignment type
interface HomeworkAssignment {
  id: number;
  title: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  completed: boolean;
  difficulty: string;
  estimatedTime: string;
  notes: string;
}

// Replace the const homeworkAssignments with useState
const [homeworkAssignments, setHomeworkAssignments] = useState<HomeworkAssignment[]>([
  {
    id: 1,
    title: "Practice C Major Scale",
    description: "Practice the C major scale 10 times daily, focusing on finger placement and rhythm.",
    assignedDate: "2024-06-15",
    dueDate: "2024-06-22",
    completed: true,
    difficulty: "Beginner",
    estimatedTime: "15 minutes",
    notes: "Great improvement on timing!"
  },
  {
    id: 2,
    title: "Learn 'Twinkle Twinkle Little Star'",
    description: "Memorize and play the melody smoothly. Focus on maintaining steady tempo.",
    assignedDate: "2024-06-18",
    dueDate: "2024-06-25",
    completed: false,
    difficulty: "Beginner",
    estimatedTime: "20 minutes",
    notes: "Remember to practice slowly first"
  },
  {
    id: 3,
    title: "Rhythm Clapping Exercise",
    description: "Practice clapping different rhythm patterns from the worksheet. Record yourself and listen back.",
    assignedDate: "2024-06-20",
    dueDate: "2024-06-27",
    completed: false,
    difficulty: "Intermediate",
    estimatedTime: "10 minutes",
    notes: "Focus on keeping steady beat"
  }
]);

// Function to toggle homework completion
const toggleHomeworkCompletion = (assignmentId: number) => {
  setHomeworkAssignments(prevAssignments => 
    prevAssignments.map(assignment => 
      assignment.id === assignmentId 
        ? { ...assignment, completed: !assignment.completed }
        : assignment
    )
  );
};


  const currentWeek = getWeekDates(currentWeekStart);

  // Navigation functions
  const goToPreviousWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newWeekStart);
  };

  const goToNextWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newWeekStart);
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(getCurrentWeekSunday());
  };

  // Format week range without year
  const formatWeekRange = (weekStart: Date) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    if (weekStart.getMonth() === weekEnd.getMonth()) {
      return `${weekStart.toLocaleDateString(undefined, { month: 'long' })} ${weekStart.getDate()}-${weekEnd.getDate()}`;
    } else {
      return `${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    }
  };

  const isCurrentWeek = () => {
    const today = getCurrentWeekSunday();
    return currentWeekStart.getTime() === today.getTime();
  };

  const handleSlotClick = (day: string, time: string) => {
    const slotKey = `${day}-${time}`;
    
    setSelectedSlots(prevSlots => {
      if (prevSlots.includes(slotKey)) {
        return prevSlots.filter(slot => slot !== slotKey);
      }
      return [...prevSlots, slotKey];
    });
  };

  const isSlotSelected = (day: string, time: string) => {
    return selectedSlots.includes(`${day}-${time}`);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <nav className="hidden md:flex relative z-10 w-44 lg:w-64 backdrop-blur-lg bg-white/80 border-r border-white/20 p-4 lg:p-6 flex-col space-y-3 shadow-2xl">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full text-2xl text-white shadow-lg">
            🎵
          </div>
          <p className="text-sm text-gray-700 font-semibold">Student Portal</p>
        </div>
        
      {tabs.map((tab, index) => (
        <button
          key={tab}
          onClick={() => {
            setActiveTab(tab);
            if (tab !== "Book") {
              setSelectedSlots([]); 
            }
          }}
          className={`group relative py-4 px-5 rounded-xl text-left font-semibold transition-all duration-300 transform hover:scale-105
            ${
              activeTab === tab
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25"
                : "text-gray-700 hover:bg-white/60 hover:text-purple-600 hover:shadow-lg"
            }`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-center space-x-3">
            <span className="text-lg">{getTabIcon(tab)}</span>
            <span className="hidden sm:inline">{tab}</span>
          </div>

          {activeTab === tab && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          )}
        </button>
      ))}
      </nav>

      {/* Bottom Navigation Bar for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex md:hidden bg-white/90 border-t border-gray-200 shadow-2xl">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              if (tab !== "Book") setSelectedSlots([]);
            }}
            className={`flex-1 flex flex-col items-center justify-center py-2 transition-all duration-200 ${
              activeTab === tab
                ? "text-indigo-600 font-bold bg-gradient-to-t from-indigo-50 to-white"
                : "text-gray-500 hover:text-indigo-500"
            }`}
            aria-label={tab}
          >
            <span className="text-xl mb-0.5">{getTabIcon(tab)}</span>
            <span className="text-xs leading-tight">{tab}</span>
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-1 p-8 overflow-auto pb-20 md:pb-0">


       {activeTab === "Home" && (
          <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto animate-fadeIn px-4 sm:px-6 lg:px-8">
            {/* Welcome Section */}
            <div className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-2xl text-white overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/90 to-indigo-600/90"></div>
              <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-white/10 rounded-full -translate-y-16 sm:-translate-y-24 lg:-translate-y-32 translate-x-16 sm:translate-x-24 lg:translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-36 sm:h-36 lg:w-48 lg:h-48 bg-white/5 rounded-full translate-y-12 sm:translate-y-18 lg:translate-y-24 -translate-x-12 sm:-translate-x-18 lg:-translate-x-24"></div>
              
              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 animate-slideInLeft leading-tight">
                  Welcome Back, {personalInfo.name}! 🎉
                </h2>
                <div className="animate-slideInLeft animation-delay-200">
                  <p className="text-base sm:text-lg lg:text-xl text-purple-100 mb-2">
                    Your next session is on
                  </p>
                  <span className="inline-block font-bold text-yellow-300 px-3 py-2 bg-white/20 rounded-full text-sm sm:text-base">
                    June 10 at 10:00 AM
                  </span>
                </div>
              </div>
            </div>

            {/* Personal Info Section */}
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
                  {Object.entries({
                    "Name": personalInfo.name,
                    "Date of Birth": personalInfo.dob,
                    "Age Group": personalInfo.ageGroup,
                    "Skill Level": personalInfo.skillLevel,
                    "Email": personalInfo.email
                  }).map(([key, value], index) => (
                    <div 
                      key={key}
                      className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:from-purple-50 hover:to-indigo-50 transition-all duration-300 space-y-1 sm:space-y-0"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <span className="font-semibold text-gray-700 text-sm sm:text-base">{key}:</span>
                      <span className="text-gray-800 font-medium text-sm sm:text-base break-words">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="group bg-white/70 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="flex items-center mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-lg sm:text-xl mr-3 sm:mr-4 flex-shrink-0">
                    📈
                  </div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent leading-tight">
                    Progress
                  </h3>
                </div>
                
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-4 sm:h-6 mb-3 sm:mb-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 h-4 sm:h-6 rounded-full transition-all duration-1000 ease-out shadow-lg relative overflow-hidden"
                      style={{ width: `${personalInfo.progress}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    </div>
                  </div>
                  <p className="text-right text-base sm:text-lg font-bold text-gray-700 mb-3 sm:mb-4">
                    {personalInfo.progress}% Complete
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0 text-xs sm:text-sm font-medium text-gray-600">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-center">Beginner Level</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-center">Intermediate Level</span>
                  </div>
                  <p className="text-center text-sm sm:text-base text-gray-600 bg-gradient-to-r from-purple-50 to-indigo-50 p-3 rounded-xl">
                    🌟 Great progress! Keep practicing to reach the next level.
                  </p>
                </div>
              </div>
            </div>

            {/* Homework Section */}
            <div className="bg-white/70 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-white/20">
              <div className="flex items-center mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-lg sm:text-xl mr-3 sm:mr-4 flex-shrink-0">
                  📚
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent leading-tight">
                  Homework Assignments
                </h3>
              </div>

              <div className="space-y-4">
                {homeworkAssignments.map((assignment, index) => (
                  <div 
                    key={assignment.id}
                    className={`p-4 sm:p-5 rounded-xl border-l-4 transition-all duration-300 hover:shadow-lg ${
                      assignment.completed 
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-500' 
                        : 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-500'
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <h4 className="text-lg sm:text-xl font-bold text-gray-800">
                            {assignment.title}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              assignment.difficulty === 'Beginner' 
                                ? 'bg-green-100 text-green-700'
                                : assignment.difficulty === 'Intermediate'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {assignment.difficulty}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              {assignment.estimatedTime}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 text-sm sm:text-base mb-3 leading-relaxed">
                          {assignment.description}
                        </p>
                        
                        {assignment.notes && (
                          <div className="bg-white/60 p-3 rounded-lg mb-3">
                            <p className="text-sm text-gray-600">
                              <span className="font-semibold">Teacher&apos;s Note:</span> {assignment.notes}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex flex-col sm:flex-row gap-2 text-xs sm:text-sm text-gray-600">
                          <span>
                            <strong>Assigned:</strong> {new Date(assignment.assignedDate).toLocaleDateString()}
                          </span>
                          <span>
                            <strong>Due:</strong> {new Date(assignment.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleHomeworkCompletion(assignment.id)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                            assignment.completed
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : 'bg-orange-500 text-white hover:bg-orange-600'
                          }`}
                        >
                          {assignment.completed ? '✓ Completed' : 'Mark Complete'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Homework Summary */}
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-center sm:text-left">
                    <p className="text-lg font-bold text-gray-800">
                      {homeworkAssignments.filter(hw => hw.completed).length} of {homeworkAssignments.length} assignments completed
                    </p>
                    <p className="text-sm text-gray-600">
                      Keep up the great work! 🎵
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-16 relative">
                      <div className="w-full h-full rounded-full border-4 border-gray-200"></div>
                      <div 
                        className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-purple-500 transition-all duration-1000"
                        style={{ 
                          strokeDasharray: '100 100',
                          strokeDashoffset: 100 - (homeworkAssignments.filter(hw => hw.completed).length / homeworkAssignments.length * 100),
                          transform: 'rotate(-90deg)'
                        }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-purple-600">
                          {Math.round(homeworkAssignments.filter(hw => hw.completed).length / homeworkAssignments.length * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
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
        <p className="text-gray-600 mt-1 text-sm sm:text-base">Select your preferred time slots</p>
      </div>
    </div>

    {/* Week Navigation - Mobile Optimized */}
    <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50 p-4 sm:p-6 rounded-2xl border-2 border-purple-200 shadow-lg space-y-4 sm:space-y-0 md:gap-8">
      <div className="flex space-x-2 sm:space-x-0 sm:block order-2 sm:order-1 md:space-x-4">
        <button
          onClick={goToPreviousWeek}
          className="group flex items-center px-3 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 bg-white text-purple-600 rounded-xl hover:bg-purple-50 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 border-2 border-purple-200 text-sm sm:text-base md:text-lg"
        >
          <span className="group-hover:animate-bounce inline-block mr-1 sm:mr-2 text-lg sm:text-xl md:text-2xl">⬅️</span>
        </button>
        <button
          onClick={goToNextWeek}
          className="group flex items-center px-3 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 bg-white text-purple-600 rounded-xl hover:bg-purple-50 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 border-2 border-purple-200 text-sm sm:text-base md:text-lg sm:hidden"
        >
          <span className="group-hover:animate-bounce inline-block ml-1 text-lg md:text-2xl">➡️</span>
        </button>
      </div>
      <div className="text-center order-1 sm:order-2 min-w-[160px] md:min-w-[220px]">
        <h3 className="text-lg sm:text-2xl md:text-3xl font-bold text-purple-800 mb-1">
          {formatWeekRange(currentWeekStart)}
        </h3>
        {!isCurrentWeek() && (
          <button
            onClick={goToCurrentWeek}
            className="text-xs sm:text-sm md:text-base text-purple-600 hover:text-purple-800 font-medium"
          >
            Go to Current Week
          </button>
        )}
        {isCurrentWeek() && (
          <span className="text-xs sm:text-sm md:text-base text-purple-600 font-medium bg-purple-100 px-2 sm:px-3 md:px-4 py-1 rounded-full">
            📍 Current Week
          </span>
        )}
      </div>
      <button
        onClick={goToNextWeek}
        className="group flex items-center px-6 py-3 md:px-8 md:py-4 bg-white text-purple-600 rounded-xl hover:bg-purple-50 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 border-2 border-purple-200 hidden sm:flex order-3 text-base md:text-lg"
      >
        <span className="group-hover:animate-bounce inline-block ml-2 text-xl md:text-2xl">➡️</span>
      </button>
    </div>

    {/* Selection Summary - Mobile Optimized */}
    {selectedSlots.length > 0 && (
      <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl shadow-lg animate-slideInDown">
        <div className="flex items-center mb-3 sm:mb-4">
          <span className="text-xl sm:text-2xl mr-2 sm:mr-3">✨</span>
          <h3 className="font-bold text-amber-800 text-lg sm:text-xl">
            Selected Sessions ({selectedSlots.length})
          </h3>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {selectedSlots.map((slotKey) => {
            const [day, time] = slotKey.split('-');
            const dayName = new Date(day).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
            return (
              <span
                key={slotKey}
                className="bg-gradient-to-r from-amber-400 to-orange-400 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                {dayName} at {time}
              </span>
            );
          })}
        </div>
      </div>
    )}

    {/* Mobile View - Dropdown Style */}
    <div className="block sm:hidden space-y-4">
      {currentWeek.map((day, dayIndex) => {
        const dayOfWeek = day.getDay();
        const isToday = day.toDateString() === new Date().toDateString();

        // Weekends (Sunday or Saturday) show disabled message
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          return (
            <div
              key={day.toDateString()}
              className="p-4 bg-gray-100/60 backdrop-blur-sm border-2 border-gray-200 rounded-2xl text-center text-gray-400 shadow-lg animate-fadeInUp"
              style={{ animationDelay: `${dayIndex * 100}ms` }}
            >
              <h3 className={`text-base font-bold mb-2 ${isToday ? 'bg-blue-100 text-blue-800 px-3 py-1 rounded-full' : ''}`}>
                {day.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
                {isToday && <span className="block text-xs mt-1">Today</span>}
              </h3>
              <div className="text-2xl mb-2">😴</div>
              <p className="font-medium text-sm">Weekend Rest</p>
            </div>
          );
        }

        return (
          <details
            key={day.toDateString()}
            className={`backdrop-blur-sm border-2 rounded-2xl shadow-xl transition-all duration-500 animate-fadeInUp ${
              isToday 
                ? 'bg-blue-50/80 border-blue-300' 
                : 'bg-white/70 border-white/30'
            }`}
            style={{ animationDelay: `${dayIndex * 100}ms` }}
          >
            {/* Day Header - Clickable */}
            <summary className="w-full p-4 text-left rounded-2xl transition-all duration-300 cursor-pointer list-none">
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-bold px-3 py-2 rounded-full ${
                  isToday 
                    ? 'text-blue-800 bg-blue-200' 
                    : 'text-gray-800 bg-gradient-to-r from-purple-100 to-indigo-100'
                }`}>
                  {day.toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                  {isToday && <span className="block text-xs mt-1">Today</span>}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {selectedSlots.filter(slot => slot.startsWith(day.toDateString())).length} selected
                  </span>
                  <span className="text-xl">⬇️</span>
                </div>
              </div>
            </summary>

            {/* Time Slots - Expandable */}
            <div className="px-4 pb-4 space-y-3 border-t border-gray-200">
              {timeSlots.map((time, timeIndex) => {
                const key = `${day.toDateString()}-${time}`;
                const slot = demoSlotData[key];
                const isSelected = isSlotSelected(day.toDateString(), time);
                
                // Check if this slot is in the past
                const slotDateTime = new Date(day);
                const [hours, minutes] = time.split(':').map(Number);
                slotDateTime.setHours(hours, minutes, 0, 0);
                const now = new Date();
                const isPastSlot = slotDateTime < now;

                return (
                  <button
                    key={key}
                    onClick={() => !isPastSlot && handleSlotClick(day.toDateString(), time)}
                    disabled={isPastSlot}
                    className={`group relative w-full rounded-xl px-4 py-3 border-2 text-sm flex items-center justify-between transition-all duration-300 transform min-h-[70px] overflow-hidden
                      ${isPastSlot
                        ? "bg-gray-100/60 text-gray-400 border-gray-200 cursor-not-allowed opacity-60"
                        : isSelected
                          ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white border-amber-300 shadow-2xl shadow-amber-500/25 scale-105 hover:scale-105"
                          : "bg-white/80 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 border-gray-200 hover:border-purple-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                      }`}
                    style={{ animationDelay: `${timeIndex * 50}ms` }}
                    aria-label={`${isPastSlot ? 'Past slot - unavailable' : isSelected ? 'Unselect' : 'Select'} slot on ${day.toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })} at ${time}`}
                  >
                    {isSelected && !isPastSlot && (
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-orange-400/20 animate-pulse"></div>
                    )}
                    
                    <div className="flex items-center space-x-3 relative z-10">
                      <span className={`font-bold text-base ${isPastSlot ? 'line-through' : ''}`}>
                        {time}
                      </span>
                      
                      {isPastSlot && (
                        <span className="text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded-full font-medium">
                          Past
                        </span>
                      )}
                      
                      {!isPastSlot && slot ? (
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-sm">
                            {slot.booked}/8 students
                          </span>
                        </div>
                      ) : !isPastSlot ? (
                        <span className="font-medium text-green-600 text-sm">0/8 students</span>
                      ) : null}
                    </div>

                    <div className="flex flex-col items-end space-y-1 relative z-10">
                      {!isPastSlot && slot ? (
                        <>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            slot.skill === 'Beginner' ? 'bg-green-100 text-green-800' :
                            slot.skill === 'Intermediate' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {slot.skill}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            slot.ageGroup === '12-14' ? 'bg-pink-100 text-pink-800' :
                            'bg-indigo-100 text-indigo-800'
                          }`}>
                            {slot.ageGroup}
                          </span>
                        </>
                      ) : !isPastSlot ? (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                          ✨ Available
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs font-medium">
                          ⏰ Unavailable
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>

    {/* Desktop View - Grid Layout */}
    <div className="hidden sm:grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 md:gap-8">
      {currentWeek.map((day, dayIndex) => {
        const dayOfWeek = day.getDay();
        const isToday = day.toDateString() === new Date().toDateString();

        // Weekends (Sunday or Saturday) show disabled slots
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          return (
            <div
              key={day.toDateString()}
              className="p-6 bg-gray-100/60 backdrop-blur-sm border-2 border-gray-200 rounded-2xl text-center text-gray-400 shadow-lg animate-fadeInUp"
              style={{ animationDelay: `${dayIndex * 100}ms` }}
            >
              <h3 className={`text-lg font-bold mb-4 ${isToday ? 'bg-blue-100 text-blue-800 px-3 py-1 rounded-full' : ''}`}>
                {day.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
                {isToday && <span className="block text-xs mt-1">Today</span>}
              </h3>
              <div className="text-4xl mb-2">😴</div>
              <p className="font-medium">Weekend Rest</p>
            </div>
          );
        }

        return (
          <div
            key={day.toDateString()}
            className={`p-6 backdrop-blur-sm border-2 rounded-2xl flex flex-col shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 animate-fadeInUp ${
              isToday 
                ? 'bg-blue-50/80 border-blue-300' 
                : 'bg-white/70 border-white/30'
            }`}
            style={{ animationDelay: `${dayIndex * 100}ms` }}
          >
            <h3 className={`text-lg font-bold mb-4 text-center px-3 py-2 rounded-full ${
              isToday 
                ? 'text-blue-800 bg-blue-200' 
                : 'text-gray-800 bg-gradient-to-r from-purple-100 to-indigo-100'
            }`}>
              {day.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
              {isToday && <span className="block text-xs mt-1">Today</span>}
            </h3>

            {/* Time slots container */}
            <div className="flex flex-col space-y-3 w-full">
              {timeSlots.map((time, timeIndex) => {
                const key = `${day.toDateString()}-${time}`;
                const slot = demoSlotData[key];
                const isSelected = isSlotSelected(day.toDateString(), time);
                
                // Check if this slot is in the past
                const slotDateTime = new Date(day);
                const [hours, minutes] = time.split(':').map(Number);
                slotDateTime.setHours(hours, minutes, 0, 0);
                const now = new Date();
                const isPastSlot = slotDateTime < now;

                return (
                  <button
                    key={key}
                    onClick={() => !isPastSlot && handleSlotClick(day.toDateString(), time)}
                    disabled={isPastSlot}
                    className={`group relative rounded-xl px-4 py-3 border-2 text-sm flex flex-col items-center transition-all duration-300 transform min-h-[70px] justify-center overflow-hidden
                      ${isPastSlot
                        ? "bg-gray-100/60 text-gray-400 border-gray-200 cursor-not-allowed opacity-60"
                        : isSelected
                          ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white border-amber-300 shadow-2xl shadow-amber-500/25 scale-105 hover:scale-105"
                          : "bg-white/80 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 border-gray-200 hover:border-purple-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                      }`}
                    style={{ animationDelay: `${(dayIndex * timeSlots.length + timeIndex) * 50}ms` }}
                    aria-label={`${isPastSlot ? 'Past slot - unavailable' : isSelected ? 'Unselect' : 'Select'} slot on ${day.toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })} at ${time}`}
                  >
                    {isSelected && !isPastSlot && (
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-orange-400/20 animate-pulse"></div>
                    )}
                    
                    <span className={`relative z-10 font-bold text-base mb-2 ${isPastSlot ? 'line-through' : ''}`}>
                      {time}
                    </span>
                    
                    {isPastSlot ? (
                      <div className="relative z-10 text-xs flex flex-col items-center space-y-1">
                        <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs font-medium">
                          ⏰ Past
                        </span>
                      </div>
                    ) : slot ? (
                      <div className="relative z-10 text-xs flex flex-col items-center space-y-1">
                        <span className="font-semibold">
                          {slot.booked}/8 students
                        </span>
                        <div className="flex flex-col items-center space-y-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            slot.skill === 'Beginner' ? 'bg-green-100 text-green-800' :
                            slot.skill === 'Intermediate' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {slot.skill}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            slot.ageGroup === '12-14' ? 'bg-pink-100 text-pink-800' :
                            'bg-indigo-100 text-indigo-800'
                          }`}>
                            {slot.ageGroup}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="relative z-10 text-xs flex flex-col items-center space-y-1">
                        <span className="font-medium text-green-600">0/8 students</span>
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                          ✨ Available
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>

    {/* Book Now Section - Mobile Optimized */}
    {selectedSlots.length > 0 && (
      <div className="mt-8 sm:mt-10 text-center animate-slideInUp">
        <p className="mb-4 sm:mb-6 text-gray-700 font-semibold text-lg sm:text-xl">
          {selectedSlots.length === 1 
            ? `🎯 You have selected 1 session`
            : `🎯 You have selected ${selectedSlots.length} sessions`
          }
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-6">
          <button
            onClick={() => setSelectedSlots([])}
            className="group px-6 py-3 sm:px-8 sm:py-4 bg-gray-200 text-gray-700 rounded-2xl hover:bg-gray-300 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 text-sm sm:text-base"
          >
            <span className="group-hover:animate-bounce inline-block mr-2">🗑️</span>
            Clear All
          </button>
          <button
            onClick={() => {
              const sessions = selectedSlots.map(slotKey => {
                const [day, time] = slotKey.split('-');
                const dayName = new Date(day).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                });
                return `${dayName} at ${time}`;
              }).join(', ');
              alert(`🎉 Booking confirmed for: ${sessions}`);
              setSelectedSlots([]);
            }}
            className="group px-8 py-3 sm:px-10 sm:py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-bold shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105 active:scale-95 text-sm sm:text-base"
          >
            <span className="group-hover:animate-bounce inline-block mr-2">🚀</span>
            Book {selectedSlots.length} Session{selectedSlots.length > 1 ? 's' : ''}
          </button>
        </div>
      </div>
    )}
  </div>
)}

{activeTab === "Buy" && (
  <div className="bg-white/80 backdrop-blur-lg p-4 sm:p-6 lg:p-8 rounded-3xl shadow-2xl border border-white/30 animate-fadeIn">
    <div className="flex items-center justify-between mb-4 sm:mb-6">
      <h2 className="text-xl sm:text-2xl">Piano Lesson Packages</h2>
      {cart.length > 0 && (
        <button
          onClick={() => setShowCart(!showCart)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          🛒
          Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
        </button>
      )}
    </div>

    {showCart && (
      <div className="mb-8 bg-slate-50 rounded-xl p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Your Cart</h3>
          <button
            onClick={() => setShowCart(false)}
            className="text-slate-500 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
        
        {cart.length === 0 ? (
          <p className="text-slate-500">Your cart is empty</p>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-white p-4 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-slate-600">{item.category}</p>
                    <p className="text-sm font-medium text-indigo-600">{item.price}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartItemQuantity(item.id, Math.max(0, item.quantity - 1))}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">Total: ${getCartTotal()}</span>
                <div className="flex gap-2">
                  <button
                    onClick={clearCart}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    Clear Cart
                  </button>
                  <Link href="/checkout/">
                    <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                      Checkout
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    )}
    
    <div className="mb-8 sm:mb-12">
      <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-slate-700">Individual Lessons</h3>
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { 
            id: "single-lesson",
            name: "Single Lesson", 
            price: "$30", 
            priceValue: 30,
            desc: "One 30-minute session",
            popular: false,
            category: "Individual Lessons",
            features: ["Individual attention", "Flexible scheduling", "Perfect for trying out"]
          },
          { 
            id: "4-pack",
            name: "4-Pack", 
            price: "$115", 
            priceValue: 115,
            desc: "Save $5 on 4 lessons",
            popular: false,
            category: "Individual Lessons",
            features: ["$28.75 per lesson", "1-month validity", "Great for beginners"]
          },
          { 
            id: "8-pack",
            name: "8-Pack", 
            price: "$220", 
            priceValue: 220,
            desc: "Save $20 on 8 lessons",
            popular: true,
            category: "Individual Lessons",
            features: ["$27.50 per lesson", "2-month validity", "Most popular choice"]
          },
          { 
            id: "12-pack",
            name: "12-Pack", 
            price: "$315", 
            priceValue: 315,
            desc: "Save $45 on 12 lessons",
            popular: false,
            category: "Individual Lessons",
            features: ["$26.25 per lesson", "3-month validity", "Best value"]
          },
        ].map((pkg) => (
          <div key={pkg.id} className={`rounded-2xl bg-white/80 shadow-xl border border-white/30 p-5 sm:p-7 flex flex-col relative transition-all hover:shadow-2xl ${pkg.popular ? 'border-indigo-200 ring-2 ring-indigo-100' : 'border-slate-200'}`}>
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 md:-top-4 md:left-4 md:translate-x-0">
                <span className="bg-indigo-600 text-white px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium whitespace-nowrap shadow-md">
                  Most Popular
                </span>
              </div>
            )}
            <h4 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">{pkg.name}</h4>
            <p className="text-sm sm:text-base text-slate-600 mb-3">{pkg.desc}</p>
            <p className="text-2xl sm:text-3xl font-bold text-indigo-600 mb-4">{pkg.price}</p>
            <ul className="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6 space-y-1 sm:space-y-2">
              {pkg.features.map((feature, idx) => (
                <li key={idx} className="flex items-center">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full mr-2 sm:mr-3 flex-shrink-0"></span>
                  <span className="leading-tight">{feature}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-3 mt-auto">
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => updateQuantity(pkg.id, Math.max(0, (quantities[pkg.id] || 0) - 1))}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  −
                </button>
                <span className="w-8 text-center font-medium">{quantities[pkg.id] || 0}</span>
                <button
                  onClick={() => updateQuantity(pkg.id, (quantities[pkg.id] || 0) + 1)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
              
              <button
                onClick={() => addToCart(pkg)}
                disabled={!quantities[pkg.id] || quantities[pkg.id] === 0}
                className="w-full py-3 rounded-lg font-medium transition-colors disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {quantities[pkg.id] > 0 ? `Add ${quantities[pkg.id]} to Cart` : 'Select Quantity'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="mb-8 sm:mb-12">
      <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-slate-700">Extended Lessons</h3>
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { 
            id: "45-min-single",
            name: "45-Minute Single", 
            price: "$40", 
            priceValue: 40,
            desc: "Extended individual session", 
            duration: "45 minutes",
            category: "Extended Lessons"
          },
          { 
            id: "45-min-6pack",
            name: "45-Minute 6-Pack", 
            price: "$225", 
            priceValue: 225,
            desc: "Save $15 on extended lessons", 
            duration: "6 x 45-minute sessions",
            category: "Extended Lessons"
          },
          { 
            id: "60-min-single",
            name: "60-Minute Single", 
            price: "$50", 
            priceValue: 50,
            desc: "Full hour private lesson", 
            duration: "60 minutes",
            category: "Extended Lessons"
          },
        ].map((item) => (
          <div key={item.id} className="border border-slate-200 rounded-lg p-4 sm:p-5 bg-white shadow-sm hover:shadow-md transition-all">
            <h4 className="text-base sm:text-lg font-semibold text-slate-800 mb-2">{item.name}</h4>
            <p className="text-slate-600 text-xs sm:text-sm mb-2">{item.desc}</p>
            <p className="text-xs text-slate-500 mb-3">{item.duration}</p>
            <p className="text-lg sm:text-3xl font-bold text-indigo-600 mb-3 sm:mb-4">{item.price}</p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => updateQuantity(item.id, Math.max(0, (quantities[item.id] || 0) - 1))}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  −
                </button>
                <span className="w-8 text-center font-medium">{quantities[item.id] || 0}</span>
                <button
                  onClick={() => updateQuantity(item.id, (quantities[item.id] || 0) + 1)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
              
              <button
                onClick={() => addToCart(item)}
                disabled={!quantities[item.id] || quantities[item.id] === 0}
                className="w-full py-3 rounded-lg font-medium transition-colors disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {quantities[item.id] > 0 ? `Add ${quantities[item.id]} to Cart` : 'Select Quantity'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="mb-8 sm:mb-12">
      <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-slate-700">Monthly Unlimited</h3>
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {[
          { 
            id: "unlimited-standard",
            name: "Unlimited Standard", 
            price: "$199/month", 
            priceValue: 199,
            desc: "Unlimited 30-minute lessons",
            category: "Monthly Unlimited",
            features: ["Book up to 2 lessons per day", "30-minute sessions", "Cancel anytime", "Practice room access"]
          },
          { 
            id: "unlimited-premium",
            name: "Unlimited Premium", 
            price: "$299/month", 
            priceValue: 299,
            desc: "Unlimited lessons + perks",
            category: "Monthly Unlimited",
            features: ["Mix of 30, 45, 60-minute sessions", "Priority booking", "Sheet music library access", "Recital preparation included"]
          },
        ].map((membership) => (
          <div key={membership.id} className="border border-slate-200 rounded-xl p-4 sm:p-6 bg-white shadow-sm hover:shadow-md transition-all">
            <h4 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">{membership.name}</h4>
            <p className="text-sm sm:text-base text-slate-600 mb-3">{membership.desc}</p>
            <p className="text-xl sm:text-2xl font-bold text-indigo-600 mb-4">{membership.price}</p>
            <ul className="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6 space-y-1 sm:space-y-2">
              {membership.features.map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full mr-2 sm:mr-3 flex-shrink-0 mt-1.5"></span>
                  <span className="leading-tight">{feature}</span>
                </li>
              ))}
            </ul>
            
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => updateQuantity(membership.id, Math.max(0, (quantities[membership.id] || 0) - 1))}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  −
                </button>
                <span className="w-8 text-center font-medium">{quantities[membership.id] || 0}</span>
                <button
                  onClick={() => updateQuantity(membership.id, (quantities[membership.id] || 0) + 1)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
              
              <button
                onClick={() => addToCart(membership)}
                disabled={!quantities[membership.id] || quantities[membership.id] === 0}
                className="w-full py-3 rounded-lg font-medium transition-colors disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {quantities[membership.id] > 0 ? `Add ${quantities[membership.id]} to Cart` : 'Select Quantity'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div>
      <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-slate-700">Special Programs</h3>
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { 
            id: "recital-prep",
            name: "Recital Prep Package", 
            price: "$150", 
            priceValue: 150,
            desc: "5 focused sessions for performance",
            duration: "5 x 45-minute sessions",
            category: "Special Programs"
          },
          { 
            id: "theory-intensive",
            name: "Theory Intensive", 
            price: "$120", 
            priceValue: 120,
            desc: "4 sessions focused on music theory",
            duration: "4 x 30-minute sessions",
            category: "Special Programs"
          },
          { 
            id: "sight-reading",
            name: "Sight-Reading Bootcamp", 
            price: "$100", 
            priceValue: 100,
            desc: "6 sessions to improve reading skills",
            duration: "6 x 30-minute sessions",
            category: "Special Programs"
          },
        ].map((program) => (
          <div key={program.id} className="border border-slate-200 rounded-lg p-4 sm:p-5 bg-white shadow-sm hover:shadow-md transition-all">
            <h4 className="text-base sm:text-lg font-semibold text-slate-800 mb-2">{program.name}</h4>
            <p className="text-slate-600 text-xs sm:text-sm mb-2">{program.desc}</p>
            <p className="text-xs text-slate-500 mb-3">{program.duration}</p>
            <p className="text-lg sm:text-3xl font-bold text-indigo-600 mb-3 sm:mb-4">{program.price}</p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => updateQuantity(program.id, Math.max(0, (quantities[program.id] || 0) - 1))}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  −
                </button>
                <span className="w-8 text-center font-medium">{quantities[program.id] || 0}</span>
                <button
                  onClick={() => updateQuantity(program.id, (quantities[program.id] || 0) + 1)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
              
              <button
                onClick={() => addToCart(program)}
                disabled={!quantities[program.id] || quantities[program.id] === 0}
                className="w-full py-3 rounded-lg font-medium transition-colors disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {quantities[program.id] > 0 ? `Add ${quantities[program.id]} to Cart` : 'Select Quantity'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}

{activeTab === "Upcoming" && (
  <div className="max-w-6xl mx-auto animate-fadeIn">
    {/* Header Section */}
    <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-8 rounded-3xl shadow-2xl text-white overflow-hidden mb-8">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/90 to-teal-600/90"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
      
      <div className="relative z-10 flex items-center">
        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl mr-6 shadow-lg">
          📅
        </div>
        <div>
          <h2 className="text-4xl font-bold mb-2 animate-slideInLeft">
            Upcoming Lessons
          </h2>
          <p className="text-xl text-emerald-100 animate-slideInLeft animation-delay-200">
            Your scheduled piano sessions
          </p>
        </div>
      </div>
    </div>

    {/* Lessons Grid */}
    <div className="space-y-6">
      {[
        {
          date: "June 10, 2024",
          time: "10:00 AM",
          student: "Timmy Turner",
          level: "Beginner",
          ageGroup: "12-14",
          status: "confirmed",
          daysTill: 0
        },
        {
          date: "June 12, 2024", 
          time: "1:00 PM",
          student: "Timmy Turner",
          level: "Beginner", 
          ageGroup: "12-14",
          status: "confirmed",
          daysTill: 2
        }
      ].map((lesson, index) => (
        <div 
          key={index}
          className="group bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-slideInUp"
          style={{ animationDelay: `${index * 200}ms` }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Lesson Info */}
            <div className="flex items-center space-x-6">
              {/* Date Circle */}
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-xs font-medium">
                    {new Date(lesson.date).toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}
                  </span>
                  <span className="text-xl font-bold">
                    {new Date(lesson.date).getDate()}
                  </span>
                </div>
                {lesson.daysTill === 0 && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">!</span>
                  </div>
                )}
              </div>

              {/* Lesson Details */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    {lesson.time}
                  </h3>
                  {lesson.daysTill === 0 && (
                    <span className="px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold rounded-full animate-pulse">
                      TODAY
                    </span>
                  )}
                  {lesson.daysTill > 0 && (
                    <span className="px-3 py-1 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 text-xs font-bold rounded-full">
                      IN {lesson.daysTill} DAY{lesson.daysTill > 1 ? 'S' : ''}
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center text-gray-700 font-semibold">
                    <span className="mr-2 text-xl">🎹</span>
                    Piano - {lesson.student}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    lesson.level === 'Beginner' ? 'bg-green-100 text-green-800' :
                    lesson.level === 'Intermediate' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {lesson.level}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    lesson.ageGroup === '12-14' ? 'bg-pink-100 text-pink-800' :
                    'bg-indigo-100 text-indigo-800'
                  }`}>
                    {lesson.ageGroup}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button className="group/btn px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-2xl hover:from-amber-500 hover:to-orange-500 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105">
                <span className="group-hover/btn:animate-bounce inline-block mr-2">🔄</span>
                Reschedule
              </button>
              <button className="group/btn px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105">
                <span className="group-hover/btn:animate-bounce inline-block mr-2">❌</span>
                Cancel
              </button>
            </div>
          </div>

          {/* Progress Bar for today's lesson */}
          {lesson.daysTill === 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Session starts in:</span>
                <span className="text-sm font-bold text-emerald-600">2 hours 30 minutes</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-lg relative overflow-hidden animate-pulse" style={{ width: '75%' }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>

    {/* No More Lessons Message */}
    <div className="mt-8 text-center p-8 bg-gradient-to-r from-gray-50 to-white rounded-3xl border-2 border-gray-100 shadow-lg">
      <div className="text-6xl mb-4">🎵</div>
      <p className="text-gray-600 font-medium text-lg">
        That&apos;s all your upcoming lessons! Ready to book more?
      </p>
      <button
        onClick={() => setActiveTab("Book")}
        className="mt-4 px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
      >
        <span className="mr-2">📅</span>
        Book New Lessons
      </button>
    </div>
  </div>
)}

{activeTab === "Account" && (
  <div className="max-w-2xl mx-auto animate-fadeIn px-4 sm:px-6 lg:px-8">
    <div className="my-12 sm:my-16 pb-24 sm:pb-32">
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl shadow-xl px-6 py-8 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-purple-800 mb-3">Demo Dashboard</h2>
        <p className="text-gray-700 text-base sm:text-lg mb-2">
          This is a demo dashboard. No real personal or payment data is stored, and no bookings or purchases are processed. You can explore the dashboard features, view example lessons, and try out the booking and homework sections. All actions are for demonstration only.
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <span className="text-green-600 text-lg">🔒</span>
          <span className="text-gray-700 font-medium text-sm sm:text-base">Your data is secure</span>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <button
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-lg hover:from-indigo-600 hover:to-purple-600 transition-all"
            onClick={() => router.push('/login?mode=signup')}
          >
            Create an Account
          </button>
          <button
            className="px-6 py-3 rounded-xl bg-white border border-indigo-300 text-indigo-700 font-semibold shadow hover:bg-indigo-50 transition-all"
            onClick={() => window.open('/login', '_blank')}
          >
            Log In
          </button>
        </div>
      </div>
    </div>
    {/* Additional Info */}
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200 text-center">
      <div className="flex items-center justify-center gap-2 text-blue-700 font-medium">
        <span className="text-xl">🔒</span>
        <span>Your data is secure and private</span>
      </div>
    </div>
  </div>
)}

      </main>

      {/* Bottom Mobile Nav 
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex justify-around bg-white border-t border-gray-300 shadow-md p-2 md:hidden">
        {tabs.map((tab) => (
     <button
      key={tab}
      onClick={() => {
        setActiveTab(tab);
        if (tab !== "Book") setSelectedSlots([]);
      }}
      className="flex flex-col items-center justify-center text-[10px] sm:text-xs"
    >
      <span
        className={`text-lg p-2 rounded-xl transition-all duration-200 ${
          activeTab === tab
            ? "bg-gradient-to-tr from-purple-500 to-indigo-500 text-white shadow-md"
            : "text-gray-500"
        }`}
      >
        {getTabIcon(tab)}
      </span>
    </button>

        ))}
      </nav>


      {/* Custom styles for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
        .animate-slideInLeft { animation: slideInLeft 0.6s ease-out; }
        .animate-slideInDown { animation: slideInDown 0.4s ease-out; }
        .animate-slideInUp { animation: slideInUp 0.5s ease-out; }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out; }
        .animate-shimmer { animation: shimmer 2s infinite; }
        .animation-delay-200 { animation-delay: 200ms; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
}



