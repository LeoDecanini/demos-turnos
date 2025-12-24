'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../auth/AuthProvider';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TabKey = 'perfil' | 'reservas' | 'declaraciones';
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
            <SidebarBtn active={tab === 'declaraciones'} onClick={() => setTab('declaraciones')} label="Declaraciones Juradas" />
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
              <MobileTab active={tab === 'declaraciones'} onClick={() => setTab('declaraciones')} label="Declaraciones" />
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

          {tab === 'perfil' ? <PerfilView user={user} /> : tab === 'declaraciones' ? <DeclaracionesView /> : <ReservasView />}
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

function DeclaracionesView() {
  const [pendingDeclarations, setPendingDeclarations] = useState<any[]>([]);
  const [completedDeclarations, setCompletedDeclarations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const { user, token } = useAuth();
  const slug = getSlug();

  // Obtener el clientId real
  useEffect(() => {
    const fetchClientProfile = async () => {
      if (!token || !slug) {
        console.log('Missing token or slug:', { token: !!token, slug });
        return;
      }
      try {
        const url = `${API_BASE}/${slug}/clients/me`;
        console.log('Fetching client profile from:', url);
        const { data } = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Client profile data:', data);
        setClientId(data._id);
      } catch (error) {
        console.error('Error fetching client profile:', error);
      }
    };
    fetchClientProfile();
  }, [token, slug]);

  // Obtener declaraciones pendientes y completadas
  useEffect(() => {
    if (!clientId) return;
    
    const fetchDeclarations = async () => {
      try {
        setLoading(true);
        
        // Pendientes
        const pendingUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/bookingmodule/health-declarations/pending/${clientId}`;
        console.log('Fetching pending declarations from:', pendingUrl);
        const { data: pending } = await axios.get(pendingUrl);
        console.log('Pending declarations:', pending);
        setPendingDeclarations(pending);

        // Completadas
        const completedUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/bookingmodule/health-declarations/completed/${clientId}`;
        console.log('Fetching completed declarations from:', completedUrl);
        const { data: completed } = await axios.get(completedUrl);
        console.log('Completed declarations:', completed);
        setCompletedDeclarations(completed);
      } catch (error) {
        console.error('Error fetching declarations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeclarations();
  }, [clientId]);

  const handleDownloadPDF = async (declarationId: string) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/bookingmodule/health-declarations/${declarationId}/pdf`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `declaracion-${declarationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error al descargar el PDF';
      alert(errorMsg);
    }
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-lg md:text-xl font-semibold text-slate-900">Declaraciones Juradas</h2>
        <p className="text-slate-500 text-xs md:text-sm mt-1">Tus formularios de salud</p>
        <div className="mt-6 space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      </div>
    );
  }

  const currentDeclarations = activeTab === 'pending' ? pendingDeclarations : completedDeclarations;

  return (
    <div>
      <h2 className="text-lg md:text-xl font-semibold text-slate-900">Declaraciones Juradas</h2>
      <p className="text-slate-500 text-xs md:text-sm mt-1">
        {pendingDeclarations.length} pendiente{pendingDeclarations.length !== 1 ? 's' : ''}, {completedDeclarations.length} completada{completedDeclarations.length !== 1 ? 's' : ''}
      </p>
      
      {/* Tabs */}
      <div className="mt-6 flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'pending'
              ? 'text-slate-900 border-b-2 border-green-400'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Pendientes ({pendingDeclarations.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'completed'
              ? 'text-slate-900 border-b-2 border-green-400'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Completadas ({completedDeclarations.length})
        </button>
      </div>
      
      {/* Lista de declaraciones */}
      <div className="mt-6 space-y-4">
        {currentDeclarations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-2">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-600 font-medium">
              {activeTab === 'pending' ? 'No tienes declaraciones pendientes' : 'No tienes declaraciones completadas'}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {activeTab === 'pending' ? 'Todos tus formularios están completos' : 'Completa tus primeros formularios'}
            </p>
          </div>
        ) : (
          currentDeclarations.map((declaration) => (
            <Card 
              key={declaration._id} 
              className={activeTab === 'pending' ? 'border-orange-200 bg-orange-50/50' : 'border-green-200 bg-green-50/50'}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base font-semibold text-slate-900">
                      {declaration.templateSnapshot?.name || 'Declaración Jurada'}
                    </CardTitle>
                    {declaration.templateSnapshot?.description && (
                      <p className="text-sm text-slate-600 mt-1">
                        {declaration.templateSnapshot.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        activeTab === 'pending' 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {activeTab === 'pending' ? 'Pendiente' : 'Completada'}
                      </span>
                      <span className="text-xs text-slate-500">
                        {declaration.templateSnapshot?.questions?.length || 0} preguntas
                      </span>
                      {declaration.submittedAt && (
                        <span className="text-xs text-slate-500">
                          • {new Date(declaration.submittedAt).toLocaleDateString('es-AR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  {activeTab === 'pending' ? (
                    <Link
                      href={`/formularios/${clientId}/${declaration._id}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Completar Formulario
                    </Link>
                  ) : (
                    <>
                      <Link
                        href={`/formularios/${clientId}/${declaration._id}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300 transition"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Ver Respuestas
                      </Link>
                      <button
                        onClick={() => handleDownloadPDF(declaration._id)}
                        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Descargar PDF
                      </button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
