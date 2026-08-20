/**
 * IndexedDB storage service to persist the user's active session and channel list across page refreshes.
 */

const DB_NAME = 'ChannelEditorSessionDB';
const STORE_NAME = 'active_session';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported in this environment.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface CachedSession {
  filename: string;
  buffer: ArrayBuffer;
  savedAt: number;
}

export class StorageService {
  /**
   * Save the current active channel list ZIP buffer into IndexedDB
   */
  static async saveSession(buffer: ArrayBuffer, filename: string): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const data: CachedSession = {
          filename,
          buffer,
          savedAt: Date.now(),
        };
        const req = store.put(data, 'current_file');
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[StorageService] Could not persist session to IndexedDB:', e);
    }
  }

  /**
   * Load the active channel list session from IndexedDB on startup/refresh
   */
  static async loadSession(): Promise<CachedSession | null> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get('current_file');
        req.onsuccess = () => {
          if (req.result && req.result.buffer) {
            resolve(req.result as CachedSession);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[StorageService] Could not load session from IndexedDB:', e);
      return null;
    }
  }

  /**
   * Clear the active session (e.g. when user clicks home/close)
   */
  static async clearSession(): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete('current_file');
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[StorageService] Could not clear session:', e);
    }
  }
}
