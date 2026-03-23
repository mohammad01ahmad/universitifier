"use client";
import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import Image from 'next/image';

const FloatingNav = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isFooterInView, setIsFooterInView] = useState(false);

    const MotionImage = motion(Image);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    // Track footer visibility
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsFooterInView(entry.isIntersecting);
            },
            {
                threshold: 0.1, // Trigger when 10% of footer is visible
                rootMargin: '-100px 0px 0px 0px' // Offset from top
            }
        );

        const footerElement = document.querySelector('footer');
        if (footerElement) {
            observer.observe(footerElement);
        }

        return () => {
            if (footerElement) {
                observer.unobserve(footerElement);
            }
        };
    }, []);

    const navItems = [
        { name: 'About', href: '/', icon: '/images/home.png' },
        { name: 'Features', href: '/features', icon: '/images/work.png' },
        { name: 'Contact', href: '/contact', icon: '/images/projects.png' }
    ];

    const menuVariants = {
        closed: { height: 0, opacity: 0, marginBottom: 0 },
        open: { height: "auto", opacity: 1, marginBottom: 16 }
    };

    return (
        <motion.div
            className="py-2 pl-2 pr-4 md:pr-8 rounded-2xl md:rounded-[20px] bg-neutral-900 border border-neutral-800 fixed left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 bottom-4 md:bottom-6 md:w-[640px] lg:w-[700px] z-50 overflow-hidden shadow-2xl"
            ref={ref}
            animate={{
                translateY: isFooterInView ? 200 : 0
            }}
            transition={{
                duration: 0.6,
                ease: [0.25, 1, 0.5, 1]
            }}
        >
            {/* Rest of your FloatingNav code remains exactly the same */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={menuVariants}
                        transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
                        className="overflow-hidden"
                    >
                        <nav className="flex flex-col gap-4">
                            {navItems.map((item) => (
                                <a key={item.name} className="flex items-center gap-5 group cursor-pointer " href={item.href}>
                                    <div className="w-[60px] h-[60px] md:w-[80px] md:h-[80px] bg-neutral-900 rounded-lg md:rounded-xl overflow-hidden relative group">
                                        <motion.div
                                            className="w-full h-full"
                                            initial={{ y: "100%" }}
                                            animate={isInView ? { y: 0 } : { y: "100%" }}
                                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                                        >
                                            <Image
                                                src={item.icon}
                                                alt={item.name}
                                                fill
                                                priority // Forces early loading for performance
                                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                                sizes="(max-width: 768px) 60px, 80px"
                                            />
                                        </motion.div>
                                    </div>

                                    <div className="overflow-hidden h-8">
                                        <div className="flex flex-col transition-transform duration-500 ease-out group-hover:-translate-y-1/2">
                                            <motion.span
                                                initial={{ y: "100%" }}
                                                animate={isInView ? { y: 0 } : { y: "100%" }}
                                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                                                className="text-lg md:text-xl font-semibold text-neutral-100 mb-1.5">{item.name}</motion.span>
                                            <motion.span
                                                initial={{ y: "100%" }}
                                                animate={isInView ? { y: 0 } : { y: "100%" }}
                                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                                                className="text-lg md:text-xl font-semibold text-neutral-100 mb-1.5">{item.name}</motion.span>
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </nav>
                        <div className="pt-4 pb-4">
                            <div className="h-px bg-neutral-800 w-full" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 md:gap-5">
                    <div className="h-[60px] w-[60px] md:h-[80px] md:w-[80px] rounded-lg md:rounded-xl bg-neutral-100 overflow-hidden relative">
                        <video src="/video/memoji-video-bg-white.mp4" autoPlay muted loop playsInline className="absolute top-[52%] left-[47%] -translate-x-1/2 -translate-y-1/2 h-full w-full scale-140" />
                    </div>

                    <div className="flex flex-col gap-1.5 md:gap-2 w-[180px] sm:w-[400px] relative">
                        <a className="md:text-lg font-semibold text-neutral-100 uppercase" href="/">UNIVERSITIFIER</a>

                        <div className="flex items-center h-4 overflow-hidden relative w-full">
                            <div className="absolute left-0 h-full w-8 bg-gradient-to-r from-neutral-900 to-transparent z-10" />
                            <div className="absolute right-0 h-full w-8 bg-gradient-to-l from-neutral-900 to-transparent z-10" />

                            <motion.div
                                animate={{ x: [0, -1000] }}
                                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                                className="flex whitespace-nowrap gap-4"
                            >
                                <p className="text-[10px] md:text-xs tracking-widest text-neutral-300 uppercase">
                                    Get your assignment done in one platform • AI Assistant •
                                </p>
                                <p className="text-[10px] md:text-xs tracking-widest text-neutral-300 uppercase">
                                    Get your assignment done in one platform • AI Assistant •
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
                >
                    <motion.div animate={{ rotate: isOpen ? 90 : 0 }}>
                        {isOpen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-100"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-100"><line x1="3" x2="21" y1="12" y2="12" /><line x1="3" x2="21" y1="6" y2="6" /><line x1="3" x2="21" y1="18" y2="18" /></svg>
                        )}
                    </motion.div>
                </button>
            </div>
        </motion.div>
    );
};

export default FloatingNav;
