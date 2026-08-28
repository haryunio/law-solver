import type { PersistStorage, StorageValue } from "zustand/middleware";

export const OFFLINE_DATA_DATABASE_NAME = "law-solver-offline";
export const OFFLINE_DATA_DATABASE_VERSION = 1;
export const OFFLINE_DATA_OBJECT_STORE = "persisted-state";
export const OFFLINE_DATA_STORAGE_KEY = "law-solver-storage";
export const OFFLINE_DATA_AUTHORITY_MARKER = "law-solver-storage-backend";

const OFFLINE_DATA_AUTHORITY_VALUE = "indexeddb-v1";
const DEFAULT_WRITE_DELAY_MS = 2_000;
const DEFAULT_MAX_WRITE_DELAY_MS = 10_000;

export type OfflineDataStorageBackend = "indexeddb" | "legacy-local-storage";

export type OfflineDataStorageErrorCode =
  | "INDEXED_DB_UNAVAILABLE"
  | "INDEXED_DB_BLOCKED"
  | "WRITE_CONFLICT"
  | "LEGACY_DATA_INVALID"
  | "READ_FAILED"
  | "WRITE_FAILED"
  | "QUOTA_EXCEEDED";

export class OfflineDataStorageError extends Error {
  constructor(
    message: string,
    readonly code: OfflineDataStorageErrorCode,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "OfflineDataStorageError";
  }
}

interface OfflineDataStorageSnapshot {
  backend: OfflineDataStorageBackend | null;
  migratedLegacyData: boolean;
  writeError: OfflineDataStorageError | null;
}

interface OfflineDataStorageOptions {
  indexedDb?: IDBFactory;
  legacyStorage?: Storage | null;
  databaseName?: string;
  writeDelayMs?: number;
  maxWriteDelayMs?: number;
}

interface PendingWrite<State> {
  key: string;
  value: StorageValue<State> | null;
  sequence: number;
  retryOnFailure: boolean;
}

const STORAGE_REVISION_FIELD = "__lawSolverStorageRevision";
const UNVERSIONED_INDEXED_DB_REVISION = "legacy-unversioned-record";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isStorageValue = <State>(value: unknown): value is StorageValue<State> =>
  isRecord(value) && "state" in value &&
  (value.version === undefined || typeof value.version === "number");

const storageError = (
  error: unknown,
  fallbackCode: OfflineDataStorageErrorCode,
): OfflineDataStorageError => {
  if (error instanceof OfflineDataStorageError) return error;
  const name = isRecord(error) && typeof error.name === "string" ? error.name : "";
  if (name === "QuotaExceededError") {
    return new OfflineDataStorageError(
      "이 기기의 브라우저 저장 공간이 부족합니다. 불필요한 사이트 데이터를 정리한 뒤 다시 시도해 주세요.",
      "QUOTA_EXCEEDED",
      error,
    );
  }
  if (name === "BlockedError") {
    return new OfflineDataStorageError(
      "다른 Law Solver 탭이 저장소 업데이트를 막고 있습니다. 열려 있는 다른 탭을 닫고 다시 시도해 주세요.",
      "INDEXED_DB_BLOCKED",
      error,
    );
  }
  return new OfflineDataStorageError(
    fallbackCode === "READ_FAILED"
      ? "이 브라우저의 오프라인 문제 풀이 데이터를 읽지 못했습니다."
      : "오프라인 문제 풀이 데이터를 이 브라우저에 저장하지 못했습니다.",
    fallbackCode,
    error,
  );
};

const isClosedConnectionError = (error: unknown): boolean => {
  if (error instanceof OfflineDataStorageError) return isClosedConnectionError(error.cause);
  return isRecord(error) && error.name === "InvalidStateError";
};

