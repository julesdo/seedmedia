"use client";

import { usePathname } from "next/navigation";
import { Link } from "next-view-transitions";
import { cn } from "@/lib/utils";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface BreadcrumbItem {
  label: string;
  href: string;
  isLoading?: boolean;
}

// Mapping des routes vers des labels lisibles
const routeLabels: Record<string, string> = {
  "/": "Accueil",
  "/discover": "Découvrir",
  "/articles": "Articles",
  "/projets": "Projets",
  "/actions": "Actions",
  "/gouvernance": "Gouvernance",
  "/debats": "Débats",
  "/dossiers": "Dossiers",
  "/portfolio": "Portefeuille",
  "/projects": "Projets",
  "/organizations": "Organisations",
  "/jobs": "Jobs",
  "/campaigns": "Campagnes",
  "/statistics": "Statistiques",
  "/badges": "Badges",
  "/settings": "Paramètres",
  "/help": "Aide",
  "/create": "Création rapide",
  "/community": "Community",
  "/hashtags": "Hashtags",
};

// Détecte si un segment est un ID Convex (commence par une lettre et contient des caractères alphanumériques)
function isConvexId(str: string): boolean {
  // Les IDs Convex commencent par une lettre et contiennent des caractères alphanumériques
  return /^[a-z][a-z0-9]{15,}$/i.test(str);
}

export function Breadcrumb() {
  const pathname = usePathname();

  // Ne pas afficher si pathname n'est pas encore défini
  if (!pathname) {
    return null;
  }

  // Générer les breadcrumbs à partir du pathname
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ label: "Accueil", href: "/" }];

    let currentPath = "";
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      
      // Vérifier si c'est un ID Convex
      if (isConvexId(path)) {
        const previousPath = paths[index - 1];
        
        // Déterminer le type d'entité basé sur le segment précédent
        if (previousPath === "organizations") {
          breadcrumbs.push({ 
            label: path, // Sera remplacé par le nom réel via useQuery
            href: currentPath,
            isLoading: true 
          });
        } else if (previousPath === "articles") {
          breadcrumbs.push({ 
            label: path,
            href: currentPath,
            isLoading: true 
          });
        } else if (previousPath === "projects") {
          breadcrumbs.push({ 
            label: path,
            href: currentPath,
            isLoading: true 
          });
        } else if (previousPath === "hashtags") {
          // Pour les hashtags, décoder le tag
          const decodedTag = decodeURIComponent(path);
          breadcrumbs.push({ 
            label: `#${decodedTag}`,
            href: currentPath
          });
        } else {
          // Autre type d'ID, utiliser le format par défaut
          breadcrumbs.push({ 
            label: path,
            href: currentPath 
          });
        }
      } else if (routeLabels[currentPath]) {
        // Route connue
        breadcrumbs.push({ label: routeLabels[currentPath], href: currentPath });
      } else {
        // Segment normal, capitaliser la première lettre
        const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");
        breadcrumbs.push({ label, href: currentPath });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Récupérer les noms réels pour les IDs
  const paths = pathname.split("/").filter(Boolean);
  
  // Trouver les IDs par type d'entité
  const orgIndex = paths.findIndex((p, i) => i > 0 && paths[i - 1] === "organizations" && isConvexId(p));
  const articleIndex = paths.findIndex((p, i) => i > 0 && paths[i - 1] === "articles" && isConvexId(p));
  const projectIndex = paths.findIndex((p, i) => i > 0 && paths[i - 1] === "projects" && isConvexId(p));
  const actionIndex = paths.findIndex((p, i) => i > 0 && paths[i - 1] === "actions" && isConvexId(p));
  const userIndex = paths.findIndex((p, i) => i > 0 && paths[i - 1] === "users" && isConvexId(p));
  
  const organizationId = orgIndex >= 0 ? (paths[orgIndex] as Id<"organizations">) : null;
  const articleId = articleIndex >= 0 ? (paths[articleIndex] as Id<"articles">) : null;
  const projectId = projectIndex >= 0 ? (paths[projectIndex] as Id<"projects">) : null;
  const actionId = actionIndex >= 0 ? (paths[actionIndex] as Id<"actions">) : null;
  const userId = userIndex >= 0 ? (paths[userIndex] as Id<"users">) : null;
  
  // Requêtes spécifiques pour chaque type d'entité
  const organization = useQuery(
    api.organizations.getOrganizationName,
    organizationId ? { organizationId } : "skip"
  );
  
  const article = useQuery(
    api.content.getArticleName,
    articleId ? { articleId } : "skip"
  );
  
  const project = useQuery(
    api.content.getProjectName,
    projectId ? { projectId } : "skip"
  );
  
  const action = useQuery(
    api.content.getActionName,
    actionId ? { actionId } : "skip"
  );
  
  const user = useQuery(
    api.users.getUserName,
    userId ? { userId } : "skip"
  );

  // Mettre à jour les labels avec les noms réels
  const enrichedBreadcrumbs = breadcrumbs.map((item, index) => {
    if (item.isLoading) {
      // Vérifier si cet item correspond à l'ID d'organisation en comparant l'href
      if (organizationId && organization) {
        const expectedHref = `/discover/organizations/${organizationId}`;
        if (item.href === expectedHref) {
          return { ...item, label: organization.name, isLoading: false };
        }
      }
      // Article
      if (articleId && article) {
        const expectedHref = `/articles/${articleId}`;
        if (item.href === expectedHref) {
          return { ...item, label: article.name, isLoading: false };
        }
      }
      // Projet
      if (projectId && project) {
        const expectedHref = `/projects/${projectId}`;
        if (item.href === expectedHref) {
          return { ...item, label: project.name, isLoading: false };
        }
      }
      // Action
      if (actionId && action) {
        const expectedHref = `/actions/${actionId}`;
        if (item.href === expectedHref) {
          return { ...item, label: action.name, isLoading: false };
        }
      }
      // Utilisateur
      if (userId && user) {
        const expectedHref = `/users/${userId}`;
        if (item.href === expectedHref) {
          return { ...item, label: user.name, isLoading: false };
        }
      }
    }
    // Gérer aussi le cas "settings" après l'ID d'organisation
    if (paths[index] === "settings" && organizationId && organization) {
      return { ...item, label: "Paramètres" };
    }
    return item;
  });

  // Toujours afficher le breadcrumb, même s'il n'y a qu'un seul élément (page d'accueil)

  return (
    <nav className="flex items-center gap-2 text-sm min-w-0" aria-label="Breadcrumb">
      <div className="flex items-center gap-2 min-w-0 overflow-hidden">
        {enrichedBreadcrumbs.map((item, index) => {
          const isLast = index === enrichedBreadcrumbs.length - 1;
          return (
            <div key={item.href} className="flex items-center gap-2 min-w-0 shrink-0">
              {index > 0 && (
                <SolarIcon 
                  icon="alt-arrow-right-bold" 
                  className="h-3.5 w-3.5 icon-gradient-light opacity-50 shrink-0" 
                />
              )}
              {isLast ? (
                <span className="font-semibold text-gradient-light truncate min-w-0 max-w-[180px]">
                  {item.isLoading ? "..." : item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "text-gradient-light opacity-70 hover:opacity-100 transition-opacity truncate max-w-[120px]",
                    index === 0 && "font-medium"
                  )}
                >
                  {item.isLoading ? "..." : item.label}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

