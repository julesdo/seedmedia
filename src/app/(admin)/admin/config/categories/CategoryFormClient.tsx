"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CategoryForm } from "./CategoryForm";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

interface CategoryFormClientProps {
  categoryId?: string;
}

export function CategoryFormClient({ categoryId }: CategoryFormClientProps) {
  const router = useRouter();
  const category = useQuery(
    api.admin.getAllCategoriesForDecisions,
    categoryId ? {} : undefined
  );

  const categoryData = categoryId
    ? category?.find((c) => c._id === (categoryId as Id<"categories">))
    : undefined;

  if (categoryId && category === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">
          {categoryId ? "Modifier la catégorie" : "Créer une catégorie"}
        </h2>
        <p className="text-muted-foreground">
          {categoryId
            ? "Modifiez les informations de la catégorie"
            : "Remplissez le formulaire pour créer une nouvelle catégorie"}
        </p>
      </div>

      <CategoryForm
        categoryId={categoryId as Id<"categories"> | undefined}
        initialData={categoryData}
        onSuccess={() => {
          router.push("/admin/config/categories");
        }}
        onCancel={() => {
          router.push("/admin/config/categories");
        }}
      />
    </div>
  );
}

