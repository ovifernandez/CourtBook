"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Menu, X, User, Calendar, List, LogOut } from "lucide-react"

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const navItems = [
    { href: "/dashboard", label: "Reservar", icon: Calendar },
    { href: "/dashboard/reservations", label: "Mis Reservas", icon: List },
    { href: "/dashboard/profile", label: "Mi Cuenta", icon: User },
  ]

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2" onClick={closeMobileMenu}>
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-slate-800">CourtBook</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
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

          {/* Desktop Sign Out */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="hidden md:flex border-slate-200 text-slate-600 hover:bg-slate-50 bg-transparent"
          >
            Cerrar Sesión
          </Button>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-slate-600"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 py-4 space-y-2">
            {navItems.map((item) => {
              const IconComponent = item.icon
              return (
                <Link key={item.href} href={item.href} onClick={closeMobileMenu}>
                  <Button
                    variant={pathname === item.href ? "default" : "ghost"}
                    size="sm"
                    className={`w-full justify-start gap-3 ${
                      pathname === item.href
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
            
            {/* Mobile Sign Out */}
            <div className="pt-2 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleSignOut()
                  closeMobileMenu()
                }}
                className="w-full justify-start gap-3 border-slate-200 text-slate-600 hover:bg-slate-50 bg-transparent"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
