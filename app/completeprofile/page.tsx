'use client'

import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/app/Database/Firebase'
import { useRouter } from 'next/navigation'

export default function CompleteProfile() {
  const [university, setUniversity] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const user = auth.currentUser
      if (!user) {
        router.push('/signin')
        return
      }

      await updateDoc(doc(db, 'users', user.uid), {
        university: university,
        profileCompleted: true
      })

      router.push('/profile')
    } catch (error) {
      console.error('Error updating profile:', error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className='bg-white min-h-screen w-full flex items-center justify-center pt-20 pb-12'>
      <form onSubmit={handleSubmit} className='flex flex-col gap-4 w-full max-w-md p-8 border border-gray-200 rounded-lg'>
        <h1 className='text-3xl font-bold text-center mb-4 text-black'>
          Complete Your Profile
        </h1>
        <p className='text-gray-600 text-center mb-4'>
          Just one more thing - tell us your university!
        </p>
        
        <input 
          type="text" 
          placeholder='University Name'
          name='university' 
          required
          className='px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600'
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
        />
        
        <button 
          type="submit"
          disabled={isSubmitting}
          className='px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mt-2 disabled:opacity-50'
        >
          {isSubmitting ? 'Saving...' : 'Continue'}
        </button>
      </form>
    </div>
  )
}