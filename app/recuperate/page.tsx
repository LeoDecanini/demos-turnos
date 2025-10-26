// app/recuperate/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

export default function RecoverPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [requested, setRequested] = useState(false);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [devCode, setDevCode] = useState<string | undefined>(undefined);

  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const requestCode = async () => {
    if (pending) return;
    try {
      setPending(true);
      setErr(null);

      const slug = getSlug();
      if (!slug) throw new Error('No se detectó el tenant');

      const r = await fetch(
        `${API}/bookingmodule/public/${slug}/clients/${encodeURIComponent(email)}/start-password-reset`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } }
      );

      const data = await r.json().catch(() => ({} as any));

      if (!r.ok) {
        const msg = data?.message || 'No se pudo enviar el código';
        throw new Error(msg);
      }

      if (data?.devCode) setDevCode(String(data.devCode));
      setRequested(true);
    } catch (e: any) {

      /* if (e?.message === "Cliente no encontrado para este negocio") router.replace(`/register?email=${encodeURIComponent(email)}`); */
      setErr(e?.message || 'Error, intenta nuevamente');
    } finally {
      setPending(false);
    }
  };

  const confirmReset = async () => {
    if (pending) return;
    try {
      setPending(true);
      setErr(null);

      const slug = getSlug();
      if (!slug) throw new Error('No se detectó el tenant');

      const r = await fetch(
        `${API}/bookingmodule/public/${slug}/clients/${encodeURIComponent(email)}/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, newPassword: password }),
        }
      );

      if (!r.ok) {
        let msg = 'No se pudo cambiar la contraseña';
        try {
          const j = await r.json();
          msg = j?.message || msg;
        } catch {
          const t = await r.text().catch(() => '');
          if (t) msg = t;
        }
        throw new Error(msg);
      }

      router.replace('/login');
    } catch (e: any) {
      setErr(e?.message || 'Error');
    } finally {
      setPending(false);
    }
  };

  const onEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!requested) requestCode();
      else confirmReset();
    }
  };

  const canRequest = /\S+@\S+\.\S+/.test(email) && !pending;
  const canConfirm = /^\d{8}$/.test(code) && password.length >= 6 && !pending;

  return (
    <main className="pt-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">
            Recuperar contraseña
          </h1>
          <div className="mx-auto mt-3 h-1 w-16 rounded bg-green-400" />
          <p className="mt-4 text-slate-500">
            Te enviamos un código para que puedas crear una nueva contraseña.
          </p>
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
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={onEnter}
                  placeholder="nombre@correo.com"
                  autoComplete="email"
                  disabled={requested}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-200 transition disabled:bg-slate-50"
                />
              </div>

              {!requested ? (
                <button
                  onClick={requestCode}
                  disabled={!canRequest}
                  className="w-full rounded-xl bg-green-400 text-slate-900 font-semibold py-3 shadow hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {pending ? 'Enviando…' : 'Enviar código'}
                </button>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Código (8 dígitos)
                    </label>
                    <div className="mt-1 flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="\d{8}"
                        maxLength={8}
                        value={code}
                        onChange={e =>
                          setCode(e.target.value.replace(/\D/g, '').slice(0, 8))
                        }
                        onKeyDown={onEnter}
                        placeholder="Ej: 12345678"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-200 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">Nueva contraseña</label>
                    <div className="mt-1 relative">
                      <input
                        type={showPwd ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={onEnter}
                        placeholder="Mínimo 6 caracteres"
                        autoComplete="new-password"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-900 placeholder-slate-400 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-200 transition"
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
                  </div>

                  <button
                    onClick={confirmReset}
                    disabled={!canConfirm}
                    className="w-full rounded-xl bg-green-400 text-slate-900 font-semibold py-3 shadow hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    {pending ? 'Guardando…' : 'Cambiar contraseña'}
                  </button>
                </>
              )}

              <div className="flex items-center justify-between text-sm">
                <Link href="/login" className="text-slate-600 hover:text-slate-900 underline underline-offset-4">
                  Volver a ingresar
                </Link>
                <Link href="/register" className="text-slate-400 hover:text-slate-700">
                  Crear cuenta
                </Link>
              </div>
            </div>
          </div>

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
