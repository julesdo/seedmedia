"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "next-view-transitions";

const ORGANIZATION_TYPES = [
  { value: "association", label: "Association" },
  { value: "entreprise", label: "Entreprise" },
  { value: "collectif", label: "Collectif" },
  { value: "institution", label: "Institution" },
  { value: "autre", label: "Autre" },
] as const;


const REGIONS = [
  "Nouvelle-Aquitaine",
  "Île-de-France",
  "Auvergne-Rhône-Alpes",
  "Provence-Alpes-Côte d'Azur",
  "Occitanie",
  "Hauts-de-France",
  "Grand Est",
  "Normandie",
  "Bretagne",
  "Pays de la Loire",
  "Centre-Val de Loire",
  "Bourgogne-Franche-Comté",
] as const;

const LANGUAGES = [
  { value: "fr", label: "Français" },
  { value: "en", label: "Anglais" },
  { value: "es", label: "Espagnol" },
  { value: "de", label: "Allemand" },
  { value: "it", label: "Italien" },
] as const;

export default function EditOrganizationPage() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.id as Id<"organizations">;

  const organization = useQuery(api.organizations.getOrganization, { organizationId });
  const updateOrganization = useMutation(api.organizations.updateOrganization);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [organizationType, setOrganizationType] = useState<string>("");
  const [seedRegion, setSeedRegion] = useState<string>("");
  const [categoryIds, setCategoryIds] = useState<Array<string>>([]);
  const [categorySlugs, setCategorySlugs] = useState<Array<string>>([]); // Pour les catégories par défaut (pas encore en base)
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Récupérer les catégories disponibles pour les organisations
  const availableCategories = useQuery(api.categories.getActiveCategories, {
    appliesTo: "organizations",
  });
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [location, setLocation] = useState({
    address: "",
    city: "",
    region: "",
    country: "",
    postalCode: "",
    lat: 0,
    lng: 0,
  });
  const [links, setLinks] = useState<Array<{ type: string; url: string }>>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (organization) {
      setName(organization.name || "");
      setDescription(organization.description || "");
      setLogo(organization.logo || null);
      setCoverImage(organization.coverImage || null);
      setOrganizationType(organization.organizationType || "");
      setSeedRegion(organization.seedRegion || "");
      setCategoryIds(organization.categoryIds ? organization.categoryIds.map(id => id as string) : []);
      setTags(organization.tags || []);
      setContactEmail(organization.contactEmail || "");
      setContactPhone(organization.contactPhone || "");
      setWebsite(organization.website || "");
      setLanguages(organization.languages || []);
      setLinks(organization.links || []);
      if (organization.location) {
        setLocation({
          address: organization.location.address || "",
          city: organization.location.city || "",
          region: organization.location.region || "",
          country: organization.location.country || "",
          postalCode: organization.location.postalCode || "",
          lat: organization.location.lat || 0,
          lng: organization.location.lng || 0,
        });
      }
    }
  }, [organization]);

  const handleSave = async () => {
    if (isSaving) return;
    
    if (!name.trim()) {
      toast.error("Le nom de l'organisation est requis");
      return;
    }

    if (!description.trim()) {
      toast.error("La description est requise");
      return;
    }

    setIsSaving(true);
    try {
      await updateOrganization({
        organizationId,
        name: name.trim(),
        description: description.trim(),
        logo: logo || undefined,
        coverImage: coverImage || undefined,
        organizationType: organizationType as any,
        seedRegion: seedRegion || undefined,
        categoryIds: categoryIds.length > 0 ? (categoryIds as any) : undefined,
        categorySlugs: categorySlugs.length > 0 ? categorySlugs : undefined,
        tags: tags.length > 0 ? tags : undefined,
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        website: website.trim() || undefined,
        languages: languages.length > 0 ? languages : undefined,
        location: location.city || location.region || location.country
          ? {
              lat: location.lat || 0,
              lng: location.lng || 0,
              address: location.address || undefined,
              city: location.city || undefined,
              region: location.region || undefined,
              country: location.country || undefined,
              postalCode: location.postalCode || undefined,
            }
          : undefined,
        links: links.length > 0 ? links : undefined,
      });
      toast.success("Organisation mise à jour avec succès");
      router.push(`/discover/organizations/${organizationId}`);
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error(error.message || "Erreur lors de la mise à jour de l'organisation");
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

  if (organization === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (organization === null || !organization.canEdit) {
    return (
      <div className="space-y-6">
        <Alert>
          <SolarIcon icon="danger-triangle-bold" className="h-4 w-4" />
          <AlertDescription>
            Vous n'avez pas les permissions nécessaires pour modifier cette organisation.
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href={`/discover/organizations/${organizationId}`}>
            Retour à l'organisation
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-light">Modifier l'organisation</h1>
          <p className="text-muted-foreground mt-2">
            Mettez à jour les informations de votre organisation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline">
            <Link href={`/discover/organizations/${organizationId}`}>
              Annuler
            </Link>
          </Button>
          <Button onClick={handleSave} disabled={isSaving} variant="accent">
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>

      {/* Formulaire */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations de base */}
          <Card>
            <CardHeader>
              <CardTitle>Informations de base</CardTitle>
              <CardDescription>
                Les informations principales de votre organisation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nom de l'organisation <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nom de l'organisation"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez la mission et les objectifs de votre organisation..."
                  className="min-h-[120px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizationType">Type d'organisation</Label>
                <Select value={organizationType || "none"} onValueChange={(value) => setOrganizationType(value === "none" ? "" : value)}>
                  <SelectTrigger id="organizationType">
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {ORGANIZATION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seedRegion">Région Seed</Label>
                <Select value={seedRegion || "none"} onValueChange={(value) => setSeedRegion(value === "none" ? "" : value)}>
                  <SelectTrigger id="seedRegion">
                    <SelectValue placeholder="Sélectionner une région" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    {REGIONS.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categories">Catégories</Label>
                <Select
                  onValueChange={(value) => {
                    if (!value) return;
                    
                    if (value.startsWith("slug:")) {
                      // Catégorie par défaut (pas encore en base)
                      const slug = value.replace("slug:", "");
                      if (!categorySlugs.includes(slug)) {
                        setCategorySlugs([...categorySlugs, slug]);
                      }
                    } else {
                      // Catégorie en base
                      if (!categoryIds.includes(value)) {
                        setCategoryIds([...categoryIds, value]);
                      }
                    }
                  }}
                >
                  <SelectTrigger id="categories" className="h-10">
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories
                      ?.filter((cat) => {
                        // Filtrer les catégories déjà sélectionnées
                        if (cat._id) {
                          return !categoryIds.includes(cat._id);
                        } else {
                          // Pour les catégories par défaut, utiliser le slug
                          return !categorySlugs.includes(cat.slug);
                        }
                      })
                      .map((category) => {
                        const value = category._id || `slug:${category.slug}`;
                        const key = category._id || `default-${category.slug}`;
                        return (
                          <SelectItem 
                            key={key} 
                            value={value}
                          >
                            <div className="flex items-center gap-2">
                              {category.icon && (
                                <SolarIcon icon={category.icon as any} className="h-4 w-4" />
                              )}
                              <span>{category.name}</span>
                              {!category._id && (
                                <Badge variant="outline" className="text-xs px-1 py-0 ml-auto">
                                  Par défaut
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
                {(categoryIds.length > 0 || categorySlugs.length > 0) && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {/* Catégories en base */}
                    {categoryIds.map((catId) => {
                      const category = availableCategories?.find((cat) => cat._id === catId);
                      if (!category) return null;
                      return (
                        <Badge key={catId} variant="secondary" className="flex items-center gap-1">
                          {category.icon && (
                            <SolarIcon icon={category.icon as any} className="h-3 w-3" />
                          )}
                          {category.name}
                          <button
                            type="button"
                            onClick={() => setCategoryIds(categoryIds.filter((id) => id !== catId))}
                            className="ml-1 hover:text-destructive"
                          >
                            <SolarIcon icon="close-circle-bold" className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                    {/* Catégories par défaut */}
                    {categorySlugs.map((slug) => {
                      const category = availableCategories?.find((cat) => !cat._id && cat.slug === slug);
                      if (!category) return null;
                      return (
                        <Badge key={`slug-${slug}`} variant="outline" className="flex items-center gap-1">
                          {category.icon && (
                            <SolarIcon icon={category.icon as any} className="h-3 w-3" />
                          )}
                          {category.name}
                          <Badge variant="outline" className="text-[9px] px-1 py-0">
                            Par défaut
                          </Badge>
                          <button
                            type="button"
                            onClick={() => setCategorySlugs(categorySlugs.filter((s) => s !== slug))}
                            className="ml-1 hover:text-destructive"
                          >
                            <SolarIcon icon="close-circle-bold" className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
              <CardDescription>
                Logo et image de couverture de votre organisation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={logo || undefined} alt={name} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-gradient-light text-2xl">
                      {name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <ImageUpload
                    value={logo}
                    onChange={setLogo}
                    accept={["image/*"]}
                    maxSize={5 * 1024 * 1024}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Image de couverture</Label>
                <ImageUpload
                  value={coverImage}
                  onChange={setCoverImage}
                  accept={["image/*"]}
                  maxSize={10 * 1024 * 1024}
                />
                {coverImage && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-border/50">
                    <img
                      src={coverImage}
                      alt="Cover"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Localisation */}
          <Card>
            <CardHeader>
              <CardTitle>Localisation</CardTitle>
              <CardDescription>
                Informations sur la localisation de votre organisation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    value={location.city}
                    onChange={(e) => setLocation({ ...location, city: e.target.value })}
                    placeholder="Ville"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Région</Label>
                  <Input
                    id="region"
                    value={location.region}
                    onChange={(e) => setLocation({ ...location, region: e.target.value })}
                    placeholder="Région"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Pays</Label>
                  <Input
                    id="country"
                    value={location.country}
                    onChange={(e) => setLocation({ ...location, country: e.target.value })}
                    placeholder="Pays"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Code postal</Label>
                  <Input
                    id="postalCode"
                    value={location.postalCode}
                    onChange={(e) => setLocation({ ...location, postalCode: e.target.value })}
                    placeholder="Code postal"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adresse complète</Label>
                <Input
                  id="address"
                  value={location.address}
                  onChange={(e) => setLocation({ ...location, address: e.target.value })}
                  placeholder="Adresse complète"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
              <CardDescription>
                Informations de contact de votre organisation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@organisation.fr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Téléphone</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Site web</Label>
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://www.organisation.fr"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>
                Ajoutez des tags pour aider les utilisateurs à trouver votre organisation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Ajouter un tag"
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  <SolarIcon icon="add-circle-bold" className="h-4 w-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <SolarIcon icon="close-circle-bold" className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Langues */}
          <Card>
            <CardHeader>
              <CardTitle>Langues</CardTitle>
              <CardDescription>
                Langues parlées par votre organisation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lang) => (
                  <Button
                    key={lang.value}
                    type="button"
                    variant={languages.includes(lang.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (languages.includes(lang.value)) {
                        setLanguages(languages.filter((l) => l !== lang.value));
                      } else {
                        setLanguages([...languages, lang.value]);
                      }
                    }}
                  >
                    {lang.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Liens */}
          <Card>
            <CardHeader>
              <CardTitle>Liens</CardTitle>
              <CardDescription>
                Ajoutez des liens vers vos réseaux sociaux et autres plateformes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {links.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <Select
                    value={link.type}
                    onValueChange={(value) => handleUpdateLink(index, "type", value)}
                  >
                    <SelectTrigger className="w-[180px]">
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
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemoveLink(index)}
                  >
                    <SolarIcon icon="trash-bin-minimalistic-bold" className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" onClick={handleAddLink} variant="outline">
                <SolarIcon icon="add-circle-bold" className="h-4 w-4 mr-2" />
                Ajouter un lien
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aperçu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={logo || undefined} alt={name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-gradient-light text-xl">
                    {name[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gradient-light truncate">{name || "Nom de l'organisation"}</h3>
                  {organizationType && (
                    <Badge variant="secondary" className="mt-1">
                      {ORGANIZATION_TYPES.find((t) => t.value === organizationType)?.label}
                    </Badge>
                  )}
                </div>
              </div>
              {description && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {description}
                </p>
              )}
              <Button asChild variant="outline" className="w-full">
                <Link href={`/discover/organizations/${organizationId}`}>
                  Voir la page publique
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

