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
      <div className="mb-8 relative">
        <div className="absolute top-0 right-0 w-16 h-16 opacity-10">
          <div className="w-full h-full bg-primary rounded-full animate-tennis-bounce"></div>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              <path d="M2 12h20" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">¡Hola, {profile?.full_name || "Tenista"}! 🎾</h1>
            <p className="text-muted-foreground text-lg">
              Reserva tu pista y disfruta del mejor tenis y pádel en Boadilla
            </p>
          </div>
        </div>
        <div className="court-pattern h-1 rounded-full bg-gradient-to-r from-primary via-accent to-primary opacity-20"></div>
      </div>

      <CourtSelection courts={courts || []} />
    </div>
  )
}
