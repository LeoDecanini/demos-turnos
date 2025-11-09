'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../auth/AuthProvider';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TabKey = 'perfil' | 'reservas';
const API_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL}/bookingmodule/public`;
const SUBDOMAIN = process.env.NEXT_PUBLIC_TENANT as string;

function getSlug() {
  if (SUBDOMAIN) return SUBDOMAIN;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const [sub] = host.split('.');
    return sub || '';
  }
  return '';
}

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
          <div className="mx-auto mt-3 h-1 w-16 rounded bg-green-400" />
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
        <div className="mt-3 h-1 w-16 rounded bg-green-400 mx-auto lg:mx-0" />
      </div>

      <div className="flex w-full gap-6">
        <aside className="hidden lg:block w-[260px] shrink-0 rounded-2xl bg-white shadow-xl ring-1 ring-slate-100 p-4 h-max">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-green-400/30 text-slate-900 flex items-center justify-center font-semibold">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="font-medium text-slate-900 truncate">{user.name || 'Usuario'}</div>
              <div className="text-xs text-slate-500 truncate">{user.email}</div>
            </div>
          </div>
          <nav className="space-y-2">
            <SidebarBtn active={tab === 'perfil'} onClick={() => setTab('perfil')} label="Perfil" />
            <SidebarBtn active={tab === 'reservas'} onClick={() => setTab('reservas')} label="Reservaciones" />
          </nav>
          <hr className="my-4 border-slate-200" />
          <button
            onClick={logout}
            className="w-full cursor-pointer rounded-xl border border-red-200 bg-white text-red-600 hover:bg-red-50 py-2 font-medium transition"
          >
            Cerrar sesión
          </button>
        </aside>

        <section className="flex-1 rounded-2xl lg:bg-white lg:shadow-xl lg:ring-1 lg:ring-slate-100 p-0 lg:p-8 min-h-[420px] w-full">
          <div className="lg:hidden -mt-2 -mx-2 mb-4">
            <div className="flex flex-wrap gap-2 overflow-x-auto px-2 pb-1">
              <MobileTab active={tab === 'perfil'} onClick={() => setTab('perfil')} label="Perfil" />
              <MobileTab active={tab === 'reservas'} onClick={() => setTab('reservas')} label="Reservaciones" />
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
              <div className="h-9 w-9 rounded-full bg-green-400/30 text-slate-900 flex items-center justify-center text-sm font-semibold">
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
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-left transition',
        active ? 'border-green-400 bg-green-50 text-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50',
      ].join(' ')}
    >
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
        active ? 'border-green-400 bg-green-50 text-slate-900' : 'border-slate-200 text-slate-600',
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

type Professional = { _id: string; name: string };

function ReservasView() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all'); // Estado del filtro
  const [clientId, setClientId] = useState<string | null>(null); // ID del cliente real

  const { user, token } = useAuth();

  const slug = getSlug();
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const getPayload = (raw: any) => raw?.data ?? raw;
  const fmt = (iso: string) => new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));

  // --- Fetch client profile to get real clientId ---
  useEffect(() => {
    const fetchClientProfile = async () => {
      if (!token || !slug) return;
      try {
        const url = `${API_BASE}/${slug}/clients/me`;
        const { data } = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('[fetchClientProfile] Client data:', data);
        setClientId(data._id || data.id);
      } catch (e: any) {
        console.error('[fetchClientProfile] Error:', e);
        setErr('No se pudo cargar el perfil del cliente');
      }
    };
    void fetchClientProfile();
  }, [token, slug]);


  // --- Fetch bookings ---
  const fetchBookings = useCallback(async () => {
    if (!token || !clientId || !slug) {
      setLoading(false);
      setErr(!token ? 'Falta token' : !clientId ? 'Falta clientId' : 'Falta slug');
      return;
    }
    try {
      setLoading(true);
      setErr(null);
      const url = `${API_BASE}/${slug}/clients/${clientId}/bookings`;
      const params: any = { 
        page, 
        limit,
        sort: 'start:desc', // Ordenar por fecha de cita (más reciente primero)
      };
      
      // Agregar filtro de estado si no es "all"
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      console.log(data)
      setItems(Array.isArray(data?.items) ? data.items : []);
      setTotal(Number(data?.total ?? 0));
      if (Number.isFinite(data?.page)) setPage(Number(data.page));
    } catch (e: any) {
      setErr(e?.response?.data?.message || e.message || 'Error');
    } finally {
      setLoading(false);
    }
  }, [token, clientId, page, limit, slug, statusFilter]); // Agregar statusFilter

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  // --- Render ---
  return (
    <div className="w-full">
      <h2 className="text-lg md:text-xl font-semibold text-slate-900">Tus reservaciones</h2>
      <p className="text-slate-500 text-xs md:text-sm mt-1">Acá verás tus próximos turnos.</p>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="text-sm text-slate-600">Total: {total}</div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Por página</span>
          <Select
            value={String(limit)}
            onValueChange={(v) => {
              const n = Number(v);
              if (n !== limit) {
                setPage(1);
                setLimit(n);
              }
            }}
          >
            <SelectTrigger className="h-9 w-[88px] cursor-pointer rounded-lg border border-slate-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem className='cursor-pointer' value="5">5</SelectItem>
              <SelectItem className='cursor-pointer' value="10">10</SelectItem>
              <SelectItem className='cursor-pointer' value="20">20</SelectItem>
              <SelectItem className='cursor-pointer' value="50">50</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro de estado */}
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setPage(1); // Reset a página 1 cuando cambia el filtro
            }}
          >
            <SelectTrigger className="h-9 w-[140px] cursor-pointer rounded-lg border border-slate-300">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem className='cursor-pointer' value="all">Todos</SelectItem>
              <SelectItem className='cursor-pointer' value="pending">Pendiente</SelectItem>
              <SelectItem className='cursor-pointer' value="confirmed">Confirmado</SelectItem>
              <SelectItem className='cursor-pointer' value="completed">Completado</SelectItem>
              <SelectItem className='cursor-pointer' value="canceled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
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
                      {b.status === 'canceled' ? 'Cancelada' : b.status === 'confirmed' ? 'Confirmada' : b.status === 'pending' ? 'Pendiente' : 'Desconocido'}
                    </span>
                  </div>

                  <TooltipProvider>
                    <div className="flex gap-2 justify-end">
                      {b.status === 'pending' && b.depositInitPoint && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => window.open(b.depositInitPoint, '_blank')}
                              className="inline-flex cursor-pointer items-center rounded-full border px-2.5 py-1 text-xs border-sky-300 text-sky-700 hover:bg-sky-50"
                            >
                              Pagar
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Pagar y confirmar tu turno</TooltipContent>
                        </Tooltip>
                      )}

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={
                              b.status === 'canceled'
                                ? '#'
                                : `/reservar?action=reschedule&id=${b._id}${b.service?._id ? `&serviceId=${b.service._id}` : ''}${b.modality === 'virtual' ? '&modality=virtual' : ''}`
                            }
                            className={[
                              'inline-flex cursor-pointer items-center rounded-full px-2.5 py-1 text-xs border',
                              b.status === 'canceled'
                                ? 'border-slate-200 text-slate-400 cursor-not-allowed pointer-events-none'
                                : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50',
                            ].join(' ')}
                          >
                            Reprogramar
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>Cambiar fecha u horario</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={
                              b.status === 'canceled'
                                ? '#'
                                : `/reservar?action=cancel&id=${b._id}`
                            }
                            className={[
                              'inline-flex cursor-pointer items-center rounded-full px-2.5 py-1 text-xs border',
                              b.status === 'canceled'
                                ? 'border-slate-200 text-slate-400 cursor-not-allowed pointer-events-none'
                                : 'border-rose-300 text-rose-700 hover:bg-rose-50',
                            ].join(' ')}
                          >
                            Cancelar
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>Cancelar la reserva</TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </div>

                {/* Mobile row */}
                <div className="md:hidden space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-slate-900">{fmt(b.start)}</div>
                    <span
                      className={[
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium text-background',
                        b.status === 'confirmed' ? 'bg-emerald-600' : b.status === 'pending' ? 'bg-amber-600' : 'bg-rose-600',
                      ].join(' ')}
                    >
                      {b.status === 'canceled' ? 'Cancelada' : b.status === 'confirmed' ? 'Confirmada' : b.status === 'pending' ? 'Pendiente' : 'Desconocido'}
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
                  <div className="pt-1 grid grid-cols-2 gap-2">
                    {b.status === 'pending' && b.depositInitPoint && (
                      <button
                        onClick={() => window.open(b.depositInitPoint, '_blank')}
                        className="w-full cursor-pointer rounded-xl border px-3 py-2 text-sm border-sky-300 text-sky-600 hover:bg-sky-50"
                      >
                        Pagar seña
                      </button>
                    )}
                    <Link
                      href={
                        b.status === 'canceled'
                          ? '#'
                          : `/reservar?action=reschedule&id=${b._id}${b.service?._id ? `&serviceId=${b.service._id}` : ''}${b.modality === 'virtual' ? '&modality=virtual' : ''}`
                      }
                      className={[
                        'w-full rounded-xl cursor-pointer border px-3 py-2 text-sm text-center',
                        b.status === 'canceled'
                          ? 'border-slate-200 text-slate-400 cursor-not-allowed pointer-events-none'
                          : 'border-green-300 text-green-600 hover:bg-green-50',
                      ].join(' ')}
                    >
                      Reprogramar
                    </Link>
                    <Link
                      href={
                        b.status === 'canceled'
                          ? '#'
                          : `/reservar?action=cancel&id=${b._id}`
                      }
                      className={[
                        'w-full rounded-xl cursor-pointer border px-3 py-2 text-sm text-center',
                        b.status === 'canceled'
                          ? 'border-slate-200 text-slate-400 cursor-not-allowed pointer-events-none'
                          : 'border-red-300 text-red-600 hover:bg-red-50',
                      ].join(' ')}
                    >
                      Cancelar
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-between">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1 || loading}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm disabled:opacity-50"
        >
          Anterior
        </button>
        <div className="text-sm text-slate-700 text-center">Página {page} de {totalPages}</div>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={page >= totalPages || loading}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
      <div className="text-slate-500">{label}</div>
      <div className="md:col-span-2 font-medium text-slate-900">{value}</div>
    </div>
  );
}
