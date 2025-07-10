// app/demodashboard/teacherdash/teacherlogin/page.tsx
"use client";
import dynamic from "next/dynamic";


console.log('TeacherLoginPage loaded');
const TeacherLogin = dynamic(() => {
  console.log('Dynamic import for TeacherLoginInner triggered');
  return import("@/components/teacherlogin");
}, { ssr: false });

export default function TeacherLoginPage() {
  console.log('TeacherLoginPage render function called');
  return <TeacherLogin />;
}
