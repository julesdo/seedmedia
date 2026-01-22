/**
 * Yield Pattern pour décomposer les tâches longues et réduire le TBT
 * Utilisé pour éviter les blocages du thread principal > 50ms
 * 
 * @see https://web.dev/articles/optimize-long-tasks
 */

/**
 * Yield au thread principal après un certain nombre d'itérations
 * Utile pour les boucles longues qui pourraient bloquer le thread
 */
export async function* processInChunks<T>(
  items: T[],
  chunkSize: number = 50,
  processor: (item: T) => void
): AsyncGenerator<void, void, unknown> {
  for (let i = 0; i < items.length; i++) {
    processor(items[i]);
    
    // Yield toutes les chunkSize itérations pour éviter les tâches > 50ms
    if (i % chunkSize === 0 && i > 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
      yield;
    }
  }
}

/**
 * Décompose une tâche longue en petits chunks avec yield
 * Retourne une promesse qui se résout quand la tâche est terminée
 */
export async function processLongTask<T>(
  items: T[],
  processor: (item: T) => void,
  chunkSize: number = 50
): Promise<void> {
  for await (const _ of processInChunks(items, chunkSize, processor)) {
    // Le yield est géré automatiquement
  }
}

/**
 * Utilise requestIdleCallback si disponible, sinon setTimeout
 * Pour exécuter des tâches non critiques sans bloquer le thread
 */
export function scheduleIdleTask(callback: () => void, timeout: number = 5000): void {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 0);
  }
}

/**
 * Debounce avec yield pour éviter les tâches longues
 */
export function debounceWithYield<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      // Utiliser scheduleIdleTask pour exécuter dans un slot idle
      scheduleIdleTask(() => func(...args));
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

