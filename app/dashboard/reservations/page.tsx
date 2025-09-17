import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { UserReservations } from "@/components/user-reservations"

export default async function ReservationsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user reservations with court information
  const { data: reservations } = await supabase
    .from("reservations")
    .select(`
      *,
      court:courts(*)
    `)
    .eq("user_id", data.user.id)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      <div className="container mx-auto px-4 py-8">
        <UserReservations reservations={reservations || []} />
      </div>
    </div>
  )
}
