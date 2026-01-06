"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useTranslations } from 'next-intl';

interface ResolutionRule {
  id: string;
  name: string;
  description: string;
  category: "threshold" | "weight" | "scoring" | "seeds";
  value: number | string;
  unit?: string;
  details?: string;
}

export function RulesClient() {
  const t = useTranslations('rules');
  const rules = useQuery(api.rules.getResolutionRules, {}) || [];

  // Grouper les règles par catégorie
  const rulesByCategory = rules.reduce(
    (acc, rule) => {
      if (!acc[rule.category]) {
        acc[rule.category] = [];
      }
      acc[rule.category].push(rule);
      return acc;
    },
    {} as Record<string, ResolutionRule[]>
  );

  const categoryLabels: Record<string, string> = {
    threshold: t('categories.threshold'),
    weight: t('categories.weight'),
    scoring: t('categories.scoring'),
    seeds: t('categories.seeds'),
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
          <p className="text-muted-foreground text-lg">
            {t('description')}
          </p>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>{t('note')}</strong> {t('noteDescription')}
            </p>
          </div>
        </div>

        {/* Règles par catégorie */}
        {Object.entries(rulesByCategory).map(([category, categoryRules]) => (
          <section key={category} className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">
              {categoryLabels[category] || category}
            </h2>
            <div className="space-y-4">
              {categoryRules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {rule.name}
                      </h3>
                      <p className="text-muted-foreground mb-2">
                        {rule.description}
                      </p>
                      {rule.details && (
                        <p className="text-sm text-muted-foreground italic">
                          {rule.details}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {typeof rule.value === "number"
                          ? rule.value.toLocaleString()
                          : rule.value}
                      </div>
                      {rule.unit && (
                        <div className="text-sm text-muted-foreground">
                          {rule.unit}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Footer */}
        <div className="mt-12 p-6 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">{t('transparency.title')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('transparency.description')}
          </p>
        </div>
      </div>
    </div>
  );
}

