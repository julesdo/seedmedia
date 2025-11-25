"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { useState } from "react";
import { toast } from "sonner";

export function NewsletterWidget() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Veuillez entrer votre email");
      return;
    }

    setIsLoading(true);
    // TODO: Implémenter l'inscription à la newsletter
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Inscription réussie !");
      setEmail("");
    }, 1000);
  };

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <SolarIcon icon="letter-bold" className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg text-gradient-light">Newsletter Seed</CardTitle>
        </div>
        <CardDescription>
          Recevez nos meilleurs articles et analyses directement dans votre boîte mail
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-background"
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Inscription..." : "S'abonner"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

