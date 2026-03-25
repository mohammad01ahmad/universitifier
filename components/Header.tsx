'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { auth } from '@/lib/Database/Firebase'
import { signOut } from 'firebase/auth'

function Header() {
  const pathName = usePathname()
  const router = useRouter()
  const isWorkspaceArea = pathName.startsWith('/profile')

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <nav className="fixed top-0 w-full z-50 glass-header shadow-sm">
      <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
        <div className="text-2xl font-bold text-emerald-900 font-headline tracking-tight">Universitifier</div>
        <div className="hidden md:flex items-center space-x-8">
          <a className="text-emerald-700 font-semibold border-b-2 border-emerald-600 font-headline tracking-tight" href="#">Features</a>
          <a className="text-zinc-600 hover:text-emerald-600 transition-colors font-headline tracking-tight" href="#">Methodology</a>
          <a className="text-zinc-600 hover:text-emerald-600 transition-colors font-headline tracking-tight" href="#">Pricing</a>
          <a className="text-zinc-600 hover:text-emerald-600 transition-colors font-headline tracking-tight" href="#">Testimonials</a>
        </div>
        <div className="flex items-center space-x-4">
          <button className="text-zinc-600 hover:text-emerald-600 transition-colors font-headline tracking-tight px-4 py-2">Log In</button>
          <button className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-bold hover:opacity-90 active:scale-95 transition-all duration-200 shadow-lg shadow-primary/20">Get Started</button>
        </div>
      </div>
    </nav>
  )
}

export default Header
