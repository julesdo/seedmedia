"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SolarIcon } from "@/components/icons/SolarIcon";
import Link from "next/link";

/**
 * Page affichée si l'utilisateur annule le paiement Stripe
 */
export default function PaymentCancelPage() {
  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 size-16 rounded-full bg-muted flex items-center justify-center">
            <SolarIcon icon="close-circle-bold" className="size-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Paiement annulé</CardTitle>
          <CardDescription>
            Votre paiement a été annulé. Aucun montant n'a été débité.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Vous pouvez réessayer à tout moment depuis votre profil.
          </p>

          <div className="flex gap-3">
            <Button asChild className="flex-1">
              <Link href="/profile">
                <SolarIcon icon="user-bold" className="size-4 mr-2" />
                Retour au profil
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">
                <SolarIcon icon="home-2-bold" className="size-4 mr-2" />
                Retour à l'accueil
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

