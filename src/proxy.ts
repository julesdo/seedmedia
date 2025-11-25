/* eslint-disable @typescript-eslint/no-unused-vars */
import { getSessionCookie } from "better-auth/cookies";
import { createAuth } from "./lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { betterFetch } from "@better-fetch/fetch";

type Session = ReturnType<typeof createAuth>["$Infer"]["Session"];
const getSession = async (request: NextRequest) => {
  const { data: session } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get("cookie") ?? "",
        origin: request.nextUrl.origin,
      },
    },
  );
  return session;
};

const signInRoutes = ["/sign-in", "/sign-up", "/verify-2fa", "/callback", "/oauth-callback"];

// Routes publiques accessibles même si connecté
const publicRoutes = ["/articles", "/dossiers", "/debats", "/gouvernance"];

// Just check cookie, recommended approach
export default async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  // Uncomment to fetch the session (not recommended)
  // const session = await getSession(request);

  const pathname = request.nextUrl.pathname;
  const isSignInRoute = signInRoutes.includes(pathname);
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route)) || pathname === "/";
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

  // Rediriger vers studio seulement si pas de paramètre add_account, switch_to_account, ou auto_reconnect (et pas callback)
  if (isSignInRoute && !addAccountParam && !switchToAccountParam && !autoReconnectParam && !isCallbackRoute) {
    return NextResponse.redirect(
      new URL("/studio", request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  // Run middleware on all routes except static assets and api routes
  matcher: ["/((?!.*\\..*|_next|api/auth).*)", "/", "/trpc(.*)"],
};
