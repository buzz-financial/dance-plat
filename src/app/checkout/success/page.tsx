"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CheckoutSuccessPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 sm:p-12 text-center border border-white/30">
          {/* Success Icon */}
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-8">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">
            Payment Successful! 🎉
          </h1>
          
          <p className="text-lg text-slate-600 mb-8">
            Thank you for your purchase! Your piano lesson package has been confirmed.
          </p>

          {/* Order Details */}
          <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Order Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Order Number:</span>
                <span className="font-medium text-slate-800">#ML-{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Date:</span>
                <span className="font-medium text-slate-800">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Package:</span>
                <span className="font-medium text-slate-800">Piano Lesson Package</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Status:</span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Confirmed</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-indigo-50 rounded-2xl p-6 mb-8 text-left">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">What happens next?</h2>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</div>
                <div>
                  <p className="font-medium text-slate-800">Confirmation Email</p>
                  <p className="text-sm text-slate-600">You&apos;ll receive a confirmation email with your receipt and package details within the next few minutes.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</div>
                <div>
                  <p className="font-medium text-slate-800">Schedule Your Lessons</p>
                  <p className="text-sm text-slate-600">Our team will contact you within 24 hours to schedule your first lesson based on your preferences.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</div>
                <div>
                  <p className="font-medium text-slate-800">Start Learning!</p>
                  <p className="text-sm text-slate-600">Get ready to begin your musical journey with our experienced instructors.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/demodashboard/studentdash"
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link 
              href="/"
              className="bg-slate-100 text-slate-700 px-8 py-3 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
            >
              Back to Home
            </Link>
          </div>

          {/* Contact Info */}
          <div className="mt-8 pt-8 border-t border-slate-200">
            <p className="text-sm text-slate-600 mb-2">
              Questions about your purchase?
            </p>
            <p className="text-sm text-slate-600">
              Contact us at <a href="mailto:support@musiclessons.com" className="text-indigo-600 hover:text-indigo-700">support@musiclessons.com</a> or call <a href="tel:+1234567890" className="text-indigo-600 hover:text-indigo-700">(123) 456-7890</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}