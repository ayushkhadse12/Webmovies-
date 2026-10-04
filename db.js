// db.js - IndexedDB wrapper for offline downloads
const DB_NAME = "WebMoviesDownloads";
const DB_VERSION = 1;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains("files")) {
                db.createObjectStore("files", { keyPath: "blobKey" });
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

window.db = {
    async saveFile(blobKey, blob) {
        const database = await openDB();
        return new Promise((resolve, reject) => {
            const tx = database.transaction("files", "readwrite");
            const store = tx.objectStore("files");
            const request = store.put({ blobKey, blob });
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
        });
    },

    async getFile(blobKey) {
        const database = await openDB();
        return new Promise((resolve, reject) => {
            const tx = database.transaction("files", "readonly");
            const store = tx.objectStore("files");
            const request = store.get(blobKey);
            request.onsuccess = (e) => resolve(e.target.result ? e.target.result.blob : null);
            request.onerror = (e) => reject(e.target.error);
        });
    },

    async deleteFile(blobKey) {
        const database = await openDB();
        return new Promise((resolve, reject) => {
            const tx = database.transaction("files", "readwrite");
            const store = tx.objectStore("files");
            const request = store.delete(blobKey);
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
        });
    }
};
