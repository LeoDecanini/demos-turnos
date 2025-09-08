// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../auth/AuthProvider';

const API = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export default function LoginPage() {
    const router = useRouter();
    const { loginWithToken } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    const onSubmit = async () => {
        if (pending) return;
        try {
            setPending(true);
            setErr(null);
            const r = await fetch(`${API}/bookingmodule/public/clients/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!r.ok) {
                const msg = await r.text();
                throw new Error(msg || 'Login inválido');
            }

            const { token } = await r.json();
            localStorage.setItem('booking_client_jwt', token);
            loginWithToken(token);
            router.replace('/perfil');
        } catch (e: any) {
            setErr(e.message || 'Error');
        } finally {
            setPending(false);
        }
    };

    const onEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') onSubmit();
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl">
                    {/* Glow */}
                    <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-fuchsia-500/10 via-cyan-500/10 to-emerald-500/10 blur-2xl pointer-events-none" />
                    {/* Header */}
                    <div className="relative z-10 space-y-2 text-center mb-6">
                        <div className="mx-auto h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                            {/* Logo minimal */}
                            <svg width="22" height="22" viewBox="0 0 24 24" className="text-white/90">
                                <path fill="currentColor" d="M12 3l7 4v10l-7 4-7-4V7zM7 9v6l5 3 5-3V9l-5-3z" />
                            </svg>
                        </div>
                        <h1 className="text-white text-2xl font-semibold tracking-tight">Ingresar</h1>
                        <p className="text-white/60 text-sm">Accedé a tu cuenta de cliente</p>
                    </div>

                    {/* Form */}
                    <div className="relative z-10 space-y-4">
                        {err && (
                            <div className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 text-sm p-3">
                                {err}
                            </div>
                        )}

                        <label className="block">
                            <span className="text-white/80 text-xs">Email</span>
                            <div className="mt-1 relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    onKeyDown={onEnter}
                                    placeholder="nombre@correo.com"
                                    autoComplete="email"
                                    className="w-full rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/40 px-10 py-3 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition"
                                    aria-invalid={!!err}
                                />
                                {/* icon */}
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                                    <svg width="18" height="18" viewBox="0 0 24 24" className="">
                                        <path fill="currentColor" d="M12 13L2 6.76V18h20V6.76zM12 11L2 4h20z" />
                                    </svg>
                                </div>
                            </div>
                        </label>

                        <label className="block">
                            <span className="text-white/80 text-xs">Contraseña</span>
                            <div className="mt-1 relative">
                                <input
                                    type={showPwd ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    onKeyDown={onEnter}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    className="w-full rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/40 px-10 py-3 pr-12 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition"
                                />
                                {/* lock icon */}
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                                    <svg width="18" height="18" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M12 1a5 5 0 00-5 5v3H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V11a2 2 0 00-2-2h-2V6a5 5 0 00-5-5zm3 8H9V6a3 3 0 116 0z" />
                                    </svg>
                                </div>
                                {/* show/hide */}
                                <button
                                    type="button"
                                    onClick={() => setShowPwd(s => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/90 transition"
                                    aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                >
                                    {showPwd ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24">
                                            <path fill="currentColor" d="M12 7a5 5 0 015 5c0 1.1-.36 2.12-.97 2.94l3.02 3.02-1.41 1.41-3.02-3.02A5.97 5.97 0 0112 19c-5.52 0-10-5-10-7s4.48-7 10-7c1.35 0 2.62.35 3.75.97l-1.5 1.5A5.02 5.02 0 0012 7zm0 2c-.3 0-.59.03-.87.1l1.76 1.76c.07-.28.11-.57.11-.86a2 2 0 00-2-2zM4.59 5.17L5.99 3.76 20.24 18l-1.41 1.41-2.36-2.36c-1.35.9-3 .95-4.47.95-5.52 0-10-5-10-7 0-1.08 1.17-2.92 3.36-4.6z" />
                                        </svg>
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 24 24">
                                            <path fill="currentColor" d="M12 5c-7 0-11 6.5-11 7s4 7 11 7 11-6.5 11-7-4-7-11-7zm0 12a5 5 0 115-5 5 5 0 01-5 5z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </label>

                        <button
                            onClick={onSubmit}
                            disabled={!email || !password || pending}
                            className="w-full relative overflow-hidden rounded-xl bg-white text-slate-900 font-medium py-3 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/40 transition"
                        >
                            <span className={`transition ${pending ? 'opacity-0' : 'opacity-100'}`}>
                                Ingresar
                            </span>
                            {pending && (
                                <span className="absolute inset-0 flex items-center justify-center">
                                    <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" fill="none" />
                                        <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" className="opacity-90" fill="none" />
                                    </svg>
                                </span>
                            )}
                        </button>

                        <div className="flex items-center justify-between text-sm">
                            <a
                                href="/verify-client"
                                className="text-white/70 hover:text-white underline underline-offset-4"
                            >
                                Crear contraseña
                            </a>
                            {/* reservado para “olvidé mi contraseña” */}
                            <button
                                className="text-white/40 hover:text-white/80"
                                onClick={() => alert('Pronto activamos la recuperación 😉')}
                                type="button"
                            >
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer mini */}
                <div className="mt-6 text-center text-white/40 text-xs">
                    © {new Date().getFullYear()} MG Estética · Todos los derechos reservados
                </div>
            </div>
        </div>
    );
}
