'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/Database/Firebase';

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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // 1. Sync the ID Token to the Server Cookie
                const idToken = await currentUser.getIdToken();
                await fetch('/api/v1/user/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken }),
                });
                setUser(currentUser);
            } else {
                // 2. If no user, ensure the cookie is cleared
                await fetch('/api/v1/user/logout', { method: 'POST' });
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        await auth.signOut();
        await fetch('/api/v1/user/logout', { method: 'POST' });
    };
};

export const useAuth = () => useContext(AuthContext);