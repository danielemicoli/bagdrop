import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const supabase = createAdminClient();

    // Update booking status
    await supabase
      .from("bookings")
      .update({ status: "paid" })
      .eq("id", session.metadata?.bookingId);

    // Generate QR code
    const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${session.metadata?.bookingId}/qr`;
    
    await supabase
      .from("bookings")
      .update({ qr_url: qrUrl })
      .eq("id", session.metadata?.bookingId);

    // TODO: Send email with QR code
  }

  return NextResponse.json({ received: true });
}
