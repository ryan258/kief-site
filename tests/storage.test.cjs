const test = require('node:test');
const assert = require('node:assert/strict');
const storage = require('../assets/storage.js');

test('storage fallback: handles environments without indexedDB gracefully', async () => {
  storage._resetDatabase();
  assert.equal(await storage.isAvailable(), false);
  assert.equal(await storage.saveMirror({ hp: 47 }), false);
  assert.equal(await storage.loadMirror(), null);
  assert.equal(await storage.saveUndo({ hp: 47 }), false);
  assert.equal(await storage.loadUndo(), null);
  assert.equal(await storage.addSnapshot({ hp: 47 }, 'test'), false);
  assert.deepEqual(await storage.getSnapshots(), []);
  assert.equal(await storage.requestPersistence(), false);
});

test('storage with mock IndexedDB: mirrors session, manages undo, and caps snapshots at 10', async () => {
  const stores = {
    session: new Map(),
    snapshots: new Map()
  };
  let idCounter = 1;

  const mockDb = {
    objectStoreNames: { contains: () => true },
    transaction: (storeName) => {
      const store = stores[storeName];
      return {
        objectStore: () => ({
          put: (val) => {
            store.set(val.key, val);
          },
          get: (key) => {
            const req = { result: store.get(key) };
            setImmediate(() => { if (req.onsuccess) req.onsuccess(); });
            return req;
          },
          delete: (key) => {
            store.delete(key);
          },
          add: (val) => {
            const id = idCounter++;
            store.set(id, { ...val, id });
          },
          getAll: () => {
            const req = { result: [...store.values()] };
            setImmediate(() => { if (req.onsuccess) req.onsuccess(); });
            return req;
          }
        }),
        set oncomplete(fn) { setImmediate(fn); },
        set onerror(fn) {}
      };
    }
  };

  globalThis.indexedDB = {
    open: () => {
      const req = { result: mockDb };
      setImmediate(() => { if (req.onsuccess) req.onsuccess(); });
      return req;
    }
  };
  storage._resetDatabase();

  try {
    assert.equal(await storage.isAvailable(), true);

    // Test mirroring
    assert.equal(await storage.saveMirror({ hp: 42, sp: 5 }), true);
    const loaded = await storage.loadMirror();
    assert.deepEqual(loaded, { hp: 42, sp: 5 });

    // Test undo persistence and clearing
    assert.equal(await storage.saveUndo({ hp: 47 }), true);
    assert.deepEqual(await storage.loadUndo(), { hp: 47 });
    assert.equal(await storage.saveUndo(null), true);
    assert.equal(await storage.loadUndo(), null);

    // Test snapshots and pruning at 10
    for (let i = 1; i <= 12; i++) {
      await storage.addSnapshot({ hp: i }, `Snapshot ${i}`);
    }
    const snapshots = await storage.getSnapshots();
    assert.equal(snapshots.length, 10);
    // Newest first
    assert.equal(snapshots[0].summary, 'Snapshot 12');
    assert.equal(snapshots[9].summary, 'Snapshot 3');
  } finally {
    delete globalThis.indexedDB;
    storage._resetDatabase();
  }
});
