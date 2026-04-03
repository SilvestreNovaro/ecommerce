"use client";

import { updateOrderStatus } from "@/app/admin/ordenes/actions";

const STATUSES = [
  { value: "pending", label: "Pendiente" },
  { value: "paid", label: "Pagado" },
  { value: "shipped", label: "Enviado" },
  { value: "delivered", label: "Entregado" },
  { value: "cancelled", label: "Cancelado" },
];

export function OrderStatusSelect({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    await updateOrderStatus(orderId, e.target.value);
  }

  return (
    <select
      defaultValue={currentStatus}
      onChange={handleChange}
      className="rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black"
    >
      {STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
