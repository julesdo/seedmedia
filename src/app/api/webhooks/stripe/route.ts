import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * POST /api/webhooks/stripe
 * Reçoit les événements Stripe (webhook)
 * 
 * ⚠️ SÉCURITÉ CRITIQUE : Vérifie toujours la signature Stripe
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    // ✅ Vérifier la signature (CRITIQUE pour la sécurité)
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Traiter les événements
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Récupérer les métadonnées
        const userId = session.metadata?.userId;
        const packId = session.metadata?.packId;
        const paymentId = session.metadata?.paymentId;

        if (!userId || !packId) {
          console.error("Missing metadata in checkout session:", session.id);
          return NextResponse.json(
            { error: "Missing metadata" },
            { status: 400 }
          );
        }

        // Récupérer les détails du paiement
        const amountTotal = session.amount_total || 0;
        const currency = session.currency || "eur";

        // Déterminer les Seeds à créditer selon le pack
        const packSeeds = {
          pack_survie: 1200,
          pack_strategie: 6000,
          pack_whale: 30000,
        }[packId as keyof typeof packSeeds] || 0;

        // Créditer les Seeds via Convex (action publique qui appelle l'internal mutation)
        await convex.runAction(api.payments.creditSeedsFromPayment, {
          userId: userId, // String ID (sera converti en Id dans l'action)
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent as string | undefined,
          packId: packId,
          amount: amountTotal,
          seedsAwarded: packSeeds,
          metadata: {
            paymentId,
            customerEmail: session.customer_email,
            customerDetails: session.customer_details,
          },
        });

        console.log(`✅ Payment completed: ${session.id} - ${packSeeds} Seeds credited to user ${userId}`);
        break;
      }

      case "payment_intent.succeeded": {
        // Optionnel : Log supplémentaire
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment intent succeeded: ${paymentIntent.id}`);
        break;
      }

      case "charge.refunded": {
        // TODO: Implémenter le remboursement (débiter les Seeds)
        const charge = event.data.object as Stripe.Charge;
        console.log(`Charge refunded: ${charge.id}`);
        // Pour l'instant, on log juste
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: error.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// Désactiver le body parsing par défaut de Next.js pour Stripe
export const runtime = "nodejs";

