// app/verify-client/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

type PublicClientInfo = {
  name: string;
  email: string;
  hasUser: boolean;
  hasCode?: boolean;
  matchesCode?: boolean;
};

const API = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const SUBDOMAIN = process.env.NEXT_PUBLIC_TENANT as string | undefined;

/** slug opcional para ambientes con subdominio; en localhost no lo usamos */
function getSlug(): string | null {
  if (SUBDOMAIN) return SUBDOMAIN;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return null;
    const [sub] = host.split('.');
    return sub || null;
  }
  return null;
}
function publicBase(): string {
  const slug = getSlug();
  return `${API}/bookingmodule/public${slug ? `/${slug}` : ''}`;
}

export default function VerifyClientPage() {
  const search = useSearchParams(); // lo dejo para leer ?code, pero NO confío en él para el email
  const router = useRouter();

  const codeFromUrl = search.get('code') || '';

  // 1) Email desde el location real (evita timing de useSearchParams)
  const [emailState, setEmailState] = useState<string>('');
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const raw = sp.get('email');
      const e = raw ? decodeURIComponent(raw) : '';
      console.log('[verify-client] email from URLSearchParams(window):', e);
      setEmailState(e);
    } catch {
      setEmailState('');
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<PublicClientInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [code, setCode] = useState(codeFromUrl);
  const [submitting, setSubmitting] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);

  const matchesCode = info?.matchesCode === true;

  const CODE_FLAG_KEY = useMemo(
    () => (emailState ? `code_requested:${emailState}` : ''),
    [emailState]
  );
  const kickoffSentRef = useRef(false);

  /** Envía código y devuelve true si fue OK */
  const requestCode = async (): Promise<boolean> => {
    if (!emailState) return false;
    try {
      console.log('[verify-client] requestCode() POST start-signup for', emailState);
      setSendingCode(true);
      setError(null);
      const res = await fetch(
        `${publicBase()}/clients/${encodeURIComponent(emailState)}/start-signup`,
        { method: 'POST' }
      );
      if (!res.ok) {
        const msg = (await res.text()) || 'No se pudo generar el código';
        throw new Error(msg);
      }
      console.log('[verify-client] requestCode() OK');
      return true;
    } catch (e: any) {
      console.error('[verify-client] requestCode() ERROR', e);
      setError(e.message || 'Error al enviar el código');
      return false;
    } finally {
      setSendingCode(false);
    }
  };

  /** 2) KICKOFF TEMPRANO: en cuanto tengamos emailState (y no haya ?code), mandamos */
  useEffect(() => {
    const kickoff = async () => {
      if (!emailState) return;
      if (codeFromUrl) return; // si ya viene el código, no mandamos
      if (kickoffSentRef.current) return;
      kickoffSentRef.current = true;

      const already =
        typeof window !== 'undefined' && CODE_FLAG_KEY
          ? localStorage.getItem(CODE_FLAG_KEY)
          : null;

      if (!already) {
        const ok = await requestCode();
        if (ok && typeof window !== 'undefined' && CODE_FLAG_KEY) {
          localStorage.setItem(CODE_FLAG_KEY, '1');
        }
      } else {
        console.log('[verify-client] kickoff skipped (localStorage flag present)');
      }
    };
    void kickoff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailState, codeFromUrl, CODE_FLAG_KEY]);

  /** 3) FETCH de info (independiente del kickoff) */
  useEffect(() => {
    const run = async () => {
      if (!emailState) {
        setError('Falta el email en la URL');
        setLoading(false);
        return;
      }
      try {
        setError(null);
        const url = `${publicBase()}/clients/${encodeURIComponent(emailState)}${
          codeFromUrl ? `?code=${encodeURIComponent(codeFromUrl)}` : ''
        }`;
        console.log('[verify-client] fetching client info:', url);
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error((await res.text()) || 'No pudimos obtener el cliente');
        const data = (await res.json()) as PublicClientInfo;
        setInfo(data);
      } catch (e: any) {
        setError(e.message || 'Error');
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [emailState, codeFromUrl]);

  const canSubmit =
    !!info &&
    !info.hasUser &&
    !!password &&
    password.length >= 6 &&
    (matchesCode || /^\d{8}$/.test(code));

  const submit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch(
        `${publicBase()}/clients/${encodeURIComponent(emailState)}/set-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password, code: matchesCode ? codeFromUrl : code }),
        }
      );
      if (!res.ok) {
        const msg = (await res.text()) || 'No se pudo guardar la contraseña';
        throw new Error(msg);
      }
      router.replace('/login');
    } catch (e: any) {
      setError(e.message || 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="pt-20">
        <div className="max-w-md mx-auto px-4">
          <div className="rounded-2xl bg-white shadow-xl ring-1 ring-slate-100 p-6 md:p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-slate-100 rounded w-1/2" />
              <div className="h-4 bg-slate-100 rounded w-3/4" />
              <div className="h-12 bg-slate-100 rounded" />
              <div className="h-12 bg-slate-100 rounded" />
              <div className="h-10 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="pt-20">
        <div className="max-w-md mx-auto px-4">
          <div className="rounded-2xl bg-white shadow-xl ring-1 ring-slate-100 p-6 md:p-8">
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">
              {error}
            </div>
            <button
              className="w-full rounded-xl bg-yellow-400 text-slate-900 font-semibold py-3 shadow hover:bg-yellow-500 transition"
              onClick={() => router.replace('/login')}
            >
              Ir al login
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!info) {
    return (
      <main className="pt-20">
        <div className="max-w-md mx-auto px-4">
          <div className="rounded-2xl bg-white shadow-xl ring-1 ring-slate-100 p-6 md:p-8">
            <div className="text-slate-600">No se encontró el cliente.</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-20 bg-white min-h-svh">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">Crear contraseña</h1>
          <div className="mx-auto mt-3 h-1 w-16 rounded bg-yellow-400" />
          <p className="mt-4 text-slate-500">
            {info.name ? `Hola ${info.name}, ` : 'Hola, '}vamos a crear tu contraseña para{' '}
            <span className="font-mono">{info.email}</span>.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="rounded-2xl bg-white shadow-xl ring-1 ring-slate-100 p-6 md:p-8">
            {info.hasUser ? (
              <div className="space-y-5">
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 text-yellow-800 text-sm px-3 py-2">
                  Este email ya tiene usuario. Ingresá con tu contraseña o iniciá recuperación.
                </div>
                <button
                  className="w-full rounded-xl bg-yellow-400 text-slate-900 font-semibold py-3 shadow hover:bg-yellow-500 transition"
                  onClick={() => router.replace(`/login?email=${encodeURIComponent(info.email)}`)}
                >
                  Ir a Ingresar
                </button>
                <button
                  type="button"
                  className="w-full rounded-xl border border-slate-200 bg-white text-slate-700 font-medium py-3 hover:bg-slate-50 transition"
                  onClick={() => router.replace(`/recuperate?email=${encodeURIComponent(info.email)}`)}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            ) : (
              <>
                {!matchesCode && (
                  <div className="space-y-2 mb-5">
                    <label className="block text-sm font-medium text-slate-700">Código (8 dígitos)</label>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 transition"
                        type="text"
                        inputMode="numeric"
                        pattern="\d{8}"
                        maxLength={8}
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        placeholder="Ej: 12345678"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Contraseña</label>
                    <input
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 transition"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                    />
                  </div>

                  <button
                    className="w-full rounded-xl bg-yellow-400 text-slate-900 font-semibold py-3 shadow hover:bg-yellow-500 disabled:opacity-60 disabled:cursor-not-allowed transition"
                    onClick={submit}
                    disabled={!canSubmit || submitting}
                  >
                    {submitting ? 'Guardando…' : 'Guardar contraseña'}
                  </button>
                </div>

                <div className="flex items-center justify-center mt-3">
                  <Button
                    onClick={async () => {
                      const ok = await requestCode();
                      if (ok && CODE_FLAG_KEY) localStorage.setItem(CODE_FLAG_KEY, '1');
                    }}
                    disabled={sendingCode}
                    variant="link"
                    className="!text-center !m-auto"
                  >
                    {sendingCode ? 'Enviando un nuevo código…' : 'Volver a enviar código'}
                  </Button>
                </div>
              </>
            )}
          </div>

          <div className="text-center mt-6">
            <button
              onClick={() => router.replace('/login')}
              className="inline-flex items-center gap-2 rounded-full border border-yellow-400 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-yellow-50 transition"
            >
              Ir al Login
              <svg width="16" height="16" viewBox="0 0 24 24" className="text-slate-900">
                <path fill="currentColor" d="M13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
