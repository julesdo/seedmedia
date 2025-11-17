"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { useState, useEffect } from "react";
import React from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProfilePage() {
  const user = useQuery(api.users.getCurrentUser);
  const organizations = useQuery(api.organizations.getUserOrganizations);
  const updateProfile = useMutation(api.users.updateProfile);

  const [bio, setBio] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [storedAccounts, setStoredAccounts] = useState<any[]>([]);

  // Synchroniser les valeurs quand l'utilisateur est chargé
  React.useEffect(() => {
    if (user && !isEditing) {
      setBio(user.bio || "");
      setTags(user.tags || []);
    }
  }, [user, isEditing]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("seed_active_accounts");
      if (stored) {
        try {
          setStoredAccounts(JSON.parse(stored));
        } catch (error) {
          console.error("Failed to parse stored accounts:", error);
        }
      }
    }
  }, []);

  const handleSave = async () => {
    try {
      await updateProfile({
        bio: bio || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
      setIsEditing(false);
      toast.success("Profil mis à jour avec succès");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du profil");
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  if (user === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gradient-light">Chargement...</div>
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gradient-light">Non authentifié</div>
      </div>
    );
  }

  const uniqueAccountsByEmail = new Map();
  storedAccounts.forEach((account) => {
    if (!uniqueAccountsByEmail.has(account.email)) {
      uniqueAccountsByEmail.set(account.email, account);
    }
  });
  const uniqueAccounts = Array.from(uniqueAccountsByEmail.values());

  return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gradient-light mb-2">Mon Profil</h1>
          <p className="text-muted-foreground opacity-70">
            Gérez vos informations personnelles et votre profil public
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="edit">Modifier</TabsTrigger>
            <TabsTrigger value="accounts">Comptes</TabsTrigger>
            <TabsTrigger value="organizations">Organisations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Avatar et informations de base */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-24 w-24 ring-2 ring-border/50">
                    <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-primary/20 to-primary/10 text-gradient-light">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-gradient-light text-2xl">{user.name || "Utilisateur"}</CardTitle>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                        Niveau {user.level}
                      </Badge>
                    </div>
                    <CardDescription className="text-base">{user.email}</CardDescription>
                    <div className="mt-3 flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <SolarIcon icon="map-point-bold" className="h-4 w-4 icon-gradient-light" />
                        <span>{user.region || "Non défini"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <SolarIcon icon="user-id-bold" className="h-4 w-4 icon-gradient-light" />
                        <span>{uniqueAccounts.length} compte{uniqueAccounts.length > 1 ? "s" : ""}</span>
                      </div>
                      {organizations && organizations.length > 0 && (
                        <div className="flex items-center gap-1">
                          <SolarIcon icon="buildings-bold" className="h-4 w-4 icon-gradient-light" />
                          <span>{organizations.length} organisation{organizations.length > 1 ? "s" : ""}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Bio */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gradient-light">Biographie</CardTitle>
                <CardDescription>Parlez-nous de vous</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-foreground opacity-80 min-h-[60px] whitespace-pre-wrap">
                  {bio || "Aucune biographie pour le moment."}
                </p>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gradient-light">Centres d'intérêt</CardTitle>
                <CardDescription>Tags qui vous décrivent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tags.length > 0 ? (
                    tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-sm">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground opacity-70">Aucun tag pour le moment.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="edit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-gradient-light">Modifier mon profil</CardTitle>
                <CardDescription>Mettez à jour vos informations personnelles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Bio */}
                <div className="space-y-2">
                  <Label className="text-gradient-light">Biographie</Label>
                  <textarea
                    className="w-full min-h-[120px] px-4 py-3 rounded-lg bg-background border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground resize-none"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Écrivez votre biographie..."
                  />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label className="text-gradient-light">Centres d'intérêt</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="Ajouter un tag..."
                      className="flex-1"
                    />
                    <Button variant="glass" onClick={handleAddTag} icon="add-circle-bold">
                      Ajouter
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {tags.map((tag) => (
                        <div
                          key={tag}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-border/50"
                        >
                          <span className="text-sm text-gradient-light">{tag}</span>
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <SolarIcon icon="close-circle-bold" className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="glass" onClick={() => setIsEditing(false)}>
                    Annuler
                  </Button>
                  <Button variant="accent" onClick={handleSave} icon="check-circle-bold">
                    Enregistrer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounts" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gradient-light">Mes comptes</CardTitle>
                    <CardDescription>Gérez vos comptes connectés</CardDescription>
                  </div>
                  <Link href="/accounts">
                    <Button variant="accent" size="sm" icon="settings-bold">
                      Gérer les comptes
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {uniqueAccounts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground opacity-70">
                    <SolarIcon icon="user-id-bold" className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm mb-4">Aucun compte connecté</p>
                    <Link href="/accounts">
                      <Button variant="accent" size="sm" icon="user-plus-bold">
                        Ajouter un compte
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {uniqueAccounts.map((account: any) => (
                      <div
                        key={account.id}
                        className="flex items-center gap-3 p-4 rounded-lg bg-background border border-border/50"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={account.image || undefined} alt={account.name || ""} />
                          <AvatarFallback>
                            {account.name?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gradient-light truncate">
                            {account.name || account.email}
                          </div>
                          <div className="text-xs text-muted-foreground opacity-70 truncate">
                            {account.email}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {account.provider === "github" ? "GitHub" : account.provider === "google" ? "Google" : "Email"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="organizations" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gradient-light">Mes organisations</CardTitle>
                    <CardDescription>Organisations dont vous faites partie</CardDescription>
                  </div>
                  <Link href="/organizations">
                    <Button variant="accent" size="sm" icon="buildings-bold">
                      Voir toutes
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {organizations === undefined ? (
                  <div className="text-center py-8 text-muted-foreground opacity-70">
                    <div className="text-sm">Chargement...</div>
                  </div>
                ) : organizations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground opacity-70">
                    <SolarIcon icon="buildings-bold" className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm mb-4">Aucune organisation</p>
                    <Link href="/organizations">
                      <Button variant="accent" size="sm" icon="add-circle-bold">
                        Créer une organisation
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {organizations.slice(0, 4).map((org) => (
                      <Link key={org._id} href={`/discover/organizations/${org._id}`}>
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-background border border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={org.logo || undefined} alt={org.name} />
                            <AvatarFallback>
                              {org.name[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gradient-light truncate">
                              {org.name}
                            </div>
                            <div className="text-xs text-muted-foreground opacity-70">
                              {org.role === "owner" ? "Propriétaire" : org.role === "admin" ? "Admin" : "Membre"}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}

