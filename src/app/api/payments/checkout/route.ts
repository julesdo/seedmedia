import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// Initialisation conditionnelle pour éviter les erreurs lors du build
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia",
    })
  : null;

// Note: L'authentification est vérifiée côté Convex dans prepareCheckoutSession
// On passe les cookies de session à Convex pour l'authentification
const convex = process.env.NEXT_PUBLIC_CONVEX_URL
  ? new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL)
  : null;

/**
 * POST /api/payments/checkout
 * Crée une session Stripe Checkout pour un pack de Seeds
 */
export async function POST(request: NextRequest) {
  if (!stripe || !convex) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { packId } = body;

    if (!packId || !["pack_survie", "pack_strategie", "pack_whale"].includes(packId)) {
      return NextResponse.json(
        { error: "Invalid pack ID" },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur depuis Convex
    // Note: prepareCheckoutSession vérifie l'authentification côté Convex via Better Auth
    // ConvexHttpClient utilise automatiquement les cookies de la requête si disponibles
    const prepareResult = await convex.mutation(
      api.payments.prepareCheckoutSession,
      { packId: packId as "pack_survie" | "pack_strategie" | "pack_whale" }
    );

    if (!prepareResult) {
      return NextResponse.json(
        { error: "Failed to prepare checkout session" },
        { status: 500 }
      );
    }

    const pack = prepareResult.pack;
    const userId = prepareResult.userId;

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: pack.name,
              description: pack.description,
            },
            unit_amount: pack.price, // En centimes
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/payments/cancel`,
      metadata: {
        userId: userId,
        packId: packId,
        paymentId: prepareResult.paymentId,
      },
      // Permettre Apple Pay et Google Pay sur le web
      payment_method_options: {
        card: {
          request_three_d_secure: "automatic",
        },
      },
    });

    // Mettre à jour l'entrée de paiement avec le vrai session ID
    // On le fera dans le webhook, mais on peut aussi le faire ici pour avoir l'ID immédiatement

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error("Error creating Stripe checkout session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

