// DICOM Library Storage Service
// Handles persistent storage of DICOM files in IndexedDB

import { 
  getDB, 
  STUDIES_STORE, 
  IMAGES_STORE,
  addRecentFile,
  getStorageUsage,
} from './preferences';
import type { StoredStudy, StoredImage } from './preferences';

// Re-export types for use by components
export type { StoredStudy, StoredImage };
import { metaData } from '@cornerstonejs/core';
import * as cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';

// Save a study to the library
export async function saveStudyToLibrary(
  files: File[],
  studyMetadata: {
    studyInstanceUid: string;
    patientName?: string;
    studyDate?: string;
    studyDescription?: string;
    modality?: string;
  },
  onProgress?: (current: number, total: number) => void
): Promise<StoredStudy> {
  const db = await getDB();
  
  let totalSize = 0;
  const storedImages: StoredImage[] = [];

  // Process each file
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const arrayBuffer = await file.arrayBuffer();
    totalSize += arrayBuffer.byteLength;

    // Get image metadata by temporarily loading
    const tempImageId = cornerstoneDICOMImageLoader.wadouri.fileManager.add(file);
    
    let seriesId = 'unknown-series';
    let instanceNumber = i;
    let imageId = `${studyMetadata.studyInstanceUid}-${i}`;

    try {
      // Try to get series info from metadata
      const generalSeriesModule = metaData.get('generalSeriesModule', tempImageId);
      const generalImageModule = metaData.get('generalImageModule', tempImageId);
      const sopCommonModule = metaData.get('sopCommonModule', tempImageId);
      
      if (generalSeriesModule?.seriesInstanceUID) {
        seriesId = generalSeriesModule.seriesInstanceUID;
      }
      if (generalImageModule?.instanceNumber) {
        instanceNumber = generalImageModule.instanceNumber;
      }
      if (sopCommonModule?.sopInstanceUID) {
        imageId = sopCommonModule.sopInstanceUID;
      }
    } catch {
      // Use defaults if metadata extraction fails
    }

    storedImages.push({
      imageId,
      studyId: studyMetadata.studyInstanceUid,
      seriesId,
      instanceNumber,
      dicomBytes: arrayBuffer,
      size: arrayBuffer.byteLength,
    });

    onProgress?.(i + 1, files.length);
  }

  // Sort images by instance number
  storedImages.sort((a, b) => a.instanceNumber - b.instanceNumber);

  // Create study record
  const study: StoredStudy = {
    id: studyMetadata.studyInstanceUid,
    patientName: studyMetadata.patientName,
    studyDate: studyMetadata.studyDate,
    studyDescription: studyMetadata.studyDescription,
    modality: studyMetadata.modality,
    imageCount: files.length,
    totalSize,
    importedAt: Date.now(),
    lastViewedAt: Date.now(),
  };

  // Store in IndexedDB
  const transaction = db.transaction([STUDIES_STORE, IMAGES_STORE], 'readwrite');
  const studiesStore = transaction.objectStore(STUDIES_STORE);
  const imagesStore = transaction.objectStore(IMAGES_STORE);

  // Save study
  await new Promise<void>((resolve, reject) => {
    const request = studiesStore.put(study);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to save study'));
  });

  // Save images
  for (const image of storedImages) {
    await new Promise<void>((resolve, reject) => {
      const request = imagesStore.put(image);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save image'));
    });
  }

  // Add to recent files
  await addRecentFile({
    name: studyMetadata.studyDescription || 'Unknown Study',
    studyId: studyMetadata.studyInstanceUid,
    studyDescription: studyMetadata.studyDescription,
    modality: studyMetadata.modality,
    imageCount: files.length,
    isInLibrary: true,
  });

  return study;
}

// Load a study from the library
export async function loadStudyFromLibrary(studyId: string): Promise<{
  study: StoredStudy;
  imageIds: string[];
} | null> {
  const db = await getDB();
  
  // Get study
  const study = await new Promise<StoredStudy | null>((resolve) => {
    const transaction = db.transaction(STUDIES_STORE, 'readonly');
    const store = transaction.objectStore(STUDIES_STORE);
    const request = store.get(studyId);
    
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => resolve(null);
  });

  if (!study) return null;

  // Get images for this study
  const images = await new Promise<StoredImage[]>((resolve) => {
    const transaction = db.transaction(IMAGES_STORE, 'readonly');
    const store = transaction.objectStore(IMAGES_STORE);
    const index = store.index('studyId');
    const request = index.getAll(studyId);
    
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });

  // Sort by instance number
  images.sort((a, b) => a.instanceNumber - b.instanceNumber);

  // Create blob URLs and register with cornerstone
  const imageIds: string[] = [];
  for (const image of images) {
    const blob = new Blob([image.dicomBytes], { type: 'application/dicom' });
    const file = new File([blob], `${image.imageId}.dcm`, { type: 'application/dicom' });
    const imageId = cornerstoneDICOMImageLoader.wadouri.fileManager.add(file);
    imageIds.push(imageId);
  }

  // Update last viewed timestamp
  await updateStudyLastViewed(studyId);

  return { study, imageIds };
}

