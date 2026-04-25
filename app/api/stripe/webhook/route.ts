import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// Use service role client — webhook runs outside user auth context
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = (session as any).metadata?.supabase_user_id
          ?? (session.subscription
            ? (await stripe.subscriptions.retrieve(session.subscription as string)).metadata?.supabase_user_id
            : null);

        if (!userId || !session.subscription) break;

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        await supabaseAdmin
          .from("profiles")
          .update({
            is_pro: true,
            stripe_subscription_id: subscription.id,
            stripe_subscription_status: subscription.status,
            pro_expires_at: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId =
          subscription.metadata?.supabase_user_id ??
          (await getUserIdFromCustomer(subscription.customer as string));

        if (!userId) break;

        const isActive = ["active", "trialing"].includes(subscription.status);

        await supabaseAdmin
          .from("profiles")
          .update({
            is_pro: isActive,
            stripe_subscription_status: subscription.status,
            pro_expires_at: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId =
          subscription.metadata?.supabase_user_id ??
          (await getUserIdFromCustomer(subscription.customer as string));

        if (!userId) break;

        await supabaseAdmin
          .from("profiles")
          .update({
            is_pro: false,
            stripe_subscription_status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const userId = await getUserIdFromCustomer(customerId);
        if (!userId) break;

        await supabaseAdmin
          .from("profiles")
          .update({
            is_pro: false,
            stripe_subscription_status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

async function getUserIdFromCustomer(customerId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();
  return data?.id ?? null;
}
