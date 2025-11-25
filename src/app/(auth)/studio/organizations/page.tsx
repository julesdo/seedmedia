"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Link } from "next-view-transitions";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function OrganizationsPage() {
  const organizations = useQuery(api.organizations.getUserOrganizations);
  const createOrganization = useMutation(api.organizations.createOrganization);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name || !slug || !description) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setIsCreating(true);
    try {
      await createOrganization({
        name,
        slug: slug.toLowerCase().replace(/\s+/g, "-"),
        description,
      });
      toast.success("Organisation créée avec succès");
      setIsDialogOpen(false);
      setName("");
      setSlug("");
      setDescription("");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création");
    } finally {
      setIsCreating(false);
    }
  };

  if (organizations === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gradient-light">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mes organisations</h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos organisations et équipes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <SolarIcon icon="add-circle-bold" className="h-4 w-4 mr-2" />
                Créer une organisation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle organisation</DialogTitle>
                <DialogDescription>
                  Créez une nouvelle organisation pour collaborer avec votre équipe
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="org-name" className="text-sm font-semibold flex items-center gap-1.5">
                    Nom de l'organisation
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="org-name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!slug) {
                        setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                      }
                    }}
                    placeholder="ex: Association pour le Climat"
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Le nom public de votre organisation, visible par tous les utilisateurs
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-slug" className="text-sm font-semibold flex items-center gap-1.5">
                    Identifiant (slug)
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="org-slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    placeholder="association-climat"
                    className="h-11 font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Identifiant unique utilisé dans l'URL. Généré automatiquement depuis le nom.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-description" className="text-sm font-semibold flex items-center gap-1.5">
                    Description
                    <span className="text-destructive">*</span>
                  </Label>
                  <textarea
                    id="org-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Décrivez la mission et les objectifs de votre organisation..."
                    className="w-full min-h-[120px] px-4 py-3 rounded-lg bg-background border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground resize-none text-sm leading-relaxed"
                  />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Présentez votre organisation en quelques phrases. Cette description sera visible sur votre profil public.
                  </p>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={isCreating}
                  >
                    {isCreating ? "Création..." : "Créer"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {organizations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <SolarIcon
              icon="buildings-bold"
              className="h-16 w-16 text-muted-foreground mb-4"
            />
            <h3 className="text-xl font-semibold mb-2">
              Aucune organisation
            </h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Créez votre première organisation pour commencer à collaborer avec votre équipe
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <SolarIcon icon="add-circle-bold" className="h-4 w-4 mr-2" />
              Créer une organisation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <Link key={org._id} href={`/discover/organizations/${org._id}`}>
              <Card className="hover:scale-[1.02] transition-transform cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 ring-2 ring-border/50">
                      <AvatarImage src={org.logo || undefined} alt={org.name} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                        {org.name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="truncate">{org.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            org.role === "owner"
                              ? "bg-primary/20 text-primary"
                              : org.role === "admin"
                                ? "bg-blue-500/20 text-blue-500"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {org.role === "owner" ? "Propriétaire" : org.role === "admin" ? "Admin" : "Membre"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="line-clamp-2 mb-4">{org.description}</CardDescription>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <SolarIcon icon="users-group-two-rounded-bold" className="h-4 w-4" />
                      <span>Voir les détails</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {org.verified && (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-500 flex items-center gap-1">
                          <SolarIcon icon="verified-check-bold" className="h-3 w-3" />
                          Vérifiée
                        </span>
                      )}
                      {org.premiumTier !== "free" && (
                        <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
                          {org.premiumTier === "starter" ? "Starter" : org.premiumTier === "pro" ? "Pro" : "Impact"}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

