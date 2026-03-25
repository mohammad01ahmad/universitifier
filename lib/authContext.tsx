'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/Database/Firebase';
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
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // 1. Get the Firebase ID Token
                const idToken = await currentUser.getIdToken();

                // 2. Get/Refresh the CSRF Token via your Server Action
                const csrfToken = await setCsrfToken();

                await fetch('/api/v1/user/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify({ idToken }),
                });
                setUser(currentUser);
            } else {
                const csrfToken = await setCsrfToken();
                await fetch('/api/v1/user/logout', {
                    method: 'POST',
                    headers: {
                        'X-CSRF-Token': csrfToken
                    },
                });
                setUser(null);
                router.push('/');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    const logout = async () => {
        try {
            // Just trigger the Firebase sign out. 
            // The useEffect's onAuthStateChanged will handle the rest automatically.
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
