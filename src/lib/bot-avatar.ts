import { createAvatar } from '@dicebear/core';
import { bottts } from '@dicebear/collection';

/**
 * Génère un avatar SVG pour un bot en utilisant DiceBear
 * Utilise le style "bottts" qui est parfait pour les bots
 */
export function generateBotAvatar(seed: string, options?: {
  backgroundColor?: string[];
  radius?: number;
}): string {
  const avatar = createAvatar(bottts, {
    seed: seed,
    backgroundColor: options?.backgroundColor || ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
    radius: options?.radius || 50,
  });

  return avatar.toString();
}

/**
 * Génère un avatar SVG et le convertit en data URI
 */
export async function generateBotAvatarDataUri(seed: string, options?: {
  backgroundColor?: string[];
  radius?: number;
}): Promise<string> {
  const avatar = createAvatar(bottts, {
    seed: seed,
    backgroundColor: options?.backgroundColor || ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
    radius: options?.radius || 50,
  });

  return await avatar.toDataUri();
}

/**
 * Génère un avatar et retourne directement un data URI (synchrone via SVG)
 */
export function generateBotAvatarDataUriSync(seed: string, options?: {
  backgroundColor?: string[];
  radius?: number;
}): string {
  // Nettoyer les couleurs (enlever le # si présent)
  const cleanBackgroundColors = options?.backgroundColor?.map(color => 
    color.startsWith('#') ? color.slice(1) : color
  );
  
  const svg = generateBotAvatar(seed, {
    ...options,
    backgroundColor: cleanBackgroundColors || ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
  });
  // Convertir SVG en data URI
  const encodedSvg = encodeURIComponent(svg);
  return `data:image/svg+xml,${encodedSvg}`;
}