const createStorageRevision = () => {
  try {
    const values = new Uint32Array(4);
    globalThis.crypto.getRandomValues(values);
    return Array.from(values, (value) => value.toString(16).padStart(8, "0")).join("");
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
};

const shallowStorageValueEqual = <State>(
  left: StorageValue<State> | null,
  right: StorageValue<State> | null,
) => {
  if (left === right) return true;
  if (!left || !right || left.version !== right.version) return false;
  const leftState = left.state;
  const rightState = right.state;
  if (!isRecord(leftState) || !isRecord(rightState)) return leftState === rightState;
  const leftEntries = Object.entries(leftState);
  const rightKeys = Object.keys(rightState);
  if (leftEntries.length !== rightKeys.length) return false;
  return leftEntries.every(([key, value]) => rightState[key] === value);
};

const getStorageValueModifiedAt = <State>(value: StorageValue<State> | null) => {
  if (!value || !isRecord(value.state) || typeof value.state.dataUpdatedAt !== "string") {
    return null;
  }
  const timestamp = Date.parse(value.state.dataUpdatedAt);
  return Number.isFinite(timestamp) ? timestamp : null;
};

const requestResult = <Result>(request: IDBRequest<Result>) =>
  new Promise<Result>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });

const getIndexedDbRevision = (value: unknown): string | null => {
  if (value === undefined) return null;
  if (!isRecord(value)) return UNVERSIONED_INDEXED_DB_REVISION;
  return typeof value[STORAGE_REVISION_FIELD] === "string"
    ? value[STORAGE_REVISION_FIELD]
    : UNVERSIONED_INDEXED_DB_REVISION;
};

const stripIndexedDbRevision = <State>(value: unknown): StorageValue<State> => {
  if (!isStorageValue<State>(value)) {
    throw new OfflineDataStorageError(
      "저장된 오프라인 문제 풀이 데이터 형식을 확인할 수 없습니다.",
      "READ_FAILED",
    );
  }
  const { [STORAGE_REVISION_FIELD]: _revision, ...storageValue } = value as unknown as
    Record<string, unknown>;
  return storageValue as unknown as StorageValue<State>;
};

const withIndexedDbRevision = <State>(
  value: StorageValue<State>,
  revision: string,
) => ({ ...value, [STORAGE_REVISION_FIELD]: revision });

