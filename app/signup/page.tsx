"use client"

import React, { useState } from 'react'
import { FcGoogle } from 'react-icons/fc'
import Link from 'next/link'
import { validatePasswordWithData } from '@/app/controllers/controllers'
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db, auth } from '@/app/Database/Firebase'
import { useRouter } from 'next/navigation'

function page() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    university: '',
    password: '',
  })

  const provider = new GoogleAuthProvider();

  // const [visiblePassword, setVisiblePassword] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [isError, setIsError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target || !e.target.name || !e.target.value) {
      console.warn('Invalid input event', e)
      return
    }
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    console.log(e.target.name, ' is changed ', e.target.value)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // FIX: Update formData FIRST, then validate
    const newPassword = e.target.value

    setFormData({
      ...formData,
      password: newPassword,
    })

    // Now validate with the new password value
    const tempFormData = { ...formData, password: newPassword }
    const passwordErrors = validatePasswordWithData(tempFormData)

    if (passwordErrors === true) {
      setIsError(false)
      setErrors([])
    } else {
      setIsError(true)
      setErrors(passwordErrors)
    }
  }

  // Normal submition 
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const isValid = validateForm()
    if (!isValid) {
      setIsError(true)
      setIsSubmitting(false)
      return
    }
    setIsError(false)
    console.log('Step 1:Form is valid')


    try {
      // 1. Create user in Firebase Auth (Client SDK)
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      )

      // 2. Save additional data to Firestore (Client SDK)
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: formData.name,
        email: formData.email,
        university: formData.university,
        profileCompleted: false,
        createdAt: new Date().toISOString()
      })

      // 3. User is automatically signed in
      router.push('/profile')

      setSuccess(true)
      setIsSubmitting(false)
      setTimeout(() => {
        setSuccess(false)
      }, 3000)

      setFormData({
        name: '',
        email: '',
        university: '',
        password: '',
      });
    } catch (error: any) {
      console.error('Error creating user:', error)
      setIsError(true)
      setIsSubmitting(false)

      if (error.code === 'auth/email-already-in-use') {
        setErrors(['Email is already in use'])
      } else if (error.code === 'auth/invalid-email') {
        setErrors(['Invalid email address'])
      } else if (error.code === 'auth/weak-password') {
        setErrors(['Password is too weak'])
      } else {
        setErrors(['An error occurred. Please try again.'])
      }
    };
  };

  const validateForm = () => {
    // Create local array and check name, email, university
    const newErrors: string[] = []

    if (formData.name.length < 1) {
      newErrors.push('Name is required')
    }
    if (formData.email.length < 1) {
      newErrors.push('Email is required')
    }
    if (formData.university.length < 1) {
      newErrors.push('University is required')
    }

    // Validate password
    const passwordErrors = validatePasswordWithData(formData)
    if (passwordErrors !== true) {
      newErrors.push(...passwordErrors)
    }

    // Set all at once
    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log('User signed in with Google', user);

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
          userID: user.uid,
          createdAt: new Date().toISOString()
        });
        router.push('/completeprofile'); // redirect to complete-profile for university data

      } else {
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
      if (error.code === 'auth/popup-closed-by-user') {
        setErrors(['Sign-in cancelled'])
      } else {
        setErrors(['Failed to sign in with Google'])
      }
      setIsError(true)
    }
  };

  return (
    <div className='bg-white min-h-screen w-full flex items-center justify-center pt-20 pb-12'>
      <form onSubmit={handleSubmit} className='flex flex-col gap-4 w-full max-w-md p-8 border border-gray-200 rounded-lg'>
        <h1 className='text-3xl font-bold text-center mb-4 text-black'>Sign Up</h1>

        <input
          type="text"
          placeholder='Name'
          name='name'
          required
          className='px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600'
          value={formData.name}
          onChange={handleChange}
        />

        <input
          type="email"
          placeholder='Email'
          name='email'
          required
          className='px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600'
          value={formData.email}
          onChange={handleChange}

        />

        <input
          type="text"
          placeholder='University Name'
          name='university'
          required
          className='px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600'
          value={formData.university}
          onChange={handleChange}
        />

        <input
          type="password"
          placeholder='Password'
          name='password'
          required
          className='px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600'
          value={formData.password}
          onChange={handlePasswordChange}
        />

        {success && (
          <div className='text-green-600 text-sm font-semibold text-center bg-green-50 p-3 rounded-lg border border-green-200'>
            ✓ Account created successfully!
          </div>
        )}

        {isError && errors.length > 0 && (
          <div className='text-red-500 text-sm'>
            {errors.map((error, index) => (
              <p key={index}>• {error}</p>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className='px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mt-2'
        >
          {success ? 'Success' : isSubmitting ? 'Signing Up...' : 'Sign Up'}
        </button>

        <div className='flex items-center gap-3 my-2'>
          <div className='flex-1 h-px bg-gray-300'></div>
          <span className='text-gray-500 text-sm'>OR</span>
          <div className='flex-1 h-px bg-gray-300'></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          className='px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2'
        >
          <FcGoogle className='text-xl' />
          <span>Continue with Google</span>
        </button>

        <p className='text-center text-gray-600 mt-4'>
          Already have an account?{' '}
          <Link href="/signin" className='text-purple-600 hover:text-purple-700 font-semibold'>
            Sign In
          </Link>
        </p>
      </form>
    </div>
  )
}

export default page