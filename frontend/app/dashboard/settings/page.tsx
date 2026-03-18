"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, LogOut, Smartphone, Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const [name, setName] = useState("Matías");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  // Mock WhatsApp status
  const waLinked = true;
  const waPhone = "+54 9 11 1234-5678";

  async function handleSave() {
    setSaving(true);
    // Mock save
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ajustes</h1>
        <p className="text-sm text-muted-foreground">
          Configurá tu perfil y conexiones
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Perfil</CardTitle>
          <CardDescription>Tu información personal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input value="matias@ejemplo.com" disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">
              El email no se puede cambiar
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            WhatsApp
          </CardTitle>
          <CardDescription>Estado de la conexión con WhatsApp</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Estado</span>
            {waLinked ? (
              <Badge className="bg-[var(--success)] text-[var(--success-foreground)]">
                Conectado
              </Badge>
            ) : (
              <Badge variant="secondary">Desconectado</Badge>
            )}
          </div>
          {waLinked && (
            <div className="flex items-center justify-between">
              <span className="text-sm">Número</span>
              <span className="text-sm text-muted-foreground">{waPhone}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <Button variant="outline" onClick={handleLogout} className="text-destructive">
        <LogOut className="mr-2 h-4 w-4" />
        Cerrar sesión
      </Button>
    </div>
  );
}
