// app/register/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../auth/AuthProvider';

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

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const onlyDigits = (v: string) => v.replace(/\D+/g, '');
const normPhone = (v: string) => v.replace(/[^\d+\s-]/g, '');

function validateName(v: string) {
  const s = v.trim();
  if (s.length < 2) return 'Ingresá tu nombre y apellido';
  if (s.length > 80) return 'Demasiado largo';
  return '';
}
function validateEmail(v: string) {
  const s = v.trim();
  if (!emailRe.test(s)) return 'Email inválido';
  return '';
}
function validatePhone(v: string) {
  const s = onlyDigits(v);
  if (s.length < 8) return 'Teléfono inválido';
  return '';
}
function validateDni(v: string) {
  const s = onlyDigits(v);
  if (s.length < 6 || s.length > 10) return 'DNI inválido';
  return '';
}
function validatePassword(v: string) {
  if (v.length < 6) return 'Mínimo 6 caracteres';
  return '';
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithToken } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const [touched, setTouched] = useState<{[k:string]:boolean}>({});
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const qp = searchParams?.get('email');
    if (qp) setEmail(qp);
  }, [searchParams]);

  const errors = useMemo(() => ({
    name: validateName(name),
    email: validateEmail(email),
    phone: validatePhone(phone),
    dni: validateDni(dni),
    password: validatePassword(password),
  }), [name, email, phone, dni, password]);

  const canSubmit = useMemo(() =>
    !pending &&
    !errors.name &&
    !errors.email &&
    !errors.phone &&
    !errors.dni &&
    !errors.password, [errors, pending]);

  const onSubmit = async () => {
    if (pending || !canSubmit) return;
    try {
      setPending(true);
      setErr(null);
      const slug = getSlug();
      if (!slug) throw new Error('No se detectó el tenant');

      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        dni: onlyDigits(dni),
        password
      };

      const r = await fetch(`${API}/bookingmodule/public/${slug}/clients/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!r.ok) throw new Error((await r.text()) || 'No se pudo crear la cuenta');

      const { token } = await r.json();
      localStorage.setItem('booking_client_jwt', token);
      loginWithToken(token);
      router.replace('/perfil');
    } catch (e: any) {
      setErr(e.message || 'Error, intenta nuevamente');
    } finally {
      setPending(false);
    }
  };

  const onEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setTouched({ name: true, email: true, phone: true, dni: true, password: true });
      if (canSubmit) onSubmit();
    }
  };

  return (
    <main className="pt-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">Crear cuenta</h1>
          <div className="mx-auto mt-3 h-1 w-16 rounded bg-yellow-400" />
          <p className="mt-4 text-slate-500">Registrate para reservar y gestionar tus turnos.</p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="rounded-2xl bg-white shadow-xl ring-1 ring-slate-100 p-6 md:p-8">
            {err && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">
                {err}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onBlur={() => setTouched(s => ({...s, name: true}))}
                  onKeyDown={onEnter}
                  placeholder="Tu nombre y apellido"
                  className={`mt-1 w-full rounded-xl border bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:ring-2 ${
                    touched.name && errors.name
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-slate-200 focus:border-yellow-400 focus:ring-yellow-200'
                  }`}
                />
                {touched.name && errors.name && (
                  <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onBlur={() => setTouched(s => ({...s, email: true}))}
                  onKeyDown={onEnter}
                  placeholder="nombre@correo.com"
                  autoComplete="email"
                  className={`mt-1 w-full rounded-xl border bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:ring-2 ${
                    touched.email && errors.email
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-slate-200 focus:border-yellow-400 focus:ring-yellow-200'
                  }`}
                />
                {touched.email && errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Teléfono</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(normPhone(e.target.value))}
                  onBlur={() => setTouched(s => ({...s, phone: true}))}
                  onKeyDown={onEnter}
                  placeholder="+54 11 1234-5678"
                  autoComplete="tel"
                  className={`mt-1 w-full rounded-xl border bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:ring-2 ${
                    touched.phone && errors.phone
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-slate-200 focus:border-yellow-400 focus:ring-yellow-200'
                  }`}
                />
                {touched.phone && errors.phone && (
                  <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">DNI</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={dni}
                  onChange={e => setDni(onlyDigits(e.target.value))}
                  onBlur={() => setTouched(s => ({...s, dni: true}))}
                  onKeyDown={onEnter}
                  placeholder="Tu DNI"
                  className={`mt-1 w-full rounded-xl border bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:ring-2 ${
                    touched.dni && errors.dni
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-slate-200 focus:border-yellow-400 focus:ring-yellow-200'
                  }`}
                />
                {touched.dni && errors.dni && (
                  <p className="mt-1 text-xs text-red-600">{errors.dni}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Contraseña</label>
                <div className="mt-1 relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onBlur={() => setTouched(s => ({...s, password: true}))}
                    onKeyDown={onEnter}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    className={`w-full rounded-xl border bg-white px-4 py-3 pr-12 text-slate-900 placeholder-slate-400 outline-none transition focus:ring-2 ${
                      touched.password && errors.password
                        ? 'border-red-300 focus:ring-red-200'
                        : 'border-slate-200 focus:border-yellow-400 focus:ring-yellow-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPwd ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5C5 5 1 12 1 12s4 7 11 7 11-7 11-7-4-7-11-7Z" stroke="currentColor" strokeWidth="1.6" />
                        <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.6" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M9.88 9.88A3.5 3.5 0 0012 15.5c1.93 0 3.5-1.57 3.5-3.5 0-.53-.12-1.02-.34-1.46M6.2 6.2C4.12 7.47 2.7 9.11 2 12c0 0 4 7 10 7 2.02 0 3.74-.6 5.14-1.48M18.9 15.7C20.52 14.35 22 12 22 12s-4-7-10-7c-1.34 0-2.56.25-3.66.67" stroke="currentColor" strokeWidth="1.6" />
                      </svg>
                    )}
                  </button>
                </div>
                {touched.password && errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                )}
              </div>

              <button
                onClick={() => {
                  setTouched({ name: true, email: true, phone: true, dni: true, password: true });
                  onSubmit();
                }}
                disabled={!canSubmit}
                className="w-full rounded-xl bg-yellow-400 text-slate-900 font-semibold py-3 shadow hover:bg-yellow-500 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {pending ? 'Creando…' : 'Crear cuenta'}
              </button>

              <div className="flex items-center justify-between text-sm">
                <Link href="/login" className="text-slate-600 hover:text-slate-900 underline underline-offset-4">
                  Ya tengo cuenta
                </Link>
                <Link href="/recuperate" className="text-slate-400 hover:text-slate-700">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link
              href="/reservar"
              className="inline-flex items-center gap-2 rounded-full border border-yellow-400 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-yellow-50 transition"
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
