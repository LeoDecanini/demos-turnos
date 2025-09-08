// app/auth/AuthProvider.tsx
'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type User = { email: string; name?: string } | null;
type AuthCtx = {
    user: User;
    token: string | null;
    loginWithToken: (t: string) => void;
    logout: () => void;
    refreshMe: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);
const API = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User>(null);

    // cargar token guardado
    useEffect(() => {
        const t = typeof window !== 'undefined' ? localStorage.getItem('booking_client_jwt') : null;
        if (t) setToken(t);
    }, []);

    // cuando cambia el token, persistir y refrescar perfil
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (token) {
            localStorage.setItem('booking_client_jwt', token);
            void refreshMe();
        } else {
            localStorage.removeItem('booking_client_jwt');
            setUser(null);
        }
    }, [token]);

    async function refreshMe() {
        if (!token) { setUser(null); return; }
        try {
            const r = await fetch(`${API}/bookingmodule/public/clients/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!r.ok) throw new Error();
            const me = await r.json();
            setUser({ email: me.email, name: me.name });
        } catch {
            setUser(null);
        }
    }

    const loginWithToken = (t: string) => setToken(t);
    const logout = () => setToken(null);

    const value = useMemo(() => ({ user, token, loginWithToken, logout, refreshMe }), [user, token]);

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
