'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../auth/AuthProvider';
import axios from 'axios';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

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
      <main className="min-h-screen pt-24 md:pt-32 px-4">
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Tu cuenta</h1>
          <div className="mx-auto mt-3 h-1 w-16 rounded bg-yellow-400" />
          <p className="mt-6 text-slate-600">
            No estás logueado{' '}
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
    <main className="min-h-screen max-w-7xl mx-auto pt-24 lg:pt-32 px-4 lg:px-6 flex items-start flex-col w-full">
      <div className="mb-6 lg:mb-8 w-full">
        <h1 className="text-2xl lg:text-4xl font-extrabold text-slate-900 text-center lg:text-left">Tu cuenta</h1>
        <div className="mt-3 h-1 w-16 rounded bg-yellow-400 mx-auto lg:mx-0" />
      </div>

      <div className="flex w-full gap-6">
        <aside className="hidden lg:block w-[260px] shrink-0 rounded-2xl bg-white shadow-xl ring-1 ring-slate-100 p-4 h-max">
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

        <section className="flex-1 rounded-2xl lg:bg-white lg:shadow-xl lg:ring-1 lg:ring-slate-100 p-0 lg:p-8 min-h-[420px] w-full">
          <div className="lg:hidden -mt-2 -mx-2 mb-4">
            <div className="flex flex-wrap gap-2 overflow-x-auto px-2 pb-1">
              <MobileTab
                active={tab === 'perfil'}
                onClick={() => setTab('perfil')}
                label="Perfil"
              />
              <MobileTab
                active={tab === 'reservas'}
                onClick={() => setTab('reservas')}
                label="Reservaciones"
              />
              <div className="ml-auto">
                <button
                  onClick={logout}
                  className="whitespace-nowrap rounded-xl border border-red-200 bg-white text-red-600 px-3 py-1.5 text-sm"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 px-2">
              <div className="h-9 w-9 rounded-full bg-yellow-400/30 text-slate-900 flex items-center justify-center text-sm font-semibold">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-900 truncate">{user.name || 'Usuario'}</div>
                <div className="text-xs text-slate-500 truncate">{user.email}</div>
              </div>
            </div>
          </div>

          {tab === 'perfil' ? <PerfilView user={user} /> : <ReservasView />}
        </section>
      </div>
    </main>
  );
}

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
        active ? 'border-yellow-400 bg-yellow-50 text-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50',
      ].join(' ')}
    >
      <span className="text-slate-500">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );
}

function MobileTab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        'shrink-0 rounded-full px-3 py-1.5 text-sm border',
        active ? 'border-yellow-400 bg-yellow-50 text-slate-900' : 'border-slate-200 text-slate-600',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

function PerfilView({ user }: { user: { email: string; name?: string } }) {
  return (
    <div>
      <h2 className="text-lg md:text-xl font-semibold text-slate-900">Perfil</h2>
      <p className="text-slate-500 text-xs md:text-sm mt-1">Tu información de contacto</p>
      <div className="mt-6 space-y-5">
        <Row label="Nombre" value={user.name || '—'} />
        <Row label="Email" value={user.email} />
      </div>
    </div>
  );
}

