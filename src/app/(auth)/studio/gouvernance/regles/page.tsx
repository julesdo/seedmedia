"use client";

import * as React from "react";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ConfigurableRulesPage() {
  const rules = useQuery(api.configurableRules.getActiveRules, {});
  const categories = useQuery(api.configurableRules.getRuleCategories, {});

  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // État du formulaire
  const [formData, setFormData] = useState({
    key: "",
    label: "",
    description: "",
    category: "",
    valueType: "number" as "number" | "boolean" | "string" | "select",
    currentValue: "",
    defaultValue: "",
    proposalType: "editorial_rules" as "editorial_rules" | "product_evolution" | "ethical_charter" | "other",
    min: "",
    max: "",
    step: "",
    unit: "",
    options: [] as Array<{ label: string; value: string }>,
  });

  const filteredRules = React.useMemo(() => {
    if (!rules) return [];
    if (selectedCategory === "all") return rules;
    return rules.filter((rule) => rule.category === selectedCategory);
  }, [rules, selectedCategory]);

  // Calculer les statistiques
  const stats = React.useMemo(() => {
    if (!rules) return { total: 0, byType: {} };
    
    const byType: Record<string, number> = {};
    rules.forEach((rule) => {
      byType[rule.valueType] = (byType[rule.valueType] || 0) + 1;
    });
    
    return {
      total: rules.length,
      byType,
    };
  }, [rules]);

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Règles configurables</h1>
          <p className="text-muted-foreground mt-2">
            Consultation des règles de la plateforme. Les modifications se font uniquement via les propositions de gouvernance.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <SolarIcon icon="settings-bold" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Numériques</CardTitle>
            <SolarIcon icon="calculator-bold" className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byType.number || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Booléennes</CardTitle>
            <SolarIcon icon="check-circle-bold" className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byType.boolean || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Texte</CardTitle>
            <SolarIcon icon="text-field-bold" className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byType.string || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList>
          <TabsTrigger value="all">Toutes</TabsTrigger>
          {categories?.map((cat) => (
            <TabsTrigger key={cat} value={cat}>
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory === "all" ? "all" : selectedCategory} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Règles actives</CardTitle>
              <CardDescription>
                {filteredRules.length} règle{filteredRules.length > 1 ? "s" : ""} active
                {selectedCategory !== "all" && ` dans la catégorie "${selectedCategory}"`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredRules.length === 0 ? (
                <div className="text-center py-12">
                  <SolarIcon
                    icon="settings-bold"
                    className="h-12 w-12 mx-auto text-muted-foreground mb-4"
                  />
                  <h3 className="text-lg font-semibold mb-2">Aucune règle</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedCategory !== "all"
                      ? `Aucune règle dans la catégorie "${selectedCategory}"`
                      : "Aucune règle configurable pour le moment"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[150px] max-w-[250px]">Clé</TableHead>
                        <TableHead className="min-w-[200px] max-w-[300px]">Label</TableHead>
                        <TableHead>Catégorie</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Valeur actuelle</TableHead>
                        <TableHead>Type de proposition</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRules.map((rule) => (
                        <TableRow key={rule.key}>
                          <TableCell className="font-mono text-xs min-w-[150px] max-w-[250px]">
                            <div className="truncate" title={rule.key}>
                              {rule.key}
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[200px] max-w-[300px]">
                            <div className="space-y-0.5">
                              <div className="font-medium truncate" title={rule.label}>
                                {rule.label}
                              </div>
                              {rule.description && (
                                <div className="text-xs text-muted-foreground line-clamp-1" title={rule.description}>
                                  {rule.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{rule.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{rule.valueType}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{String(rule.currentValue)}</span>
                              {rule.unit && (
                                <span className="text-xs text-muted-foreground">({rule.unit})</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {rule.proposalType.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Rediriger vers la page de création de proposition avec le type approprié
                                window.location.href = `/studio/gouvernance/nouvelle?proposalType=${rule.proposalType}&ruleKey=${rule.key}`;
                              }}
                            >
                              <SolarIcon icon="document-add-bold" className="h-3 w-3 mr-1" />
                              Modifier
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}

