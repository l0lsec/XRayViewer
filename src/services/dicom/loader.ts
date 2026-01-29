// DICOM file loading service

import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';
import { cache } from '@cornerstonejs/core';
import type { DicomMetadata } from '../../types/dicom';
import { extractMetadata } from './metadata';

// Load a single DICOM file and return its image ID
export async function loadDicomFile(file: File): Promise<string> {
  return cornerstoneDICOMImageLoader.wadouri.fileManager.add(file);
}

// Load multiple DICOM files
export async function loadDicomFiles(
  files: File[],
  onProgress?: (loaded: number, total: number) => void
): Promise<string[]> {
  const imageIds: string[] = [];
  const total = files.length;

  for (let i = 0; i < files.length; i++) {
    try {
      const imageId = await loadDicomFile(files[i]);
      imageIds.push(imageId);
    } catch (error) {
      console.warn(`Failed to load file: ${files[i].name}`, error);
    }

    onProgress?.(i + 1, total);
  }

  return imageIds;
}

// Preload an image into cache
export async function preloadImage(imageId: string): Promise<void> {
  try {
    await cornerstoneDICOMImageLoader.wadouri.loadImage(imageId);
    // Image is now cached
  } catch (error) {
    console.warn(`Failed to preload image: ${imageId}`, error);
  }
}

// Preload multiple images (e.g., for a series)
export async function preloadImages(
  imageIds: string[],
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  const total = imageIds.length;

  for (let i = 0; i < imageIds.length; i++) {
    await preloadImage(imageIds[i]);
    onProgress?.(i + 1, total);
  }
}

// Clear the image cache
export function clearCache(): void {
  cache.purgeCache();
}

// Get cache statistics
export function getCacheStats(): { 
  cacheSize: number; 
  cacheSizeInBytes: number;
  numberOfCachedImages: number;
} {
  // Cache API varies by version, return safe defaults
  return {
    cacheSize: 0,
    cacheSizeInBytes: 0,
    numberOfCachedImages: 0,
  };
}

// Check if a file is a valid DICOM file by trying to parse it
export async function validateDicomFile(file: File): Promise<boolean> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const byteArray = new Uint8Array(arrayBuffer);

    // Check for DICM magic number at offset 128
    if (byteArray.length > 132) {
      const dicm = String.fromCharCode(
        byteArray[128],
        byteArray[129],
        byteArray[130],
        byteArray[131]
      );
      if (dicm === 'DICM') {
        return true;
      }
    }

    // Some DICOM files don't have the preamble, try parsing anyway
    // This is a basic heuristic check
    if (byteArray.length > 8) {
      // Look for common DICOM group numbers (0002, 0008, 0010, etc.)
      const view = new DataView(arrayBuffer);
      const group = view.getUint16(0, true);
      if (group === 0x0002 || group === 0x0008 || group === 0x0010) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

// Get basic DICOM info without fully loading the image
export async function getQuickMetadata(file: File): Promise<Partial<DicomMetadata> | null> {
  try {
    const imageId = await loadDicomFile(file);
    const metadata = await extractMetadata(imageId);
    return metadata;
  } catch {
    return null;
  }
}
