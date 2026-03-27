import { useAuth } from '@/lib/authContext'
import { useRouter, usePathname } from 'next/navigation'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { FaChevronDown } from 'react-icons/fa'
import { PiSignOutBold } from 'react-icons/pi'
import Link from 'next/link'
import { FaUser } from "react-icons/fa";


export function DashboardHeader() {
    const { user, logout } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    const handleLogout = async () => {
        try {
            await logout()
            router.push('/login')
        } catch (error) {
            console.error('Error signing out:', error)
        }
    }

    const navLinkClass = (isActive: boolean) =>
        `border-b-2 pb-1 text-sm font-medium transition-colors ${isActive
            ? 'border-primary text-primary'
            : 'border-transparent text-on-surface hover:border-primary/40 hover:text-primary'
        }`

    return (
        <header className="fixed top-0 right-0 left-0 z-40 flex h-16 justify-between glass-header px-24 transition-all">
            <div className="flex items-center">
                <nav className="flex items-center gap-6 text-on-surface">
                    <Link href="/profile" className={navLinkClass(pathname === '/profile')}>
                        Dashboard
                    </Link>
                    <Link href="/profile/assignments" className={navLinkClass(pathname.startsWith('/profile/assignments'))}>
                        Assignments
                    </Link>
                    <Link href="/pomodoro" className={navLinkClass(pathname === '/pomodoro')}>
                        Study Session
                    </Link>
                </nav>
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger>
                    <div className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1 hover:bg-primary-container/10">
                        {/* Google account image or generic user image */}
                        {user?.photoURL ? (
                            <img
                                alt="User profile avatar"
                                className="h-10 w-10 rounded-full border-2 border-primary-container object-cover"
                                src={user?.photoURL}
                            />
                        ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary-container bg-primary-container/10">
                                <FaUser className="h-5 w-5 text-primary" />
                            </div>
                        )}

                        <div className="hidden text-right sm:block">
                            <p className="text-sm leading-none text-on-surface">{user?.displayName}</p>
                        </div>
                        <FaChevronDown className="text-xs text-on-surface" />
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-lg px-2 py-1 glass-header">
                    <DropdownMenuGroup>
                        <DropdownMenuItem>
                            <div className="block pt-2 pb-2">
                                <p className="text-sm leading-none font-bold text-on-surface">{user?.displayName}</p>
                                <p className="mt-1 text-xs leading-none text-on-surface">{user?.email}</p>
                            </div>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer hover:rounded-lg hover:bg-primary-container/10">
                        <PiSignOutBold className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    )
}