"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import type { Reservation } from "@/lib/types"
import Link from "next/link"
import { AlertModal } from "@/components/ui/alert-modal"
import { ReservationCard } from "./reservation-card"

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
  const [now, setNow] = useState<Date>(() => new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMsg, setModalMsg] = useState("")

  const supabase = createClient()

  useEffect(() => {
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime()
    const timer = setTimeout(() => setNow(new Date()), msUntilMidnight)
    return () => clearTimeout(timer)
  }, [now])

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

  const refreshReservations = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select(`*, court:courts(*)`)
        .eq("status", "active")
        .order("date", { ascending: true })
        .order("start_time", { ascending: true })

      if (error) {
        console.error("[v0] Error refreshing reservations:", error)
        setModalMsg("Error al cargar las reservas. Por favor, recarga la página.")
        setModalOpen(true)
        return
      }

      if (data) setReservations(data)
    } catch (error) {
      console.error("[v0] Unexpected error refreshing reservations:", error)
      setModalMsg("Error inesperado. Por favor, recarga la página.")
      setModalOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshReservations()
    const channel = supabase
      .channel("all-reservations")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations", filter: `status=eq.active` }, () =>
        refreshReservations(),
      )
      .subscribe()

    return () => channel.unsubscribe()
  }, [supabase])

  const handleCancel = async (id: string) => {
    if (!id || typeof id !== "string") {
      setModalMsg("ID de reserva inválido.")
      setModalOpen(true)
      return
    }

    setCancellingId(id)
    setIsLoading(true)
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        throw new Error("Sesión expirada. Por favor, inicia sesión nuevamente.")
      }

      const reservation = reservations.find((r) => r.id === id)
      if (!reservation) {
        throw new Error("Reserva no encontrada.")
      }

      if (reservation.user_id !== user.id) {
        throw new Error("No tienes permisos para cancelar esta reserva.")
      }

      const { error } = await supabase
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", id)
        .eq("user_id", user.id)

      if (error) {
        console.error("[v0] Cancellation error:", error)
        throw new Error("Error al cancelar la reserva. Inténtalo de nuevo.")
      }

      setModalMsg("Reserva cancelada exitosamente")
      setModalOpen(true)
      refreshReservations()
    } catch (error: any) {
      console.error("[v0] Cancellation error:", error)
      setModalMsg(error.message || "Error al cancelar la reserva")
      setModalOpen(true)
    } finally {
      setIsLoading(false)
      setCancellingId(null)
    }
  }

  const sevenDaysAhead = new Date(now)
  sevenDaysAhead.setDate(now.getDate() + 7)

  const upcomingReservations = reservations.filter((r) => {
    const date = new Date(`${r.date}T${r.start_time}`)
    return date >= now && date <= sevenDaysAhead && r.status === "active"
  })

  const pastReservations = reservations.filter((r) => {
    const date = new Date(`${r.date}T${r.start_time}`)
    return date < now || r.status === "cancelled"
  })

  const badgeFor = (reservation: ReservationWithUser) => {
    const date = new Date(`${reservation.date}T${reservation.start_time}`)
    if (reservation.status === "cancelled") return <Badge variant="destructive">Cancelada</Badge>
    if (date < now) return <Badge variant="secondary">Completada</Badge>
    if (reservation.user_id === userId) return <Badge className="bg-emerald-100 text-emerald-700">Tuya</Badge>
    return <Badge className="bg-slate-300 text-slate-600">Ocupada</Badge>
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Reservas</h1>
          <p className="text-slate-600">Todas las reservas para evitar solapamientos</p>
          {isLoading && (
            <p className="text-sm text-green-600" aria-live="polite">
              Actualizando…
            </p>
          )}
        </div>
        <Button asChild className="w-full max-w-xs sm:w-auto bg-green-700 hover:bg-green-800 text-white">
          <Link href="/dashboard">Nueva Reserva</Link>
        </Button>
      </div>

      <section aria-labelledby="upcoming-reservations">
        <h2 id="upcoming-reservations" className="text-2xl font-bold text-slate-800 mb-6">
          Próximas Reservas
        </h2>
        {upcomingReservations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-600">No hay reservas próximas.</p>
              <Button asChild className="mt-4 bg-green-700 hover:bg-green-800 text-white">
                <Link href="/dashboard">Hacer Reserva</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4" role="list">
            {upcomingReservations.map((reservation) => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                onCancel={() => handleCancel(reservation.id)}
                isCancelling={cancellingId === reservation.id}
                showCancelButton={reservation.user_id === userId}
                badgeFor={badgeFor}
                formatDate={(d: string) =>
                  new Date(d).toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                }
                formatTime={(t: string) => t.slice(0, 5)}
              />
            ))}
          </div>
        )}
      </section>

      {pastReservations.length > 0 && (
        <section aria-labelledby="past-reservations">
          <h2 id="past-reservations" className="text-2xl font-bold text-slate-800 mb-6">
            Historial
          </h2>
          <div className="grid gap-4" role="list">
            {pastReservations.map((reservation) => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                onCancel={() => handleCancel(reservation.id)}
                isCancelling={cancellingId === reservation.id}
                showCancelButton={reservation.user_id === userId}
                badgeFor={badgeFor}
                formatDate={(d: string) =>
                  new Date(d).toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                }
                formatTime={(t: string) => t.slice(0, 5)}
              />
            ))}
          </div>
        </section>
      )}

      <AlertModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Reserva"
        message={modalMsg}
        aria-live="polite"
      />
    </div>
  )
}
