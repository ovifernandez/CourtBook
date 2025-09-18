"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Court } from "@/lib/types"
import { TimeSlotBooking } from "./time-slot-booking"

interface CourtSelectionProps {
  courts: Court[]
}

export function CourtSelection({ courts }: CourtSelectionProps) {
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null)

  if (selectedCourt) {
    return (
      <div>
        <Button
          variant="outline"
          onClick={() => setSelectedCourt(null)}
          className="mb-6 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
        >
          ← Volver a selección de pistas
        </Button>
        <TimeSlotBooking court={selectedCourt} />
      </div>
    )
  }

  const tennisCourts = courts.filter((court) => court.type === "tennis")
  const padelCourts = courts.filter((court) => court.type === "padel")

  return (
    <div className="space-y-8">
      {/* Tennis Courts Section */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Pistas de Tenis</h2>
            <p className="text-slate-600">Reserva tu pista de tenis favorita</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {tennisCourts.map((court) => (
            <CourtCard key={court.id} court={court} onSelect={setSelectedCourt} />
          ))}
        </div>
      </div>

      {/* Padel Courts Section */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Pistas de Pádel</h2>
            <p className="text-slate-600">Disfruta del pádel en nuestra pista</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {padelCourts.map((court) => (
            <CourtCard key={court.id} court={court} onSelect={setSelectedCourt} />
          ))}
        </div>
      </div>
    </div>
  )
}

interface CourtCardProps {
  court: Court
  onSelect: (court: Court) => void
}

function CourtCard({ court, onSelect }: CourtCardProps) {
  const isTennis = court.type === "tennis"

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => onSelect(court)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-800">{court.name}</CardTitle>
          <Badge
            variant={isTennis ? "default" : "secondary"}
            className={isTennis ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}
          >
            {isTennis ? "Tenis" : "Pádel"}
          </Badge>
        </div>
        <CardDescription className="text-slate-600">
          {isTennis ? "Pista de tenis reglamentaria" : "Pista de pádel con cristales"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Horarios: 8:30 - 23:30</span>
          </div>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white group-hover:bg-emerald-700">
            Ver Horarios
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
