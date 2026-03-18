"use client";

import { useState, useEffect, useCallback } from "react";
import { Shield, Key, CreditCard, IdCard, Package, Eye, EyeOff, Copy, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { mockVaultItems, type VaultItem } from "@/lib/mock-data";
import { toast } from "sonner";

const typeConfig = {
  password: { label: "Contraseña", icon: Key, className: "text-blue-600 dark:text-blue-400" },
  id_photo: { label: "Documento", icon: IdCard, className: "text-amber-600 dark:text-amber-400" },
  card: { label: "Tarjeta", icon: CreditCard, className: "text-green-600 dark:text-green-400" },
  other: { label: "Otro", icon: Package, className: "text-gray-600 dark:text-gray-400" },
} as const;

function VaultItemRow({
  item,
  onReveal,
}: {
  item: VaultItem;
  onReveal: (item: VaultItem) => void;
}) {
  const config = typeConfig[item.type];
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between rounded-lg border px-4 py-3">
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${config.className}`} />
        <div>
          <p className="text-sm font-medium">{item.label}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(item.created_at).toLocaleDateString("es-AR")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {config.label}
        </Badge>
        <Button variant="ghost" size="sm" onClick={() => onReveal(item)}>
          <Eye className="mr-1 h-3.5 w-3.5" />
          Ver
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function VaultPage() {
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  const [reAuthPassword, setReAuthPassword] = useState("");
  const [reAuthError, setReAuthError] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const hideContent = useCallback(() => {
    setRevealed(false);
    setSelectedItem(null);
    setReAuthPassword("");
    setReAuthError("");
    setCountdown(30);
  }, []);

  useEffect(() => {
    if (!revealed) return;
    if (countdown <= 0) {
      hideContent();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [revealed, countdown, hideContent]);

  function handleReAuth() {
    if (!reAuthPassword) {
      setReAuthError("Ingresá tu contraseña");
      return;
    }
    // Mock: any password works
    setRevealed(true);
    setCountdown(30);
  }

  function handleCopy() {
    navigator.clipboard.writeText("valor-mock-descifrado-12345");
    toast.success("Copiado al portapapeles");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Shield className="h-6 w-6 text-[var(--vault)]" />
          Bóveda
        </h1>
        <p className="text-sm text-muted-foreground">
          Datos sensibles cifrados. Requiere re-autenticación para acceder.
        </p>
      </div>

      <div className="space-y-2">
        {mockVaultItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">Bóveda vacía</p>
              <p className="text-sm">Los datos sensibles detectados aparecerán acá</p>
            </CardContent>
          </Card>
        ) : (
          mockVaultItems.map((item) => (
            <VaultItemRow
              key={item.id}
              item={item}
              onReveal={setSelectedItem}
            />
          ))
        )}
      </div>

      <Dialog
        open={!!selectedItem}
        onOpenChange={(open) => {
          if (!open) hideContent();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedItem?.label}</DialogTitle>
            <DialogDescription>
              {revealed
                ? `El contenido se ocultará en ${countdown}s`
                : "Ingresá tu contraseña para ver el contenido"}
            </DialogDescription>
          </DialogHeader>

          {!revealed ? (
            <div className="space-y-3 py-2">
              {reAuthError && (
                <p className="text-sm text-destructive">{reAuthError}</p>
              )}
              <Input
                type="password"
                placeholder="Tu contraseña"
                value={reAuthPassword}
                onChange={(e) => setReAuthPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReAuth()}
              />
              <DialogFooter>
                <Button onClick={handleReAuth} className="w-full">
                  Desbloquear
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="rounded-lg bg-muted p-4 font-mono text-sm break-all">
                valor-mock-descifrado-12345
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="mr-1 h-3.5 w-3.5" />
                    Copiar
                  </Button>
                  <Button variant="outline" size="sm" onClick={hideContent}>
                    <EyeOff className="mr-1 h-3.5 w-3.5" />
                    Ocultar
                  </Button>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div
                    className="h-1.5 w-24 rounded-full bg-muted overflow-hidden"
                  >
                    <div
                      className="h-full bg-[var(--vault)] transition-all duration-1000"
                      style={{ width: `${(countdown / 30) * 100}%` }}
                    />
                  </div>
                  {countdown}s
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
