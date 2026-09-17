/* Zero-dependency resilient storage engine: IndexedDB mirroring, persistent storage API, rolling snapshots, and undo persistence. */
(function (root) {
  'use strict';

  const DB_NAME = 'kief-companion-v1';
  const DB_VERSION = 1;
  const SESSION_STORE = 'session';
  const SNAPSHOTS_STORE = 'snapshots';
  const MAX_SNAPSHOTS = 10;

  let dbPromise = null;

  function openDatabase() {
    if (dbPromise) return dbPromise;
    if (typeof indexedDB === 'undefined') {
      dbPromise = Promise.resolve(null);
      return dbPromise;
    }
    dbPromise = new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(SESSION_STORE)) {
            db.createObjectStore(SESSION_STORE, { keyPath: 'key' });
          }
          if (!db.objectStoreNames.contains(SNAPSHOTS_STORE)) {
            const store = db.createObjectStore(SNAPSHOTS_STORE, { keyPath: 'id', autoIncrement: true });
            store.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          console.warn('IndexedDB could not be opened; continuing with localStorage only.');
          resolve(null);
        };
      } catch (err) {
        console.warn('IndexedDB error on open:', err);
        resolve(null);
      }
    });
    return dbPromise;
  }

  async function saveMirror(state) {
    const db = await openDatabase();
    if (!db) return false;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(SESSION_STORE, 'readwrite');
        const store = tx.objectStore(SESSION_STORE);
        store.put({ key: 'current', state, updatedAt: new Date().toISOString() });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }

  async function loadMirror() {
    const db = await openDatabase();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(SESSION_STORE, 'readonly');
        const store = tx.objectStore(SESSION_STORE);
        const req = store.get('current');
        req.onsuccess = () => {
          if (req.result && req.result.state) resolve(req.result.state);
          else resolve(null);
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  async function saveUndo(undoState) {
    const db = await openDatabase();
    if (!db) return false;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(SESSION_STORE, 'readwrite');
        const store = tx.objectStore(SESSION_STORE);
        if (undoState) {
          store.put({ key: 'undo', state: undoState, updatedAt: new Date().toISOString() });
        } else {
          store.delete('undo');
        }
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }

  async function loadUndo() {
    const db = await openDatabase();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(SESSION_STORE, 'readonly');
        const store = tx.objectStore(SESSION_STORE);
        const req = store.get('undo');
        req.onsuccess = () => {
          if (req.result && req.result.state) resolve(req.result.state);
          else resolve(null);
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  async function addSnapshot(state, summary) {
    const db = await openDatabase();
    if (!db) return false;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(SNAPSHOTS_STORE, 'readwrite');
        const store = tx.objectStore(SNAPSHOTS_STORE);
        const entry = {
          timestamp: new Date().toISOString(),
          summary: summary || 'Tracker change',
          state
        };
        store.add(entry);

        // Limit total snapshots to MAX_SNAPSHOTS
        const getAllReq = store.getAll();
        getAllReq.onsuccess = () => {
          const list = getAllReq.result || [];
          if (list.length > MAX_SNAPSHOTS) {
            list.sort((a, b) => (a.id || 0) - (b.id || 0));
            const excess = list.slice(0, list.length - MAX_SNAPSHOTS);
            for (const item of excess) {
              if (item.id !== undefined) store.delete(item.id);
            }
          }
        };

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }

  async function getSnapshots() {
    const db = await openDatabase();
    if (!db) return [];
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(SNAPSHOTS_STORE, 'readonly');
        const store = tx.objectStore(SNAPSHOTS_STORE);
        const req = store.getAll();
        req.onsuccess = () => {
          const list = req.result || [];
          list.sort((a, b) => {
            if (a.timestamp !== b.timestamp) {
              return a.timestamp > b.timestamp ? -1 : 1;
            }
            return (b.id || 0) - (a.id || 0);
          });
          resolve(list);
        };
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  async function requestPersistence() {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      try {
        return await navigator.storage.persist();
      } catch {
        return false;
      }
    }
    return false;
  }

  async function isAvailable() {
    const db = await openDatabase();
    return Boolean(db);
  }

  function _resetDatabase() {
    dbPromise = null;
  }

  const api = {
    DB_NAME,
    MAX_SNAPSHOTS,
    openDatabase,
    _resetDatabase,
    isAvailable,
    saveMirror,
    loadMirror,
    saveUndo,
    loadUndo,
    addSnapshot,
    getSnapshots,
    requestPersistence
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KiefStorage = api;
})(globalThis);
