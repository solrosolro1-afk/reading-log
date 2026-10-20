// 폰 안(IndexedDB)에만 저장한다. 서버·클로드로 보내는 것은 없다.
const DB_NAME = 'chaekgalpi';
const VERSION = 1;
export const STORES = ['books', 'quotes', 'notes', 'sessions', 'photos', 'kv'];

let dbp;
function open() {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains('books')) d.createObjectStore('books', { keyPath: 'id' });
      for (const s of ['quotes', 'notes', 'sessions']) {
        if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, { keyPath: 'id' }).createIndex('bookId', 'bookId');
      }
      if (!d.objectStoreNames.contains('photos')) d.createObjectStore('photos', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv', { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}

function tx(store, mode, fn) {
  return open().then(d => new Promise((resolve, reject) => {
    const t = d.transaction(store, mode);
    const out = fn(t.objectStore(store));
    t.oncomplete = () => resolve(out);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

const req2p = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

export const db = {
  async get(store, id) {
    const d = await open();
    return req2p(d.transaction(store).objectStore(store).get(id));
  },
  async all(store) {
    const d = await open();
    return req2p(d.transaction(store).objectStore(store).getAll());
  },
  async byBook(store, bookId) {
    const d = await open();
    return req2p(d.transaction(store).objectStore(store).index('bookId').getAll(bookId));
  },
  put(store, obj) {
    return tx(store, 'readwrite', s => { s.put(obj); return obj; });
  },
  putMany(store, list) {
    return tx(store, 'readwrite', s => { for (const o of list) s.put(o); return list.length; });
  },
  del(store, id) {
    return tx(store, 'readwrite', s => { s.delete(id); });
  },
  clear(store) {
    return tx(store, 'readwrite', s => { s.clear(); });
  },
  async getKV(key, def = null) {
    const r = await this.get('kv', key);
    return r ? r.value : def;
  },
  setKV(key, value) {
    return this.put('kv', { key, value });
  },
};

// 기록 변경을 화면에 알리는 아주 작은 이벤트 버스
export const bus = new EventTarget();
export const changed = (what) => bus.dispatchEvent(new CustomEvent('change', { detail: what }));

// ── 자주 쓰는 묶음 동작 ──
export async function saveBook(b) {
  b.updatedAt = Date.now();
  await db.put('books', b);
  changed('books');
  return b;
}

export async function deleteBook(id) {
  const b = await db.get('books', id);
  for (const s of ['quotes', 'notes', 'sessions']) {
    const list = await db.byBook(s, id);
    for (const x of list) {
      if (x.photoId) await db.del('photos', x.photoId);
      await db.del(s, x.id);
    }
  }
  if (b?.coverId) await db.del('photos', b.coverId);
  if (b?.authorPhotoId) await db.del('photos', b.authorPhotoId);
  await db.del('books', id);
  changed('books');
}

// 브라우저가 공간 부족 때 기록을 지우지 않도록 '영구 저장'을 요청
export async function requestPersist() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) return await navigator.storage.persist();
    return await navigator.storage?.persisted?.();
  } catch { return false; }
}
