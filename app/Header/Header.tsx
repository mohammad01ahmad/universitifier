'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { auth } from '@/app/Database/Firebase'
import { signOut } from 'firebase/auth'

function Header() {
  const pathName = usePathname()
  const router = useRouter()
  const isProfilePage = pathName === '/profile'

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <div className="text-2xl font-bold text-black cursor-pointer">Universitifier</div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#about-section" className="text-gray-700 hover:text-purple-600 transition-colors">About</a>
          <a href="#features" className="text-gray-700 hover:text-purple-600 transition-colors">Features</a>
          <a href="#upcoming" className="text-gray-700 hover:text-purple-600 transition-colors">Upcoming</a>
        </nav>

        {isProfilePage ? (
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link href="/signin">
              <button className="px-4 py-2 text-gray-700 hover:text-purple-600 transition-colors cursor-pointer">
                Sign In
              </button>
            </Link>
            <Link href="/signup">
              <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer">
                Get Started
              </button>
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header