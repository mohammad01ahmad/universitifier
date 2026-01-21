'use client'

import React from 'react'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/app/Database/Firebase'
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { FcGoogle } from 'react-icons/fc'
import { GoogleAuthProvider } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '@/app/Database/Firebase'

function page() {
  const router = useRouter()
  const [isLoginError, setIsLoginError] = useState(false)
  const [loginError, setLoginError] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setIsSuccess] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log(formData)
    setIsSubmitting(true)
    setLoginError([])
    setIsSuccess(false)
    setIsLoginError(false)

    // login business logic
    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password)
      console.log('User signed in', userCredential)

      setIsSuccess(true)
      setIsSubmitting(false)
      setLoginError([])
      setFormData({
        email: '',
        password: '',
      })
      setTimeout(() => {
        setIsSuccess(false)
      }, 3000)

      router.push('/profile')

    } catch (error: any) {
      console.error('Error signing in:', error)
    // Better error messages
      if (error.code === 'auth/user-not-found') {
        setLoginError(['No account found with this email'])
      } else if (error.code === 'auth/wrong-password') {
        setLoginError(['Incorrect password'])
      } else if (error.code === 'auth/invalid-email') {
        setLoginError(['Invalid email address'])
      } else if (error.code === 'auth/invalid-credential') {
        setLoginError(['Invalid email or password'])
      } else {
        setLoginError(['An error occurred. Please try again.'])
      }
      setIsLoginError(true)
      setIsSubmitting(false)
      setIsSuccess(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    console.log(e.target.name, "changed to", e.target.value)
  }

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log('User signed in with Google', user);

      // Check if user exists in firebase
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      // Does not exist
      if (!userDoc.exists()){
        await setDoc(userDocRef, {
          name: user.displayName,
          email: user.email,
          university: null,
          profileCompleted: false,
        });
        router.push('/completeprofile'); // redirect to complete-profile for university data

      }else{
        // Exists
        const userData = userDoc.data()
        if (!userData.university || !userData.profileCompleted) {
          router.push('/completeprofile'); // redirect to complete-profile for university data
        }
        router.push('/profile'); // redirect to profile
      }
      setIsSubmitting(false)
      
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      if (error.code === 'auth/popup-closed-by-user'){
        setLoginError(['Sign-in cancelled'])
      } else {
        setLoginError(['Failed to sign in with Google. Please try again.'])
      }
      setIsLoginError(true)
      setIsSubmitting(false)
      setIsSuccess(false)
    }
  };


  return (
    <div className='bg-white min-h-screen w-full flex items-center justify-center pt-20'>
        <form onSubmit={handleSubmit} className=' bg-white flex flex-col gap-4 w-full max-w-md p-8 border border-gray-200 rounded-lg'>
            <h1 className='text-3xl font-bold text-center mb-4'>Sign In</h1>
            <input 
              type="text" 
              name='email'
              placeholder='Email' 
              onChange={handleChange}
              className='px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600'
            />
            <input 
              type="password" 
              name='password'
              placeholder='Password' 
              onChange={handleChange}
              className='px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600'
            />
            <button 
              type="submit"
              disabled={isSubmitting}
              className='px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mt-2'
            >
              {success ? 'Signed In' : isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>

            {/* Success message */}
            {success && (
              <div className='text-green-600 text-sm font-semibold text-center bg-green-50 p-3 rounded-lg border border-green-200'>
                ✓ Signed in successfully!
              </div>
            )}
          
            {/* Error message */}
            {isLoginError && loginError.length > 0 && (
              <div className='flex items-center gap-2'>
                {loginError.map((error, index) => (
                  <p key={index} className='text-red-500 text-sm'>{error}</p>
                ))}
              </div>
            )}

            <div className='flex items-center gap-3 my-2'>
              <div className='flex-1 h-px bg-gray-300'></div>
              <span className='text-gray-500 text-sm'>OR</span>
              <div className='flex-1 h-px bg-gray-300'></div>
            </div>
                        
            <button 
              type="button"
              disabled={isSubmitting}
              onClick={handleGoogleSignIn}
              className='px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2'
            >
              <FcGoogle className='text-xl' />
              <span>Continue with Google</span>
            </button>
            
            <p className='text-center text-sm text-gray-600 mt-4'>
              Don't have an account? <Link href="/signup" className='text-purple-600 hover:underline'>Sign Up</Link>
            </p>         
        </form>
    </div>
  )
}

export default page