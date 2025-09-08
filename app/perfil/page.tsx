'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../auth/AuthProvider';

type TabKey = 'perfil' | 'reservas';
const API = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export default function PerfilPage() {
  const { user, token, logout } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<TabKey>('reservas');

  useEffect(() => setHydrated(true), []);
  if (!hydrated) return null;

  if (!user) {
    return (
      <main className="min-h-screen pt-32">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-slate-900">Tu cuenta</h1>
          <div className="mx-auto mt-3 h-1 w-16 rounded bg-yellow-400" />
          <p className="mt-6 text-slate-600">
            No estás logueado.{' '}
            <Link href="/login" className="underline text-slate-900 hover:text-slate-700">
              Ingresar
            </Link>
          </p>
        </div>
      </main>
    );
  }

  const initials = (() => {
    const base = (user?.name || user?.email || '').trim();
    if (!base) return 'U';
    const parts = base.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return base.slice(0, 2).toUpperCase();
  })();

  return (
    <main className="min-h-screen max-w-7xl mx-auto pt-32 flex items-center flex-col w-full">
      <div className="mb-8 flex items-center flex-col w-full">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">Tu cuenta</h1>
        <div className="mt-3 h-1 w-16 rounded bg-yellow-400" />
      </div>

      {/* layout: botones (izq) | contenido (der) */}
      <div className="flex gap-6 w-full">
        {/* sidebar */}
        <aside className="w-[260px] shrink-0 rounded-2xl bg-white shadow-xl ring-1 ring-slate-100 p-4 h-max">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-yellow-400/30 text-slate-900 flex items-center justify-center font-semibold">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="font-medium text-slate-900 truncate">{user.name || 'Usuario'}</div>
              <div className="text-xs text-slate-500 truncate">{user.email}</div>
            </div>
          </div>

          <nav className="space-y-2">
            <SidebarBtn
              active={tab === 'perfil'}
              onClick={() => setTab('perfil')}
              label="Perfil"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
                </svg>
              }
            />
            <SidebarBtn
              active={tab === 'reservas'}
              onClick={() => setTab('reservas')}
              label="Reservaciones"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M7 2v2H5a2 2 0 0 0-2 2v2h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2ZM3 10v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8Zm4 2h4v4H7Z" />
                </svg>
              }
            />
          </nav>

          <hr className="my-4 border-slate-200" />

          <button
            onClick={logout}
            className="w-full rounded-xl border border-red-200 bg-white text-red-600 hover:bg-red-50 py-2 font-medium transition"
          >
            Cerrar sesión
          </button>
        </aside>

        {/* contenido */}
        <section className="flex-1 rounded-2xl bg-white shadow-xl ring-1 ring-slate-100 p-6 md:p-8 min-h-[420px]">
          {tab === 'perfil' ? <PerfilView user={user} /> : <ReservasView token={token} />}
        </section>
      </div>
    </main>
  );
}

/* ---------- componentes ---------- */

function SidebarBtn({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition',
        active
          ? 'border-yellow-400 bg-yellow-50 text-slate-900'
          : 'border-slate-200 text-slate-600 hover:bg-slate-50',
      ].join(' ')}
    >
      <span className="text-slate-500">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );
}

function PerfilView({ user }: { user: { email: string; name?: string } }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900">Perfil</h2>
      <p className="text-slate-500 text-sm mt-1">Tu información de contacto</p>

      <div className="mt-6 space-y-5">
        <Row label="Nombre" value={user.name || '—'} />
        <Row label="Email" value={user.email} />
      </div>
    </div>
  );
}

function ReservasView({ token }: { token: string | null }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!token) { setLoading(false); return; }
      try {
        setLoading(true);
        setErr(null);
        const r = await fetch(
          `${API}/bookingmodule/public/clients/me/bookings?upcoming=1&limit=50`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!r.ok) throw new Error(await r.text() || 'No se pudieron cargar tus reservaciones');
        const data = await r.json();
        setItems(Array.isArray(data) ? data : (data.items ?? []));
      } catch (e: any) {
        setErr(e.message || 'Error');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [token]);

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900">Tus reservaciones</h2>
      <p className="text-slate-500 text-sm mt-1">Acá verás tus próximos turnos.</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
        <div className="grid grid-cols-4 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
          <div>Fecha</div>
          <div>Servicio</div>
          <div>Profesional</div>
          <div>Estado</div>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-center text-slate-500">Cargando…</div>
        ) : err ? (
          <div className="px-4 py-6 text-center text-red-600">{err}</div>
        ) : items.length === 0 ? (
          <div className="px-4 py-6 text-center text-slate-500">Aún no tenés reservaciones.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((b: any) => (
              <li key={b._id} className="grid grid-cols-4 px-4 py-3 text-sm">
                <div className="font-medium text-slate-900">{fmt(b.start)}</div>
                <div className="text-slate-700">{b.service?.name || '—'}</div>
                <div className="text-slate-700">{b.professional?.name || 'A asignar'}</div>
                <div className="text-slate-700 capitalize">{b.status || '—'}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6">
        <Link
          href="/reservar"
          className="inline-flex items-center gap-2 rounded-full border border-yellow-400 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-yellow-50 transition"
        >
          Reservar nueva cita
          <svg width="16" height="16" viewBox="0 0 24 24" className="text-slate-900">
            <path fill="currentColor" d="M13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="text-slate-500">{label}</div>
      <div className="col-span-2 font-medium text-slate-900">{value}</div>
    </div>
  );
}
