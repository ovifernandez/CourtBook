"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import type { Reservation } from "@/lib/types"
import Link from "next/link"
import { AlertModal } from "@/components/ui/alert-modal"

// Se añade userId a las reservas para distinguir propias
interface ReservationWithUser extends Reservation {
  court: any
  user_id: string
}

interface UserReservationsProps {
  reservations: ReservationWithUser[]
}

export function UserReservations({ reservations: initialReservations }: UserReservationsProps) {
  const [reservations, setReservations] = useState(initialReservations)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [now, setNow] = useState<Date>(() => new Date()) // "reloj" interno
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMsg, setModalMsg] = useState("")

  const supabase = createClient()

  useEffect(() => {
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime()
    const timer = setTimeout(() => setNow(new Date()), msUntilMidnight)
    return () => clearTimeout(timer)
  }, [now])

  // Obtener usuario activo
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error) {
        console.error("Error al obtener usuario:", error)
        return
      }
      if (user) setUserId(user.id)
    }
    fetchUser()
  }, [supabase])

  // Refrescar todas las reservas activas (no solo las propias)
  const refreshReservations = async () => {
    setIsLoading(true)
    try {
      const { data } = await supabase
        .from("reservations")
        .select(`*, court:courts(*)`)
        .eq("status", "active") // solo activas
        .order("date", { ascending: true })
        .order("start_time", { ascending: true })

      if (data) setReservations(data)
    } catch (error) {
      console.error("Error refreshing reservations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Suscripción realtime sin filtro por userId (recibe todos los cambios)
  useEffect(() => {
    refreshReservations()
    const channel = supabase
      .channel("all-reservations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations", filter: `status=eq.active` },
        () => refreshReservations(),
      )
      .subscribe()

    return () => channel.unsubscribe()
  }, [supabase])

  const sevenDaysAhead = new Date(now)
  sevenDaysAhead.setDate(now.getDate() + 7)

  // Próximas reservas activas dentro de 7 días
  const upcomingReservations = reservations.filter((r) => {
    const date = new Date(`${r.date}T${r.start_time}`)
    return date >= now && date <= sevenDaysAhead && r.status === "active"
  })

  // Historial (canceladas o pasadas)
  const pastReservations = reservations.filter((r) => {
    const date = new Date(`${r.date}T${r.start_time}`)
    return date < now || r.status === "cancelled"
  })

  // Mostrar badge y diferenciar reservas propias
  const badgeFor = (reservation: ReservationWithUser) => {
    const date = new Date(`${reservation.date}T${reservation.start_time}`)
    if (reservation.status === "cancelled") return <Badge variant="destructive">Cancelada</Badge>
    if (date < now) return <Badge variant="secondary">Completada</Badge>
    if (reservation.user_id === userId) return <Badge className="bg-emerald-100 text-emerald-700">Tuya</Badge>
    return <Badge className="bg-slate-300 text-slate-600">Ocupada</Badge>
  }

  // El resto del render y handler de cancelación, botones, etc se mantiene igual...

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Reservas</h1>
          <p className="text-slate-600">Todas las reservas para evitar solapamientos</p>
          {isLoading && <p className="text-sm text-emerald-600">Actualizando…</p>}
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Link href="/dashboard">Nueva Reserva</Link>
        </Button>
      </div>

      <section>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Próximas Reservas</h2>
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
            {upcomingReservations.map((reservation) => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                onCancel={() => {}}
                isCancelling={false}
                showCancelButton={false}
                badgeFor={badgeFor}
                formatDate={(d: string) => new Date(d).toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                formatTime={(t: string) => t.slice(0, 5)}
              />
            ))}
          </div>
        )}
      </section>

      {pastReservations.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Historial</h2>
          <div className="grid gap-4">
            {pastReservations.map((reservation) => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                onCancel={() => {}}
                isCancelling={false}
                showCancelButton={false}
                badgeFor={badgeFor}
                formatDate={(d: string) => new Date(d).toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                formatTime={(t: string) => t.slice(0, 5)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

interface ReservationCardProps {
  reservation: ReservationWithUser
  onCancel: (id: string) => void
  isCancelling: boolean
  showCancelButton: boolean
  badgeFor: (r: ReservationWithUser) => JSX.Element
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
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${isTennis ? "bg-blue-100" : "bg-orange-100"}`}
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
              <span>{formatTime(reservation.start_time)} – {formatTime(reservation.end_time)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-
