"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CATEGORY_LABELS = {
  habit: "Habitude",
  discovery: "Découverte",
  contribution: "Contribution",
  engagement: "Engagement",
} as const;

const CATEGORY_COLORS = {
  habit: "bg-blue-500/10 text-blue-500",
  discovery: "bg-green-500/10 text-green-500",
  contribution: "bg-purple-500/10 text-purple-500",
  engagement: "bg-orange-500/10 text-orange-500",
} as const;

export default function AdminMissionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const templates = useQuery(api.missions.getAllMissionTemplates);
  const createTemplate = useMutation(api.missions.createMissionTemplate);
  const updateTemplate = useMutation(api.missions.updateMissionTemplate);
  const deleteTemplate = useMutation(api.missions.deleteMissionTemplate);

  const [formData, setFormData] = useState({
    type: "",
    category: "habit" as "habit" | "discovery" | "contribution" | "engagement",
    title: "",
    description: "",
    target: 1,
    active: true,
  });

  const filteredTemplates = useMemo(() => {
    if (!templates) return [];
    return templates.filter((template) => {
      const matchesSearch =
        !searchQuery ||
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !categoryFilter || template.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, categoryFilter]);

  const selectedTemplate = useMemo(() => {
    if (!selectedTemplateId || !templates) return null;
    return templates.find((t) => t._id === selectedTemplateId);
  }, [selectedTemplateId, templates]);

  const handleCreate = async () => {
    try {
      await createTemplate(formData);
      toast.success("Mission créée avec succès");
      setIsCreateDialogOpen(false);
      setFormData({
        type: "",
        category: "habit",
        title: "",
        description: "",
        target: 1,
        active: true,
      });
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création");
    }
  };

  const handleEdit = async () => {
    if (!selectedTemplateId) return;
    try {
      await updateTemplate({
        templateId: selectedTemplateId as any,
        ...formData,
      });
      toast.success("Mission mise à jour avec succès");
      setIsEditDialogOpen(false);
      setSelectedTemplateId(null);
      setFormData({
        type: "",
        category: "habit",
        title: "",
        description: "",
        target: 1,
        active: true,
      });
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette mission ?")) return;
    try {
      await deleteTemplate({ templateId: templateId as any });
      toast.success("Mission supprimée avec succès");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression");
    }
  };

  const handleEditClick = (templateId: string) => {
    const template = templates?.find((t) => t._id === templateId);
    if (template) {
      setSelectedTemplateId(templateId);
      setFormData({
        type: template.type,
        category: template.category,
        title: template.title,
        description: template.description,
        target: template.target,
        active: template.active,
      });
      setIsEditDialogOpen(true);
    }
  };

  if (templates === undefined) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Missions</h1>
            <p className="text-muted-foreground mt-1">
              Gérez les missions disponibles sur la plateforme
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Missions</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les missions disponibles sur la plateforme. Les missions actives seront automatiquement créées pour chaque nouvel utilisateur.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="glass" className="button-glass">
              <SolarIcon icon="add-circle-bold" className="h-4 w-4" />
              Créer une mission
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle mission</DialogTitle>
              <DialogDescription>
                Une mission est une action concrète que les utilisateurs peuvent accomplir sur la plateforme.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type (identifiant unique)</Label>
                <Input
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="ex: view_10_projects, login_3_days"
                />
                <p className="text-xs text-muted-foreground">
                  Identifiant unique utilisé pour tracker la progression (minuscules, underscores)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="habit">Habitude</SelectItem>
                    <SelectItem value="discovery">Découverte</SelectItem>
                    <SelectItem value="contribution">Contribution</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="ex: Consulter 10 projets"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Décris la mission en détail"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">Objectif</Label>
                <Input
                  id="target"
                  type="number"
                  min={1}
                  value={formData.target}
                  onChange={(e) =>
                    setFormData({ ...formData, target: parseInt(e.target.value) || 1 })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Nombre d'actions à accomplir pour compléter la mission
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, active: checked === true })
                  }
                />
                <Label htmlFor="active" className="cursor-pointer">
                  Mission active (sera créée pour les nouveaux utilisateurs)
                </Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button variant="glass" onClick={handleCreate} className="button-glass">
                Créer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Alert>
        <SolarIcon icon="info-circle-bold" className="h-4 w-4" />
        <AlertDescription>
          Les missions actives seront automatiquement créées pour chaque nouvel utilisateur.
          Les missions inactives ne seront pas créées mais restent visibles ici pour référence.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Missions ({filteredTemplates.length})</CardTitle>
              <CardDescription>
                Liste de toutes les missions templates disponibles
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Rechercher une mission..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select
                value={categoryFilter || "all"}
                onValueChange={(value) =>
                  setCategoryFilter(value === "all" ? null : value)
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  <SelectItem value="habit">Habitude</SelectItem>
                  <SelectItem value="discovery">Découverte</SelectItem>
                  <SelectItem value="contribution">Contribution</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <SolarIcon icon="document-text-bold" className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune mission trouvée</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Objectif</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template._id}>
                    <TableCell className="font-mono text-xs">
                      {template.type}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{template.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {template.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={CATEGORY_COLORS[template.category]}
                      >
                        {CATEGORY_LABELS[template.category]}
                      </Badge>
                    </TableCell>
                    <TableCell>{template.target}</TableCell>
                    <TableCell>
                      <Badge variant={template.active ? "default" : "secondary"}>
                        {template.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(template._id)}
                        >
                          <SolarIcon icon="pen-bold" className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template._id)}
                        >
                          <SolarIcon icon="trash-bin-trash-bold" className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier la mission</DialogTitle>
            <DialogDescription>
              Modifie les détails de cette mission template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type (identifiant unique)</Label>
              <Input
                id="edit-type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="ex: view_10_projects, login_3_days"
              />
              <p className="text-xs text-muted-foreground">
                Identifiant unique utilisé pour tracker la progression (minuscules, underscores)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Catégorie</Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="habit">Habitude</SelectItem>
                  <SelectItem value="discovery">Découverte</SelectItem>
                  <SelectItem value="contribution">Contribution</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-title">Titre</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="ex: Consulter 10 projets"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décris la mission en détail"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-target">Objectif</Label>
              <Input
                id="edit-target"
                type="number"
                min={1}
                value={formData.target}
                onChange={(e) =>
                  setFormData({ ...formData, target: parseInt(e.target.value) || 1 })
                }
              />
              <p className="text-xs text-muted-foreground">
                Nombre d'actions à accomplir pour compléter la mission
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-active"
                checked={formData.active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, active: checked === true })
                }
              />
              <Label htmlFor="edit-active" className="cursor-pointer">
                Mission active (sera créée pour les nouveaux utilisateurs)
              </Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedTemplateId(null);
              }}
            >
              Annuler
            </Button>
            <Button variant="glass" onClick={handleEdit} className="button-glass">
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

