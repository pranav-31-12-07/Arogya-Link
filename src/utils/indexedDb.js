/**
 * IndexedDB storage utility for offline-first capabilities.
 * Manages local consultation drafts, cached messages, and synchronization outbox.
 */

const DB_NAME = 'aarogya_link_offline_db';
const DB_VERSION = 1;

export function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Store for consultations
      if (!db.objectStoreNames.contains('consultations')) {
        db.createObjectStore('consultations', { keyPath: 'id' });
      }

      // Store for messages
      if (!db.objectStoreNames.contains('messages')) {
        const msgStore = db.createObjectStore('messages', { keyPath: 'id' });
        msgStore.createIndex('consultationId', 'consultationId', { unique: false });
      }

      // Store for offline sync queue (outbox)
      if (!db.objectStoreNames.contains('syncOutbox')) {
        const outboxStore = db.createObjectStore('syncOutbox', { keyPath: 'syncId' });
        outboxStore.createIndex('status', 'status', { unique: false });
      }

      // Store for user profile cached locally
      if (!db.objectStoreNames.contains('profile')) {
        db.createObjectStore('profile', { keyPath: 'uid' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveConsultationOffline(consultation) {
  const db = await openDatabase();
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const tx = db.transaction('consultations', 'readwrite');
    const store = tx.objectStore('consultations');
    const req = store.put({ ...consultation, updatedAt: new Date().toISOString() });
    req.onsuccess = () => resolve(consultation);
    req.onerror = () => reject(req.error);
  });
}

export async function getConsultationOffline(id) {
  const db = await openDatabase();
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const tx = db.transaction('consultations', 'readonly');
    const store = tx.objectStore('consultations');
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function saveMessagesOffline(messages) {
  const db = await openDatabase();
  if (!db) return;
  return new Promise((resolve, reject) => {
    const tx = db.transaction('messages', 'readwrite');
    const store = tx.objectStore('messages');
    messages.forEach((msg) => store.put(msg));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getMessagesOffline(consultationId) {
  const db = await openDatabase();
  if (!db) return [];
  return new Promise((resolve, reject) => {
    const tx = db.transaction('messages', 'readonly');
    const store = tx.objectStore('messages');
    const index = store.index('consultationId');
    const req = index.getAll(consultationId);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function queueSyncItem(item) {
  const db = await openDatabase();
  if (!db) return;
  const syncItem = {
    syncId: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...item,
    createdAt: new Date().toISOString(),
    status: 'pending'
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncOutbox', 'readwrite');
    const store = tx.objectStore('syncOutbox');
    const req = store.put(syncItem);
    req.onsuccess = () => resolve(syncItem);
    req.onerror = () => reject(req.error);
  });
}

export async function getPendingSyncCount() {
  const db = await openDatabase();
  if (!db) return 0;
  return new Promise((resolve) => {
    const tx = db.transaction('syncOutbox', 'readonly');
    const store = tx.objectStore('syncOutbox');
    const index = store.index('status');
    const req = index.count('pending');
    req.onsuccess = () => resolve(req.result || 0);
    req.onerror = () => resolve(0);
  });
}
