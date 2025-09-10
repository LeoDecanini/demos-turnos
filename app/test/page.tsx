'use client';

import { useMemo, useState } from 'react';

const API = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export default function StartClientSignupPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  const isValidEmail = (e: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const verifyLink = useMemo(() => {
    if (!email) return '';
    const origin =
      typeof window !== 'undefined' ? window.location.origin : '';
    const base = `${origin}/verify-client?email=${encodeURIComponent(
      email.trim()
    )}`;
    return devCode ? `${base}&code=${encodeURIComponent(devCode)}` : base;
  }, [email, devCode]);

  const start = async () => {
    setError(null);
    setOkMsg(null);
    setDevCode(null);

    const e = email.trim();
    if (!isValidEmail(e)) {
      setError('Ingresá un email válido');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(
        `${API}/bookingmodule/public/clients/${encodeURIComponent(e)}/start-signup`,
        { method: 'POST' }
      );
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'No se pudo generar el código');
      }
      const data = await res.json();
      // En dev el backend puede devolver { devCode }, en prod suele ser undefined
      if (data?.devCode) setDevCode(String(data.devCode));
      setOkMsg(
        data?.devCode
          ? 'Código generado (DEV). Usá el link de abajo para probar.'
          : 'Código generado. Revisá el canal de entrega (email/SMS).'
      );
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-md mx-auto p-6 space-y-5">
      <h1 className="text-2xl font-semibold">Generar código de alta</h1>
      <p className="text-sm text-gray-600">
        Ingresá el email del cliente y generá el código (8 dígitos). En
        producción se envía por el canal configurado; en desarrollo, el backend
        puede devolver <code>devCode</code> para probar rápido.
      </p>

      <label className="block text-sm">
        Email del cliente
        <input
          className="mt-1 border rounded w-full p-2"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="cliente@dominio.com"
        />
      </label>

      <button
        onClick={start}
        disabled={submitting || !email}
        className="w-full py-2 rounded bg-black text-white disabled:opacity-50"
      >
        {submitting ? 'Generando…' : 'Generar código'}
      </button>

      {error && <div className="text-red-600 text-sm">{error}</div>}
      {okMsg && <div className="text-green-700 text-sm">{okMsg}</div>}

      {/* Si estás en DEV y volvió devCode, mostramos también el código */}
      {devCode && (
        <div className="p-3 rounded bg-yellow-50 border border-yellow-200 text-sm">
          <div>
            <strong>devCode:</strong> <span className="font-mono">{devCode}</span>
          </div>
        </div>
      )}

      {/* Link de prueba a verify-client */}
      {verifyLink && (
        <div className="space-y-2">
          <div className="text-sm text-gray-700">Link de verificación:</div>
          <a
            className="break-all text-blue-600 underline"
            href={verifyLink}
          >
            {verifyLink}
          </a>
          {!devCode && (
            <div className="text-xs text-gray-500">
              (En producción no se muestra el código. Este link solo lleva el
              email; ingresá el código recibido en la pantalla siguiente.)
            </div>
          )}
        </div>
      )}
    </main>
  );
}
