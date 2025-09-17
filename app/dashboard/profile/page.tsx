"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Upload, User, Mail, Shield, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UserProfile {
  id: string
  full_name: string
  street: string
  phone?: string
  email: string
  card_image_url?: string
  is_verified: boolean
  created_at: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    street: "",
    phone: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (error) throw error

      setProfile(data)
      setFormData({
        full_name: data.full_name || "",
        street: data.street || "",
        phone: data.phone || "",
      })
    } catch (error) {
      console.error("Error loading profile:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return

    setSaving(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          street: formData.street,
          phone: formData.phone,
        })
        .eq("id", profile.id)

      if (error) throw error

      setProfile((prev) => (prev ? { ...prev, ...formData } : null))
      toast({
        title: "Perfil actualizado",
        description: "Tus datos se han guardado correctamente",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCardUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !profile) return

    // TODO: Implementar subida de imagen de tarjeta
    // Esto se implementará en el futuro con Vercel Blob
    toast({
      title: "Próximamente",
      description: "La verificación por tarjeta estará disponible pronto",
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              <div className="h-32 bg-slate-200 rounded"></div>
              <div className="h-48 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Error</h1>
          <p className="text-slate-600">No se pudo cargar el perfil</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Mi Cuenta</h1>
            <p className="text-slate-600">Gestiona tu información personal</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Estado de Verificación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Estado de Verificación
              </CardTitle>
              <CardDescription>Tu estado como vecino del Club Social Parque Boadilla</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {profile.is_verified ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <Badge variant="default" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                      Verificado
                    </Badge>
                    <span className="text-sm text-slate-600">Tu cuenta está verificada como vecino</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                      Pendiente de Verificación
                    </Badge>
                    <span className="text-sm text-slate-600">
                      Sube tu tarjeta identificativa para verificar tu cuenta
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Información Personal */}
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>Actualiza tus datos personales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nombre Completo</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Tu nombre completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="Tu número de teléfono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="street">Calle</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => setFormData((prev) => ({ ...prev, street: e.target.value }))}
                  placeholder="Tu calle en Parque Boadilla"
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-md">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-600">{profile.email}</span>
                  <Badge variant="outline" className="ml-auto">
                    No editable
                  </Badge>
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </CardContent>
          </Card>

          {/* Verificación por Tarjeta (Futuro) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Verificación por Tarjeta
              </CardTitle>
              <CardDescription>
                Sube una foto de tu tarjeta identificativa del club para verificar tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile.card_image_url ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-sm text-emerald-800">
                      ✓ Tarjeta subida correctamente. Pendiente de revisión por el administrador.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 mb-2">Sube una foto clara de tu tarjeta identificativa</p>
                    <p className="text-sm text-slate-500 mb-4">Formatos: JPG, PNG (máx. 5MB)</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCardUpload}
                      className="hidden"
                      id="card-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById("card-upload")?.click()}
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    >
                      Seleccionar Archivo
                    </Button>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Próximamente:</strong> Esta funcionalidad estará disponible pronto para verificar
                      automáticamente que eres vecino del club.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Información de la Cuenta */}
          <Card>
            <CardHeader>
              <CardTitle>Información de la Cuenta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600">
                <p>
                  <strong>Miembro desde:</strong> {new Date(profile.created_at).toLocaleDateString("es-ES")}
                </p>
                <p>
                  <strong>ID de Usuario:</strong> {profile.id.slice(0, 8)}...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
