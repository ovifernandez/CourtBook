"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const navItems = [
    { href: "/dashboard", label: "Reservar", icon: "calendar" },
    { href: "/dashboard/reservations", label: "Mis Reservas", icon: "list" },
    { href: "/dashboard/profile", label: "Mi Cuenta", icon: "user" },
  ]

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-bold text-slate-800">CourtBook</span>
            </Link>

            <div className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={pathname === item.href ? "default" : "ghost"}
                    size="sm"
                    className={
                      pathname === item.href
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "text-slate-600 hover:text-slate-800"
                    }
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="border-slate-200 text-slate-600 hover:bg-slate-50 bg-transparent"
          >
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </nav>
  )
}
