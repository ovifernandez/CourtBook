export interface Court {
  id: string
  name: string
  type: "tennis" | "padel"
  created_at: string
}

export interface Profile {
  id: string
  email: string
  street: string
  full_name?: string
  club_card_verified: boolean
  created_at: string
}

export interface Reservation {
  id: string
  user_id: string
  court_id: string
  date: string
  start_time: string
  end_time: string
  status: "active" | "cancelled"
  created_at: string
  court?: Court
  profile?: Profile
}

export interface TimeSlot {
  time: string
  available: boolean
  reservationId?: string
}
