import { Suspense } from "react";
import { CategoryFormClient } from "../CategoryFormClient";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<CategoryFormSkeleton />}>
      <EditCategoryWrapper params={params} />
    </Suspense>
  );
}

async function EditCategoryWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CategoryFormClient categoryId={id} />;
}

function CategoryFormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

