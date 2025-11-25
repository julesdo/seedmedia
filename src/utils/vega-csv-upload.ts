/**
 * Fonction utilitaire pour uploader les fichiers CSV vers Convex storage
 * et remplacer les références localStorage par les URLs Convex
 */

import { Id } from 'convex/values';
import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';

export interface CsvFileInfo {
  id: string;
  name: string;
  data: any[];
  storageId?: Id<'_storage'>;
  url?: string;
}

/**
 * Upload un fichier CSV vers Convex storage
 */
export async function uploadCsvToConvex(
  csvFile: { id: string; name: string; data: any[] },
  generateUploadUrl: () => Promise<string>,
  getFileUrl: (args: { storageId: Id<'_storage'> }) => Promise<string | null>
): Promise<{ storageId: Id<'_storage'>; url: string }> {
  // Convertir les données CSV en fichier Blob
  const csvContent = convertDataToCSV(csvFile.data);
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const file = new File([blob], csvFile.name, { type: 'text/csv' });

  // 1. Générer l'URL d'upload
  const uploadUrl = await generateUploadUrl();

  // 2. Uploader le fichier vers Convex Storage
  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/csv',
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error("Échec de l'upload du fichier CSV");
  }

  // 3. Récupérer le storageId
  const { storageId } = await uploadResponse.json();
  if (!storageId) {
    throw new Error("Aucun storageId retourné");
  }

  // 4. Obtenir l'URL signée du fichier
  const fileUrl = await getFileUrl({ storageId: storageId as Id<'_storage'> });

  if (!fileUrl) {
    throw new Error("Impossible de récupérer l'URL du fichier CSV");
  }

  return { storageId: storageId as Id<'_storage'>, url: fileUrl };
}

/**
 * Convertit un tableau d'objets en format CSV
 */
function convertDataToCSV(data: any[]): string {
  if (data.length === 0) return '';

  // Obtenir les en-têtes depuis le premier objet
  const headers = Object.keys(data[0]);

  // Créer la ligne d'en-tête
  const headerLine = headers.map(h => escapeCSVValue(h)).join(',');

  // Créer les lignes de données
  const dataLines = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      return escapeCSVValue(value !== undefined && value !== null ? String(value) : '');
    }).join(',');
  });

  return [headerLine, ...dataLines].join('\n');
}

/**
 * Échappe une valeur CSV (ajoute des guillemets si nécessaire)
 */
function escapeCSVValue(value: string): string {
  // Si la valeur contient des virgules, des guillemets ou des retours à la ligne, l'entourer de guillemets
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    // Échapper les guillemets doubles
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Upload tous les fichiers CSV d'un bloc Vega vers Convex storage
 */
export async function uploadAllCsvFiles(
  csvFiles: CsvFileInfo[],
  generateUploadUrl: () => Promise<string>,
  getFileUrl: (args: { storageId: Id<'_storage'> }) => Promise<string | null>
): Promise<CsvFileInfo[]> {
  const uploadPromises = csvFiles.map(async (csvFile) => {
    // Si le fichier a déjà été uploadé, le retourner tel quel
    if (csvFile.storageId && csvFile.url) {
      return csvFile;
    }

    try {
      const { storageId, url } = await uploadCsvToConvex(
        csvFile,
        generateUploadUrl,
        getFileUrl
      );

      return {
        ...csvFile,
        storageId,
        url,
      };
    } catch (error) {
      console.error(`Erreur lors de l'upload du fichier CSV ${csvFile.name}:`, error);
      // Retourner le fichier original même en cas d'erreur
      return csvFile;
    }
  });

  return Promise.all(uploadPromises);
}

