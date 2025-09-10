// app/verify-client/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

type PublicClientInfo = { name: string; email: string; hasUser: boolean };
const API = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export default function VerifyClientPage() {
    const search = useSearchParams();
    const router = useRouter();
    const email = search.get('email') ? decodeURIComponent(search.get('email')!) : '';
    const [loading, setLoading] = useState(true);
    const [info, setInfo] = useState<PublicClientInfo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [password, setPassword] = useState('');

    useEffect(() => {
        const run = async () => {
            if (!email) { setError('Falta el email en la URL'); setLoading(false); return; }
            try {
                const res = await fetch(`${API}/bookingmodule/public/clients/${encodeURIComponent(email)}`);
                if (!res.ok) throw new Error('No pudimos obtener el cliente');
                const data = await res.json();
                setInfo(data);
            } catch (e: any) {
                setError(e.message || 'Error');
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [email]);

    const submit = async () => {
        try {
            const res = await fetch(`${API}/bookingmodule/public/clients/${encodeURIComponent(email)}/set-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            if (!res.ok) throw new Error(await res.text() || 'No se pudo guardar la contraseña');
            router.replace('/');
        } catch (e: any) {
            setError(e.message || 'Error');
        }
    };

    if (loading) return <div className="p-6">Cargando…</div>;
    if (error) return <div className="p-6 text-red-600">{error}</div>;
    if (!info) return <div className="p-6">No se encontró el cliente.</div>;

    return (
        <div className="max-w-md mx-auto p-6 space-y-5">
            <h1 className="text-2xl font-semibold">Crear contraseña</h1>
            <p className="text-sm text-gray-600">
                {info.name ? `Hola ${info.name},` : 'Hola,'} vamos a crear tu contraseña para{' '}
                <span className="font-mono">{info.email}</span>.
            </p>

            {info.hasUser && (
                <div className="p-3 rounded bg-yellow-100 text-yellow-800 text-sm">
                    Este email ya tiene usuario. Si no recordás tu contraseña, después armamos recuperación.
                </div>
            )}

            <label className="block text-sm">
                Contraseña
                <input
                    className="mt-1 border rounded w-full p-2"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                />
            </label>

            <button
                className="w-full py-2 rounded bg-black text-white disabled:opacity-50"
                onClick={submit}
                disabled={!password || password.length < 6}
            >
                Guardar
            </button>
        </div>
    );
}
