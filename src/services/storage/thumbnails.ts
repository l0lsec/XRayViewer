// Thumbnail caching service using IndexedDB

import { getDB, THUMBNAILS_STORE } from './preferences';

interface ThumbnailEntry {
  imageId: string;
  studyId?: string;
  dataUrl: string;
  width: number;
  height: number;
  timestamp: number;
}

// Generate a thumbnail from a canvas
export function generateThumbnail(
  canvas: HTMLCanvasElement,
  maxSize = 128
): string {
  const { width, height } = canvas;
  
  // Calculate thumbnail dimensions
  let thumbWidth = maxSize;
  let thumbHeight = maxSize;
  
  if (width > height) {
    thumbHeight = Math.round((height / width) * maxSize);
  } else {
    thumbWidth = Math.round((width / height) * maxSize);
  }

  // Create thumbnail canvas
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = thumbWidth;
  thumbCanvas.height = thumbHeight;
  
  const ctx = thumbCanvas.getContext('2d');
  if (!ctx) return '';

  // Draw scaled image
  ctx.drawImage(canvas, 0, 0, thumbWidth, thumbHeight);
  
  return thumbCanvas.toDataURL('image/jpeg', 0.7);
}

// Save a thumbnail
export async function saveThumbnail(
  imageId: string,
  dataUrl: string,
  width: number,
  height: number,
  studyId?: string
): Promise<void> {
  try {
    const db = await getDB();
    const transaction = db.transaction(THUMBNAILS_STORE, 'readwrite');
    const store = transaction.objectStore(THUMBNAILS_STORE);

    const entry: ThumbnailEntry = {
      imageId,
      studyId,
      dataUrl,
      width,
      height,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save thumbnail'));
    });
  } catch (error) {
    console.error('Failed to save thumbnail:', error);
  }
}

// Get a thumbnail
export async function getThumbnail(imageId: string): Promise<ThumbnailEntry | null> {
  try {
    const db = await getDB();
    const transaction = db.transaction(THUMBNAILS_STORE, 'readonly');
    const store = transaction.objectStore(THUMBNAILS_STORE);

    return new Promise((resolve) => {
      const request = store.get(imageId);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

// Get all thumbnails for a study
export async function getStudyThumbnails(studyId: string): Promise<ThumbnailEntry[]> {
  try {
    const db = await getDB();
    const transaction = db.transaction(THUMBNAILS_STORE, 'readonly');
    const store = transaction.objectStore(THUMBNAILS_STORE);
    const index = store.index('studyId');

    return new Promise((resolve) => {
      const request = index.getAll(studyId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

// Delete a thumbnail
export async function deleteThumbnail(imageId: string): Promise<void> {
  try {
    const db = await getDB();
    const transaction = db.transaction(THUMBNAILS_STORE, 'readwrite');
    const store = transaction.objectStore(THUMBNAILS_STORE);

    return new Promise((resolve, reject) => {
      const request = store.delete(imageId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete thumbnail'));
    });
  } catch (error) {
    console.error('Failed to delete thumbnail:', error);
  }
}

// Clear old thumbnails (older than specified days)
export async function clearOldThumbnails(daysOld = 30): Promise<void> {
  try {
    const db = await getDB();
    const transaction = db.transaction(THUMBNAILS_STORE, 'readwrite');
    const store = transaction.objectStore(THUMBNAILS_STORE);

    const cutoff = Date.now() - daysOld * 24 * 60 * 60 * 1000;

    return new Promise((resolve) => {
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        
        if (cursor) {
          if (cursor.value.timestamp < cutoff) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => {
        resolve();
      };
    });
  } catch (error) {
    console.error('Failed to clear old thumbnails:', error);
  }
}

// Clear all thumbnails
export async function clearAllThumbnails(): Promise<void> {
  try {
    const db = await getDB();
    const transaction = db.transaction(THUMBNAILS_STORE, 'readwrite');
    const store = transaction.objectStore(THUMBNAILS_STORE);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear thumbnails'));
    });
  } catch (error) {
    console.error('Failed to clear thumbnails:', error);
  }
}
