'use client'

import { usePathname } from 'next/navigation'
import { MdOutlineAlternateEmail } from "react-icons/md";
import { ImEarth } from "react-icons/im";

function Footer() {
  const pathname = usePathname()

  if (pathname.startsWith('/profile')) {
    return null
  }

  return (
    <footer className="bg-zinc-100 dark:bg-zinc-950 w-full py-12 px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto border-t border-zinc-200 dark:border-zinc-800 pt-12">
        <div>
          <div className="text-lg font-bold text-emerald-900 dark:text-emerald-50 mb-2 font-headline tracking-tight">Universitifier</div>
          <p className="text-zinc-500 font-body text-sm max-w-xs mb-8">© 2026 Universitifier.</p>
          <div className="flex space-x-6">
            <a className="text-zinc-400 hover:text-emerald-600 transition-colors" href="#">
              <ImEarth size={24} />
            </a>
            <a className="text-zinc-400 hover:text-emerald-600 transition-colors" href="#">
              <MdOutlineAlternateEmail size={24} />
            </a>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h4 className="text-emerald-900 dark:text-emerald-50 font-bold text-sm uppercase tracking-widest mb-4">Product</h4>
            <nav className="flex flex-col space-y-3">
              <a className="text-zinc-500 hover:text-emerald-600 transition-colors text-sm" href="/">Features</a>
              <a className="text-zinc-500 hover:text-emerald-600 transition-colors text-sm" href="/">Pricing</a>
              <a className="text-zinc-500 hover:text-emerald-600 transition-colors text-sm" href="/">Methodology</a>
            </nav>
          </div>
          <div>
            <h4 className="text-emerald-900 dark:text-emerald-50 font-bold text-sm uppercase tracking-widest mb-4">Legal</h4>
            <nav className="flex flex-col space-y-3">
              <a className="text-zinc-500 hover:text-emerald-600 transition-colors text-sm" href="/">Privacy Policy</a>
              <a className="text-zinc-500 hover:text-emerald-600 transition-colors text-sm" href="/">Terms of Service</a>
              <a className="text-zinc-500 hover:text-emerald-600 transition-colors text-sm" href="/">Contact Support</a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
