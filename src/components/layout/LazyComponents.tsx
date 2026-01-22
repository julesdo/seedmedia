"use client";

import dynamic from 'next/dynamic';

// Lazy load les composants non critiques pour réduire le bundle initial
// Ces composants sont dans un composant client pour permettre ssr: false
const ServiceWorkerRegistration = dynamic(() => import('@/components/service-worker/ServiceWorkerRegistration').then(mod => ({ default: mod.ServiceWorkerRegistration })), {
  ssr: false,
});

const SeedsGainManager = dynamic(() => import("@/components/seeds/SeedsGainManager").then(mod => ({ default: mod.SeedsGainManager })), {
  ssr: false,
});

const InstallPrompt = dynamic(() => import('@/components/pwa/InstallPrompt').then(mod => ({ default: mod.InstallPrompt })), {
  ssr: false,
});

export function LazyComponents() {
  return (
    <>
      <ServiceWorkerRegistration />
      <SeedsGainManager />
      <InstallPrompt />
    </>
  );
}

