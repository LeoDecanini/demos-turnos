'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

type PublicClientInfo = {
    name: string;
    email: string;
    hasUser: boolean;
    hasCode?: boolean;
    matchesCode?: boolean;
};

const API = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export default function VerifyClientPage() {
    const search = useSearchParams();
    const router = useRouter();

    const email = search.get('email') ? decodeURIComponent(search.get('email')!) : '';
    const codeFromUrl = search.get('code') || '';

    const [loading, setLoading] = useState(true);
    const [info, setInfo] = useState<PublicClientInfo | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [password, setPassword] = useState('');
    const [code, setCode] = useState(codeFromUrl);
    const [submitting, setSubmitting] = useState(false);
    const [sendingCode, setSendingCode] = useState(false);
    const matchesCode = info?.matchesCode === true;

    useEffect(() => {
        const run = async () => {
            if (!email) { setError('Falta el email en la URL'); setLoading(false); return; }
            try {
                setError(null);
                const url = `${API}/bookingmodule/public/clients/${encodeURIComponent(email)}${codeFromUrl ? `?code=${encodeURIComponent(codeFromUrl)}` : ''}`;
                const res = await fetch(url, { cache: 'no-store' });
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [email, codeFromUrl]);

    const canSubmit = useMemo(() => {
        if (!password || password.length < 6) return false;
        // Si NO coincide el code, exigimos ingresar code manualmente (8 dígitos)
        if (!matchesCode) {
            return /^\d{8}$/.test(code);
        }
        return true;
    }, [password, code, matchesCode]);

    const submit = async () => {
        try {
            setSubmitting(true);
            setError(null);
            const res = await fetch(`${API}/bookingmodule/public/clients/${encodeURIComponent(email)}/set-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Si el código matcheó por URL, igual lo mandamos para validación server-side;
                // si no coincidía, enviamos el que el usuario tipeó.
                body: JSON.stringify({ password, code: matchesCode ? codeFromUrl : code }),
            });
            if (!res.ok) {
                const msg = (await res.text()) || 'No se pudo guardar la contraseña';
                throw new Error(msg);
            }
            // Listo: redirigimos
            router.replace('/');
        } catch (e: any) {
            setError(e.message || 'Error');
        } finally {
            setSubmitting(false);
        }
    };

    const requestCode = async () => {
        if (!email) return;
        try {
            setSendingCode(true);
            setError(null);
            const res = await fetch(`${API}/bookingmodule/public/clients/${encodeURIComponent(email)}/start-signup`, {
                method: 'POST',
            });
            if (!res.ok) throw new Error((await res.text()) || 'No se pudo generar el código');
            // Podrías mostrar un toast. Acá solo reseteo por las dudas.
            // En dev podrías leer el code dev en la respuesta si el backend lo devuelve.
        } catch (e: any) {
            setError(e.message || 'Error');
        } finally {
            setSendingCode(false);
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

            {/* Si el código de la URL coincide, solo pedimos password; si no, pedimos código + password */}
            {!matchesCode && (
                <div className="space-y-2">
                    <label className="block text-sm">
                        Código (8 dígitos)
                        <input
                            className="mt-1 border rounded w-full p-2"
                            type="text"
                            inputMode="numeric"
                            pattern="\d{8}"
                            maxLength={8}
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                            placeholder="Ej: 12345678"
                        />
                    </label>

                    <button
                        onClick={requestCode}
                        disabled={sendingCode}
                        className="w-full py-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                        {sendingCode ? 'Enviando código…' : 'Enviar código'}
                    </button>
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
                disabled={!canSubmit || submitting}
            >
                {submitting ? 'Guardando…' : 'Guardar'}
            </button>
        </div>
    );
}