export function getOfflineDataStorageMessage(error: unknown): string {
  return error instanceof OfflineDataStorageError
    ? error.message
    : "오프라인 문제 풀이 데이터를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

export function createOfflineDataStorage<State>({
  indexedDb = typeof indexedDB === "undefined" ? undefined : indexedDB,
  legacyStorage = (() => {
    try {
      return typeof localStorage === "undefined" ? null : localStorage;
    } catch {
      return null;
    }
  })(),
  databaseName = OFFLINE_DATA_DATABASE_NAME,
  writeDelayMs = DEFAULT_WRITE_DELAY_MS,
  maxWriteDelayMs = DEFAULT_MAX_WRITE_DELAY_MS,
}: OfflineDataStorageOptions = {}) {
  let databasePromise: Promise<IDBDatabase> | null = null;
  let activeDatabase: IDBDatabase | null = null;
  let preparePromise: Promise<OfflineDataStorageBackend> | null = null;
  let backend: OfflineDataStorageBackend | null = null;
  let pendingWrite: PendingWrite<State> | null = null;
  let writeChain = Promise.resolve();
  let queuedWriteCount = 0;
  let latestWriteSequence = 0;
  let writeTimer: ReturnType<typeof setTimeout> | null = null;
  let maxWriteTimer: ReturnType<typeof setTimeout> | null = null;
  let legacyCleanupPending = false;
  let legacyCleanupExpected: string | null = null;
  let lastDurableValue: StorageValue<State> | null = null;
  let lastScheduledValue: StorageValue<State> | null = null;
  let indexedDbRevision: string | null = null;
  let lastWriteError: OfflineDataStorageError | null = null;
  let lastWriteErrorSequence: number | null = null;
  const listeners = new Set<() => void>();

  const snapshot = (): OfflineDataStorageSnapshot => ({
    backend,
    migratedLegacyData: legacyCleanupPending,
    writeError: lastWriteError,
  });

  const emit = () => listeners.forEach((listener) => listener());

  const markerExists = () => {
    try {
      return legacyStorage?.getItem(OFFLINE_DATA_AUTHORITY_MARKER) ===
        OFFLINE_DATA_AUTHORITY_VALUE;
    } catch {
      return false;
    }
  };

  const legacyKeyExists = (key: string) => {
    try {
      return legacyStorage?.getItem(key) !== null;
    } catch {
      return false;
    }
  };

  const setAuthorityMarker = () => {
    try {
      legacyStorage?.setItem(OFFLINE_DATA_AUTHORITY_MARKER, OFFLINE_DATA_AUTHORITY_VALUE);
      return markerExists();
    } catch {
      return false;
    }
  };

  const markLegacyCleanup = (value: StorageValue<State>) => {
    legacyCleanupPending = true;
    legacyCleanupExpected = JSON.stringify(value);
  };

  const invalidateDatabase = (database: IDBDatabase, close = true) => {
    if (activeDatabase === database) {
      activeDatabase = null;
      databasePromise = null;
    }
    if (close) {
      try {
        database.close();
      } catch {
        // The browser has already closed this connection.
      }
    }
  };

  const openDatabase = () => {
    if (!indexedDb) {
      return Promise.reject(new OfflineDataStorageError(
        "이 브라우저에서는 IndexedDB를 사용할 수 없습니다.",
        "INDEXED_DB_UNAVAILABLE",
      ));
    }
    if (databasePromise) return databasePromise;
    databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
      let settled = false;
      const rejectOnce = (error: OfflineDataStorageError) => {
        if (settled) return;
        settled = true;
        reject(error);
      };
      let request: IDBOpenDBRequest;
      try {
        request = indexedDb.open(databaseName, OFFLINE_DATA_DATABASE_VERSION);
      } catch (error) {
        rejectOnce(storageError(error, "INDEXED_DB_UNAVAILABLE"));
        return;
      }
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(OFFLINE_DATA_OBJECT_STORE)) {
          database.createObjectStore(OFFLINE_DATA_OBJECT_STORE);
        }
      };
      request.onblocked = () => rejectOnce(new OfflineDataStorageError(
        "다른 Law Solver 탭이 저장소 업데이트를 막고 있습니다. 열려 있는 다른 탭을 닫고 다시 시도해 주세요.",
        "INDEXED_DB_BLOCKED",
      ));
      request.onerror = () => rejectOnce(storageError(request.error, "INDEXED_DB_UNAVAILABLE"));
      request.onsuccess = () => {
        const database = request.result;
        if (settled) {
          database.close();
          return;
        }
        settled = true;
        activeDatabase = database;
        database.onversionchange = () => {
          invalidateDatabase(database);
        };
        database.addEventListener("close", () => invalidateDatabase(database, false));
        resolve(database);
      };
    }).catch((error) => {
      databasePromise = null;
      throw error;
    });
    return databasePromise;
  };

  const readIndexedDbOnce = async (
    database: IDBDatabase,
    key: string,
  ): Promise<StorageValue<State> | null> => {
    const transaction = database.transaction(OFFLINE_DATA_OBJECT_STORE, "readonly");
    const result = await requestResult(
      transaction.objectStore(OFFLINE_DATA_OBJECT_STORE).get(key),
    );
    indexedDbRevision = getIndexedDbRevision(result);
    return result === undefined ? null : stripIndexedDbRevision<State>(result);
  };

  const readIndexedDb = async (key: string): Promise<StorageValue<State> | null> => {
    let database = await openDatabase();
    try {
      return await readIndexedDbOnce(database, key);
    } catch (error) {
      if (isClosedConnectionError(error)) {
        invalidateDatabase(database);
        database = await openDatabase();
        try {
          return await readIndexedDbOnce(database, key);
        } catch (retryError) {
          throw storageError(retryError, "READ_FAILED");
        }
      }
      throw storageError(error, "READ_FAILED");
    }
  };

  const writeIndexedDbOnce = (
    database: IDBDatabase,
    key: string,
    value: StorageValue<State> | null,
  ) => new Promise<string | null>((resolve, reject) => {
    let transaction: IDBTransaction;
    let transactionError: OfflineDataStorageError | null = null;
    const expectedRevision = indexedDbRevision;
    const nextRevision = value === null ? null : createStorageRevision();
    try {
      transaction = database.transaction(OFFLINE_DATA_OBJECT_STORE, "readwrite");
      const store = transaction.objectStore(OFFLINE_DATA_OBJECT_STORE);
      const readRequest = store.get(key);
      readRequest.onsuccess = () => {
        const currentRevision = getIndexedDbRevision(readRequest.result);
        if (currentRevision !== expectedRevision) {
          transactionError = new OfflineDataStorageError(
            "다른 Law Solver 탭에서 오프라인 문제 풀이 데이터가 변경되었습니다. 이 탭을 새로고침한 뒤 다시 시도해 주세요.",
            "WRITE_CONFLICT",
          );
          transaction.abort();
          return;
        }
        try {
          if (value === null) store.delete(key);
          else store.put(withIndexedDbRevision(value, nextRevision!), key);
        } catch (error) {
          transactionError = storageError(error, "WRITE_FAILED");
          transaction.abort();
        }
      };
      readRequest.onerror = () => {
        transactionError = storageError(readRequest.error, "WRITE_FAILED");
      };
    } catch (error) {
      reject(storageError(error, "WRITE_FAILED"));
      return;
    }
    transaction.oncomplete = () => resolve(nextRevision);
    transaction.onerror = () => {
      transactionError ??= storageError(transaction.error, "WRITE_FAILED");
    };
    transaction.onabort = () => reject(
      transactionError ?? storageError(transaction.error, "WRITE_FAILED"),
    );
  });

  const writeIndexedDb = async (
    key: string,
    value: StorageValue<State> | null,
  ): Promise<void> => {
    let database = await openDatabase();
    try {
      indexedDbRevision = await writeIndexedDbOnce(database, key, value);
    } catch (error) {
      if (!isClosedConnectionError(error)) throw error;
      invalidateDatabase(database);
      database = await openDatabase();
      indexedDbRevision = await writeIndexedDbOnce(database, key, value);
    }
    setAuthorityMarker();
  };

  const readLegacy = (key: string): StorageValue<State> | null => {
    let raw: string | null;
    try {
      raw = legacyStorage?.getItem(key) ?? null;
    } catch (error) {
      throw storageError(error, "READ_FAILED");
    }
    if (raw === null) return null;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!isStorageValue<State>(parsed)) throw new Error("Invalid persisted state");
      return parsed;
    } catch (error) {
      throw new OfflineDataStorageError(
        "기존 브라우저 저장 데이터의 형식을 확인할 수 없습니다. 원본 데이터는 삭제하지 않았습니다.",
        "LEGACY_DATA_INVALID",
        error,
      );
    }
  };

  const writeLegacy = (key: string, value: StorageValue<State> | null) => {
    try {
      if (!legacyStorage) {
        throw new OfflineDataStorageError(
          "이 브라우저의 로컬 저장소를 사용할 수 없습니다.",
          "WRITE_FAILED",
        );
      }
      if (value === null) legacyStorage.removeItem(key);
      else legacyStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      throw storageError(error, "WRITE_FAILED");
    }
  };

  const prepare = () => {
    if (preparePromise) return preparePromise;
    preparePromise = (async () => {
      try {
        const indexedValue = await readIndexedDb(OFFLINE_DATA_STORAGE_KEY);
        backend = "indexeddb";
        lastDurableValue = indexedValue;
        lastScheduledValue = indexedValue;
        if (indexedValue) {
          if (legacyKeyExists(OFFLINE_DATA_STORAGE_KEY)) {
            let legacyValue: StorageValue<State> | null = null;
            try {
              legacyValue = readLegacy(OFFLINE_DATA_STORAGE_KEY);
            } catch (error) {
              if (!(error instanceof OfflineDataStorageError) || error.code !== "LEGACY_DATA_INVALID") {
                throw error;
              }
            }
            if (legacyValue) {
              const indexedSerialized = JSON.stringify(indexedValue);
              const legacySerialized = JSON.stringify(legacyValue);
              const indexedModifiedAt = getStorageValueModifiedAt(indexedValue);
              const legacyModifiedAt = getStorageValueModifiedAt(legacyValue);
              if (
                legacySerialized === indexedSerialized ||
                (indexedModifiedAt !== null && legacyModifiedAt !== null &&
                  indexedModifiedAt > legacyModifiedAt)
              ) {
                markLegacyCleanup(legacyValue);
              } else if (
                indexedModifiedAt !== null && legacyModifiedAt !== null &&
                legacyModifiedAt > indexedModifiedAt
              ) {
                await writeIndexedDb(OFFLINE_DATA_STORAGE_KEY, legacyValue);
                const verified = await readIndexedDb(OFFLINE_DATA_STORAGE_KEY);
                if (!verified || JSON.stringify(verified) !== legacySerialized) {
                  throw new OfflineDataStorageError(
                    "더 최근의 기존 데이터를 IndexedDB로 안전하게 이전하지 못했습니다.",
                    "WRITE_FAILED",
                  );
                }
                lastDurableValue = verified;
                lastScheduledValue = verified;
                markLegacyCleanup(legacyValue);
              }
            }
          }
          setAuthorityMarker();
          emit();
          return backend;
        }
        const legacyValue = readLegacy(OFFLINE_DATA_STORAGE_KEY);
        if (legacyValue) {
          try {
            await writeIndexedDb(OFFLINE_DATA_STORAGE_KEY, legacyValue);
          } catch (error) {
            if (!(error instanceof OfflineDataStorageError) || error.code !== "WRITE_CONFLICT") {
              throw error;
            }
          }
          const verified = await readIndexedDb(OFFLINE_DATA_STORAGE_KEY);
          if (!verified || JSON.stringify(verified) !== JSON.stringify(legacyValue)) {
            throw new OfflineDataStorageError(
              "기존 데이터를 IndexedDB로 안전하게 이전하지 못했습니다.",
              "WRITE_FAILED",
            );
          }
          lastDurableValue = verified;
          lastScheduledValue = verified;
          markLegacyCleanup(legacyValue);
        }
        emit();
        return backend;
      } catch (error) {
        if (markerExists()) throw storageError(error, "READ_FAILED");
        const legacyValue = readLegacy(OFFLINE_DATA_STORAGE_KEY);
        if (!legacyValue) throw storageError(error, "READ_FAILED");
        backend = "legacy-local-storage";
        lastDurableValue = legacyValue;
        lastScheduledValue = legacyValue;
        emit();
        return backend;
      }
    })().catch((error) => {
      preparePromise = null;
      throw error;
    });
    return preparePromise;
  };

  const clearTimers = () => {
    if (writeTimer) clearTimeout(writeTimer);
    if (maxWriteTimer) clearTimeout(maxWriteTimer);
    writeTimer = null;
    maxWriteTimer = null;
  };

  const commitPending = () => {
    clearTimers();
    const write = pendingWrite;
    pendingWrite = null;
    if (!write) return writeChain;
    queuedWriteCount += 1;
    const attempt = writeChain.then(async () => {
      try {
        await prepare();
        if (backend === "indexeddb") await writeIndexedDb(write.key, write.value);
        else writeLegacy(write.key, write.value);
        lastDurableValue = write.value;
        lastWriteError = null;
        lastWriteErrorSequence = null;
      } catch (error) {
        lastWriteError = storageError(error, "WRITE_FAILED");
        lastWriteErrorSequence = write.sequence;
        if (
          write.retryOnFailure &&
          !pendingWrite &&
          write.sequence === latestWriteSequence
        ) {
          pendingWrite = write;
        }
        if (!write.retryOnFailure && write.sequence === latestWriteSequence) {
          lastScheduledValue = lastDurableValue;
        }
        throw lastWriteError;
      } finally {
        queuedWriteCount -= 1;
        emit();
      }
    });
    writeChain = attempt.catch(() => undefined);
    return attempt;
  };

  const scheduleWrite = (
    key: string,
    value: StorageValue<State> | null,
    retryOnFailure = true,
  ) => {
    if (shallowStorageValueEqual(value, lastScheduledValue)) {
      return pendingWrite?.sequence ?? null;
    }
    const sequence = ++latestWriteSequence;
    pendingWrite = { key, value, sequence, retryOnFailure };
    lastScheduledValue = value;
    if (writeTimer) clearTimeout(writeTimer);
    writeTimer = setTimeout(() => void commitPending().catch(() => undefined), writeDelayMs);
    if (!maxWriteTimer) {
      maxWriteTimer = setTimeout(
        () => void commitPending().catch(() => undefined),
        maxWriteDelayMs,
      );
    }
    return sequence;
  };

  const flush = async () => {
    while (true) {
      if (pendingWrite) {
        await commitPending();
        continue;
      }
      const observedChain = writeChain;
      await observedChain;
      if (!pendingWrite && observedChain === writeChain) break;
    }
    if (lastWriteError) throw lastWriteError;
  };

  const persistStorage: PersistStorage<State> = {
    getItem: async (key) => {
      await prepare();
      const value = backend === "indexeddb" ? await readIndexedDb(key) : readLegacy(key);
      lastDurableValue = value;
      if (!pendingWrite && queuedWriteCount === 0) lastScheduledValue = value;
      return value;
    },
    setItem: (key, value) => {
      scheduleWrite(key, value);
      return Promise.resolve();
    },
    removeItem: (key) => {
      scheduleWrite(key, null);
      return Promise.resolve();
    },
  };

  return {
    storage: persistStorage,
    prepare,
    flush,
    writeDurably: async (key: string, value: StorageValue<State>) => {
      await flush();
      const sequence = scheduleWrite(key, value, false);
      if (sequence === null) return;
      try {
        await flush();
      } catch (error) {
        if (pendingWrite?.sequence === sequence) pendingWrite = null;
        if (lastWriteErrorSequence === sequence) {
          lastWriteError = null;
          lastWriteErrorSequence = null;
          if (sequence === latestWriteSequence) lastScheduledValue = lastDurableValue;
          emit();
        }
        throw error;
      }
    },
    finalizeLegacyMigration: async () => {
      if (backend !== "indexeddb" || !legacyCleanupPending) return;
      await flush();
      let currentLegacy: StorageValue<State> | null;
      try {
        currentLegacy = readLegacy(OFFLINE_DATA_STORAGE_KEY);
      } catch {
        return;
      }
      if (!currentLegacy) {
        legacyCleanupPending = false;
        legacyCleanupExpected = null;
        emit();
        return;
      }
      if (
        !legacyCleanupExpected ||
        JSON.stringify(currentLegacy) !== legacyCleanupExpected
      ) {
        return;
      }
      if (!setAuthorityMarker()) return;
      try {
        legacyStorage?.removeItem(OFFLINE_DATA_STORAGE_KEY);
        legacyCleanupPending = false;
        legacyCleanupExpected = null;
        emit();
      } catch {
        // Keeping a duplicate legacy snapshot is safe; IndexedDB remains authoritative.
      }
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: snapshot,
    dismissWriteError: () => {
      lastWriteError = null;
      lastWriteErrorSequence = null;
      emit();
    },
    close: async () => {
      let flushError: unknown = null;
      try {
        await flush();
      } catch (error) {
        flushError = error;
      }
      const database = await databasePromise?.catch(() => null);
      database?.close();
      activeDatabase = null;
      databasePromise = null;
      preparePromise = null;
      indexedDbRevision = null;
      if (flushError) throw flushError;
    },
  };
}
