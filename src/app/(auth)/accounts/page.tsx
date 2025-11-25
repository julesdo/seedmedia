"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const ACCOUNT_TYPE_LABELS = {
  personal: "Personnel",
  professional: "Professionnel",
  organization: "Organisation",
} as const;

export default function AccountsPage() {
  const accounts = useQuery(api.accounts.getUserAccounts);
  const currentUser = useQuery(api.users.getCurrentUser);
  const [accountToRemove, setAccountToRemove] = useState<Id<"userAccounts"> | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<Id<"userAccounts"> | null>(null);

  const createAccount = useMutation(api.accounts.createAccount);
  const updateAccount = useMutation(api.accounts.updateAccount);
  const deleteAccount = useMutation(api.accounts.deleteAccount);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    accountEmail: "",
    type: "personal" as "personal" | "professional" | "organization",
    region: "",
  });

  const handleCreateAccount = async () => {
    if (!formData.name || !formData.accountEmail) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      await createAccount({
        name: formData.name,
        accountEmail: formData.accountEmail,
        type: formData.type,
        region: formData.region || undefined,
      });
      toast.success("Compte créé avec succès");
      setIsCreateDialogOpen(false);
      setFormData({ name: "", accountEmail: "", type: "personal", region: "" });
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création du compte");
    }
  };

  const handleEditAccount = async () => {
    if (!editingAccountId || !formData.name) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      await updateAccount({
        accountId: editingAccountId,
        name: formData.name,
        bio: formData.region ? undefined : undefined, // On peut ajouter bio plus tard
        region: formData.region || undefined,
      });
      toast.success("Compte mis à jour avec succès");
      setIsEditDialogOpen(false);
      setEditingAccountId(null);
      setFormData({ name: "", accountEmail: "", type: "personal", region: "" });
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour du compte");
    }
  };

  const handleDeleteAccount = async () => {
    if (!accountToRemove) return;

    try {
      await deleteAccount({ accountId: accountToRemove });
      toast.success("Compte supprimé avec succès");
      setAccountToRemove(null);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression du compte");
    }
  };

  const openEditDialog = (account: any) => {
    setEditingAccountId(account.id);
    setFormData({
      name: account.name || "",
      accountEmail: account.email || "",
      type: account.type || "personal",
      region: account.region || "",
    });
    setIsEditDialogOpen(true);
  };

  if (accounts === undefined || currentUser === undefined) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Créer un compte par défaut si aucun compte n'existe
  const ensureDefaultAccount = useMutation(api.accounts.createDefaultAccount);
  const hasNoAccounts = accounts.length === 0;

  if (hasNoAccounts && currentUser) {
    // Créer automatiquement le compte par défaut
    ensureDefaultAccount({}).catch(() => {
      // Ignorer les erreurs silencieusement
    });
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-light mb-2">Gestion des comptes</h1>
          <p className="text-muted-foreground opacity-70">
            Gérez vos comptes multiples et basculez entre eux facilement
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="accent"
              onClick={() => {
                setFormData({ name: "", accountEmail: "", type: "personal", region: "" });
              }}
              icon="user-plus-bold"
            >
              Créer un compte
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouveau compte</DialogTitle>
              <DialogDescription>
                Créez un nouveau profil pour gérer différents aspects de votre activité.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du compte *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Mon compte professionnel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.accountEmail}
                  onChange={(e) => setFormData({ ...formData, accountEmail: e.target.value })}
                  placeholder="compte@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type de compte *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personnel</SelectItem>
                    <SelectItem value="professional">Professionnel</SelectItem>
                    <SelectItem value="organization">Organisation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Région (optionnel)</Label>
                <Input
                  id="region"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="France, Europe, etc."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateAccount}>Créer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <SolarIcon
              icon="user-id-bold"
              className="h-16 w-16 icon-gradient-light opacity-50 mb-4"
            />
            <h3 className="text-xl font-semibold text-gradient-light mb-2">
              Aucun compte
            </h3>
            <p className="text-muted-foreground opacity-70 text-center mb-6 max-w-md">
              Créez votre premier compte pour commencer. Vous pouvez créer plusieurs comptes
              (personnel, professionnel, organisation) et gérer chacun indépendamment.
            </p>
            <Button
              variant="accent"
              onClick={() => setIsCreateDialogOpen(true)}
              icon="user-plus-bold"
            >
              Créer un compte
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accounts.map((account) => {
            return (
              <Card
                key={account.id}
                className={`relative transition-all ${
                  account.isDefault
                    ? "ring-2 ring-primary/50 bg-primary/5"
                    : "hover:scale-[1.02] hover:shadow-lg"
                }`}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14 ring-2 ring-border/50">
                      <AvatarImage src={account.image || undefined} alt={account.name || ""} />
                      <AvatarFallback className="bg-linear-to-br from-primary/20 to-primary/10 text-gradient-light text-lg">
                        {account.name?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-gradient-light truncate">
                          {account.name || account.email}
                        </CardTitle>
                        {account.isDefault && (
                          <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                            Par défaut
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="truncate">{account.email}</CardDescription>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {ACCOUNT_TYPE_LABELS[account.type as keyof typeof ACCOUNT_TYPE_LABELS]}
                        </Badge>
                        {account.region && (
                          <>
                            <span className="text-xs text-muted-foreground opacity-50">•</span>
                            <span className="text-xs text-muted-foreground">{account.region}</span>
                          </>
                        )}
                        {account.level && (
                          <>
                            <span className="text-xs text-muted-foreground opacity-50">•</span>
                            <span className="text-xs text-muted-foreground">Niveau {account.level}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(account)}
                      className="flex-1"
                      icon="pen-new-round-bold"
                    >
                      Modifier
                    </Button>
                    {!account.isDefault && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setAccountToRemove(account.id)}
                        icon="trash-bin-minimalistic-bold"
                      >
                        Supprimer
                      </Button>
                    )}
                    {account.isDefault && (
                      <div className="flex-1 text-sm text-muted-foreground text-center py-2">
                        Compte par défaut
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog de modification */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le compte</DialogTitle>
            <DialogDescription>
              Modifiez les informations de votre compte.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom du compte *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Mon compte professionnel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-region">Région (optionnel)</Label>
              <Input
                id="edit-region"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder="France, Europe, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEditAccount}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog
        open={accountToRemove !== null}
        onOpenChange={(open) => !open && setAccountToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gradient-light">Supprimer ce compte ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement ce compte. Vous ne pourrez plus l'utiliser.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
