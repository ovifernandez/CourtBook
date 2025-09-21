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
          className="mb-6 border-primary text-primary hover:bg-primary/10"
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
    <div className="space-y-12">
      <div>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-xl relative">
            <svg className="w-8 h-8 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
              <span className="text-2xl">🎾</span>
              <path
                d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                fill="none"
                stroke="white"
                strokeWidth="1"
              />
              
            </svg>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full animate-pulse"></div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground flex items-center gap-2">
              Pistas de Tenis
            </h2>
            <p className="text-muted-foreground text-lg">Juega en nuestras pistas de tenis profesionales</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {tennisCourts.map((court) => (
            <CourtCard key={court.id} court={court} onSelect={setSelectedCourt} />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-400 rounded-full flex items-center justify-center shadow-xl relative">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-1.414-.586H13" />
              <path d="M7 7h.01" />
              <path d="M17 7h.01" />
              <path d="M7 17h.01" />
              <path d="M17 17h.01" />
            </svg>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-300 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground flex items-center gap-2">
              Pistas de Pádel
              <span className="text-2xl">🏓</span>
            </h2>
            <p className="text-muted-foreground text-lg">Disfruta del pádel en nuestra pista con cristales</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
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
    <Card className="hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:scale-105 border-2 hover:border-primary/30 bg-card relative overflow-hidden">
      <div className="absolute inset-0 court-pattern opacity-5"></div>
      <div className="absolute top-4 right-4">
        {isTennis ? (
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
            <span className="text-lg">🎾</span>
          </div>
        ) : (
          <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
            <span className="text-lg">🏓</span>
          </div>
        )}
      </div>

      <CardHeader className="pb-4 relative z-10" onClick={() => onSelect(court)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
            {court.name}
          </CardTitle>
          <Badge
            variant={isTennis ? "default" : "secondary"}
            className={
              isTennis
                ? "bg-primary/20 text-primary border-primary/30 font-semibold"
                : "bg-orange-500/20 text-orange-700 border-orange-500/30 font-semibold"
            }
          >
            {isTennis ? "Tenis" : "Pádel"}
          </Badge>
        </div>
        <CardDescription className="text-muted-foreground text-base">
          {isTennis
            ? "Pista de tenis reglamentaria con superficie dura"
            : "Pista de pádel cerrada con cristales y césped artificial"}
        </CardDescription>
      </CardHeader>

      <CardContent className="relative z-10" onClick={() => onSelect(court)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium">8:30 - 23:30</span>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground group-hover:shadow-lg transition-all font-semibold"
          >
            Ver Horarios →
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
