"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SolarIcon } from "@/components/icons/SolarIcon";

// Régions Seed (France)
const SEED_REGIONS = [
  { value: "ARA", label: "Auvergne-Rhône-Alpes" },
  { value: "BFC", label: "Bourgogne-Franche-Comté" },
  { value: "BR", label: "Bretagne" },
  { value: "CVL", label: "Centre-Val de Loire" },
  { value: "COR", label: "Corse" },
  { value: "GE", label: "Grand Est" },
  { value: "HDF", label: "Hauts-de-France" },
  { value: "IDF", label: "Île-de-France" },
  { value: "NA", label: "Nouvelle-Aquitaine" },
  { value: "OCC", label: "Occitanie" },
  { value: "PDL", label: "Pays de la Loire" },
  { value: "PAC", label: "Provence-Alpes-Côte d'Azur" },
  { value: "DOM", label: "Outre-Mer" },
];

const ORGANIZATION_TYPES = [
  { value: "association", label: "Association" },
  { value: "entreprise", label: "Entreprise" },
  { value: "collectif", label: "Collectif" },
  { value: "institution", label: "Institution" },
  { value: "autre", label: "Autre" },
];

const SECTORS = [
  { value: "tech", label: "Technologie" },
  { value: "environnement", label: "Environnement" },
  { value: "social", label: "Social" },
  { value: "education", label: "Éducation" },
  { value: "culture", label: "Culture" },
  { value: "sante", label: "Santé" },
  { value: "autre", label: "Autre" },
];

const LANGUAGES = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "de", label: "Deutsch" },
  { value: "it", label: "Italiano" },
];

interface GeneralSettingsProps {
  organizationId: Id<"organizations">;
  organization: {
    name: string;
    description: string;
    logo?: string | null;
    coverImage?: string | null;
    tags: string[];
    location?: {
      address?: string;
      city?: string;
      region?: string;
      country?: string;
      postalCode?: string;
      lat?: number;
      lng?: number;
    } | null;
    seedRegion?: string | null;
    organizationType?: "association" | "entreprise" | "collectif" | "institution" | "autre" | null;
    legalStatus?: string | null;
    foundedAt?: number | null;
    sector?: "tech" | "environnement" | "social" | "education" | "culture" | "sante" | "autre" | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    website?: string | null;
    languages?: string[] | null;
    impactMetrics?: Array<{ label: string; value: string }> | null;
    links?: Array<{ type: string; url: string }> | null;
    schedule?: {
      meetings?: string;
      hours?: string;
      timezone?: string;
    } | null;
  };
}

