/**
 * Almacén de archivos anexos en IndexedDB.
 *
 * localStorage no admite archivos grandes, así que el contenido se guarda aquí
 * con la misma clave que el `Anexo.id`; los metadatos viven en el proyecto.
 * Los archivos quedan en este navegador: al conectar el backend habrá que
 * moverlos a un almacenamiento del servidor (S3, disco, etc.).
 */

const DB_NAME = 'envirogest_files';
const STORE   = 'files';

export const MAX_FILE_BYTES = 20 * 1024 * 1024;   // 20 MB por archivo

let dbPromise: Promise<IDBDatabase> | null = null;

function db(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => { dbPromise = null; reject(req.error); };
    });
  }
  return dbPromise;
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return db().then(d => new Promise<T | undefined>((resolve, reject) => {
    const tx  = d.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req ? req.result : undefined);
    tx.onerror    = () => reject(tx.error);
    tx.onabort    = () => reject(tx.error);
  }));
}

export const filesService = {
  async put(id: string, file: Blob): Promise<void> {
    await run('readwrite', s => s.put(file, id));
  },

  async get(id: string): Promise<Blob | undefined> {
    return run<Blob>('readonly', s => s.get(id) as IDBRequest<Blob>);
  },

  async remove(ids: string[]): Promise<void> {
    if (!ids.length) return;
    await run('readwrite', s => { ids.forEach(id => s.delete(id)); });
  },

  /** Abre el archivo en una pestaña nueva (o lo descarga si el navegador no lo muestra). */
  async open(id: string, nombre: string): Promise<boolean> {
    const blob = await this.get(id);
    if (!blob) return false;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    if (!/^(application\/pdf|image\/)/.test(blob.type)) a.download = nombre;
    else a.target = '_blank';
    a.rel = 'noopener';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return true;
  },
};
