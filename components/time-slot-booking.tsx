"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import type { Court, Reservation, TimeSlot } from "@/lib/types"
import { AlertModal } from "@/components/ui/alert-modal"

interface TimeSlotBookingProps {
  court: Court
}

export function TimeSlotBooking({ court }: TimeSlotBookingProps) {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMsg, setModalMsg] = useState("")

  const timeToMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number)
    return hours * 60 + minutes
  }

  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = []
    const startTime = 8.5
    const endTime = 23.5
    const slotDuration = 1.5

    for (let time = startTime; time <= endTime - slotDuration; time += slotDuration) {
      const wholeHour = Math.floor(time)
      const minutes = (time % 1) * 60
      const timeString = `${wholeHour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`

      slots.push({
        time: timeString,
        available: true,
      })
    }
    return slots
  }

  const loadReservations = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("reservations")
      .select("*")
      .eq("court_id", court.id)
      .eq("date", selectedDate)
      .eq("status", "active")

    setReservations(data || [])
  }

  useEffect(() => {
    loadReservations()
  }, [court.id, selectedDate])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("reservation-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reservations",
          filter: `court_id=eq.${court.id},date=eq.${selectedDate}`,
        },
        () => loadReservations()
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [court.id, selectedDate])

  useEffect(() => {
    const slots = generateTimeSlots()

    const updatedSlots = slots.map((slot) => {
      const slotMinutes = timeToMinutes(slot.time)
      const isReserved = reservations.some((reservation) => {
        const resStart = timeToMinutes(reservation.start_time.substring(0, 5))
        const resEnd = timeToMinutes(reservation.end_time.substring(0, 5))
        return slotMinutes >= resStart && slotMinutes < resEnd
      })

      return {
        ...slot,
        available: !isReserved,
      }
    })

    setTimeSlots(updatedSlots)
  }, [reservations])

  const handleSlotClick = (time: string, available: boolean, isPast: boolean) => {
    if (!available || isPast) return

    if (selectedSlots.includes(time)) {
      setSelectedSlots(selectedSlots.filter((s) => s !== time))
    } else {
      if (selectedSlots.length >= 2) {
        setSelectedSlots([time])
      } else if (selectedSlots.length === 1) {
        const indexOld = timeSlots.findIndex((s) => s.time === selectedSlots[0])
        const indexNew = timeSlots.findIndex((s) => s.time === time)
        if (Math.abs(indexOld - indexNew) === 1) {
          setSelectedSlots([...selectedSlots, time])
        } else {
          setSelectedSlots([time])
        }
      } else {
        setSelectedSlots([time])
      }
    }
  }

  const handleBooking = async () => {
    if (selectedSlots.length === 0) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuario no autenticado")

      const { data: currentReservations } = await supabase
        .from("reservations")
        .select("*")
        .eq("court_id", court.id)
        .eq("date", selectedDate)
        .eq("status", "active")

      const selectedMinutes = selectedSlots.map((slot) => timeToMinutes(slot)).sort((a, b) => a - b)

      for (const reservation of currentReservations || []) {
        const resStart = timeToMinutes(reservation.start_time.substring(0, 5))
        const resEnd = timeToMinutes(reservation.end_time.substring(0, 5))

        for (const slotMin of selectedMinutes) {
          if (slotMin >= resStart && slotMin < resEnd) {
            throw new Error("Alguno de los slots seleccionados ya está reservado. Por favor, elige otros horarios.")
          }
        }
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single()

      if (profileError || !profile) {
        const { error: createProfileError } = await supabase.from("profiles").insert({
          id: user.id,
          email: user.email || "",
          street: "",
          full_name: user.user_metadata?.full_name || "",
        })
        if (createProfileError) throw new Error("Error al crear perfil de usuario")
      }

      const sortedSlots = selectedSlots.sort()
      const startTime = sortedSlots[0]
      const endSlotIndex = timeSlots.findIndex((slot) => slot.time === sortedSlots[sortedSlots.length - 1])
      const endTime = timeSlots[endSlotIndex + 1]?.time || "23:30"

      const { data: newReservation, error } = await supabase
        .from("reservations")
        .insert({
          user_id: user.id,
          court_id: court.id,
          date: selectedDate,
          start_time: startTime,
          end_time: endTime,
          status: "active",
        })
        .select()
        .single()

      if (error) throw error

      if (newReservation) {
        setReservations((prev) => [...prev, newReservation])
      }
      setSelectedSlots([])

      setModalMsg("¡Reserva confirmada exitosamente!")
      setModalOpen(true)
    } catch (error: any) {
      setModalMsg(error.message || "Error al crear la reserva. Por favor, inténtalo de nuevo.")
      setModalOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  const getNextDays = (count: number) => {
    const days = []
    for (let i = 0; i < count; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      days.push(date)
    }
    return days
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })
  }

  const now = new Date()
  const currentTime = now.toTimeString().slice(0, 5)
  const isToday = selectedDate === now.toISOString().split("T")[0]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                court.type === "tennis" ? "bg-blue-100" : "bg-orange-100"
              }`}
            >
              <svg
                className={`w-5 h-5 ${court.type === "tennis" ? "text-blue-600" : "text-orange-600"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{court.name}</h2>
              <p className="text-sm text-slate-600">Selecciona fecha y horarios</p>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seleccionar Fecha</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {getNextDays(7).map((date) => {
              const dateString = date.toISOString().split("T")[0]
              const isSelected = selectedDate === dateString
              const isDateToday = dateString === new Date().toISOString().split("T")[0]

              return (
                <Button
                  key={dateString}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDate(dateString)}
                  className={`min-w-fit ${
                    isSelected ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xs">{formatDate(date)}</div>
                    {isDateToday && <div className="text-xs opacity-75">Hoy</div>}
                  </div>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Horarios Disponibles</CardTitle>
          <p className="text-sm text-slate-600">Puedes reservar hasta 2 slots consecutivos (3 horas máximo)</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {timeSlots.map((slot) => {
              const isSelected = selectedSlots.includes(slot.time)
              const isAvailable = slot.available
              const isPast = isToday && timeToMinutes(slot.time) <= timeToMinutes(currentTime)

              return (
                <Button
                  key={slot.time}
                  variant={isSelected ? "default" : isAvailable && !isPast ? "outline" : "secondary"}
                  size="sm"
                  onClick={() => handleSlotClick(slot.time, isAvailable, isPast)}
                  disabled={!isAvailable || isPast}
                  className={`h-12 ${
                    isSelected
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : isAvailable && !isPast
                      ? "border-emerald-200 hover:bg-emerald-50 text-slate-700"
                      : "bg-red-100 text-red-600 cursor-not-allowed hover:bg-red-100"
                  }`}
                >
                  <div className="text-center">
                    <div className="font-medium">{slot.time}</div>
                    <div className="text-xs opacity-75">{isPast ? "Pasado" : isAvailable ? "Libre" : "Ocupado"}</div>
                  </div>
                </Button>
              )
            })}
          </div>

          {selectedSlots.length > 0 && (
            <div className="mt-6 p-4 bg-emerald-50 rounded-lg">
              <div className="hidden sm:flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-slate-800">Reserva Seleccionada</h4>
                  <p className="text-sm text-slate-600">
                    {selectedSlots.sort().join(" - ")} ({selectedSlots.length * 1.5} horas)
                  </p>
                </div>
                <Button
                  onClick={handleBooking}
                  disabled={isLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isLoading ? "Reservando..." : "Confirmar Reserva"}
                </Button>
              </div>

              <div className="sm:hidden space-y-4">
                <div className="text-center">
                  <h4 className="font-medium text-slate-800">Reserva Seleccionada</h4>
                  <p className="text-sm text-slate-600">
                    {selectedSlots.sort().join(" - ")} ({selectedSlots.length * 1.5} horas)
                  </p>
                </div>
                <Button
                  onClick={handleBooking}
                  disabled={isLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isLoading ? "Reservando..." : "Confirmar Reserva"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertModal open={modalOpen} onClose={() => setModalOpen(false)} title="Reserva" message={modalMsg} />
    </div>
  )
}
