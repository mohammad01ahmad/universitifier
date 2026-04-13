'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
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
    const isLoggingOutRef = useRef(false);
    const userRef = useRef<User | null>(null);
    const router = useRouter();

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (isLoggingOutRef.current && !currentUser) {
                userRef.current = null;
                setUser(null);
                setLoading(false);
                isLoggingOutRef.current = false;
                router.replace('/login');
                return;
            }

            if (currentUser) {
                userRef.current = currentUser;
                setUser(currentUser);
                setLoading(false);
                return;
            }

            const hadUser = Boolean(userRef.current);
            userRef.current = null;
            setUser(null);
            setLoading(false);

            if (!hadUser) {
                return;
            }

            try {
                const csrfToken = await setCsrfToken();
                await fetch('/api/v1/user/logout', {
                    method: 'POST',
                    headers: {
                        'X-CSRF-Token': csrfToken
                    },
                });
            } catch (error) {
                console.error('Failed to clear session after auth state change:', error);
            } finally {
                if (!isLoggingOutRef.current) {
                    router.replace('/login');
                } else {
                    isLoggingOutRef.current = false;
                    setUser(null);
                    router.replace('/login');
                }
            }
        });

        return () => unsubscribe();
    }, [router]);

    const logout = async () => {
        if (isLoggingOutRef.current) {
            return;
        }

        try {
            isLoggingOutRef.current = true;
            const csrfToken = await setCsrfToken();
            await fetch('/api/v1/user/logout', {
                method: 'POST',
                headers: {
                    'X-CSRF-Token': csrfToken
                },
            });
            await auth.signOut();
        } catch (error) {
            console.error("Logout failed:", error);
            isLoggingOutRef.current = false;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
