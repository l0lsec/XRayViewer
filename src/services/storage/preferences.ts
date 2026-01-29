// IndexedDB storage for user preferences and library

const DB_NAME = 'DicomViewerDB';
const DB_VERSION = 2; // Incremented for library stores
const PREFS_STORE = 'preferences';
const RECENT_FILES_STORE = 'recentFiles';
const STUDIES_STORE = 'studies';
const IMAGES_STORE = 'images';
const THUMBNAILS_STORE = 'thumbnails';

export interface Preferences {
  showPhiData: boolean;
  showMetadataSidebar: boolean;
  showThumbnailStrip: boolean;
  showLibraryPanel: boolean;
  defaultTool: string;
  invertColors: boolean;
}

export interface RecentFile {
  id: string;
  name: string;
  studyId?: string;
  studyDescription?: string;
  modality?: string;
  imageCount?: number;
  isInLibrary?: boolean;
  timestamp: number;
}

export interface StoredStudy {
  id: string;                    // StudyInstanceUID
  patientName?: string;          // For display (can be redacted)
  studyDate?: string;
  studyDescription?: string;
  modality?: string;
  imageCount: number;
  totalSize: number;             // bytes
  importedAt: number;            // timestamp
  lastViewedAt: number;
  thumbnailDataUrl?: string;     // First image thumbnail
}

export interface StoredImage {
  imageId: string;               // SOPInstanceUID
  studyId: string;
  seriesId: string;
  instanceNumber: number;
  dicomBytes: ArrayBuffer;       // The actual DICOM file data
  size: number;                  // bytes
}

const DEFAULT_PREFERENCES: Preferences = {
  showPhiData: false,
  showMetadataSidebar: true,
  showThumbnailStrip: true,
  showLibraryPanel: false,
  defaultTool: 'WindowLevel',
  invertColors: false,
};

let dbPromise: Promise<IDBDatabase> | null = null;

// Initialize database
function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open database'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;

      // Create preferences store (v1)
      if (!db.objectStoreNames.contains(PREFS_STORE)) {
        db.createObjectStore(PREFS_STORE, { keyPath: 'key' });
      }

      // Create recent files store (v1)
      if (!db.objectStoreNames.contains(RECENT_FILES_STORE)) {
        const store = db.createObjectStore(RECENT_FILES_STORE, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // New stores for v2 - Library
      if (oldVersion < 2) {
        // Studies store
        if (!db.objectStoreNames.contains(STUDIES_STORE)) {
          const studiesStore = db.createObjectStore(STUDIES_STORE, { keyPath: 'id' });
          studiesStore.createIndex('importedAt', 'importedAt', { unique: false });
          studiesStore.createIndex('lastViewedAt', 'lastViewedAt', { unique: false });
        }

        // Images store
        if (!db.objectStoreNames.contains(IMAGES_STORE)) {
          const imagesStore = db.createObjectStore(IMAGES_STORE, { keyPath: 'imageId' });
          imagesStore.createIndex('studyId', 'studyId', { unique: false });
          imagesStore.createIndex('seriesId', 'seriesId', { unique: false });
        }

        // Thumbnails store
        if (!db.objectStoreNames.contains(THUMBNAILS_STORE)) {
          const thumbStore = db.createObjectStore(THUMBNAILS_STORE, { keyPath: 'imageId' });
          thumbStore.createIndex('studyId', 'studyId', { unique: false });
        }
      }
    };
  });

  return dbPromise;
}

// Export getDB for use by other storage services
export { getDB, STUDIES_STORE, IMAGES_STORE, THUMBNAILS_STORE, RECENT_FILES_STORE };

// Get all preferences
export async function getPreferences(): Promise<Preferences> {
  try {
    const db = await getDB();
    const transaction = db.transaction(PREFS_STORE, 'readonly');
    const store = transaction.objectStore(PREFS_STORE);

    return new Promise((resolve) => {
      const request = store.get('userPreferences');
      
      request.onsuccess = () => {
        if (request.result) {
          resolve({ ...DEFAULT_PREFERENCES, ...request.result.value });
        } else {
          resolve(DEFAULT_PREFERENCES);
        }
      };

      request.onerror = () => {
        resolve(DEFAULT_PREFERENCES);
      };
    });
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

// Save preferences
export async function savePreferences(prefs: Partial<Preferences>): Promise<void> {
  try {
    const db = await getDB();
    const transaction = db.transaction(PREFS_STORE, 'readwrite');
    const store = transaction.objectStore(PREFS_STORE);

    const current = await getPreferences();
    const updated = { ...current, ...prefs };

    return new Promise((resolve, reject) => {
      const request = store.put({ key: 'userPreferences', value: updated });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save preferences'));
    });
  } catch (error) {
    console.error('Failed to save preferences:', error);
  }
}

// Get a single preference
export async function getPreference<K extends keyof Preferences>(
  key: K
): Promise<Preferences[K]> {
  const prefs = await getPreferences();
  return prefs[key];
}

// Set a single preference
export async function setPreference<K extends keyof Preferences>(
  key: K,
  value: Preferences[K]
): Promise<void> {
  await savePreferences({ [key]: value });
}

// Add a recent file
export async function addRecentFile(file: Omit<RecentFile, 'id' | 'timestamp'>): Promise<void> {
  try {
    const db = await getDB();
    const transaction = db.transaction(RECENT_FILES_STORE, 'readwrite');
    const store = transaction.objectStore(RECENT_FILES_STORE);

    const recentFile: RecentFile = {
      ...file,
      id: file.studyId || `${file.name}-${Date.now()}`,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const request = store.put(recentFile);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to add recent file'));
    });
  } catch (error) {
    console.error('Failed to add recent file:', error);
  }
}

// Get recent files (most recent first, limited)
export async function getRecentFiles(limit = 10): Promise<RecentFile[]> {
  try {
    const db = await getDB();
    const transaction = db.transaction(RECENT_FILES_STORE, 'readonly');
    const store = transaction.objectStore(RECENT_FILES_STORE);
    const index = store.index('timestamp');

    return new Promise((resolve) => {
      const files: RecentFile[] = [];
      const request = index.openCursor(null, 'prev');

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        
        if (cursor && files.length < limit) {
          files.push(cursor.value);
          cursor.continue();
        } else {
          resolve(files);
        }
      };

      request.onerror = () => {
        resolve([]);
      };
    });
  } catch {
    return [];
  }
}

// Clear recent files
export async function clearRecentFiles(): Promise<void> {
  try {
    const db = await getDB();
    const transaction = db.transaction(RECENT_FILES_STORE, 'readwrite');
    const store = transaction.objectStore(RECENT_FILES_STORE);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear recent files'));
    });
  } catch (error) {
    console.error('Failed to clear recent files:', error);
  }
}

// Clear all storage
export async function clearAllStorage(): Promise<void> {
  try {
    const db = await getDB();
    
    const storeNames = [PREFS_STORE, RECENT_FILES_STORE, STUDIES_STORE, IMAGES_STORE, THUMBNAILS_STORE];
    const transaction = db.transaction(storeNames, 'readwrite');
    
    await Promise.all(
      storeNames.map(storeName => 
        new Promise<void>((resolve, reject) => {
          const request = transaction.objectStore(storeName).clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject();
        })
      )
    );
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
}

// Check if IndexedDB is available
export function isStorageAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined';
  } catch {
    return false;
  }
}

// Get storage usage estimate
export async function getStorageUsage(): Promise<{ used: number; quota: number } | null> {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}
