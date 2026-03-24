"use client"

import { useState } from 'react'
import { FcGoogle } from 'react-icons/fc'
import Link from 'next/link'
import { db, auth, GoogleAuthProvider, signInWithPopup } from '@/lib/Database/Firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
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
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if user exists in firebase
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          name: user.displayName,
          email: user.email,
          universityName: null,
          profileCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        const idToken = await userCredential.user.getIdToken();

        // Send this token to your API route to create a cookie
        const res = await fetch('/api/v1/user/login', {
          method: 'POST',
          body: JSON.stringify({ idToken })
        });

        if (!res.ok) {
          setFormError('Failed to create session cookie');
        }

        router.push('/complete-profile');

      } else {
        // Exists
        const userData = userDoc.data()
        if (!userData.universityName || !userData.profileCompleted) {
          router.push('/complete-profile'); // redirect to complete-profile for university data
        }
        router.push('/profile'); // redirect to profile
      }

    } catch (error) {
      // console.error('Error signing in with Google:', error);
      if (error instanceof FirebaseError && error.code === 'auth/popup-closed-by-user') {
        setFormError('Sign-in cancelled')
      } else {
        setFormError('Failed to sign in with Google')
      }
    }
  };

  return (
    <div className="container relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      {/* Left Side: Branding/Quote */}
      <div className="relative hidden h-full flex-col bg-muted pl-10 pt-5 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          Universitifier
        </div>
      </div>

      {/* Right Side: Sign Up Form */}
      <div className="lg:p-8 bg-black h-full flex items-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Link
            href="/login"
            className="absolute right-4 top-4 md:right-8 md:top-8 text-sm font-medium text-white hover:underline"
          >
            Login
          </Link>
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Create an account
            </h1>
            <p className="text-sm text-zinc-400">
              Create your account using Google
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
