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

  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = []
    const startTime = 8.5 // 8:30
    const endTime = 23.5 // 23:30
    const slotDuration = 1.5 // 1.5 hours

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

    console.log("[v0] Loaded reservations for date:", selectedDate, data)
    setReservations(data || [])
  }

  // Load reservations for selected date and court
  useEffect(() => {
    loadReservations()
  }, [court.id, selectedDate])

  // Subscribe to realtime changes in reservations for the current court and date
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
        (payload) => {
          console.log("[Realtime] Cambio en reservas recibido:", payload)
          loadReservations() // Refresh reservations on any change
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [court.id, selectedDate])

  // Update time slots availability based on reservations
  useEffect(() => {
    const slots = generateTimeSlots()
    const updatedSlots = slots.map((slot) => {
      // Comparar solo las primeras 5 posiciones (hora y minutos)
      const isReserved = reservations.some((reservation) =>
        reservation.start_time.substring(0, 5) === slot.time
      )
      return {
        ...slot,
        available: !isReserved,
        reservationId: isReserved
          ? reservations.find((r) => r.start_time.substring(0, 5) === slot.time)?.id
          : undefined,
      }
    })
    console.log(
      "[v0] Updated slots availability:",
      updatedSlots.filter((s) => !s.available),
    )
    setTimeSlots(updatedSlots)
  }, [reservations])

  const handleSlotClick = (time: string, available: boolean) => {
    if (!available) {
      console.log("[v0] Slot not available:", time)
      return
    }

    if (selectedSlots.includes(time)) {
      setSelectedSlots(selectedSlots.filter((slot) => slot !== time))
    } else {
      // Allow maximum 2 consecutive slots
      if (selectedSlots.length >= 2) {
        setSelectedSlots([time])
      } else if (selectedSlots.length === 1) {
        // Check if slots are consecutive
        const existingSlot = selectedSlots[0]
        const existingIndex = timeSlots.findIndex((slot) => slot.time === existingSlot)
        const newIndex = timeSlots.findIndex((slot) => slot.time === time)

        if (Math.abs(existingIndex - newIndex) === 1) {
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

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single()

      if (profileError || !profile) {
        // Create profile if it doesn't exist
        const { error: createProfileError } = await supabase.from("profiles").insert({
          id: user.id,
          email: user.email || "",
          street: "",
          full_name: user.user_metadata?.full_name || "",
        })

        if (createProfileError) {
          console.error("Error creating profile:", createProfileError)
          throw new Error("Error al crear perfil de usuario")
        }
      }

      // Sort selected slots to ensure proper start/end times
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

      if (error) {
        console.error("Error al reservar:", error)
        throw error
      }

      console.log("[v0] Reserva creada exitosamente:", newReservation)

      if (newReservation) {
        setReservations((prev) => [...prev, newReservation])
        console.log("[v0] Updated local reservations state")
      }

      setSelectedSlots([])

      // Show success message with modal
      setModalMsg("¡Reserva confirmada exitosamente!")
      setModalOpen(true)
    } catch (error) {
      console.error("Error al reservar:", error)
      setModalMsg("Error al crear la reserva. Por favor, inténtalo de nuevo.")
      setModalOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  // Generate next 7 days for date selection
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

      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seleccionar Fecha</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {getNextDays(7).map((date) => {
              const dateString = date.toISOString().split("T")[0]
              const isSelected = selectedDate === dateString
              const isToday = dateString === new Date().toISOString().split("T")[0]

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
                    {isToday && <div className="text-xs opacity-75">Hoy</div>}
                  </div>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Time Slots */}
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

              return (
                <Button
                  key={slot.time}
                  variant={isSelected ? "default" : isAvailable ? "outline" : "secondary"}
                  size="sm"
                  onClick={() => handleSlotClick(slot.time, isAvailable)}
                  disabled={!isAvailable}
                  className={`h-12 ${
                    isSelected
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : isAvailable
                      ? "border-emerald-200 hover:bg-emerald-50 text-slate-700"
                      : "bg-red-100 text-red-600 cursor-not-allowed hover:bg-red-100"
                  }`}
                >
                  <div className="text-center">
                    <div className="font-medium">{slot.time}</div>
                    <div className="text-xs opacity-75">{isAvailable ? "Libre" : "Ocupado"}</div>
                  </div>
                </Button>
              )
            })}
          </div>

          {selectedSlots.length > 0 && (
            <div className="mt-6 p-4 bg-emerald-50 rounded-lg">
              <div className="flex items-center justify-between">
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal estilo Apple */}
      <AlertModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Reserva"
        message={modalMsg}
      />
    </div>
  )
}
