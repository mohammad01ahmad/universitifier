"use client"

import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/app/Database/Firebase'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { FaRegCopy } from "react-icons/fa6";
import { MdDone } from "react-icons/md";
import { ReferenceGenerator } from '../components/ReferenceGenerator'

function Page() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, get data from Firestore
        try {
          const userDocRef = doc(db, 'users', user.uid)
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            const userData = userDoc.data()
            setUserName(userData.name || "User")
            setLoading(false)
          } else {
            setUserName(user.displayName || 'User')
            setLoading(false)
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
          setLoading(false)
        }
      } else {
        // no user signedin, redirect to signin page
        router.push('/signin')
      }
    })

    return () => { unsubscribe() }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Hero Section with Welcome Message */}
      <section className="min-h-screen flex flex-col items-center justify-center">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight animate-fade-in-up">
            Welcome back, {userName} 👋
          </h1>
          <p className="text-xl text-gray-600 mb-8 animate-fade-in-up animation-delay-200">
            Ready to make your university life easier?
          </p>
          <button className="px-8 py-4 bg-purple-600 text-white rounded-lg text-lg hover:bg-purple-700 transition-colors animate-fade-in-up animation-delay-400">
            Lets Go!
          </button>
        </div>
      </section>

      <ReferenceGenerator />

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
          opacity: 0;
        }
      `}</style>
    </div>
  )
}

export default Page