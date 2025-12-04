// Middleware désactivé temporairement pour éviter les conflits avec le routing
// La détection de locale se fait dans le layout via les cookies
export function middleware() {
  // Pas de middleware - toutes les routes passent directement
}

export const config = {
  // Ne matcher aucune route pour désactiver complètement le middleware
  matcher: []
};

