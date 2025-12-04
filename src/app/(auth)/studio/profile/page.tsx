"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { FormField } from "@/components/ui/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import React from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  const user = useQuery(api.users.getCurrentUser);
  const organizations = useQuery(api.organizations.getUserOrganizations);
  const updateProfile = useMutation(api.users.updateProfile);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [links, setLinks] = useState<Array<{ type: string; url: string }>>([]);
  const [location, setLocation] = useState({
    city: "",
    region: "",
    country: "",
    lat: 0,
    lng: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [storedAccounts, setStoredAccounts] = useState<any[]>([]);

  React.useEffect(() => {
    if (user) {
      setName(user.name || "");
      setUsername((user as any).username || "");
      setImage(user.image || null);
      setCoverImage((user as any).coverImage || null);
      setBio(user.bio || "");
      setTags(user.tags || []);
      setLinks(user.links || []);
      if (user.location) {
        setLocation({
          city: user.location.city || "",
          region: user.location.region || "",
          country: user.location.country || "",
          lat: user.location.lat || 0,
          lng: user.location.lng || 0,
        });
      }
    }
  }, [user]);

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
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      await updateProfile({
        name: name.trim() || undefined,
        username: username.trim() || undefined,
        image: image || undefined,
        coverImage: coverImage || undefined,
        bio: bio.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        links: links.length > 0 ? links : undefined,
        location: location.city || location.region || location.country
          ? {
              lat: location.lat || 0,
              lng: location.lng || 0,
              city: location.city || undefined,
              region: location.region || undefined,
              country: location.country || undefined,
            }
          : undefined,
      });
      toast.success("Profil mis à jour avec succès");
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error("Erreur lors de la mise à jour du profil");
    } finally {
      setIsSaving(false);
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

  const handleAddLink = () => {
    setLinks([...links, { type: "website", url: "" }]);
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleUpdateLink = (index: number, field: "type" | "url", value: string) => {
    const updated = [...links];
    updated[index] = { ...updated[index], [field]: value };
    setLinks(updated);
  };

  const linkTypes = [
    { value: "website", label: "Site web" },
    { value: "github", label: "GitHub" },
    { value: "twitter", label: "Twitter/X" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "youtube", label: "YouTube" },
    { value: "instagram", label: "Instagram" },
    { value: "facebook", label: "Facebook" },
    { value: "other", label: "Autre" },
  ];

  if (user === undefined) {
    return <div className="flex items-center justify-center h-full">Chargement...</div>;
  }

  if (user === null) {
    return <div className="flex items-center justify-center h-full">Non authentifié</div>;
  }

  const uniqueAccountsByEmail = new Map();
  storedAccounts.forEach((account) => {
    if (!uniqueAccountsByEmail.has(account.email)) {
      uniqueAccountsByEmail.set(account.email, account);
    }
  });
  const uniqueAccounts = Array.from(uniqueAccountsByEmail.values());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mon Profil</h1>
        <p className="text-muted-foreground mt-2">
          Gérez vos informations personnelles et votre profil public
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="edit">Modifier</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24 ring-2 ring-border/50">
                  <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                  <AvatarFallback className="text-3xl bg-gradient-to-br from-primary/20 to-primary/10">
                    {user.name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-2xl">{user.name || "Utilisateur"}</CardTitle>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                      Niveau {user.level}
                    </Badge>
                  </div>
                  <CardDescription className="text-base">{user.email}</CardDescription>
                  <div className="mt-3 flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <SolarIcon icon="map-point-bold" className="h-4 w-4" />
                      <span>{user.region || "Non défini"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <SolarIcon icon="user-id-bold" className="h-4 w-4" />
                      <span>{uniqueAccounts.length} compte{uniqueAccounts.length > 1 ? "s" : ""}</span>
                    </div>
                    {organizations && organizations.length > 0 && (
                      <div className="flex items-center gap-1">
                        <SolarIcon icon="buildings-bold" className="h-4 w-4" />
                        <span>{organizations.length} organisation{organizations.length > 1 ? "s" : ""}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Biographie</CardTitle>
              <CardDescription>Parlez-nous de vous</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-foreground opacity-80 min-h-[60px] whitespace-pre-wrap">
                {bio || "Aucune biographie pour le moment."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Centres d'intérêt</CardTitle>
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
              <CardTitle>Modifier mon profil</CardTitle>
              <CardDescription>Mettez à jour vos informations personnelles et votre profil public</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Images */}
              <div className="space-y-6">
                <FormField
                  label="Image de profil"
                  description="Votre photo de profil sera visible publiquement"
                >
                  <ImageUpload
                    value={image || undefined}
                    onChange={(url) => setImage(url)}
                    variant="avatar"
                    maxSize={2 * 1024 * 1024} // 2MB pour avatar
                  />
                </FormField>

                <FormField
                  label="Image de couverture"
                  description="Image de fond de votre profil (recommandé: 1600x400px)"
                >
                  <ImageUpload
                    value={coverImage || undefined}
                    onChange={(url) => setCoverImage(url)}
                    variant="cover"
                    aspectRatio={16 / 4}
                  />
                </FormField>
              </div>

              <Separator />

              {/* Informations de base */}
              <div className="space-y-6">
                <FormField
                  label="Nom d'affichage"
                  description="Votre nom tel qu'il apparaîtra publiquement"
                >
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Votre nom"
                  />
                </FormField>

                <FormField
                  label="Nom d'utilisateur"
                  description="Un identifiant unique pour votre profil (ex: @johndoe)"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">@</span>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/[^a-z0-9_-]/gi, ""))}
                      placeholder="johndoe"
                      className="flex-1"
                    />
                  </div>
                </FormField>

                <FormField
                  label="Biographie"
                  description="Parlez-nous de vous en quelques mots"
                >
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Écrivez votre biographie..."
                    className="min-h-[120px] resize-none"
                  />
                </FormField>
              </div>

              <Separator />

              {/* Localisation */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Localisation</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label="Ville">
                    <Input
                      value={location.city}
                      onChange={(e) => setLocation({ ...location, city: e.target.value })}
                      placeholder="Paris"
                    />
                  </FormField>
                  <FormField label="Région">
                    <Input
                      value={location.region}
                      onChange={(e) => setLocation({ ...location, region: e.target.value })}
                      placeholder="Île-de-France"
                    />
                  </FormField>
                  <FormField label="Pays">
                    <Input
                      value={location.country}
                      onChange={(e) => setLocation({ ...location, country: e.target.value })}
                      placeholder="France"
                    />
                  </FormField>
                </div>
              </div>

              <Separator />

              {/* Tags */}
              <div className="space-y-4">
                <FormField
                  label="Centres d'intérêt"
                  description="Ajoutez des tags pour décrire vos domaines d'intérêt"
                >
                  <div className="space-y-3">
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
                      <Button variant="outline" onClick={handleAddTag} type="button">
                        <SolarIcon icon="add-circle-bold" className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-sm px-3 py-1.5 flex items-center gap-2"
                          >
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="text-muted-foreground hover:text-foreground ml-1"
                              type="button"
                            >
                              <SolarIcon icon="close-circle-bold" className="h-4 w-4" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </FormField>
              </div>

              <Separator />

              {/* Liens */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Liens</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ajoutez vos liens vers vos réseaux sociaux et sites web
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleAddLink} type="button">
                    <SolarIcon icon="add-circle-bold" className="h-4 w-4 mr-2" />
                    Ajouter un lien
                  </Button>
                </div>
                {links.length > 0 && (
                  <div className="space-y-3">
                    {links.map((link, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <Select
                          value={link.type}
                          onValueChange={(value) => handleUpdateLink(index, "type", value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {linkTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={link.url}
                          onChange={(e) => handleUpdateLink(index, "url", e.target.value)}
                          placeholder="https://..."
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveLink(index)}
                          type="button"
                        >
                          <SolarIcon icon="trash-bin-trash-bold" className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <SolarIcon icon="loader-circle-bold" className="h-4 w-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <SolarIcon icon="check-circle-bold" className="h-4 w-4 mr-2" />
                      Enregistrer les modifications
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

