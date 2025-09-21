"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Reservation } from "@/lib/types"
import type { JSX } from "react"

interface ReservationWithUser extends Reservation {
  court: any
  user_id: string
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

export function ReservationCard({
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
    <Card className="hover:shadow-md transition-shadow" role="listitem">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${isTennis ? "bg-blue-100" : "bg-orange-100"}`}
              role="img"
              aria-label={`Icono de ${isTennis ? "tenis" : "pádel"}`}
            >
              <svg
                className={`w-5 h-5 ${isTennis ? "text-blue-600" : "text-orange-600"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-800">{reservation.court?.name}</CardTitle>
              <CardDescription className="text-slate-600">{formatDate(reservation.date)}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {badgeFor(reservation)}
            {showCancelButton && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onCancel(reservation.id)}
                disabled={isCancelling}
                aria-label={`Cancelar reserva ${reservation.id.slice(-8)}`}
              >
                {isCancelling ? "Cancelando..." : "Cancelar"}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>#{reservation.id.slice(-8)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
