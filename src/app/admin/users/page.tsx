"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const allUsers = useQuery(api.admin.getAllUsers, { limit: 100, search: searchQuery || undefined });
  const updateUser = useMutation(api.admin.updateUserAdmin);

  const selectedUser = useMemo(() => {
    if (!selectedUserId || !allUsers) return null;
    return allUsers.find((u) => u._id === selectedUserId);
  }, [selectedUserId, allUsers]);

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setIsDialogOpen(true);
  };

  if (allUsers === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 max-w-7xl">
          <div className="space-y-6">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold">Gestion des utilisateurs</h1>
          <p className="text-lg text-muted-foreground">
            Modifier tous les paramètres utilisateurs (super admin - sans restrictions)
          </p>
          <Badge variant="destructive">⚠️ Modifications sans validation</Badge>
        </div>

        {/* Recherche */}
        <div className="mb-6">
          <div className="relative">
            <SolarIcon
              icon="magnifer-bold"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
            />
            <Input
              type="text"
              placeholder="Rechercher un utilisateur (email, nom, username)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Liste des utilisateurs */}
        <div className="space-y-4">
          {allUsers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
              </CardContent>
            </Card>
          ) : (
            allUsers.map((user) => (
              <Card key={user._id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold">{user.name || user.email}</h3>
                        <Badge variant="secondary">{user.role}</Badge>
                        {user.premiumTier !== "free" && (
                          <Badge variant="default">{user.premiumTier}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{user.email}</span>
                        {user.username && <span>@{user.username}</span>}
                        <span>Niveau {user.level}</span>
                        <span>Score: {user.credibilityScore}</span>
                      </div>
                    </div>
                    <Button onClick={() => handleUserClick(user._id)} variant="outline">
                      Modifier
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Dialog de modification */}
        {selectedUser && (
          <UserEditDialog
            user={selectedUser}
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onUpdate={updateUser}
          />
        )}
      </div>
    </div>
  );
}

function UserEditDialog({
  user,
  open,
  onOpenChange,
  onUpdate,
}: {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: any;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || "",
    username: user.username || "",
    email: user.email || "",
    bio: user.bio || "",
    role: user.role || "explorateur",
    level: user.level || 1,
    credibilityScore: user.credibilityScore || 0,
    premiumTier: user.premiumTier || "free",
    boostCredits: user.boostCredits || 0,
    region: user.region || "",
    reachRadius: user.reachRadius || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onUpdate({
        userId: user._id,
        updates: {
          name: formData.name || undefined,
          username: formData.username || undefined,
          email: formData.email || undefined,
          bio: formData.bio || undefined,
          role: formData.role as any,
          level: formData.level,
          credibilityScore: formData.credibilityScore,
          premiumTier: formData.premiumTier as any,
          boostCredits: formData.boostCredits,
          region: formData.region || undefined,
          reachRadius: formData.reachRadius,
        },
      });

      toast.success("Utilisateur mis à jour avec succès");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'utilisateur</DialogTitle>
          <DialogDescription>
            ⚠️ Super admin : Toutes les modifications sont possibles sans validation
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email ⚠️</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Attention : Modification de l'email peut affecter l'authentification
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="explorateur">Explorateur</SelectItem>
                  <SelectItem value="contributeur">Contributeur</SelectItem>
                  <SelectItem value="editeur">Éditeur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="premiumTier">Premium Tier</Label>
              <Select
                value={formData.premiumTier}
                onValueChange={(value: any) => setFormData({ ...formData, premiumTier: value })}
              >
                <SelectTrigger id="premiumTier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="impact">Impact</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="level">Niveau</Label>
              <Input
                id="level"
                type="number"
                min="1"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credibilityScore">Score crédibilité</Label>
              <Input
                id="credibilityScore"
                type="number"
                min="0"
                max="100"
                value={formData.credibilityScore}
                onChange={(e) =>
                  setFormData({ ...formData, credibilityScore: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="boostCredits">Boost Credits</Label>
              <Input
                id="boostCredits"
                type="number"
                min="0"
                value={formData.boostCredits}
                onChange={(e) => setFormData({ ...formData, boostCredits: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <Alert variant="destructive">
            <SolarIcon icon="danger-triangle-bold" className="h-4 w-4" />
            <AlertDescription>
              Toutes les modifications sont appliquées immédiatement sans validation. Soyez prudent.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading} variant="destructive">
              {loading ? "Mise à jour..." : "Mettre à jour"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

