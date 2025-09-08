// app/perfil/page.tsx
'use client';
import { useAuth } from '../auth/AuthProvider';

export default function PerfilPage() {
  const { user } = useAuth();
  return (
    <>
      <div className="max-w-lg mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Tu perfil</h1>
        {!user ? (
          <p>No estás logueado.</p>
        ) : (
          <div className="space-y-2">
            <div><b>Nombre:</b> {user.name || '—'}</div>
            <div><b>Email:</b> {user.email}</div>
          </div>
        )}
      </div>
    </>
  );
}