function ReservasView() {
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const [reason, setReason] = useState("")
  const [submittingCancel, setSubmittingCancel] = useState(false)
  const [cancelErr, setCancelErr] = useState<string | null>(null)
  const { user, token } = useAuth()

  const accountId = '68b4e6c5b13caf9d9b16949a'
  const clientId = user?._id
  const totalPages = Math.max(1, Math.ceil(total / limit))

  useEffect(() => {
    if (!token || !accountId || !clientId) {
      setLoading(false)
      setErr(!token ? 'Falta token' : !accountId ? 'Falta accountId' : 'Falta clientId')
      return
    }
    const ctrl = new AbortController()
    const run = async () => {
      try {
        setLoading(true)
        setErr(null)
        const url = `${API}/bookingmodule/public/clients/by-account/${accountId}/clients/${clientId}/bookings`
        const { data } = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
          params: { upcoming: 1, page, limit },
          signal: ctrl.signal,
        })
        if (ctrl.signal.aborted) return
        setItems(Array.isArray(data?.items) ? data.items : [])
        setTotal(Number(data?.total ?? 0))
        if (Number.isFinite(data?.page)) setPage(Number(data.page))
      } catch (e: any) {
        if (axios.isCancel(e)) return
        setErr(e?.response?.data?.message || e.message || 'Error')
      } finally {
        if (!ctrl.signal.aborted) setLoading(false)
      }
    }
    run()
    return () => ctrl.abort()
  }, [token, accountId, clientId, page, limit])

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))

  const openCancel = (id: string) => {
    setCancelErr(null)
    setReason("")
    setCancelingId(id)
  }

  const closeCancel = () => {
    setSubmittingCancel(false)
    setCancelErr(null)
    setReason("")
    setCancelingId(null)
  }

  const confirmCancel = async () => {
    if (!cancelingId || !token) return
    try {
      setSubmittingCancel(true)
      setCancelErr(null)
      const url = `${API}/bookingmodule/public/cancel/${cancelingId}`
      await axios.post(
        url,
        reason ? { reason } : {},
        { headers: { Authorization: `Bearer ${token}` }, params: { accountId } }
      )
      setItems(prev => prev.map(it => it._id === cancelingId ? { ...it, status: 'canceled' } : it))
      closeCancel()
    } catch (e: any) {
      setCancelErr(e?.response?.data?.message || e.message || 'No se pudo cancelar')
      setSubmittingCancel(false)
    }
  }

  return (
    <div className="w-full">
      <h2 className="text-lg md:text-xl font-semibold text-slate-900">Tus reservaciones</h2>
      <p className="text-slate-500 text-xs md:text-sm mt-1">Acá verás tus próximos turnos.</p>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="text-sm text-slate-600">Total: {total}</div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Por página</span>
          <select
            value={limit}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10)
              if (v !== limit) {
                setPage(1)
                setLimit(v)
              }
            }}
            className="h-9 rounded-lg border border-slate-300 px-2 py-1 text-sm"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
        <div className="hidden md:grid grid-cols-5 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
          <div>Fecha</div>
          <div>Servicio</div>
          <div>Profesional</div>
          <div>Estado</div>
          <div>Acciones</div>
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
              <li key={b._id} className="px-4 py-3">
                <div className="hidden md:grid grid-cols-5 text-sm items-center">
                  <div className="font-medium text-slate-900">{fmt(b.start)}</div>
                  <div className="text-slate-700">{b.service?.name || '—'}</div>
                  <div className="text-slate-700">{b.professional?.name || 'A asignar'}</div>
                  <div>
                    <span
                      className={[
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium text-background',
                        b.status === 'confirmed' ? 'bg-emerald-600' : b.status === 'pending' ? 'bg-amber-600' : 'bg-rose-600',
                      ].join(' ')}
                    >
                      {b.status === 'canceled'
                        ? 'Cancelada'
                        : b.status === 'confirmed'
                          ? 'Confirmada'
                          : b.status === 'pending'
                            ? 'Pendiente'
                            : 'Desconocido'}
                    </span>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      className={[
                        'rounded-full border px-3 py-1.5 text-sm',
                        false
                          ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                          : 'border-green-300 text-green-600 hover:bg-green-50'
                      ].join(' ')}
                    >
                      Reprogramar
                    </button>
                    <button
                      onClick={() => openCancel(b._id)}
                      disabled={b.status === 'canceled'}
                      className={[
                        'rounded-full border px-3 py-1.5 text-sm',
                        b.status === 'canceled'
                          ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                          : 'border-red-300 text-red-600 hover:bg-red-50'
                      ].join(' ')}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>

                <div className="md:hidden space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-slate-900">{fmt(b.start)}</div>
                    <span
                      className={[
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium text-background',
                        b.status === 'confirmed' ? 'bg-emerald-600' : b.status === 'pending' ? 'bg-amber-600' : 'bg-rose-600',
                      ].join(' ')}
                    >
                      {b.status === 'canceled'
                        ? 'Cancelada'
                        : b.status === 'confirmed'
                          ? 'Confirmada'
                          : b.status === 'pending'
                            ? 'Pendiente'
                            : 'Desconocido'}
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="col-span-1 text-slate-500">Servicio</span>
                      <span className="col-span-2">{b.service?.name || '—'}</span>
                      <span className="col-span-1 text-slate-500">Profesional</span>
                      <span className="col-span-2">{b.professional?.name || 'A asignar'}</span>
                    </div>
                  </div>
                  <div className="pt-1">
                    <button
                      onClick={() => openCancel(b._id)}
                      disabled={b.status === 'canceled'}
                      className={[
                        'w-full rounded-xl border px-3 py-2 text-sm',
                        b.status === 'canceled'
                          ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                          : 'border-red-300 text-red-600 hover:bg-red-50'
                      ].join(' ')}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => openCancel(b._id)}
                      disabled={b.status === 'canceled'}
                      className={[
                        'w-full rounded-xl border px-3 py-2 text-sm',
                        b.status === 'canceled'
                          ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                          : 'border-red-300 text-red-600 hover:bg-red-50'
                      ].join(' ')}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-between">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1 || loading}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm disabled:opacity-50"
        >
          Anterior
        </button>
        <div className="text-sm text-slate-700 text-center">
          Página {page} de {totalPages}
        </div>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={page >= totalPages || loading}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>

      <div className="mt-6">
        <Link
          href="/reservar"
          className="inline-flex items-center gap-2 rounded-full border border-yellow-400 px-4 py-2 text-sm md:text-base font-medium text-slate-900 hover:bg-yellow-50 transition"
        >
          Reservar nueva cita
          <svg width="16" height="16" viewBox="0 0 24 24" className="text-slate-900">
            <path fill="currentColor" d="M13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
          </svg>
        </Link>
      </div>

      <Dialog open={!!cancelingId} onOpenChange={(o) => (o ? null : closeCancel())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar reservación</DialogTitle>
            <DialogDescription>Podés agregar una nota para explicar el motivo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motivo de la cancelación (opcional)"
              rows={4}
            />
            {cancelErr && <div className="text-sm text-red-600">{cancelErr}</div>}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              onClick={closeCancel}
              disabled={submittingCancel}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm"
            >
              Cerrar
            </button>
            <button
              onClick={confirmCancel}
              disabled={submittingCancel}
              className="rounded-xl border border-red-300 bg-red-600 text-white px-4 py-2 text-sm hover:bg-red-700 disabled:opacity-50"
            >
              {submittingCancel ? "Cancelando…" : "Cancelar turno"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
      <div className="text-slate-500">{label}</div>
      <div className="md:col-span-2 font-medium text-slate-900">{value}</div>
    </div>
  );
}
