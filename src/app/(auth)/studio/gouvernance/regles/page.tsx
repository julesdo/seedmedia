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
import { Separator } from "@/components/ui/separator";
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Règles configurables</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Consultation des règles de la plateforme. Les modifications se font uniquement via les propositions de gouvernance.
          </p>
        </div>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clé</TableHead>
                    <TableHead>Label</TableHead>
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
                      <TableCell className="font-mono text-xs">{rule.key}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rule.label}</div>
                          {rule.description && (
                            <div className="text-xs text-muted-foreground mt-0.5">
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
                          Proposer une modification
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}