export function GeneralSettings({ organizationId, organization }: GeneralSettingsProps) {
  const router = useRouter();
  const updateOrganization = useMutation(api.organizations.updateOrganization);

  const [name, setName] = useState(organization.name);
  const [description, setDescription] = useState(organization.description);
  const [logo, setLogo] = useState(organization.logo || "");
  const [coverImage, setCoverImage] = useState(organization.coverImage || "");
  const [tags, setTags] = useState<string[]>(organization.tags);
  const [tagInput, setTagInput] = useState("");
  const [seedRegion, setSeedRegion] = useState(organization.seedRegion || "");
  const [organizationType, setOrganizationType] = useState(organization.organizationType || "");
  const [legalStatus, setLegalStatus] = useState(organization.legalStatus || "");
  const [foundedAt, setFoundedAt] = useState(
    organization.foundedAt ? new Date(organization.foundedAt).toISOString().split("T")[0] : ""
  );
  const [sector, setSector] = useState(organization.sector || "");
  const [contactEmail, setContactEmail] = useState(organization.contactEmail || "");
  const [contactPhone, setContactPhone] = useState(organization.contactPhone || "");
  const [website, setWebsite] = useState(organization.website || "");
  const [languages, setLanguages] = useState<string[]>(organization.languages || ["fr"]);
  const [location, setLocation] = useState({
    address: organization.location?.address || "",
    city: organization.location?.city || "",
    region: organization.location?.region || "",
    country: organization.location?.country || "France",
    postalCode: organization.location?.postalCode || "",
    lat: organization.location?.lat || 0,
    lng: organization.location?.lng || 0,
  });
  const [schedule, setSchedule] = useState({
    meetings: organization.schedule?.meetings || "",
    hours: organization.schedule?.hours || "",
    timezone: organization.schedule?.timezone || "Europe/Paris",
  });
  const [impactMetrics, setImpactMetrics] = useState<Array<{ label: string; value: string }>>(
    organization.impactMetrics || []
  );
  const [links, setLinks] = useState<Array<{ type: string; url: string }>>(
    organization.links || []
  );

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(organization.name);
    setDescription(organization.description);
    setLogo(organization.logo || "");
    setCoverImage(organization.coverImage || "");
    setTags(organization.tags);
    setSeedRegion(organization.seedRegion || "");
    setOrganizationType(organization.organizationType || "");
    setLegalStatus(organization.legalStatus || "");
    setFoundedAt(organization.foundedAt ? new Date(organization.foundedAt).toISOString().split("T")[0] : "");
    setSector(organization.sector || "");
    setContactEmail(organization.contactEmail || "");
    setContactPhone(organization.contactPhone || "");
    setWebsite(organization.website || "");
    setLanguages(organization.languages || ["fr"]);
    setLocation({
      address: organization.location?.address || "",
      city: organization.location?.city || "",
      region: organization.location?.region || "",
      country: organization.location?.country || "France",
      postalCode: organization.location?.postalCode || "",
      lat: organization.location?.lat || 0,
      lng: organization.location?.lng || 0,
    });
    setSchedule({
      meetings: organization.schedule?.meetings || "",
      hours: organization.schedule?.hours || "",
      timezone: organization.schedule?.timezone || "Europe/Paris",
    });
    setImpactMetrics(organization.impactMetrics || []);
    setLinks(organization.links || []);
  }, [organization]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleLanguageToggle = (lang: string) => {
    if (languages.includes(lang)) {
      if (languages.length > 1) {
        setLanguages(languages.filter((l) => l !== lang));
      }
    } else {
      setLanguages([...languages, lang]);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    setIsSaving(true);
    try {
      await updateOrganization({
        organizationId,
        name: name.trim(),
        description: description.trim() || undefined,
        logo: logo.trim() || undefined,
        coverImage: coverImage.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        seedRegion: seedRegion || undefined,
        organizationType: (organizationType as any) || undefined,
        legalStatus: legalStatus.trim() || undefined,
        foundedAt: foundedAt ? new Date(foundedAt).getTime() : undefined,
        sector: (sector as any) || undefined,
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        website: website.trim() || undefined,
        languages: languages.length > 0 ? languages : undefined,
        impactMetrics: impactMetrics.length > 0 ? impactMetrics : undefined,
        links: links.length > 0 ? links : undefined,
        location:
          location.city || location.address
            ? {
                lat: location.lat || 0,
                lng: location.lng || 0,
                address: location.address.trim() || undefined,
                city: location.city.trim() || undefined,
                region: location.region.trim() || undefined,
                country: location.country.trim() || undefined,
                postalCode: location.postalCode.trim() || undefined,
              }
            : undefined,
        schedule:
          schedule.meetings || schedule.hours
            ? {
                meetings: schedule.meetings.trim() || undefined,
                hours: schedule.hours.trim() || undefined,
                timezone: schedule.timezone.trim() || undefined,
              }
            : undefined,
      });
      toast.success("Paramètres mis à jour avec succès");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-gradient-light">Images</CardTitle>
          <CardDescription>Modifiez le logo et l'image de couverture de l'organisation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ImageUpload
            variant="avatar"
            value={logo}
            onChange={(url) => setLogo(url || "")}
            label="Logo"
            description="Image carrée recommandée (minimum 200x200px, max 5MB)"
            maxSize={5 * 1024 * 1024}
            accept={["image/jpeg", "image/jpg", "image/png", "image/webp"]}
          />
          <ImageUpload
            variant="cover"
            value={coverImage}
            onChange={(url) => setCoverImage(url || "")}
            label="Image de couverture"
            description="Image de couverture recommandée: 1920x1080px (max 10MB)"
            aspectRatio={16 / 9}
            maxSize={10 * 1024 * 1024}
            accept={["image/jpeg", "image/jpg", "image/png", "image/webp"]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-gradient-light">Informations générales</CardTitle>
          <CardDescription>Modifiez les informations de base de l'organisation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gradient-light">Nom de l'organisation *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de l'organisation" />
          </div>

          <div className="space-y-2">
            <Label className="text-gradient-light">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre organisation..."
              rows={6}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gradient-light">Type d'organisation</Label>
              <Select value={organizationType} onValueChange={setOrganizationType}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {ORGANIZATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gradient-light">Secteur d'activité</Label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un secteur" />
                </SelectTrigger>
                <SelectContent>
                  {SECTORS.map((sec) => (
                    <SelectItem key={sec.value} value={sec.value}>
                      {sec.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gradient-light">Statut légal</Label>
            <Input
              value={legalStatus}
              onChange={(e) => setLegalStatus(e.target.value)}
              placeholder="Ex: Association loi 1901, SARL, SCIC..."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gradient-light">Date de fondation</Label>
            <Input
              type="date"
              value={foundedAt}
              onChange={(e) => setFoundedAt(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="rounded-lg bg-muted/30 border border-border/50 p-4 space-y-2">
            <div className="flex items-start gap-2">
              <SolarIcon icon="info-circle-bold" className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <Label className="text-gradient-light">Rayon d'audience</Label>
                <p className="text-sm text-muted-foreground/80">
                  Le rayon d'audience de votre organisation est géré automatiquement par l'algorithme de diffusion selon votre niveau, la pertinence de votre contenu, et la fiabilité de vos informations. 
                  Les bonnes actions (soutiens de projets, articles de qualité, etc.) permettent de gagner de l'XP et d'élargir progressivement votre audience.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gradient-light">Tags</Label>
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
              <Button variant="glass" onClick={handleAddTag} icon="plus-circle-bold">
                Ajouter
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-background border border-border/50"
                  >
                    <span className="text-sm text-gradient-light">{tag}</span>
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <SolarIcon icon="close-circle-bold" className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-gradient-light">Localisation Seed</CardTitle>
          <CardDescription>Informations de localisation importantes pour Seed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gradient-light">Région Seed *</Label>
            <Select value={seedRegion} onValueChange={setSeedRegion}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une région" />
              </SelectTrigger>
              <SelectContent>
                {SEED_REGIONS.map((region) => (
                  <SelectItem key={region.value} value={region.value}>
                    {region.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-gradient-light">Adresse complète</Label>
            <Input
              value={location.address}
              onChange={(e) => setLocation({ ...location, address: e.target.value })}
              placeholder="Numéro et nom de rue"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-gradient-light">Code postal</Label>
              <Input
                value={location.postalCode}
                onChange={(e) => setLocation({ ...location, postalCode: e.target.value })}
                placeholder="Code postal"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gradient-light">Ville</Label>
              <Input
                value={location.city}
                onChange={(e) => setLocation({ ...location, city: e.target.value })}
                placeholder="Ville"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gradient-light">Pays</Label>
              <Input
                value={location.country}
                onChange={(e) => setLocation({ ...location, country: e.target.value })}
                placeholder="Pays"
              />
            </div>
          </div>

          <div className="text-xs text-muted-foreground opacity-70">
            <SolarIcon icon="info-circle-bold" className="h-3 w-3 inline mr-1" />
            Les coordonnées GPS seront automatiquement détectées à partir de l'adresse
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-gradient-light">Contact</CardTitle>
          <CardDescription>Informations de contact de l'organisation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gradient-light">Email de contact</Label>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contact@organisation.fr"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gradient-light">Téléphone</Label>
              <Input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+33 1 23 45 67 89"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gradient-light">Site web</Label>
            <Input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://www.organisation.fr"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-gradient-light">Langues</CardTitle>
          <CardDescription>Langues parlées par l'organisation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <Button
                key={lang.value}
                variant={languages.includes(lang.value) ? "accent" : "glass"}
                size="sm"
                onClick={() => handleLanguageToggle(lang.value)}
              >
                {lang.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-gradient-light">Horaires et réunions</CardTitle>
          <CardDescription>Informations sur les horaires et les réunions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gradient-light">Fréquence des réunions</Label>
            <Input
              value={schedule.meetings}
              onChange={(e) => setSchedule({ ...schedule, meetings: e.target.value })}
              placeholder="Ex: Tous les mercredis à 19h"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gradient-light">Horaires d'ouverture</Label>
            <Input
              value={schedule.hours}
              onChange={(e) => setSchedule({ ...schedule, hours: e.target.value })}
              placeholder="Ex: Lundi-Vendredi 9h-18h"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-gradient-light">Métriques d'impact</CardTitle>
          <CardDescription>Ajoutez des métriques pour mesurer l'impact de votre organisation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {impactMetrics.map((metric, index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <Input
                  value={metric.label}
                  onChange={(e) => {
                    const newMetrics = [...impactMetrics];
                    newMetrics[index] = { ...newMetrics[index], label: e.target.value };
                    setImpactMetrics(newMetrics);
                  }}
                  placeholder="Label (ex: Personnes aidées)"
                />
                <Input
                  value={metric.value}
                  onChange={(e) => {
                    const newMetrics = [...impactMetrics];
                    newMetrics[index] = { ...newMetrics[index], value: e.target.value };
                    setImpactMetrics(newMetrics);
                  }}
                  placeholder="Valeur (ex: 500)"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setImpactMetrics(impactMetrics.filter((_, i) => i !== index))}
                className="shrink-0"
              >
                <SolarIcon icon="trash-bin-minimalistic-bold" className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="glass"
            onClick={() => setImpactMetrics([...impactMetrics, { label: "", value: "" }])}
            icon="plus-circle-bold"
            className="w-full"
          >
            Ajouter une métrique
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-gradient-light">Liens externes</CardTitle>
          <CardDescription>Ajoutez des liens vers vos réseaux sociaux, sites web, etc.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {links.map((link, index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <Input
                  value={link.type}
                  onChange={(e) => {
                    const newLinks = [...links];
                    newLinks[index] = { ...newLinks[index], type: e.target.value };
                    setLinks(newLinks);
                  }}
                  placeholder="Type (ex: Facebook, LinkedIn, Twitter)"
                />
                <Input
                  type="url"
                  value={link.url}
                  onChange={(e) => {
                    const newLinks = [...links];
                    newLinks[index] = { ...newLinks[index], url: e.target.value };
                    setLinks(newLinks);
                  }}
                  placeholder="https://..."
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLinks(links.filter((_, i) => i !== index))}
                className="shrink-0"
              >
                <SolarIcon icon="trash-bin-minimalistic-bold" className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="glass"
            onClick={() => setLinks([...links, { type: "", url: "" }])}
            icon="plus-circle-bold"
            className="w-full"
          >
            Ajouter un lien
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button variant="glass" onClick={() => router.push(`/discover/organizations/${organizationId}`)}>
          Annuler
        </Button>
        <Button variant="accent" onClick={handleSave} disabled={isSaving} icon="check-circle-bold">
          {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
        </Button>
      </div>
    </div>
  );
}
