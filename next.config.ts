import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Désactive la vérification TypeScript lors du build
    ignoreBuildErrors: true,
  },
  // eslint config déplacé - utiliser next lint à la place
  // Optimisations de performance
  compress: true,
  // Conserver les console.log en production pour le debugging
  // IMPORTANT: removeConsole doit être false ou omis pour garder les logs
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? false : undefined,
    // React Compiler - Optimise automatiquement useMemo/useCallback
    // Note: Nécessite babel-plugin-react-compiler si utilisé en mode strict
    // Pour Next.js 16, le compiler est intégré mais peut nécessiter une config supplémentaire
  },
  // Optimisations de production
  productionBrowserSourceMaps: false, // Désactiver les source maps en production pour réduire la taille
  poweredByHeader: false, // Retirer le header X-Powered-By
  // NOTE: cacheComponents désactivé car incompatible avec revalidate/dynamic/runtime
  // Pour activer PPR, il faudrait retirer toutes ces configs de toutes les pages
  // Ce qui n'est pas faisable pour certaines pages (docs, bots, etc.)
  // Les pages principales (homepage, [slug]) n'utilisent plus revalidate/dynamic
  // et bénéficient déjà des optimisations de streaming et cache
  experimental: {
    // Partial Prerendering (PPR) - Désactivé car incompatible avec revalidate/dynamic/runtime
    // cacheComponents: true, // Nécessite de retirer revalidate/dynamic/runtime de TOUTES les pages
    // Optimiser les imports de packages volumineux
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      '@iconify/react',
      '@iconify-json/solar',
      'echarts',
      'echarts-for-react',
      'framer-motion',
      'motion',
      'recharts',
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-avatar',
      '@radix-ui/react-scroll-area',
    ],
    // Optimisations de mémoire pour réduire la consommation
    webpackMemoryOptimizations: true,
    // Optimiser les builds
    optimizeCss: true,
    // Optimiser les imports de modules
    optimizeServerReact: true,
  },
  // Optimisations de bundle
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Code splitting plus agressif
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Bundle séparé pour les vendors lourds
            echarts: {
              name: 'echarts',
              test: /[\\/]node_modules[\\/](echarts|echarts-for-react)[\\/]/,
              priority: 30,
              reuseExistingChunk: true,
            },
            framerMotion: {
              name: 'framer-motion',
              test: /[\\/]node_modules[\\/](framer-motion|motion)[\\/]/,
              priority: 30,
              reuseExistingChunk: true,
            },
            recharts: {
              name: 'recharts',
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              priority: 30,
              reuseExistingChunk: true,
            },
            // Bundle pour les composants UI
            ui: {
              name: 'ui',
              test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
              priority: 20,
              reuseExistingChunk: true,
            },
            // Bundle pour les composants de décisions
            decisions: {
              name: 'decisions',
              test: /[\\/]src[\\/]components[\\/]decisions[\\/]/,
              priority: 20,
              reuseExistingChunk: true,
            },
            // Bundle commun pour les autres vendors
            vendor: {
              name: 'vendor',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },
  images: {
    dangerouslyAllowSVG: true, // This allows SVG usage
    remotePatterns: [
      {
        protocol: "https", // Or 'http' if that's what your URLs use
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**", // Allows any path under this hostname
      },
      {
        protocol: "https", // Or 'http' if that's what your URLs use
        hostname: "utfs.io",
        port: "",
        pathname: "/a/uy24lm300a/**", // Allows any path under this hostname
      },
      {
        protocol: "https", // Or 'http' if that's what your URLs use
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "/**", // Allows any path under this hostname
      },
      {
        protocol: "https", // Or 'http' if that's what your URLs use
        hostname: "rightful-monitor-255.convex.cloud",
        port: "",
        pathname: "/**", // Allows any path under this hostname
      },
      {
        protocol: "https", // Production Convex
        hostname: "judicious-mandrill-471.convex.cloud",
        port: "",
        pathname: "/**", // Allows any path under this hostname
      },
      {
        protocol: "https", // Or 'http' if that's what your URLs use
        hostname: "images.pexels.com",
        port: "",
        pathname: "/**", // Allows any path under this hostname
      },
      // You can add other hostnames here if needed
      // Example:
      // {
      //   protocol: 'https',
      //   hostname: 'another-image-provider.com',
      //   port: '',
      //   pathname: '/**',
      // },
    ],
  },
};

export default withNextIntl(nextConfig);