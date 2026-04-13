'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/database/Firebase';
import { setCsrfToken } from '@/lib/security/csrfProtection';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    const logout = async () => {
        try {
            // 1. Clear the server session first
            const csrfToken = await setCsrfToken();
            await fetch('/api/v1/user/logout', {
                method: 'POST',
                headers: {
                    'X-CSRF-Token': csrfToken
                },
            });
            // 2. Sign out of Firebase (this triggers the observer above)
            await auth.signOut();
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
