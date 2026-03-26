'use client'

import { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { BsStars } from "react-icons/bs";
import { IoPlayCircleOutline } from "react-icons/io5";
import { FaRegCalendarAlt } from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import { MdGroups2 } from "react-icons/md";
import { FaRegCheckCircle } from "react-icons/fa";
import Link from 'next/link';

export default function HomePage() {
  const [visibleSections, setVisibleSections] = useState(new Set());

  const router = useRouter();

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
      <Header />

      {/* Hero Section */}
      <section className="relative px-8 pt-40 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="z-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary-container text-on-primary-container text-xs font-bold tracking-widest uppercase mb-6">Elevate Your Academics</span>
            <h1 className="font-editorial font-bold text-6xl md:text-7xl text-on-surface leading-[1.1] tracking-tighter mb-8">
              Master Your Academic <span className="text-primary italic">Journey.</span>
            </h1>
            <p className="text-xl text-on-surface-variant max-w-xl mb-10 leading-relaxed">
              The scholarly catalyst for organizing assignments, tracking progress, and reaching your potential. Transform academic pressure into prestige.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/login" className="cursor-pointer bg-primary text-on-primary px-8 py-4 rounded-full text-lg font-bold hover:bg-primary-dim transition-all active:scale-95 shadow-xl shadow-primary/20">Get Started for Free</Link>
              <button className="cursor-pointer bg-surface-container-high text-on-surface px-8 py-4 rounded-full text-lg font-bold hover:bg-surface-container-highest transition-all active:scale-95 flex items-center gap-2">
                <IoPlayCircleOutline className='text-3xl' />
                View Demo
              </button>
            </div>
            <div className="mt-12 flex items-center gap-4">
              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full border-2 border-surface bg-zinc-300 overflow-hidden">
                  <img className="w-full h-full object-cover" data-alt="portrait of a smiling female student with glasses in a library" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBoqjiVNynoPiT10Szrja_QUcpBiO7dhUoZn8XIhRV6u2BhvgMjmqJqtZyU7-1wk22Gq_iWms5JnURjzckayjUS4tL7uIiZVlk-_tEeoj45Xlx3AoowWbIFAOhVZn98UMyd4bf3TXayHnMei3eJ6E7KzrD1D4EvbPc2FN4BTL1kfwYKwt8R6PVmOEuMPKjnLjZ0FNGgoJfpM2e8G5sukNUwSeD05cmVmFlscF47Wk8-M4NakmQxEeps6TAs4VUCjGWUDUhTiJEoYUG" />
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-surface bg-zinc-300 overflow-hidden">
                  <img className="w-full h-full object-cover" data-alt="headshot of a confident male university student outdoors" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOeGXFmMOJZWzz0lY8iar4M9ht_0sgs16weovNYqryLkO8FI7D9MZ9zHoLRyX5iQKfaDGx5t1Gcn1Mycc59MfMPbDRkCXPo6ffRJLwoHaVT-DXX6fblOnTfZASXklFBhwXYYf7E_D7yKvlK3dacqZG1zkDRdVaRYNDDnQpxbI8_mGY519BazEixTrYBXtYN-QFVVrcRIxtu29pDTGAfrKGaXCcPqw-GysW1eiLVyZWjPiJ4QF95f3vFMo4-_JVVDUdPXpyUQ1oOXmD" />
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-surface bg-zinc-300 overflow-hidden">
                  <img className="w-full h-full object-cover" data-alt="smiling young woman sitting in a modern study lounge" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4Fax36-DdBdy3ORJsKsq-VV3fp-bE_aQ-emWLOJqShPe35gZ2uE8l4EwebvqNf419_zCj7nla_XSu4OixSBNRQHWI5YYIMln05-a2L90gvAWfSHYm6sWa2dG4lvtvjcnIOq4YbvPoMhmCRtl9R9AFUypWCIihPCQ3I0fetGRev_vUmwNFfntJo6KQQSWQ6S9Qpfp8s9OxAo8fIthaBvTQl2flqt2tkpig5poedU0Y_Nf5AkhiRhO-TiS1ymPrrP9BS5077Ch_LBMY" />
                </div>
              </div>
              <p className="text-sm text-on-surface-variant font-medium">Joined by <span className="text-primary font-bold">12,000+</span> elite scholars</p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary-container/30 rounded-full blur-3xl"></div>
            <div className="relative rounded-xl overflow-hidden shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-700">
              <img className="w-full h-full object-cover aspect-[4/3]" data-alt="high-angle artistic shot of a clean workspace with laptop, notebook, and green tea in soft morning light" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEBAcm45kxPC-VNwyycJFhMoG4M1k1lwqgE7aa0RBUvQtpDG2CwGNJTg8-k3hm1azXBi2SbwQwrbDWVEDD5T0lNVkXUG7J9o0c5pLxHorezT8L4l3Cak-w1dx6AMvgSzCW9b3JDxCDrFj3H2H0LoKipWxgpUf98PP1O6IZ8EYE5m2MqC-ZfQA6NYuX7vtcoudaZ94vT11YaulmdhXU_mrN21QrAFGPqjtc0DhiiywkqKUX4PlRRpKnhANzy1itkEE3ZhFqVqFrPaJ2" />
              <div className="absolute bottom-6 left-6 right-6 p-6 glass-header rounded-xl border border-white/20">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-editorial text-lg">Active Session: Thesis Prep</span>
                  <span className="bg-primary text-on-primary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Deep Work</span>
                </div>
                <div className="w-full bg-white/90 h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-3/4 rounded-full"></div>
                </div>
              </div>
            </div>
            {/* <!-- Floating Card --> */}
            <div className="absolute -bottom-10 -left-10 p-6 bg-surface-container-lowest rounded-xl shadow-2xl max-w-[240px] border border-outline-variant/10 hidden md:block">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                  <BsStars className="text-primary text-xl" />
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant">Smart Priority</p>
                  <p className="text-sm font-editorial">Ethics Paper Due</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-error font-bold uppercase">Critical</span>
                <span className="text-xs font-medium text-on-surface-variant">2h 15m left</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-8 bg-surface-container-low">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 text-center">
            <h2 className="font-editorial font-bold text-4xl md:text-5xl text-on-surface mb-4">Built for Success</h2>
            <p className="text-on-surface-variant text-lg max-w-2xl mx-auto">Precision-engineered tools to streamline your academic workflow and eliminate digital friction.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* <!-- Feature 1: Dashboard --> */}
            <div className="md:col-span-2 bg-surface-container-lowest p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow group flex flex-col md:flex-row gap-8 overflow-hidden">
              <div className="flex-1">
                <div className="w-12 h-12 bg-primary-container rounded-lg flex items-center justify-center text-on-primary-container mb-6">
                  <MdDashboard className="text-primary text-2xl" />
                </div>
                <h3 className="font-editorial text-2xl mb-4">Elite Dashboard</h3>
                <p className="text-on-surface-variant leading-relaxed mb-6">A centralized hub for your academic life. View deadlines, active projects, and real-time progress metrics in one glance.</p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm font-medium text-on-surface">
                    <span className="text-primary text-lg"><FaRegCheckCircle /></span>
                    Customizable Widget Layout
                  </li>
                  <li className="flex items-center gap-2 text-sm font-medium text-on-surface">
                    <span className="text-primary text-lg"><FaRegCheckCircle /></span>
                    AI-Powered Task Sorter
                  </li>
                </ul>
              </div>
              <div className="flex-1 -mb-12 -mr-12 opacity-80 group-hover:opacity-100 transition-opacity">
                <img className="rounded-tl-xl w-full h-full object-cover shadow-2xl" data-alt="minimalistic abstract data visualization with soft green and white tones" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUEu-Rj1xL-DyGf6UowE_WOe_TPHAZLQh1COJ-XjPUnSI_h1ntEyFsxXFmwBcq_RXg2XUSxurwXfyl0OCidppYDVuwCff6GYpFNtj6iM-NKB4SUAw2_8TWhN7uuCXyPRNLwhzkOcyQE_gO_x2tQ5DHtzGDVm3GuROTB95MQkOvszPuax_mBmDSZy4o7J0EcoIPh0wrv455ceSnPiIbFlTopgNnZPY3Tlu4gjOEUVuqQJhICOA18JTMOYpzV_y-3h5XcVz3m3jt6SxB" />
              </div>
            </div>
            {/* <!-- Feature 2: Smart Calendar --> */}
            <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-secondary-container rounded-lg flex items-center justify-center text-on-secondary-container mb-6">
                <FaRegCalendarAlt className="text-primary text-xl" />
              </div>
              <h3 className="font-editorial text-2xl mb-4">Smart Calendar</h3>
              <p className="text-on-surface-variant leading-relaxed">Automatic course syllabus parsing that maps your entire semester in seconds. Never miss a deadline again.</p>
              <div className="mt-8 pt-8 border-t border-surface-container-high">
                <div className="flex items-center justify-between text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">
                  <span>Upcoming Weekly</span>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-surface-container rounded-lg flex justify-between items-center">
                    <span className="text-sm font-medium">Seminar Prep</span>
                    <span className="text-[10px] text-primary font-bold">MON</span>
                  </div>
                  <div className="p-3 bg-surface-container rounded-lg flex justify-between items-center border-l-4 border-primary">
                    <span className="text-sm font-medium">Midterm Exam</span>
                    <span className="text-[10px] text-primary font-bold">WED</span>
                  </div>
                </div>
              </div>
            </div>
            {/* <!-- Feature 3: Collaboration --> */}
            <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-tertiary-container rounded-lg flex items-center justify-center text-on-tertiary-container mb-6">
                <MdGroups2 className="text-primary text-2xl" />
              </div>
              <h3 className="font-editorial text-2xl mb-4">Sync Teams</h3>
              <p className="text-on-surface-variant leading-relaxed">Collaborate on group projects without the chaos. Shared task boards and integrated file sharing built for scholars.</p>
            </div>
            {/* <!-- Feature 4: Academic Integrity --> */}
            <div className="md:col-span-2 bg-primary p-8 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center gap-8">
              <div className="text-on-primary flex-1">
                <h3 className="font-editorial text-3xl mb-4">Scholarly Catalyst Engine</h3>
                <p className="opacity-90 leading-relaxed text-lg">We don't just list tasks. Our proprietary algorithm calculates "Prestige Momentum," rewarding consistent habits and deep-work sessions.</p>
                <button className="mt-8 bg-surface-container-lowest text-primary px-6 py-3 rounded-full font-bold hover:bg-white transition-colors">Learn Our Methodology</button>
              </div>
              <div className="flex-1 w-full flex justify-center">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle className="text-primary-dim" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeWidth="12"></circle>
                    <circle className="text-on-primary" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeDasharray="440" strokeDashoffset="110" strokeWidth="12"></circle>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-on-primary">
                    <span className="text-4xl font-editorial">75%</span>
                    <span className="text-[10px] font-bold uppercase">Focus Score</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-8">
        <div className="max-w-5xl mx-auto hero-gradient rounded-xl p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <img className="w-full h-full object-cover" data-alt="abstract artistic background with swirling textures and light patterns" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9T09fxRjIx6BMIm_M1BA_77PUL3jSFngPyzM8x51TM17QvhQ-NXcsCNECKeQriFH6stS99G28ZoMZj8gMhxftn_GggqvG6utmBFtP6lXnwG5Jjtrv4kLT7C6AfwAzoqsE7EYuDfL8EXICzZ2VCSo670IKBuhmoTS9TL_MXF66EQM7b0Fbt7WvTy_3vPCo266WhARnTMLCnXGscAjFed5KRZDAA-eJ8CvbXhjvybEtoPxgkjHbUhs2gbnG62BrtTKU54tqA2UXwOHr" />
          </div>
          <div className="relative z-10">
            <h2 className="font-editorial text-4xl md:text-6xl text-on-primary mb-8 tracking-tighter">Ready to catalyze your potential?</h2>
            <p className="text-on-primary/80 text-xl max-w-2xl mx-auto mb-12">Join the next generation of academic leaders. Get started with your personalized dashboard today.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login" className="bg-on-primary text-primary px-10 py-5 rounded-full text-xl font-bold hover:bg-white transition-all shadow-xl active:scale-95">Start For Free</Link>
              {/* <Link href="/pricing" className="bg-primary-dim/30 backdrop-blur-md text-on-primary border border-on-primary/20 px-10 py-5 rounded-full text-xl font-bold hover:bg-primary-dim/50 transition-all active:scale-95">Compare Plans</Link> */}
            </div>
            <p className="mt-8 text-on-primary/60 text-sm">No credit card required. Cancel anytime.</p>
          </div>
        </div>
      </section>


      {/* Footer */}
      <Footer />

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
