'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

function Footer() {
  const pathname = usePathname()

  if (pathname.startsWith('/profile')) {
    return null
  }

  return (
    <footer className="bg-zinc-100 dark:bg-zinc-950 w-full py-12 px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto border-t border-zinc-200 dark:border-zinc-800 pt-12">
        <div>
          <div className="text-lg font-bold text-emerald-900 dark:text-emerald-50 mb-4 font-headline tracking-tight">Universitifier</div>
          <p className="text-zinc-500 font-body text-sm max-w-xs mb-8">© 2024 Universitifier. The Scholarly Catalyst for Modern Academia.</p>
          <div className="flex space-x-6">
            <a className="text-zinc-400 hover:text-emerald-600 transition-colors" href="#">
              <span className="material-symbols-outlined">public</span>
            </a>
            <a className="text-zinc-400 hover:text-emerald-600 transition-colors" href="#">
              <span className="material-symbols-outlined">alternate_email</span>
            </a>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h4 className="text-on-surface font-bold text-sm uppercase tracking-widest mb-4">Product</h4>
            <nav className="flex flex-col space-y-3">
              <a className="text-zinc-500 hover:text-emerald-600 transition-colors text-sm" href="#">Features</a>
              <a className="text-zinc-500 hover:text-emerald-600 transition-colors text-sm" href="#">Pricing</a>
              <a className="text-zinc-500 hover:text-emerald-600 transition-colors text-sm" href="#">Methodology</a>
            </nav>
          </div>
          <div>
            <h4 className="text-on-surface font-bold text-sm uppercase tracking-widest mb-4">Legal</h4>
            <nav className="flex flex-col space-y-3">
              <a className="text-zinc-500 hover:text-emerald-600 transition-colors text-sm" href="#">Privacy Policy</a>
              <a className="text-zinc-500 hover:text-emerald-600 transition-colors text-sm" href="#">Terms of Service</a>
              <a className="text-zinc-500 hover:text-emerald-600 transition-colors text-sm" href="#">Contact Support</a>
              <a className="text-zinc-500 hover:text-emerald-600 transition-colors text-sm" href="#">Academic Integrity</a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
