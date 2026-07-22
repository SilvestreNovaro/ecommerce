import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_TRANSFER_PCT } from "@/lib/pricing";

export type StoreSettings = {
  transferPct: number;
  transferEnabled: boolean;
};

// Config del descuento por transferencia global (store_settings, single-row).
// Resiliente: si la tabla no existe todavía → deshabilitado con % default.
export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const db = createAdminClient();
    const { data } = await db.from("store_settings").select("*").eq("id", 1).maybeSingle();
    const pct = Number(data?.transfer_discount_pct);
    return {
      transferPct: Number.isFinite(pct) ? pct : DEFAULT_TRANSFER_PCT,
      transferEnabled: data?.transfer_discount_enabled === true,
    };
  } catch {
    return { transferPct: DEFAULT_TRANSFER_PCT, transferEnabled: false };
  }
}

export async function setTransferDiscount(enabled: boolean, pct: number): Promise<void> {
  const db = createAdminClient();
  const clamped = Math.min(90, Math.max(0, Number(pct) || 0));
  const { error } = await db.from("store_settings").upsert({
    id: 1,
    transfer_discount_enabled: !!enabled,
    transfer_discount_pct: clamped,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`setTransferDiscount: ${error.message}`);
}
