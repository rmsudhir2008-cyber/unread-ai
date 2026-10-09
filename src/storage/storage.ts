import type {Conversation} from '../types';

const DB = 'unreadai-local';
const STORE = 'conversations';
const memoryStore = new Map<string, Conversation>();

const hasIndexedDb = () => typeof window !== 'undefined' && 'indexedDB' in window;

function openDb(): Promise<IDBDatabase | undefined> {
  if (!hasIndexedDb()) return Promise.resolve(undefined);
  return new Promise(resolve => {
    try {
      const request = indexedDB.open(DB, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, {keyPath: 'id'});
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(undefined);
      request.onblocked = () => resolve(undefined);
    } catch {
      resolve(undefined);
    }
  });
}

const sorted = (items: Conversation[]) => items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

export async function listConversations(): Promise<Conversation[]> {
  const db = await openDb();
  if (!db) return sorted([...memoryStore.values()]);
  return new Promise(resolve => {
    try {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
      request.onsuccess = () => resolve(sorted(request.result as Conversation[]));
      request.onerror = () => resolve(sorted([...memoryStore.values()]));
    } catch {
      resolve(sorted([...memoryStore.values()]));
    }
  });
}

export async function saveConversation(conversation: Conversation): Promise<void> {
  memoryStore.set(conversation.id, conversation);
  const db = await openDb();
  if (!db) return;
  await new Promise<void>(resolve => {
    try {
      const transaction = db.transaction(STORE, 'readwrite');
      transaction.objectStore(STORE).put(conversation);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
      transaction.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function deleteConversation(id: string): Promise<void> {
  memoryStore.delete(id);
  const db = await openDb();
  if (!db) return;
  await new Promise<void>(resolve => {
    try {
      const transaction = db.transaction(STORE, 'readwrite');
      transaction.objectStore(STORE).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
      transaction.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function clearConversations(): Promise<void> {
  memoryStore.clear();
  const db = await openDb();
  if (!db) return;
  await new Promise<void>(resolve => {
    try {
      const transaction = db.transaction(STORE, 'readwrite');
      transaction.objectStore(STORE).clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
      transaction.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}
