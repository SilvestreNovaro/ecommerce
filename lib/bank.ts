// Datos bancarios para pagos por transferencia (patrón SUK: env BANK_*).
// Placeholders hasta que Silvestre cargue los reales en Vercel.

export type BankInfo = {
  holder: string;
  bank: string;
  cbu: string;
  alias: string;
  cuit: string;
};

export function getBankInfo(): BankInfo {
  return {
    holder: process.env.BANK_HOLDER || "Nalika (titular a definir)",
    bank: process.env.BANK_NAME || "Banco a definir",
    cbu: process.env.BANK_CBU || "0000000000000000000000",
    alias: process.env.BANK_ALIAS || "NALIKA.MASCOTAS",
    cuit: process.env.BANK_CUIT || "00-00000000-0",
  };
}

export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP || "5491100000000";

export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
