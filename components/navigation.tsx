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
    <nav className="bg-card shadow-lg border-b-2 border-primary/20 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="flex items-center gap-3 group" onClick={closeMobileMenu}>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all group-hover:scale-110">
              <svg className="w-5 h-5 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path
                  d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                  fill="none"
                  stroke="white"
                  strokeWidth="1"
                />
                <path d="M2 12h20" fill="none" stroke="white" strokeWidth="1" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">
                CourtBook
              </span>
              <div className="text-xs text-muted-foreground font-medium">Boadilla</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? "default" : "ghost"}
                  size="sm"
                  className={
                    pathname === item.href
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-primary/10 font-medium"
                  }
                >
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="hidden md:flex border-primary/30 text-muted-foreground hover:bg-primary/10 hover:text-foreground hover:border-primary/50 bg-transparent font-medium"
          >
            Cerrar Sesión
          </Button>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-muted-foreground hover:text-foreground hover:bg-primary/10"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-primary/20 py-4 space-y-2 bg-card/95 backdrop-blur-sm">
            {navItems.map((item) => {
              const IconComponent = item.icon
              return (
                <Link key={item.href} href={item.href} onClick={closeMobileMenu}>
                  <Button
                    variant={pathname === item.href ? "default" : "ghost"}
                    size="sm"
                    className={`w-full justify-start gap-3 font-medium ${
                      pathname === item.href
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-primary/10"
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}

            {/* Mobile Sign Out */}
            <div className="pt-2 border-t border-primary/20">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleSignOut()
                  closeMobileMenu()
                }}
                className="w-full justify-start gap-3 border-primary/30 text-muted-foreground hover:bg-primary/10 hover:text-foreground bg-transparent font-medium"
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
