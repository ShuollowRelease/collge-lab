const DB_NAME = "photo-cut-assets";
const STORE_NAME = "binary-assets";
const DB_VERSION = 1;

function openStore() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("当前环境不支持本地资源存储"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("无法打开本地资源存储"));
  });
}

export function readAsset(key) {
  return openStore().then(
    (db) =>
      new Promise((resolve, reject) => {
        const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(key);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error || new Error("无法读取本地资源"));
      }).finally(() => db.close())
  );
}

export function writeAsset(key, value) {
  return openStore().then(
    (db) =>
      new Promise((resolve, reject) => {
        const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(value, key);
        request.onsuccess = () => resolve(key);
        request.onerror = () => reject(request.error || new Error("无法保存本地资源"));
      }).finally(() => db.close())
  );
}

export function removeAsset(key) {
  return openStore().then(
    (db) =>
      new Promise((resolve, reject) => {
        const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).delete(key);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error || new Error("无法删除本地资源"));
      }).finally(() => db.close())
  );
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("无法读取文件"));
    reader.readAsDataURL(file);
  });
}

