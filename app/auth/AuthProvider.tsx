// app/auth/AuthProvider.tsx
'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type User = { 
  email: string; 
  name?: string; 
  _id: string; 
  phone: string; 
  dni: string;
  cuit?: string;
  obraSocial?: string | { _id: string; name: string };
  user?: boolean;
  verifiedAt?: string;
} | null;

type AuthCtx = {
  user: User;
  token: string | null;
  loginWithToken: (t: string) => void;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

const API = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const SUBDOMAIN = process.env.NEXT_PUBLIC_TENANT as string | undefined;

function getSlug() {
  if (SUBDOMAIN) return SUBDOMAIN;
  if (typeof window !== 'undefined') {
    const [sub] = window.location.hostname.split('.');
    return sub || '';
  }
  return '';
}

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
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const slug = getSlug();
      if (!slug) throw new Error('Tenant no detectado');

      // ⚠️ Ruta pública con slug para que pase el PublicTenantGuard
      const r = await fetch(`${API}/bookingmodule/public/${slug}/clients/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!r.ok) {
        // Si el token no es válido para este account, hacer logout
        console.warn('[AuthProvider] Token no válido para este account, haciendo logout');
        throw new Error('No autorizado');
      }
      const me = await r.json();
      console.log('🔍 [AuthProvider] Datos del usuario desde backend:', me);
      setUser(me);
    } catch (err) {
      console.error('[AuthProvider] Error refreshing user:', err);
      // Token inválido o no pertenece a este account -> logout
      setToken(null);
      setUser(null);
    }
  }

  const loginWithToken = (t: string) => setToken(t);
  const logout = () => setToken(null);

  const value = useMemo(
    () => ({ user, token, loginWithToken, logout, refreshMe }),
    [user, token]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
