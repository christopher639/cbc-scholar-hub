// IndexedDB wrapper for offline data storage

const DB_NAME = 'SchoolManagementDB';
const DB_VERSION = 1;

// Store names
export const STORES = {
  LEARNERS: 'learners',
  GRADES: 'grades',
  STREAMS: 'streams',
  FEE_PAYMENTS: 'fee_payments',
  FEE_BALANCES: 'fee_balances',
  TEACHERS: 'teachers',
  PERFORMANCE: 'performance_records',
  ALUMNI: 'alumni',
  SYNC_QUEUE: 'sync_queue',
} as const;

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create learners store
        if (!db.objectStoreNames.contains(STORES.LEARNERS)) {
          const learnersStore = db.createObjectStore(STORES.LEARNERS, { keyPath: 'id' });
          learnersStore.createIndex('admission_number', 'admission_number', { unique: true });
          learnersStore.createIndex('current_grade_id', 'current_grade_id', { unique: false });
          learnersStore.createIndex('status', 'status', { unique: false });
        }

        // Create grades store
        if (!db.objectStoreNames.contains(STORES.GRADES)) {
          const gradesStore = db.createObjectStore(STORES.GRADES, { keyPath: 'id' });
          gradesStore.createIndex('grade_level', 'grade_level', { unique: false });
        }

        // Create streams store
        if (!db.objectStoreNames.contains(STORES.STREAMS)) {
          const streamsStore = db.createObjectStore(STORES.STREAMS, { keyPath: 'id' });
          streamsStore.createIndex('grade_id', 'grade_id', { unique: false });
        }

        // Create fee payments store
        if (!db.objectStoreNames.contains(STORES.FEE_PAYMENTS)) {
          const paymentsStore = db.createObjectStore(STORES.FEE_PAYMENTS, { keyPath: 'id' });
          paymentsStore.createIndex('learner_id', 'learner_id', { unique: false });
          paymentsStore.createIndex('payment_date', 'payment_date', { unique: false });
        }

        // Create fee balances store
        if (!db.objectStoreNames.contains(STORES.FEE_BALANCES)) {
          const balancesStore = db.createObjectStore(STORES.FEE_BALANCES, { keyPath: 'id' });
          balancesStore.createIndex('learner_id', 'learner_id', { unique: false });
          balancesStore.createIndex('academic_year', 'academic_year', { unique: false });
        }

        // Create teachers store
        if (!db.objectStoreNames.contains(STORES.TEACHERS)) {
          const teachersStore = db.createObjectStore(STORES.TEACHERS, { keyPath: 'id' });
          teachersStore.createIndex('email', 'email', { unique: true });
        }

        // Create performance records store
        if (!db.objectStoreNames.contains(STORES.PERFORMANCE)) {
          const performanceStore = db.createObjectStore(STORES.PERFORMANCE, { keyPath: 'id' });
          performanceStore.createIndex('learner_id', 'learner_id', { unique: false });
          performanceStore.createIndex('academic_year', 'academic_year', { unique: false });
        }

        // Create alumni store
        if (!db.objectStoreNames.contains(STORES.ALUMNI)) {
          const alumniStore = db.createObjectStore(STORES.ALUMNI, { keyPath: 'id' });
          alumniStore.createIndex('learner_id', 'learner_id', { unique: true });
          alumniStore.createIndex('graduation_year', 'graduation_year', { unique: false });
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('synced', 'synced', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  // Generic CRUD operations
  async add(storeName: string, data: any): Promise<IDBValidKey> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName: string, data: any): Promise<IDBValidKey> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName: string, key: IDBValidKey): Promise<any> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName: string): Promise<any[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getByIndex(storeName: string, indexName: string, value: any): Promise<any[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async bulkPut(storeName: string, items: any[]): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      let completed = 0;
      let hasError = false;

      items.forEach((item) => {
        const request = store.put(item);
        request.onsuccess = () => {
          completed++;
          if (completed === items.length && !hasError) {
            resolve();
          }
        };
        request.onerror = () => {
          hasError = true;
          reject(request.error);
        };
      });

      if (items.length === 0) {
        resolve();
      }
    });
  }

  async count(storeName: string): Promise<number> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getStorageEstimate(): Promise<{ usage: number; quota: number; percentage: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
        percentage: ((estimate.usage || 0) / (estimate.quota || 1)) * 100,
      };
    }
    return { usage: 0, quota: 0, percentage: 0 };
  }
}

// Export singleton instance
export const dbManager = new IndexedDBManager();
