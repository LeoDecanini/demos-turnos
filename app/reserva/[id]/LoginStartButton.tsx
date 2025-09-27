'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

type Props = { email?: string };

const API = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export default function LoginStartButton({ email }: Props) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!email) return null;

  const onClick = async () => {
    try {
      setSending(true);
      setError(null);
      const res = await fetch(
        `${API}/bookingmodule/public/clients/${encodeURIComponent(email)}/start-signup`,
        { method: 'POST' }
      );
      if (!res.ok) throw new Error((await res.text()) || 'No se pudo enviar el código');
      setSent(true);
    } catch (e: any) {
      setError(e.message || 'Error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        onClick={onClick}
        disabled={sending || sent}
        className="bg-amber-600 hover:bg-amber-700 text-white"
      >
        {sent ? 'Código enviado' : sending ? 'Enviando…' : 'Iniciar sesión'}
      </Button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {sent && (
        <p className="text-sm text-slate-600">
          Revisá tu email para continuar. También podés{' '}
          <a
            className="underline"
            href={`/verify-client?email=${encodeURIComponent(email)}`}
          >
            crear tu contraseña
          </a>.
        </p>
      )}
    </div>
  );
}
