import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";
// Avec localePrefix: 'never', on n'a pas besoin du middleware next-intl
// La locale est gérée uniquement via getRequestConfig dans i18n/request.ts
// import createMiddleware from 'next-intl/middleware';
// import { routing } from './i18n/routing';

// const intlMiddleware = createMiddleware(routing);

const signInRoutes = ["/sign-in", "/sign-up", "/verify-2fa", "/callback", "/oauth-callback"];

// Routes publiques accessibles même si connecté
// ✅ Toutes les routes sous (public) sont publiques
const publicRoutes = [
  "/", // Page d'accueil
  "/articles", 
  "/dossiers", 
  "/debats", 
  "/gouvernance", 
  "/actions", 
  "/projets",
  // Routes (public)
  "/profile",
  "/map",
  "/stats",
  "/trending",
  "/bots",
  "/notifications",
  "/saved",
  "/settings",
  "/rules",
  "/anticipations",
  "/search",
  "/u", // /u/[username]
];

// Just check cookie, recommended approach
export default async function proxy(request: NextRequest) {
  // Pas besoin du middleware next-intl avec localePrefix: 'never'
  // La locale est détectée côté serveur via getRequestConfig

  const sessionCookie = getSessionCookie(request);
  // Uncomment to fetch the session (not recommended)
  // const session = await getSession(request);

  const pathname = request.nextUrl.pathname;
  const isSignInRoute = signInRoutes.includes(pathname);
  
  // ✅ Vérifier si la route est publique
  // - Commence par une route publique
  // - OU c'est une route dynamique simple (format /slug) pour les décisions
  const isPublicRoute = publicRoutes.some(route => {
    if (route === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(route);
  }) || 
  // Routes dynamiques publiques : /[slug] pour les décisions (format /slug-simple)
  (pathname.split("/").filter(Boolean).length === 1 && // Une seule partie après /
   !pathname.startsWith("/api") && 
   !pathname.startsWith("/_next") && 
   !pathname.includes(".")); // Pas un fichier statique
  const addAccountParam = request.nextUrl.searchParams.get("add_account") === "true";
  const switchToAccountParam = request.nextUrl.searchParams.get("switch_to_account");
  const autoReconnectParam = request.nextUrl.searchParams.get("auto_reconnect") === "true";
  const isCallbackRoute = pathname === "/callback" || pathname === "/oauth-callback";

  // Routes publiques : toujours autoriser l'accès
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Permettre l'accès à sign-in et callbacks même si connecté si c'est pour ajouter un compte, switch de compte, ou auto_reconnect
  if ((isSignInRoute || isCallbackRoute) && (!sessionCookie || addAccountParam || switchToAccountParam || autoReconnectParam)) {
    return NextResponse.next();
  }

  // Routes protégées : nécessitent une authentification
  if (!isSignInRoute && !isCallbackRoute && !sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Rediriger vers la page d'accueil seulement si pas de paramètre add_account, switch_to_account, ou auto_reconnect (et pas callback)
  if (isSignInRoute && !addAccountParam && !switchToAccountParam && !autoReconnectParam && !isCallbackRoute) {
    return NextResponse.redirect(
      new URL("/", request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  // Run middleware on all routes except static assets and api routes
  matcher: ["/((?!.*\\..*|_next|api/auth).*)", "/", "/trpc(.*)"],
};
