// IndexedDB storage for user preferences

const DB_NAME = 'DicomViewerDB';
const DB_VERSION = 1;
const PREFS_STORE = 'preferences';
const RECENT_FILES_STORE = 'recentFiles';

interface Preferences {
  showPhiData: boolean;
  showMetadataSidebar: boolean;
  defaultTool: string;
  invertColors: boolean;
}

interface RecentFile {
  id: string;
  name: string;
  path?: string;
  studyDescription?: string;
  modality?: string;
  timestamp: number;
}

const DEFAULT_PREFERENCES: Preferences = {
  showPhiData: false,
  showMetadataSidebar: true,
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

      // Create preferences store
      if (!db.objectStoreNames.contains(PREFS_STORE)) {
        db.createObjectStore(PREFS_STORE, { keyPath: 'key' });
      }

      // Create recent files store
      if (!db.objectStoreNames.contains(RECENT_FILES_STORE)) {
        const store = db.createObjectStore(RECENT_FILES_STORE, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });

  return dbPromise;
}

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
      id: `${file.name}-${Date.now()}`,
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
    
    const transaction = db.transaction([PREFS_STORE, RECENT_FILES_STORE], 'readwrite');
    
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore(PREFS_STORE).clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject();
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore(RECENT_FILES_STORE).clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject();
      }),
    ]);
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
