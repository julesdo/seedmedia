import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Désactive la vérification TypeScript lors du build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Désactive la vérification ESLint lors du build
    ignoreDuringBuilds: true,
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