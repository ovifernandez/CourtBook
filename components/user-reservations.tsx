"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import type { Reservation } from "@/lib/types"
import Link from "next/link"

interface UserReservationsProps {
  reservations: (Reservation & { court: any })[]
}

export function UserReservations({ reservations: initialReservations }: UserReservationsProps) {
  const [reservations, setReservations] = useState(initialReservations)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [now, setNow] = useState<Date>(() => new Date()) // “reloj” interno

  const supabase = createClient()

  /* -------------------- 1. ACTUALIZAR ‘now’ A MEDIANOCHE ------------------- */
  useEffect(() => {
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime()

    const timer = setTimeout(() => setNow(new Date()), msUntilMidnight)
    return () => clearTimeout(timer)
  }, [now])

  /* ----------------------- 2. OBTENER USUARIO ACTIVO ----------------------- */
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error) console.error("Error al obtener usuario:", error)
      if (user) setUserId(user.id)
    }
    getUser()
  }, [supabase])

  /* ------------------ 3. CARGAR / REFRESCAR RESERVAS ---------------------- */
  const refreshReservations = async () => {
    if (!userId) return
    setIsLoading(true)
    try {
      const { data } = await supabase
        .from("reservations")
        .select(`*, court:courts(*)`)
        .eq("user_id", userId)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true })

      if (data) setReservations(data)
    } catch (error) {
      console.error("Error refreshing reservations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  /* -------- 4. SUSCRIPCIÓN REALTIME A CAMBIOS EN RESERVAS DEL USUARIO ------ */
  useEffect(() => {
    if (!userId) return
    refreshReservations()

    const channel = supabase
      .channel("user-reservations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations", filter: `user_id=eq.${userId}` },
        () => refreshReservations(),
      )
      .subscribe()

    return () => channel.unsubscribe()
  }, [userId, supabase])

  /* --------------------------- 5. FILTROS UI ------------------------------ */
  const sevenDaysAhead = new Date(now)
  sevenDaysAhead.setDate(now.getDate() + 7)

  // Próximas (máx. 7 días, activas)
  const upcomingReservations = reservations.filter((r) => {
    if (r.status !== "active") return false
    const date = new Date(`${r.date}T${r.start_time}`)
    return date >= now && date <= sevenDaysAhead
  })

  // Pasadas (cualquier estado) - solo fechas anteriores a hoy
  const pastReservations = reservations.filter((r) => {
    const date = new Date(`${r.date}T${r.start_time}`)
    return date < now
  })

  /* --------------------- 6. CANCELAR RESERVA (UPDATE) --------------------- */
  const handleCancelReservation = async (id: string) => {
    setCancellingId(id)
    try {
      const { error } = await supabase.from("reservations").update({ status: "cancelled" }).eq("id", id)
      if (error) throw error
      // Optimista: marcar como cancelada localmente, realtime hará el resto
      setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)))
    } catch (error) {
      console.error("Error al cancelar reserva:", error)
      alert("No se pudo cancelar la reserva. Inténtalo de nuevo.")
    } finally {
      setCancellingId(null)
    }
  }

  /* ---------------------------- 7. HELPERS UI ----------------------------- */
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })

  const formatTime = (t: string) => t.slice(0, 5)

  const badgeFor = (r: Reservation & { court: any }) => {
    const date = new Date(`${r.date}T${r.start_time}`)
    if (r.status === "cancelled") return <Badge variant="destructive">Cancelada</Badge>
    if (date < now) return <Badge variant="secondary">Completada</Badge>
    return <Badge className="bg-emerald-100 text-emerald-700">Activa</Badge>
  }

  /* ------------------------------ 8. RENDER ------------------------------- */
  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Mis Reservas</h1>
          <p className="text-slate-600">Gestiona tus reservas de pistas</p>
          {isLoading && <p className="text-sm text-emerald-600">Actualizando…</p>}
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Link href="/dashboard">Nueva Reserva</Link>
        </Button>
      </div>

      {/* Próximas */}
      <section>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Próximas (≤ 7 días)</h2>
        {upcomingReservations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-600">No hay reservas próximas.</p>
              <Button asChild className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Link href="/dashboard">Hacer Reserva</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {upcomingReservations.map((r) => (
              <ReservationCard
                key={r.id}
                reservation={r}
                onCancel={handleCancelReservation}
                isCancelling={cancellingId === r.id}
                showCancelButton
                badgeFor={badgeFor}
                formatDate={formatDate}
                formatTime={formatTime}
              />
            ))}
          </div>
        )}
      </section>

      {/* Historial */}
      {pastReservations.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Historial</h2>
          <div className="grid gap-4">
            {pastReservations.map((r) => (
              <ReservationCard
                key={r.id}
                reservation={r}
                onCancel={handleCancelReservation}
                isCancelling={false}
                showCancelButton={false}
                badgeFor={badgeFor}
                formatDate={formatDate}
                formatTime={formatTime}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

/* ----------------------- Card reutilizable ----------------------- */
interface ReservationCardProps {
  reservation: Reservation & { court: any }
  onCancel: (id: string) => void
  isCancelling: boolean
  showCancelButton: boolean
  badgeFor: (r: Reservation & { court: any }) => JSX.Element
  formatDate: (d: string) => string
  formatTime: (t: string) => string
}

function ReservationCard({
  reservation,
  onCancel,
  isCancelling,
  showCancelButton,
  badgeFor,
  formatDate,
  formatTime,
}: ReservationCardProps) {
  const isTennis = reservation.court?.type === "tennis"

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isTennis ? "bg-blue-100" : "bg-orange-100"
              }`}
            >
              <svg
                className={`w-5 h-5 ${isTennis ? "text-blue-600" : "text-orange-600"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-800">{reservation.court?.name}</CardTitle>
              <CardDescription className="text-slate-600">{formatDate(reservation.date)}</CardDescription>
            </div>
          </div>
          {badgeFor(reservation)}
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                {formatTime(reservation.start_time)} – {formatTime(reservation.end_time)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>#{reservation.id.slice(-8)}</span>
            </div>
          </div>

          {showCancelButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel(reservation.id)}
              disabled={isCancelling}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              {isCancelling ? "Cancelando…" : "Cancelar"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
