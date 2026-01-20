"use client"

import React, { useState } from 'react'
import { FcGoogle } from 'react-icons/fc'
import Link from 'next/link'
import { validatePasswordWithData } from '@/app/controllers/controllers.js'

function page() {

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    university: '',
    password: '',
  })

  // const [visiblePassword, setVisiblePassword] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [isError, setIsError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const isValid = validateForm()
    if (!isValid) {
      setIsError(true)
      setIsSubmitting(false)
      return
    }
    setIsError(false)

    // TODO: Add form submission logic here
    console.log('Form submitted', formData)
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
    })
  }

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