'use client'

import React from 'react'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/Database/Firebase'
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { FcGoogle } from 'react-icons/fc'
import { GoogleAuthProvider } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/Database/Firebase'
import { FirebaseError } from 'firebase/app'
import { Button } from "@/components/ui/button"

function Page() {
    const router = useRouter()
    const provider = new GoogleAuthProvider();

    const [formError, setFormError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState('');

    const handleGoogleSignIn = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const res = await fetch('/api/v1/user/signup', {
                method: 'POST',
                body: JSON.stringify({ idToken: user.getIdToken() }),
            });

            if (!res.ok) {
                setFormError('Failed to create session cookie');
            }

            // Check if user exists in firebase
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            // Does not exist
            if (!userDoc.exists()) {
                await setDoc(userDocRef, {
                    name: user.displayName,
                    email: user.email,
                    university: null,
                    profileCompleted: false,
                });
                router.push('/complete-profile'); // redirect to complete-profile for university data

            } else {
                // Exists
                const userData = userDoc.data()
                if (!userData.university || !userData.profileCompleted) {
                    router.push('/complete-profile'); // redirect to complete-profile for university data
                }
                router.push('/profile'); // redirect to profile
            }

        } catch (error) {
            console.error('Error signing in with Google:', error);
            if (error instanceof FirebaseError && error.code === 'auth/popup-closed-by-user') {
                setFormError('Sign-in cancelled')
            } else {
                setFormError('Failed to sign in with Google. Please try again.')
            }
        }
    };

    return (
        <div className="container relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
            {/* Left Side: Branding/Quote */}
            <div className="relative hidden h-full flex-col bg-muted pl-10 pt-5 text-white dark:border-r lg:flex">
                <div className="absolute inset-0 bg-zinc-900" />
                <Link href="/" className="relative z-20 flex items-center text-lg font-medium">
                    Universitifier
                </Link>
            </div>

            {/* Right Side: Sign Up Form */}
            <div className="lg:p-8 bg-black h-full flex items-center">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <Link
                        href="/signup"
                        className="absolute right-4 top-4 md:right-8 md:top-8 text-sm font-medium text-white hover:underline"
                    >
                        Sign Up
                    </Link>
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight text-white">
                            Login to your account
                        </h1>
                        <p className="text-sm text-zinc-400">
                            Login to your account using Google
                        </p>
                    </div>

                    <div className="grid gap-6 justify-center ">
                        <div className="relative">
                            <Button
                                variant="outline"
                                type="button"
                                disabled={isLoading}
                                onClick={handleGoogleSignIn}
                                className="border-zinc-800 bg-transparent py-5 px-20 text-white"
                            >
                                <FcGoogle className="mr-2 h-8 w-8" />
                                Google
                            </Button>
                        </div>

                        {/* Error message */}
                        {formError && (
                            <div className="text-red-500 text-center">{formError}</div>
                        )}
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-zinc-800" />
                        </div>
                    </div>

                    <p className="px-8 text-center text-sm text-zinc-400">
                        By clicking continue, you agree to our{" "}
                        <Link href="/terms" className="underline underline-offset-4 hover:text-white">
                            Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="underline underline-offset-4 hover:text-white">
                            Privacy Policy
                        </Link>
                        .
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Page
