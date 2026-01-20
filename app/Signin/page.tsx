'use client'

import React from 'react'
import Link from 'next/link'
import { useState } from 'react'

function page() {

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [loginError, setLoginError] = useState('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log(formData)

    // login business logic
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    console.log(e.target.name, "changed to", e.target.value)
  }


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
              className='px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mt-2'
            >
              Sign In
            </button>

            <div>
              <p>{loginError}</p>
            </div>
            
            <p className='text-center text-sm text-gray-600 mt-4'>
              Don't have an account? <Link href="/signup" className='text-purple-600 hover:underline'>Sign Up</Link>
            </p>
        </form>
    </div>
  )
}

export default page