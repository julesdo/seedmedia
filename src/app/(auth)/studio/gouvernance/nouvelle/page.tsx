"use client";

import * as React from "react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlateEditorWrapper, extractTextFromPlateValue } from "@/components/articles/PlateEditorWrapper";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ActionFields } from "@/components/governance/ActionFields";
import { getActionSchema, validateActionData } from "@/lib/governance/actionSchemas";

const PROPOSAL_TYPES = [
  { value: "editorial_rules", label: "Règles éditoriales" },
  { value: "product_evolution", label: "Évolution du produit" },
  { value: "ethical_charter", label: "Charte éthique" },
  { value: "category_addition", label: "Ajout de catégories" },
  { value: "expert_nomination", label: "Process de nomination des experts" },
  { value: "other", label: "Autre" },
] as const;

function NewProposalPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createProposal = useMutation(api.governance.createProposal);
  const allCategories = useQuery(api.categories.getActiveCategories, {});
  const allUsers = useQuery(api.users.getAllUsers, {});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Pré-remplir depuis les query params si on vient de la page des règles
  const initialProposalType = (searchParams?.get("proposalType") as any) || "editorial_rules";
  const initialRuleKey = searchParams?.get("ruleKey") || "";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState<string>("");
  const [proposalType, setProposalType] = useState<
    "editorial_rules" | "product_evolution" | "ethical_charter" | "category_addition" | "expert_nomination" | "other"
  >(initialProposalType);
  
  // Charger les règles configurables pour editorial_rules et product_evolution
  const editorialRules = useQuery(
    api.configurableRules.getActiveRules,
    proposalType === "editorial_rules" ? { proposalType: "editorial_rules" } : "skip"
  );
  const productRules = useQuery(
    api.configurableRules.getActiveRules,
    proposalType === "product_evolution" ? { proposalType: "product_evolution" } : "skip"
  );

  // Pré-remplir actionData si on vient de la page des règles
  useEffect(() => {
    if (initialRuleKey && (proposalType === "editorial_rules" || proposalType === "product_evolution")) {
      const fieldKey = proposalType === "editorial_rules" ? "ruleKey" : "settingKey";
      setActionData({ [fieldKey]: initialRuleKey });
    }
  }, [initialRuleKey, proposalType]);

  // Réinitialiser actionData quand le type change (sauf si on vient de la page des règles)
  React.useEffect(() => {
    if (!initialRuleKey) {
      setActionData({});
    }
  }, [proposalType, initialRuleKey]);
  // Récupérer les paramètres de vote actuels pour valider les minimums
  const currentVoteParams = useQuery(api.governanceEvolution.getCurrentVoteParameters);
  
  // Initialiser la durée du vote avec la valeur par défaut du backend
  const [voteDurationDays, setVoteDurationDays] = useState<number>(
    currentVoteParams?.defaultDurationDays || 7
  );
  
  // Mettre à jour la durée si les paramètres changent
  useEffect(() => {
    if (currentVoteParams?.defaultDurationDays) {
      setVoteDurationDays(currentVoteParams.defaultDurationDays);
    }
  }, [currentVoteParams?.defaultDurationDays]);
  const [loading, setLoading] = useState(false);
  
  // Champs spécifiques par type - Structure flexible basée sur les schémas
  const [actionData, setActionData] = useState<Record<string, any>>({});

  // Générer le slug depuis le titre
  const slug = React.useMemo(() => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }, [title]);

  // Validation
  const validationErrors = React.useMemo(() => {
    const errors: string[] = [];
    
    if (!title.trim()) errors.push("Le titre est obligatoire");
    
    // Extraire le texte brut de la description (qui est en JSON Plate.js)
    let descriptionText = "";
    if (description) {
      try {
        const parsed = JSON.parse(description);
        descriptionText = extractTextFromPlateValue(parsed);
      } catch {
        // Si ce n'est pas du JSON, utiliser directement la chaîne (pour compatibilité)
        descriptionText = description;
      }
    }
    if (!descriptionText.trim()) errors.push("La description est obligatoire");
    
    // Valider la durée du vote selon les minimums définis dans les évolutions
    const minDuration = currentVoteParams?.minDurationDays || 1;
    const maxDuration = currentVoteParams?.maxDurationDays || 90;
    if (voteDurationDays < minDuration) {
      errors.push(`La durée du vote doit être d'au moins ${minDuration} jour${minDuration > 1 ? "s" : ""}`);
    }
    if (voteDurationDays > maxDuration) {
      errors.push(`La durée du vote ne peut pas dépasser ${maxDuration} jours`);
    }
    
    // Validation selon le schéma d'action
    const actionValidation = validateActionData(proposalType, actionData);
    if (!actionValidation.valid) {
      Object.values(actionValidation.errors).forEach((error) => {
        errors.push(error);
      });
    }
    
    return errors;
  }, [title, description, voteDurationDays, proposalType, actionData, currentVoteParams]);

  const canSubmit = validationErrors.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit) {
      toast.error("Veuillez corriger les erreurs avant de soumettre");
      return;
    }

    setLoading(true);
    try {
      await createProposal({
        title,
        slug: slug || `proposition-${Date.now()}`,
        description,
        proposalType,
        voteDurationDays,
        actionData: Object.keys(actionData).length > 0 ? actionData : undefined,
      });

      toast.success("Proposition créée avec succès !");
      router.push(`/studio/gouvernance`);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création de la proposition");
    } finally {
      setLoading(false);
    }
  };

  // Contenu de la sidebar (réutilisable pour mobile et desktop)
  const sidebarContent = (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 py-3 border-b shrink-0 bg-background">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold text-foreground">Paramètres</h2>
          <p className="text-xs text-muted-foreground">
            Configurez votre proposition de gouvernance
          </p>
        </div>
      </div>

      {/* Content - Scrollable */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-3 py-3 space-y-4">
          {/* Alerts de validation */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="py-2">
              <SolarIcon icon="danger-triangle-bold" className="h-3 w-3" />
              <AlertDescription className="text-[10px] mt-0.5">
                <div className="font-semibold mb-0.5">Erreurs :</div>
                <ul className="list-disc list-inside space-y-0">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-[10px]">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Type de proposition */}
          <div className="space-y-1.5">
            <Label htmlFor="proposalType" className="text-xs font-semibold text-foreground">
              Type de proposition
            </Label>
            <Select
              value={proposalType}
              onValueChange={(value: any) => setProposalType(value)}
            >
              <SelectTrigger id="proposalType" className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROPOSAL_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-xs">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Durée du vote */}
          <div className="space-y-1.5">
            <Label htmlFor="voteDurationDays" className="text-xs font-semibold text-foreground">
              Durée du vote <span className="text-destructive">*</span>
              <span className="text-[10px] font-normal text-muted-foreground ml-1">(jours)</span>
            </Label>
            <Input
              id="voteDurationDays"
              type="number"
              min={currentVoteParams?.minDurationDays || 1}
              max={currentVoteParams?.maxDurationDays || 90}
              value={voteDurationDays}
              onChange={(e) => {
                const value = parseInt(e.target.value) || (currentVoteParams?.defaultDurationDays || 7);
                // Forcer la valeur dans les limites
                const min = currentVoteParams?.minDurationDays || 1;
                const max = currentVoteParams?.maxDurationDays || 90;
                setVoteDurationDays(Math.max(min, Math.min(max, value)));
              }}
              className="h-8 text-xs"
              required
            />
            <p className="text-[10px] text-muted-foreground">
              Nombre de jours pendant lesquels le vote restera ouvert
              {currentVoteParams && (
                <span className="block mt-0.5">
                  Minimum: {currentVoteParams.minDurationDays} jour{currentVoteParams.minDurationDays > 1 ? "s" : ""}, 
                  Maximum: {currentVoteParams.maxDurationDays} jours
                </span>
              )}
            </p>
          </div>

          <Separator />

          {/* Info sur les paramètres automatiques */}
          <Alert className="py-2">
            <SolarIcon icon="info-circle-bold" className="h-3 w-3" />
            <AlertDescription className="text-[10px] mt-0.5">
              <strong>Paramètres automatiques :</strong>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-[10px]">
                {proposalType === "editorial_rules" && (
                  <>
                    <li>Quorum : 15+ votes</li>
                    <li>Majorité : 60%+</li>
                  </>
                )}
                {proposalType === "ethical_charter" && (
                  <>
                    <li>Quorum : 20+ votes</li>
                    <li>Majorité : 66%+</li>
                  </>
                )}
                {proposalType === "expert_nomination" && (
                  <>
                    <li>Quorum : 12+ votes</li>
                    <li>Majorité : 50%+</li>
                  </>
                )}
                {proposalType === "category_addition" && (
                  <>
                    <li>Quorum : 10+ votes</li>
                    <li>Majorité : 50%+</li>
                  </>
                )}
                {proposalType === "product_evolution" && (
                  <>
                    <li>Quorum : 12+ votes</li>
                    <li>Majorité : 55%+</li>
                  </>
                )}
                {proposalType === "other" && (
                  <>
                    <li>Quorum : 10+ votes</li>
                    <li>Majorité : 50%+</li>
                  </>
                )}
              </ul>
            </AlertDescription>
          </Alert>

          <Separator />

          {/* Champs spécifiques selon le type - Générés dynamiquement */}
          {(() => {
            const availableRules =
              proposalType === "editorial_rules"
                ? editorialRules
                : proposalType === "product_evolution"
                ? productRules
                : undefined;
            const schema = getActionSchema(proposalType, availableRules);
            if (!schema) return null;
            
            return (
              <ActionFields
                schema={schema}
                actionData={actionData}
                onActionDataChange={setActionData}
                categoryOptions={allCategories || []}
                userOptions={allUsers || []}
                availableRules={availableRules}
              />
            );
          })()}

          {/* Slug généré */}
          {slug && (
            <>
              <Separator />
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground">URL générée</Label>
                <code className="block bg-muted px-2 py-1 rounded text-[10px] font-mono break-all">
                  {slug}
                </code>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="flex h-[calc(100vh-4rem)] w-full overflow-hidden">
      {/* Main Content - Éditeur centré */}
      <main className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header compact - Fixe en haut */}
        <div className="border-b bg-background shrink-0 px-3 md:px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Mobile sidebar trigger */}
            <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden shrink-0">
                  <SolarIcon icon="sidebar-bold" className="h-5 w-5" />
                  <span className="sr-only">Ouvrir les paramètres</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                {sidebarContent}
              </SheetContent>
            </Sheet>

            {/* Desktop sidebar toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex shrink-0"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              type="button"
            >
              <SolarIcon icon={sidebarOpen ? "sidebar-minimalistic-bold" : "sidebar-code-bold"} className="h-5 w-5" />
              <span className="sr-only">Basculer les paramètres</span>
            </Button>

            {/* Type de proposition + Input titre dans le header */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Select
                value={proposalType}
                onValueChange={(value: any) => setProposalType(value)}
              >
                <SelectTrigger className="h-8 w-[160px] text-xs shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROPOSAL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-xs">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre de la proposition..."
                className="text-lg md:text-xl font-semibold bg-transparent border-none outline-none flex-1 min-w-0 placeholder:text-muted-foreground focus:ring-0 p-0"
                autoFocus
              />
            </div>
            
            {validationErrors.length > 0 && (
              <Badge variant="destructive" className="text-xs shrink-0">
                {validationErrors.length} erreur{validationErrors.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              disabled={loading}
              size="sm"
              type="button"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || !canSubmit}
              size="sm"
            >
              {loading ? (
                <>
                  <SolarIcon icon="spinner-circle" className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <SolarIcon icon="check-circle-bold" className="h-4 w-4 mr-2" />
                  Créer
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Editor Area - Scrollable */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ height: 'calc(100vh - 8rem)' }}>
          <div className="w-full h-full flex flex-col">
            {/* Éditeur principal - Contenu scrollable */}
            <div className="py-2 md:py-4 h-full flex flex-col min-h-0">
              <div className="h-full min-h-0">
                <PlateEditorWrapper
                  value={description}
                  onChange={setDescription}
                  placeholder="Décrivez en détail votre proposition, ses objectifs, ses implications et les raisons pour lesquelles elle devrait être adoptée..."
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sidebar Desktop - Paramètres avec scroll */}
      <aside
        className={`hidden md:flex flex-col w-80 border-l bg-background shrink-0 h-full transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full absolute right-0"
        }`}
      >
        {sidebarContent}
      </aside>
    </form>
  );
}

export default function NewProposalPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <div className="text-center">
          <SolarIcon icon="spinner-circle" className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    }>
      <NewProposalPageContent />
    </Suspense>
  );
}

