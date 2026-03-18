"use client";

import { useEffect, useRef } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { toast } from "sonner";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type PostgresChangeEvent = "INSERT" | "UPDATE" | "DELETE";

interface UseRealtimeOptions<T extends Record<string, unknown>> {
  table: string;
  event?: PostgresChangeEvent | "*";
  filter?: string;
  onInsert?: (record: T) => void;
  onUpdate?: (record: T, old: Partial<T>) => void;
  onDelete?: (old: Partial<T>) => void;
  showToast?: boolean;
  enabled?: boolean;
}

const tableLabels: Record<string, string> = {
  notes: "nota",
  folders: "carpeta",
  vault_items: "elemento de bóveda",
};

export function useRealtime<T extends Record<string, unknown>>({
  table,
  event = "*",
  filter,
  onInsert,
  onUpdate,
  onDelete,
  showToast = true,
  enabled = true,
}: UseRealtimeOptions<T>) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const supabase = createSupabaseBrowserClient();
    const label = tableLabels[table] ?? table;

    const channelConfig: Record<string, string> = {
      event,
      schema: "public",
      table,
    };
    if (filter) channelConfig.filter = filter;

    const channel = supabase
      .channel(`realtime:${table}`)
      .on(
        "postgres_changes" as never,
        channelConfig,
        (payload: RealtimePostgresChangesPayload<T>) => {
          switch (payload.eventType) {
            case "INSERT":
              onInsert?.(payload.new as T);
              if (showToast) toast.info(`Nueva ${label} recibida`);
              break;
            case "UPDATE":
              onUpdate?.(payload.new as T, payload.old as Partial<T>);
              break;
            case "DELETE":
              onDelete?.(payload.old as Partial<T>);
              if (showToast) toast.info(`${label} eliminada`);
              break;
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [table, event, filter, enabled, onInsert, onUpdate, onDelete, showToast]);
}