// Update study's last viewed timestamp
async function updateStudyLastViewed(studyId: string): Promise<void> {
  try {
    const db = await getDB();
    const transaction = db.transaction(STUDIES_STORE, 'readwrite');
    const store = transaction.objectStore(STUDIES_STORE);
    
    const study = await new Promise<StoredStudy | null>((resolve) => {
      const request = store.get(studyId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });

    if (study) {
      study.lastViewedAt = Date.now();
      await new Promise<void>((resolve) => {
        const request = store.put(study);
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      });
    }
  } catch {
    // Ignore errors for non-critical update
  }
}

// Delete a study from the library
export async function deleteStudyFromLibrary(studyId: string): Promise<void> {
  const db = await getDB();
  const transaction = db.transaction([STUDIES_STORE, IMAGES_STORE], 'readwrite');
  
  // Delete study
  const studiesStore = transaction.objectStore(STUDIES_STORE);
  await new Promise<void>((resolve, reject) => {
    const request = studiesStore.delete(studyId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to delete study'));
  });

  // Delete all images for this study
  const imagesStore = transaction.objectStore(IMAGES_STORE);
  const index = imagesStore.index('studyId');
  
  const imageKeys = await new Promise<IDBValidKey[]>((resolve) => {
    const keys: IDBValidKey[] = [];
    const request = index.openKeyCursor(IDBKeyRange.only(studyId));
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursor>).result;
      if (cursor) {
        keys.push(cursor.primaryKey);
        cursor.continue();
      } else {
        resolve(keys);
      }
    };
    request.onerror = () => resolve([]);
  });

  for (const key of imageKeys) {
    await new Promise<void>((resolve) => {
      const request = imagesStore.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }
}

// Get all studies in the library
export async function getLibraryStudies(): Promise<StoredStudy[]> {
  try {
    const db = await getDB();
    const transaction = db.transaction(STUDIES_STORE, 'readonly');
    const store = transaction.objectStore(STUDIES_STORE);
    const index = store.index('lastViewedAt');

    return new Promise((resolve) => {
      const studies: StoredStudy[] = [];
      const request = index.openCursor(null, 'prev'); // Most recent first

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          studies.push(cursor.value);
          cursor.continue();
        } else {
          resolve(studies);
        }
      };

      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

// Get library statistics
export async function getLibraryStats(): Promise<{
  studyCount: number;
  totalImages: number;
  totalSize: number;
  storageUsed: number;
  storageQuota: number;
}> {
  const studies = await getLibraryStudies();
  const storageEstimate = await getStorageUsage();

  return {
    studyCount: studies.length,
    totalImages: studies.reduce((sum, s) => sum + s.imageCount, 0),
    totalSize: studies.reduce((sum, s) => sum + s.totalSize, 0),
    storageUsed: storageEstimate?.used || 0,
    storageQuota: storageEstimate?.quota || 0,
  };
}

// Check if a study exists in the library
export async function isStudyInLibrary(studyId: string): Promise<boolean> {
  try {
    const db = await getDB();
    const transaction = db.transaction(STUDIES_STORE, 'readonly');
    const store = transaction.objectStore(STUDIES_STORE);

    return new Promise((resolve) => {
      const request = store.count(studyId);
      request.onsuccess = () => resolve(request.result > 0);
      request.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

// Update study thumbnail
export async function updateStudyThumbnail(studyId: string, thumbnailDataUrl: string): Promise<void> {
  try {
    const db = await getDB();
    const transaction = db.transaction(STUDIES_STORE, 'readwrite');
    const store = transaction.objectStore(STUDIES_STORE);
    
    const study = await new Promise<StoredStudy | null>((resolve) => {
      const request = store.get(studyId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });

    if (study) {
      study.thumbnailDataUrl = thumbnailDataUrl;
      await new Promise<void>((resolve) => {
        const request = store.put(study);
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      });
    }
  } catch {
    // Ignore errors
  }
}

// Clear entire library
export async function clearLibrary(): Promise<void> {
  const db = await getDB();
  const transaction = db.transaction([STUDIES_STORE, IMAGES_STORE], 'readwrite');
  
  await Promise.all([
    new Promise<void>((resolve, reject) => {
      const request = transaction.objectStore(STUDIES_STORE).clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject();
    }),
    new Promise<void>((resolve, reject) => {
      const request = transaction.objectStore(IMAGES_STORE).clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject();
    }),
  ]);
}

// Format bytes for display
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
