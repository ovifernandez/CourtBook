import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CourtSelection } from "@/components/court-selection"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  // Get courts
  const { data: courts } = await supabase.from("courts").select("*").order("name")

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Bienvenido, {profile?.full_name || "Usuario"}</h1>
        <p className="text-slate-600">Selecciona una pista para ver los horarios disponibles</p>
      </div>

      <CourtSelection courts={courts || []} />
    </div>
  )
}
