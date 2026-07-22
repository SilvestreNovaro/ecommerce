// Única fuente de verdad del cálculo de precios (patrón SUK, adaptado a Nalika).
// Todos los precios de Nalika son INTEGER en pesos → siempre Math.round.
//   - normal   = precio de lista (products.price)
//   - current  = promocional si es oferta válida (>0 y < normal), si no el normal
//   - transfer = current con el % de descuento por transferencia global aplicado
//                (solo si está habilitado y el % > 0; si no, null = sin doble precio)

export const DEFAULT_TRANSFER_PCT = 10;

export type ProductPrices = {
  normal: number;
  current: number;
  transfer: number | null;
  hasPromo: boolean; // hay oferta real (current < normal)
  hasTransferDiscount: boolean; // hay ahorro real por transferencia (transfer < current)
  promoPct: number; // % de la oferta sobre el normal (badge "-X%")
};

export function computePrices(
  product: { price: number; promo_price: number | null },
  transferPct: number,
  transferEnabled: boolean
): ProductPrices {
  const normal = Math.max(0, Math.round(Number(product.price) || 0));
  const pp = product.promo_price == null ? null : Math.round(Number(product.promo_price));
  const promo = pp != null && pp > 0 && pp < normal ? pp : null;
  const current = promo ?? normal;
  const pct = Math.min(90, Math.max(0, Number(transferPct) || 0));
  const transfer =
    transferEnabled && pct > 0 ? Math.round(current * (1 - pct / 100)) : null;
  return {
    normal,
    current,
    transfer,
    hasPromo: promo != null,
    hasTransferDiscount: transfer != null && transfer < current,
    promoPct: promo != null && normal > 0 ? Math.round((1 - promo / normal) * 100) : 0,
  };
}
