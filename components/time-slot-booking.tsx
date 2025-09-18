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

  // Helper para convertir "HH:MM" a minutos desde medianoche
  const timeToMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number)
    return hours * 60 + minutes
  }

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

  // Update time slots availability based on reservations (correct marking)
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
        reservationId: isReserved
          ? reservations.find((r) => {
              const resStart = timeToMinutes(r.start_time.substring(0, 5))
              const resEnd = timeToMinutes(r.end_time.substring(0, 5))
              return slotMinutes >= resStart && slotMinutes < resEnd
            })?.id
          : undefined,
      }
    })

    console.log("[v0] Updated slots availability:", updatedSlots.filter((s) => !s.available))
    setTimeSlots(updatedSlots)
  }, [reservations])

  const handleSlotClick = (time: string, available: boolean, isPast: boolean) => {
    if (!available || isPast) {
      console.log("[v0] Slot not available or in the past:", time)
      return
    }

    if (selectedSlots.includes(time)) {
      setSelectedSlots(selectedSlots.filter((slot) => slot !== time))
    } else {
      // Allow maximum 2 consecutive slots
      if (selectedSlots
