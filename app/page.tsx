'use client'

import { VscReferences, VscWholeWord, } from "react-icons/vsc";
import { FaBrain } from "react-icons/fa";
import Header from "@/app/Header/Header.jsx"
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/Database/Firebase"
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [visibleSections, setVisibleSections] = useState(new Set());

  const router = useRouter();

  // redirect to profile if user is logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User is logged in", user);
        router.push('/profile')
      } else {
        console.log("User is signed out");
      }
    })

    return () => unsubscribe()
  }, [router])


  // for the animation effect for all components
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white text-black font-['Inter']">
      {/* Header */}
      {/* In the layout.tsx */}

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 mt-15 leading-tight animate-fade-in-up">
            Get All Your University Tools In One Place
          </h1>
          <p className="text-xl text-gray-600 mb-8 animate-fade-in-up animation-delay-200">
            Simplifying your University Life
          </p>
          <Link href="/signup">
            <button className="px-8 py-4 bg-purple-600 text-white rounded-lg text-lg hover:bg-purple-700 transition-colors animate-fade-in-up animation-delay-400">
              Get Started
            </button>
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section
        id="about-section"
        data-animate
        className={`py-20 px-6 bg-gray-50 transition-all duration-1000 ${visibleSections.has('about-section')
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-20'
          }`}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">About Us</h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg text-gray-700 mb-4">
                Universitifier is transforming the way students complete their assignment and study for exams.
              </p>
              <p className="text-lg text-gray-700">
                We believe in making tools that students really need to save time and energy.
              </p>
            </div>
            <div className="bg-purple-100 h-64 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 font-semibold">[About Image Placeholder]</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features-section"
        data-animate
        className={`py-20 px-6 transition-all duration-1000 ${visibleSections.has('features-section')
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-20'
          }`}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div
              className={`p-6 border border-gray-200 rounded-lg hover:border-purple-600 transition-all duration-700 ${visibleSections.has('features-section')
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-20'
                }`}
              style={{ transitionDelay: '100ms' }}
            >
              <div className="w-12 h-12 bg-purple-600 rounded-lg mb-4 flex items-center justify-center"><VscReferences className="h-8 w-8 text-white" /></div>
              <h3 className="text-xl font-semibold mb-3">Harward Style Reference Generator</h3>
              <p className="text-gray-600">Generate references for your assignment in Harward style with just a few clicks.</p>
            </div>
            <div
              className={`p-6 border border-gray-200 rounded-lg hover:border-purple-600 transition-all duration-700 ${visibleSections.has('features-section')
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-20'
                }`}
              style={{ transitionDelay: '200ms' }}
            >
              <div className="w-12 h-12 bg-purple-600 rounded-lg mb-4 flex items-center justify-center"><VscWholeWord className="h-8 w-8 text-white" /></div>
              <h3 className="text-xl font-semibold mb-3">Word Counter</h3>
              <p className="text-gray-600">Count the words in your assignment with just a few clicks.</p>
            </div>
            <div
              className={`p-6 border border-gray-200 rounded-lg hover:border-purple-600 transition-all duration-700 ${visibleSections.has('features-section')
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-20'
                }`}
              style={{ transitionDelay: '300ms' }}
            >
              <div className="w-12 h-12 bg-purple-600 rounded-lg mb-4 flex items-center justify-center"><FaBrain className="h-8 w-8 text-white" /></div>
              <h3 className="text-xl font-semibold mb-3">GenAI Tools</h3>
              <p className="text-gray-600">Use GenAI tools to generate content for your assignment with just a few clicks.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Section */}
      <section
        id="upcoming-section"
        data-animate
        className={`py-20 px-6 bg-gray-50 transition-all duration-1000 ${visibleSections.has('upcoming-section')
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-20'
          }`}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Upcoming</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div
              className={`bg-white p-8 rounded-lg shadow-sm border border-gray-200 transition-all duration-700 ${visibleSections.has('upcoming-section')
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-20'
                }`}
              style={{ transitionDelay: '100ms' }}
            >
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Upcoming Feature 1</h3>
                  <p className="text-gray-600">Details about exciting new features coming soon to Universitifier.</p>
                </div>
              </div>
            </div>
            <div
              className={`bg-white p-8 rounded-lg shadow-sm border border-gray-200 transition-all duration-700 ${visibleSections.has('upcoming-section')
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-20'
                }`}
              style={{ transitionDelay: '200ms' }}
            >
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Upcoming Feature 2</h3>
                  <p className="text-gray-600">More innovations on the horizon to enhance your experience.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}