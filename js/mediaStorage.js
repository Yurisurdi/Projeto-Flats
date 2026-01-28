// ============================================
// INDEXEDDB STORAGE FOR LARGE FILES
// ============================================

class MediaStorage {
    constructor() {
        this.dbName = 'flatManagementMedia';
        this.dbVersion = 1;
        this.storeName = 'mediaFiles';
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    objectStore.createIndex('apartmentId', 'apartmentId', { unique: false });
                    objectStore.createIndex('type', 'type', { unique: false });
                }
            };
        });
    }

    async saveFile(apartmentId, fileData) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);

            const mediaObject = {
                apartmentId: apartmentId,
                name: fileData.name,
                type: fileData.type,
                size: fileData.size,
                data: fileData.data,
                createdAt: new Date().toISOString()
            };

            const request = objectStore.add(mediaObject);

            request.onsuccess = () => {
                resolve({
                    id: request.result,
                    name: fileData.name,
                    type: fileData.type,
                    size: fileData.size
                });
            };

            request.onerror = () => reject(request.error);
        });
    }

    async getFilesByApartment(apartmentId) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const index = objectStore.index('apartmentId');
            const request = index.getAll(apartmentId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getFile(fileId) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.get(fileId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteFile(fileId) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.delete(fileId);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteFilesByApartment(apartmentId) {
        if (!this.db) await this.init();

        const files = await this.getFilesByApartment(apartmentId);
        const deletePromises = files.map(file => this.deleteFile(file.id));
        return Promise.all(deletePromises);
    }

    async getTotalSize() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.getAll();

            request.onsuccess = () => {
                const files = request.result;
                const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
                resolve(totalSize);
            };

            request.onerror = () => reject(request.error);
        });
    }
}

// Make available globally
window.mediaStorage = new MediaStorage();
