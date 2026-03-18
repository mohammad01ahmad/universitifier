"use client"

import React, { useState } from 'react'
import { FcGoogle } from 'react-icons/fc'
import Link from 'next/link'
import { validatePassword, validateForm } from '@/controllers/formValidation'
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/Database/Firebase'
import { useRouter } from 'next/navigation'
import { FirebaseError } from 'firebase/app'

type FieldErrors = Partial<Record<'name' | 'email' | 'university' | 'password', string[]>>

function Page() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    university: '',
    password: '',
  })

  const provider = new GoogleAuthProvider();

  // const [visiblePassword, setVisiblePassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target || !e.target.name) {
      console.warn('Invalid input event', e)
      return
    }
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setFieldErrors((prev) => ({
      ...prev,
      [e.target.name]: undefined,
    }))
    setFormError('')
  }

  // Password Change Handler (UI Only)
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // FIX: Update formData FIRST, then validate
    const newPassword = e.target.value

    setFormData({
      ...formData,
      password: newPassword,
    })
    setFormError('')

    // Now validate with the new password value
    const passwordValidation = validatePassword(newPassword)

    if (passwordValidation.isValid) {
      setFieldErrors((prev) => ({
        ...prev,
        password: undefined,
      }))
    } else {
      setFieldErrors((prev) => ({
        ...prev,
        password: passwordValidation.fieldErrors.password,
      }))
    }
  }

  // Normal submition 
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const validation = validateForm(formData)
    if (!validation.isValid) {
      setFieldErrors(validation.fieldErrors)
      setFormError('')
      setIsSubmitting(false)
      return
    }
    setFieldErrors({})
    setFormError('')

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
        universityName: formData.university,
        profileCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
      setFieldErrors({})
    } catch (error) {
      setIsSubmitting(false)

      if (error instanceof FirebaseError && error.code === 'auth/email-already-in-use') {
        setFieldErrors((prev) => ({
          ...prev,
          email: ['Email is already in use'],
        }))
      } else if (error instanceof FirebaseError && error.code === 'auth/invalid-email') {
        setFieldErrors((prev) => ({
          ...prev,
          email: ['Invalid email address'],
        }))
      } else if (error instanceof FirebaseError && error.code === 'auth/weak-password') {
        setFieldErrors((prev) => ({
          ...prev,
          password: ['Password is too weak'],
        }))
      } else {
        setFormError('An error occurred. Please try again.')
      }
    };
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // console.log('User signed in with Google', user);

      // Check if user exists in firebase
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      // Does not exist
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          name: user.displayName,
          email: user.email,
          universityName: null,
          profileCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        router.push('/complete-profile'); // redirect to complete-profile for university data

      } else {
        // Exists
        const userData = userDoc.data()
        if (!userData.universityName || !userData.profileCompleted) {
          router.push('/complete-profile'); // redirect to complete-profile for university data
        }
        router.push('/profile'); // redirect to profile
      }
      setIsSubmitting(false)

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
    <div className='bg-white min-h-screen w-full flex items-center justify-center pt-20 pb-12'>
      <form onSubmit={handleSubmit} className='flex flex-col gap-4 w-full max-w-md p-8 border border-gray-200 rounded-lg'>
        <h1 className='text-3xl font-bold text-center mb-4 text-black'>Sign Up</h1>

        <div>
          <input
            type="text"
            placeholder='Name'
            name='name'
            required
            className='px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 w-full'
            value={formData.name}
            onChange={handleChange}
          />
          {fieldErrors.name?.map((error) => (
            <p key={error} className='mt-1 text-sm text-red-500'>{error}</p>
          ))}
        </div>

        <div>
          <input
            type="email"
            placeholder='Email'
            name='email'
            required
            className='px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 w-full'
            value={formData.email}
            onChange={handleChange}
          />
          {fieldErrors.email?.map((error) => (
            <p key={error} className='mt-1 text-sm text-red-500'>{error}</p>
          ))}
        </div>

        <div>
          <input
            type="text"
            placeholder='University Name'
            name='university'
            required
            className='px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 w-full'
            value={formData.university}
            onChange={handleChange}
          />
          {fieldErrors.university?.map((error) => (
            <p key={error} className='mt-1 text-sm text-red-500'>{error}</p>
          ))}
        </div>

        <div>
          <input
            type="password"
            placeholder='Password'
            name='password'
            required
            className='px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 w-full'
            value={formData.password}
            onChange={handlePasswordChange}
          />
          {fieldErrors.password?.map((error) => (
            <p key={error} className='mt-2 text-sm text-red-500'>{error}</p>
          ))}
        </div>

        {success && (
          <div className='text-green-600 text-sm font-semibold text-center bg-green-50 p-3 rounded-lg border border-green-200'>
            ✓ Account created successfully!
          </div>
        )}

        {formError && (
          <div className='text-red-500 text-sm text-center'>
            <p>{formError}</p>
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

export default Page
