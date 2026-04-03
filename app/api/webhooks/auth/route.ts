import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/resend/emails";

export async function POST(request: Request) {
  const payload = await request.json();

  const { type, record } = payload;

  // Supabase Auth webhook: new user signup
  if (type === "INSERT" && record?.email) {
    const name = record.raw_user_meta_data?.full_name ?? "usuario";
    await sendWelcomeEmail(record.email, name);
  }

  return NextResponse.json({ received: true });
}
