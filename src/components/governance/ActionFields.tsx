"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ActionSchema, ActionField } from "@/lib/governance/actionSchemas";
import { SolarIconPicker } from "@/components/ui/solar-icon-picker";

interface ActionFieldsProps {
  schema: ActionSchema;
  actionData: Record<string, any>;
  onActionDataChange: (data: Record<string, any>) => void;
  // Pour les champs de type combobox qui nécessitent des options dynamiques
  categoryOptions?: Array<{ _id: string; name: string }>;
  userOptions?: Array<{ _id: string; email: string; name?: string }>;
  // Règles configurables disponibles (pour déterminer le type de champ de valeur)
  availableRules?: Array<{
    _id: string;
    key: string;
    label: string;
    description?: string;
    valueType: "number" | "boolean" | "string" | "select";
    currentValue: any;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    options?: Array<{ label: string; value: any }>;
  }>;
}

export function ActionFields({
  schema,
  actionData,
  onActionDataChange,
  categoryOptions = [],
  userOptions = [],
  availableRules = [],
}: ActionFieldsProps) {
  const updateField = (key: string, value: any) => {
    onActionDataChange({ ...actionData, [key]: value });
  };

  const renderField = (field: ActionField) => {
    const value = actionData?.[field.key] ?? undefined;
    
    // Pour les champs de valeur (ruleValue, settingValue), déterminer le type depuis la règle sélectionnée
    if ((field.key === "ruleValue" || field.key === "settingValue") && availableRules.length > 0) {
      const ruleKey = actionData.ruleKey || actionData.settingKey;
      const selectedRule = availableRules.find((r) => r.key === ruleKey);
      if (selectedRule) {
        // Adapter le type de champ selon la règle sélectionnée
        if (selectedRule.valueType === "number") {
          return (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={field.key} className="text-xs font-semibold text-foreground">
                {field.label}
                {field.required && <span className="text-destructive ml-0.5">*</span>}
                {selectedRule.unit && <span className="text-muted-foreground ml-1">({selectedRule.unit})</span>}
              </Label>
              {field.description && (
                <p className="text-[10px] text-muted-foreground">{field.description}</p>
              )}
              <Input
                id={field.key}
                type="number"
                value={value !== undefined && value !== null ? value : ""}
                onChange={(e) => {
                  const numValue = e.target.value === "" ? undefined : Number(e.target.value);
                  updateField(field.key, numValue);
                }}
                placeholder={field.placeholder}
                className="h-8 text-xs"
                min={selectedRule.min}
                max={selectedRule.max}
                step={selectedRule.step || 1}
                required={field.required}
              />
              {(selectedRule.min !== undefined || selectedRule.max !== undefined) && (
                <p className="text-[10px] text-muted-foreground">
                  {selectedRule.min !== undefined && selectedRule.max !== undefined
                    ? `Valeur entre ${selectedRule.min} et ${selectedRule.max}`
                    : selectedRule.min !== undefined
                    ? `Valeur minimum : ${selectedRule.min}`
                    : `Valeur maximum : ${selectedRule.max}`}
                </p>
              )}
            </div>
          );
        } else if (selectedRule.valueType === "boolean") {
          return (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={field.key} className="text-xs font-semibold text-foreground">
                {field.label}
                {field.required && <span className="text-destructive ml-0.5">*</span>}
              </Label>
              {field.description && (
                <p className="text-[10px] text-muted-foreground">{field.description}</p>
              )}
              <Select
                value={value !== undefined && value !== null ? String(value) : ""}
                onValueChange={(val) => updateField(field.key, val === "true")}
              >
                <SelectTrigger id={field.key} className="h-8 text-xs">
                  <SelectValue placeholder="Sélectionnez..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true" className="text-xs">Oui</SelectItem>
                  <SelectItem value="false" className="text-xs">Non</SelectItem>
                </SelectContent>
              </Select>
            </div>
          );
        } else if (selectedRule.valueType === "select" && selectedRule.options) {
          return (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={field.key} className="text-xs font-semibold text-foreground">
                {field.label}
                {field.required && <span className="text-destructive ml-0.5">*</span>}
              </Label>
              {field.description && (
                <p className="text-[10px] text-muted-foreground">{field.description}</p>
              )}
              <Select
                value={value !== undefined && value !== null ? String(value) : ""}
                onValueChange={(val) => updateField(field.key, val)}
              >
                <SelectTrigger id={field.key} className="h-8 text-xs">
                  <SelectValue placeholder="Sélectionnez..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedRule.options.map((option) => (
                    <SelectItem key={String(option.value)} value={String(option.value)} className="text-xs">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }
      }
    }

    switch (field.type) {
      case "select":
        return (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={field.key} className="text-xs font-semibold text-foreground">
              {field.label}
              {field.required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
            {field.description && (
              <p className="text-[10px] text-muted-foreground">{field.description}</p>
            )}
            <Select value={value || ""} onValueChange={(val) => updateField(field.key, val)}>
              <SelectTrigger id={field.key} className="h-8 text-xs">
                <SelectValue placeholder={field.placeholder || "Sélectionnez..."} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={String(option.value)} value={String(option.value)} className="text-xs">
                    <div>
                      <div className="font-medium">{option.label}</div>
                      {option.description && (
                        <div className="text-[10px] text-muted-foreground">{option.description}</div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "multiselect":
        const selectedValues = Array.isArray(value) ? value : value ? [value] : [];
        return (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={field.key} className="text-xs font-semibold text-foreground">
              {field.label}
              {field.required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
            {field.description && (
              <p className="text-[10px] text-muted-foreground">{field.description}</p>
            )}
            <div className="space-y-2 border rounded-md p-2 min-h-[80px]">
              {field.options?.map((option) => {
                const isChecked = selectedValues.includes(String(option.value));
                return (
                  <div key={String(option.value)} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${field.key}-${option.value}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        const newValues = checked
                          ? [...selectedValues, String(option.value)]
                          : selectedValues.filter((v) => v !== String(option.value));
                        updateField(field.key, newValues);
                      }}
                    />
                    <label
                      htmlFor={`${field.key}-${option.value}`}
                      className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {option.label}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "combobox":
        // Pour categoryId
        if (field.key === "categoryId") {
          return (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={field.key} className="text-xs font-semibold text-foreground">
                {field.label}
                {field.required && <span className="text-destructive ml-0.5">*</span>}
              </Label>
              {field.description && (
                <p className="text-[10px] text-muted-foreground">{field.description}</p>
              )}
              <Select value={value || ""} onValueChange={(val) => updateField(field.key, val)}>
                <SelectTrigger id={field.key} className="h-8 text-xs">
                  <SelectValue placeholder={field.placeholder || "Sélectionnez..."} />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category._id} value={category._id} className="text-xs">
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }
        // Pour userId
        if (field.key === "userId") {
          return (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={field.key} className="text-xs font-semibold text-foreground">
                {field.label}
                {field.required && <span className="text-destructive ml-0.5">*</span>}
              </Label>
              {field.description && (
                <p className="text-[10px] text-muted-foreground">{field.description}</p>
              )}
              <Select value={value || ""} onValueChange={(val) => updateField(field.key, val)}>
                <SelectTrigger id={field.key} className="h-8 text-xs">
                  <SelectValue placeholder={field.placeholder || "Sélectionnez..."} />
                </SelectTrigger>
                <SelectContent>
                  {userOptions.map((user) => (
                    <SelectItem key={user._id} value={user._id} className="text-xs">
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }
        // Fallback pour autres combobox
        return (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={field.key} className="text-xs font-semibold text-foreground">
              {field.label}
              {field.required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
            {field.description && (
              <p className="text-[10px] text-muted-foreground">{field.description}</p>
            )}
            <Input
              id={field.key}
              value={value || ""}
              onChange={(e) => updateField(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="h-8 text-xs"
              required={field.required}
            />
          </div>
        );

      case "number":
        return (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={field.key} className="text-xs font-semibold text-foreground">
              {field.label}
              {field.required && <span className="text-destructive ml-0.5">*</span>}
              {field.unit && <span className="text-muted-foreground ml-1">({field.unit})</span>}
            </Label>
            {field.description && (
              <p className="text-[10px] text-muted-foreground">{field.description}</p>
            )}
            <Input
              id={field.key}
              type="number"
              value={value !== undefined && value !== null ? value : ""}
              onChange={(e) => {
                const numValue = e.target.value === "" ? undefined : Number(e.target.value);
                updateField(field.key, numValue);
              }}
              placeholder={field.placeholder}
              className="h-8 text-xs"
              min={field.min}
              max={field.max}
              step={field.step || 1}
              required={field.required}
            />
            {(field.min !== undefined || field.max !== undefined) && (
              <p className="text-[10px] text-muted-foreground">
                {field.min !== undefined && field.max !== undefined
                  ? `Valeur entre ${field.min} et ${field.max}`
                  : field.min !== undefined
                  ? `Valeur minimum : ${field.min}`
                  : `Valeur maximum : ${field.max}`}
              </p>
            )}
          </div>
        );

      case "textarea":
        return (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={field.key} className="text-xs font-semibold text-foreground">
              {field.label}
              {field.required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
            {field.description && (
              <p className="text-[10px] text-muted-foreground">{field.description}</p>
            )}
            <Textarea
              id={field.key}
              value={value || ""}
              onChange={(e) => updateField(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="min-h-[80px] text-xs resize-none"
              required={field.required}
            />
          </div>
        );

      case "iconpicker":
        return (
          <SolarIconPicker
            key={field.key}
            value={value || ""}
            onValueChange={(val) => updateField(field.key, val)}
            label={field.label}
            description={field.description}
            required={field.required}
            placeholder={field.placeholder || "Rechercher une icône..."}
          />
        );

      case "input":
      default:
        return (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={field.key} className="text-xs font-semibold text-foreground">
              {field.label}
              {field.required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
            {field.description && (
              <p className="text-[10px] text-muted-foreground">{field.description}</p>
            )}
            <Input
              id={field.key}
              value={value || ""}
              onChange={(e) => updateField(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="h-8 text-xs"
              required={field.required}
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-xs font-semibold text-foreground">{schema.title}</h3>
        {schema.description && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{schema.description}</p>
        )}
      </div>
      <div className="space-y-3">
        {schema.fields.map((field) => renderField(field))}
      </div>
    </div>
  );
}

