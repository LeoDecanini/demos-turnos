// app/login/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../auth/AuthProvider';

const API = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const SUBDOMAIN = process.env.NEXT_PUBLIC_TENANT as string | undefined;

function getSlug() {
  if (SUBDOMAIN) return SUBDOMAIN;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const [sub] = host.split('.');
    return sub || '';
  }
  return '';
}

export default function LoginPage() {
  const router = useRouter();
  const { loginWithToken } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const slug = useMemo(getSlug, []);

  const onSubmit = async () => {
    if (pending) return;
    try {
      setPending(true);
      setErr(null);

      if (!slug) throw new Error('No se detectó el tenant (slug).');

      // ↪️ ahora las rutas públicas llevan slug: /bookingmodule/public/:slug/clients/sessions
      const r = await fetch(`${API}/bookingmodule/public/${slug}/clients/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!r.ok) {
        let msg = 'Login inválido';
        try {
          const j = await r.json();
          msg = j?.message || msg;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }

      const { token } = await r.json();
      localStorage.setItem('booking_client_jwt', token);
      loginWithToken(token);
      router.replace('/perfil');
    } catch (e: any) {
      setErr(e?.message || 'Error, intenta nuevamente');
    } finally {
      setPending(false);
    }
  };

  const onEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSubmit();
  };

  return (
    <main className=" pt-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* título con acento amarillo */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">
            Ingresar a tu cuenta
          </h1>
          <div className="mx-auto mt-3 h-1 w-16 rounded bg-green-400" />
          <p className="mt-4 text-slate-500">
            Accedé para reservar y gestionar tus turnos.
          </p>
        </div>

        {/* card */}
        <div className="max-w-md mx-auto">
          <div className="rounded-2xl bg-white shadow-xl ring-1 ring-slate-100 p-6 md:p-8">
            {err && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">
                {err}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={onEnter}
                  placeholder="nombre@correo.com"
                  autoComplete="email"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-200 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Contraseña
                </label>
                <div className="mt-1 relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={onEnter}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-900 placeholder-slate-400 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-200 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPwd ? (
                      // ojo abierto
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5C5 5 1 12 1 12s4 7 11 7 11-7 11-7-4-7-11-7Z" stroke="currentColor" strokeWidth="1.6" />
                        <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.6" />
                      </svg>
                    ) : (
                      // ojo tachado
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M9.88 9.88A3.5 3.5 0 0012 15.5c1.93 0 3.5-1.57 3.5-3.5 0-.53-.12-1.02-.34-1.46M6.2 6.2C4.12 7.47 2.7 9.11 2 12c0 0 4 7 10 7 2.02 0 3.74-.6 5.14-1.48M18.9 15.7C20.52 14.35 22 12 22 12s-4-7-10-7c-1.34 0-2.56.25-3.66.67" stroke="currentColor" strokeWidth="1.6" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={onSubmit}
                disabled={!email || !password || pending}
                className="w-full rounded-xl bg-green-400 text-slate-900 font-semibold py-3 shadow hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {pending ? 'Ingresando…' : 'Ingresar'}
              </button>

              <div className="flex items-center justify-between text-sm">
                <Link
                  href="/register"
                  className="text-slate-600 hover:text-slate-900 underline underline-offset-4"
                >
                  Crear usuario
                </Link>
                <Link
                  href="/recuperate"
                  className="text-slate-600 hover:text-slate-900 underline underline-offset-4"
                >
                  ¿Olvidate la contraseña?
                </Link>
              </div>
            </div>
          </div>

          {/* CTA secundaria similar a “Ver todos los servicios” */}
          <div className="text-center mt-6">
            <Link
              href="/reservar"
              className="inline-flex items-center gap-2 rounded-full border border-green-400 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-green-50 transition"
            >
              Ver tratamientos
              <svg width="16" height="16" viewBox="0 0 24 24" className="text-slate-900">
                <path fill="currentColor" d="M13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
