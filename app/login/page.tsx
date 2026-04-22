'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/database/Firebase'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { FcGoogle } from 'react-icons/fc'
import { FirebaseError } from 'firebase/app'
import { setCsrfToken } from '@/lib/security/csrfProtection'
import { IoSchoolSharp } from "react-icons/io5";
import { FaArrowLeft } from "react-icons/fa";
import { Loader2 } from 'lucide-react';

function Page() {
    const router = useRouter()
    const provider = new GoogleAuthProvider();

    const [formError, setFormError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // This line forces the account selection screen
    provider.setCustomParameters({
        prompt: 'select_account'
    });

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            // 1. Sign in on the client
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // 2. Get ID token from Firebase
            const idToken = await user.getIdToken();

            // 3. Get csrf Token for security
            const csrfToken = await setCsrfToken();

            // 4. CALL YOUR API (This sets the HTTP-only Cookie)
            const res = await fetch('/api/v1/user/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                },
                body: JSON.stringify({ idToken }),
            });

            if (!res.ok) {
                setFormError('Failed to sign in');
                return;
            }

            const data = await res.json();

            // 4. Redirect to the correct page
            router.push(data.redirectTo);
            console.log("login success")
        } catch (error) {
            console.error('Error signing in with Google:', error);
            setIsLoading(false);
            if (error instanceof FirebaseError && error.code === 'auth/popup-closed-by-user') {
                setFormError('Sign-in cancelled')
            } else {
                setFormError('Failed to sign in with Google. Please try again.')
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="animate-spin text-2xl" />
            </div>
        )
    }

    return (
        <section className="bg-surface text-on-surface font-body min-h-screen flex flex-col overflow-x-hidden">
            {/* <!-- TopAppBar --> */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent">
                <div className="flex justify-between items-center w-full px-8 py-6 max-w-7xl mx-auto">
                    <div onClick={() => router.push('/')} className="text-2xl font-bold text-emerald-900 font-headline tracking-tight cursor-pointer">Universitifier</div>
                </div>
            </nav>

            {/* <!-- Main Content Canvas --> */}
            <main className="flex-grow flex items-center justify-center px-6 pt-24 pb-12 relative overflow-hidden">
                {/* <!-- Subtle Academic Decorative Elements --> */}
                <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-primary-container/20 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[35rem] h-[35rem] bg-tertiary-container/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="w-full max-w-md z-10">
                    {/* <!-- Login Card --> */}
                    <div className="bg-surface-container-lowest editorial-shadow rounded-xl p-10 md:p-12 text-center transition-all duration-300">
                        {/* <!-- Brand Icon/Identity --> */}
                        <div className="mb-8 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-container text-on-primary-container">
                            <IoSchoolSharp className='text-4xl' />
                        </div>
                        {/* <!-- Headline --> */}
                        <h1 className="font-headline text-4xl md:text-5xl font-bold text-on-surface tracking-tight mb-4 bricolage leading-tight">
                            Welcome back, Student
                        </h1>
                        <p className="text-on-surface-variant text-lg mb-10 leading-relaxed font-body">
                            Your digital sanctuary for academic excellence and curated focus.
                        </p>

                        {/* Error message */}
                        {formError && (
                            <div className="mb-6 p-4 bg-error/10 text-error rounded-lg text-sm">
                                {formError}
                            </div>
                        )}

                        {/* <!-- Sign in with Google Button --> */}
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                            className="cursor-pointer w-full flex items-center justify-center gap-4 bg-surface-container-lowest border border-outline-variant/20 hover:bg-surface-container-low text-on-surface font-medium py-4 px-6 rounded-full transition-all duration-200 group active:scale-[0.98] disabled:opacity-50"
                        >
                            <FcGoogle className='text-2xl' />
                            <span className="text-base">Sign in with Google</span>
                        </button>

                        {/* Back button with arrow  */}
                        <button
                            onClick={() => router.back()}
                            disabled={isLoading}
                            className="mt-8 cursor-pointer w-full flex items-center justify-center gap-4 bg-surface-container-lowest text-on-surface font-medium py-4 px-6 rounded-full transition-all duration-200 group active:scale-[0.98] disabled:opacity-50"
                        >
                            <FaArrowLeft className='text-md' />
                            <span className="text-base">Back</span>
                        </button>
                    </div>
                </div>
            </main>
        </section>
    )
}

export default Page
