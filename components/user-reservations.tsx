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

  const supabase = createClient()

  // Obtener usuario autenticado y establecer userId
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

  // Función para refrescar reservas desde la base de datos
  const refreshReservations = async () => {
    if (!userId) return
    setIsLoading(true)

    try {
      const { data: updatedReservations } = await supabase
        .from("reservations")
        .select(`
          *,
          court:courts(*)
        `)
        .eq("user_id", userId)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true })

      if (updatedReservations) {
        setReservations(updatedReservations)
      }
    } catch (error) {
      console.error("Error refreshing reservations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Inicial load y suscripción realtime a cambios en las reservas del usuario
  useEffect(() => {
    if (!userId) return

    refreshReservations()
    const channel = supabase
      .channel("user-reservations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reservations",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("[Realtime] Reserva cambiada:", payload)
          refreshReservations()
        }
      )
      .subscribe()

    // Limpieza al desmontar
    return () => {
      channel.unsubscribe()
    }
  }, [userId, supabase])

  const today = new Date().toISOString().split("T")[0]
  const now = new Date()

  const upcomingReservations = reservations.filter((reservation) => {
    if (reservation.status === "cancelled") return false
    const reservationDate = new Date(`${reservation.date}T${reservation.start_time}`)
    return reservationDate >= now
  })

  const pastReservations = reservations.filter((reservation) => {
    const reservationDate = new Date(`${reservation.date}T${reservation.start_time}`)
    return reservationDate < now || reservation.status === "cancelled"
  })

  const handleCancelReservation = async (reservationId: string) => {
    setCancellingId(reservationId)

    try {
      const { error } = await supabase.from("reservations").update({ status: "cancelled" }).eq("id", reservationId)
      if (error) throw error

      // No es obligatorio actualizar localmente porque lo hace el realtime, pero por UX se puede hacer:
      setReservations((prev) =>
        prev.map((reservation) =>
          reservation.id === reservationId ? { ...reservation, status: "cancelled" as const } : reservation,
        ),
      )

      console.log("[v0] Reservation cancelled successfully:", reservationId)
      alert("Reserva cancelada exitosamente")
    } catch (error) {
      console.error("Error al cancelar reserva:", error)
      alert("Error al cancelar la reserva. Por favor, inténtalo de nuevo.")
    } finally {
      setCancellingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5) // Remove seconds
  }

  const getStatusBadge = (reservation: Reservation & { court: any }) => {
    if (reservation.status === "cancelled") {
      return <Badge variant="destructive">Cancelada</Badge>
    }

    const now = new Date()
    const reservationDate = new Date(`${reservation.date}T${reservation.start_time}`)
    if (reservationDate < now) {
      return <Badge variant="secondary">Completada</Badge>
    }

    return <Badge className="bg-emerald-100 text-emerald-700">Activa</Badge>
  }

  const isTennis = (reservation: Reservation & { court: any }) => reservation.court?.type === "tennis"

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Mis Reservas</h1>
          <p className="text-slate-600">Gestiona tus reservas de pistas</p>
          {isLoading && <p className="text-sm text-emerald-600">Actualizando reservas...</p>}
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Link href="/dashboard">Nueva Reserva</Link>
        </Button>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Próximas Reservas</h2>
        {upcomingReservations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {/* Icono */}
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-2">No tienes reservas próximas</h3>
              <p className="text-slate-600 mb-4">¡Reserva una pista para empezar a jugar!</p>
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
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
                onCancel={handleCancelReservation}
                isCancelling={cancellingId === reservation.id}
                showCancelButton={true}
              />
            ))}
          </div>
        )}
      </div>

      {pastReservations.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Historial de Reservas</h2>
          <div className="grid gap-4">
            {pastReservations.map((reservation) => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                onCancel={handleCancelReservation}
                isCancelling={false}
                showCancelButton={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface ReservationCardProps {
  reservation: Reservation & { court: any }
  onCancel: (id: string) => void
  isCancelling: boolean
  showCancelButton: boolean
}

function ReservationCard({ reservation, onCancel, isCancelling, showCancelButton }: ReservationCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5) // Remove seconds
  }

  const getStatusBadge = (reservation: Reservation & { court: any }) => {
    if (reservation.status === "cancelled") {
      return <Badge variant="destructive">Cancelada</Badge>
    }

    const now = new Date()
    const reservationDate = new Date(`${reservation.date}T${reservation.start_time}`)
    if (reservationDate < now) {
      return <Badge variant="secondary">Completada</Badge>
    }

    return <Badge className="bg-emerald-100 text-emerald-700">Activa</Badge>
  }

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
          {getStatusBadge(reservation)}
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
                {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Reserva #{reservation.id.slice(-8)}</span>
            </div>
          </div>
          {showCancelButton && reservation.status === "active" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel(reservation.id)}
              disabled={isCancelling}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              {isCancelling ? "Cancelando..." : "Cancelar"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
