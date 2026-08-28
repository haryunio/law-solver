// @vitest-environment jsdom

import { IDBFactory } from "fake-indexeddb";
import { afterEach, describe, expect, it } from "vitest";
import {
  createOfflineDataStorage,
  OFFLINE_DATA_AUTHORITY_MARKER,
  OFFLINE_DATA_STORAGE_KEY,
  OfflineDataStorageError,
} from "./offlineDataStorage";

interface StoredState {
  sessions: Array<{ id: string; answer?: string }>;
  dataUpdatedAt: string;
}

const state = (id: string): { state: StoredState; version: number } => ({
  state: {
    sessions: [{ id }],
    dataUpdatedAt: `2026-08-29T00:00:0${id.length}.000Z`,
  },
  version: 3,
});

const openStorages: Array<ReturnType<typeof createOfflineDataStorage<StoredState>>> = [];

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

class RecoveringStorage extends MemoryStorage {
  failWrites = true;
  failWhenValueIncludes: string | null = null;

  override setItem(key: string, value: string) {
    if (this.failWrites || (this.failWhenValueIncludes && value.includes(this.failWhenValueIncludes))) {
      throw new DOMException("quota", "QuotaExceededError");
    }
    super.setItem(key, value);
  }
}

class MarkerFailingStorage extends MemoryStorage {
  override setItem(key: string, value: string) {
    if (key === OFFLINE_DATA_AUTHORITY_MARKER) {
      throw new DOMException("blocked", "SecurityError");
    }
    super.setItem(key, value);
  }
}

function createStorage(
  indexedDb: IDBFactory,
  databaseName: string,
  writeDelayMs = 60_000,
  legacyStorage: Storage = localStorage,
) {
  const storage = createOfflineDataStorage<StoredState>({
    indexedDb,
    legacyStorage,
    databaseName,
    writeDelayMs,
    maxWriteDelayMs: writeDelayMs,
  });
  openStorages.push(storage);
  return storage;
}

afterEach(async () => {
  await Promise.all(openStorages.splice(0).map((storage) => storage.close().catch(() => undefined)));
  localStorage.clear();
});

describe("offline IndexedDB storage", () => {
  it("copies a legacy Zustand envelope and deletes it only after finalization", async () => {
    const indexedDb = new IDBFactory();
    const legacy = state("legacy");
    localStorage.setItem(OFFLINE_DATA_STORAGE_KEY, JSON.stringify(legacy));
    const storage = createStorage(indexedDb, "migration-success");

    await expect(storage.prepare()).resolves.toBe("indexeddb");
    await expect(storage.storage.getItem(OFFLINE_DATA_STORAGE_KEY)).resolves.toEqual(legacy);
    expect(localStorage.getItem(OFFLINE_DATA_STORAGE_KEY)).toBe(JSON.stringify(legacy));

    await storage.finalizeLegacyMigration();

    expect(localStorage.getItem(OFFLINE_DATA_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(OFFLINE_DATA_AUTHORITY_MARKER)).toBe("indexeddb-v1");
  });

  it("keeps the legacy copy when the IndexedDB authority marker cannot be stored", async () => {
    const indexedDb = new IDBFactory();
    const legacyStorage = new MarkerFailingStorage();
    const legacy = state("marker-safe");
    legacyStorage.setItem(OFFLINE_DATA_STORAGE_KEY, JSON.stringify(legacy));
    const storage = createStorage(indexedDb, "marker-failure", 60_000, legacyStorage);

    await storage.prepare();
    await storage.finalizeLegacyMigration();

    expect(legacyStorage.getItem(OFFLINE_DATA_STORAGE_KEY)).toBe(JSON.stringify(legacy));
    await expect(storage.storage.getItem(OFFLINE_DATA_STORAGE_KEY)).resolves.toEqual(legacy);
  });

  it("keeps IndexedDB authoritative when stale localStorage data also exists", async () => {
    const indexedDb = new IDBFactory();
    const first = createStorage(indexedDb, "indexeddb-wins");
    await first.prepare();
    await first.writeDurably(OFFLINE_DATA_STORAGE_KEY, state("indexed"));
    await first.close();
    openStorages.splice(openStorages.indexOf(first), 1);
    localStorage.setItem(OFFLINE_DATA_STORAGE_KEY, JSON.stringify(state("stale")));

    const reopened = createStorage(indexedDb, "indexeddb-wins");
    await reopened.prepare();

    await expect(reopened.storage.getItem(OFFLINE_DATA_STORAGE_KEY))
      .resolves.toEqual(state("indexed"));
    await reopened.finalizeLegacyMigration();
    expect(localStorage.getItem(OFFLINE_DATA_STORAGE_KEY)).toBeNull();
  });

  it("ignores malformed stale localStorage when a valid IndexedDB snapshot exists", async () => {
    const indexedDb = new IDBFactory();
    const first = createStorage(indexedDb, "malformed-stale");
    await first.prepare();
    await first.writeDurably(OFFLINE_DATA_STORAGE_KEY, state("indexed"));
    await first.close();
    openStorages.splice(openStorages.indexOf(first), 1);
    localStorage.setItem(OFFLINE_DATA_STORAGE_KEY, "{broken-stale-copy");

    const reopened = createStorage(indexedDb, "malformed-stale");
    await expect(reopened.prepare()).resolves.toBe("indexeddb");
    await expect(reopened.storage.getItem(OFFLINE_DATA_STORAGE_KEY))
      .resolves.toEqual(state("indexed"));
    await reopened.finalizeLegacyMigration();
    expect(localStorage.getItem(OFFLINE_DATA_STORAGE_KEY)).toBe("{broken-stale-copy");
  });

  it("migrates a legacy snapshot that is newer than the existing IndexedDB value", async () => {
    const indexedDb = new IDBFactory();
    const older = state("older");
    older.state.dataUpdatedAt = "2026-08-29T00:00:01.000Z";
    const newer = state("newer");
    newer.state.dataUpdatedAt = "2026-08-29T00:00:02.000Z";
    const first = createStorage(indexedDb, "newer-legacy-wins");
    await first.prepare();
    await first.writeDurably(OFFLINE_DATA_STORAGE_KEY, older);
    await first.close();
    openStorages.splice(openStorages.indexOf(first), 1);
    localStorage.setItem(OFFLINE_DATA_STORAGE_KEY, JSON.stringify(newer));

    const reopened = createStorage(indexedDb, "newer-legacy-wins");
    await reopened.prepare();
    await expect(reopened.storage.getItem(OFFLINE_DATA_STORAGE_KEY)).resolves.toEqual(newer);
    await reopened.finalizeLegacyMigration();
    expect(localStorage.getItem(OFFLINE_DATA_STORAGE_KEY)).toBeNull();
  });

  it("does not delete legacy data that changes after cleanup was prepared", async () => {
    const indexedDb = new IDBFactory();
    const indexed = state("indexed");
    indexed.state.dataUpdatedAt = "2026-08-29T00:00:02.000Z";
    const stale = state("stale");
    stale.state.dataUpdatedAt = "2026-08-29T00:00:01.000Z";
    const updated = state("updated");
    updated.state.dataUpdatedAt = "2026-08-29T00:00:03.000Z";
    const first = createStorage(indexedDb, "late-legacy-update");
    await first.prepare();
    await first.writeDurably(OFFLINE_DATA_STORAGE_KEY, indexed);
    await first.close();
    openStorages.splice(openStorages.indexOf(first), 1);
    localStorage.setItem(OFFLINE_DATA_STORAGE_KEY, JSON.stringify(stale));

    const reopened = createStorage(indexedDb, "late-legacy-update");
    await reopened.prepare();
    localStorage.setItem(OFFLINE_DATA_STORAGE_KEY, JSON.stringify(updated));
    await reopened.finalizeLegacyMigration();

    expect(localStorage.getItem(OFFLINE_DATA_STORAGE_KEY)).toBe(JSON.stringify(updated));
    await expect(reopened.storage.getItem(OFFLINE_DATA_STORAGE_KEY)).resolves.toEqual(indexed);
  });

  it("migrates a roughly 10MB legacy snapshot without localStorage quota assumptions", async () => {
    const indexedDb = new IDBFactory();
    const roomyStorage = new MemoryStorage();
    const large = state("large");
    large.state.sessions[0]!.answer = "가".repeat(5_000_000);
    roomyStorage.setItem(OFFLINE_DATA_STORAGE_KEY, JSON.stringify(large));
    const storage = createStorage(indexedDb, "large-migration", 60_000, roomyStorage);

    await storage.prepare();
    await storage.finalizeLegacyMigration();

    expect(roomyStorage.getItem(OFFLINE_DATA_STORAGE_KEY)).toBeNull();
    const restored = await storage.storage.getItem(OFFLINE_DATA_STORAGE_KEY);
    expect(restored?.state.sessions[0]?.answer?.length).toBe(5_000_000);
  });

  it("coalesces rapid writes and persists the newest complete snapshot", async () => {
    const indexedDb = new IDBFactory();
    const storage = createStorage(indexedDb, "coalesced-writes");
    await storage.prepare();

    await storage.storage.setItem(OFFLINE_DATA_STORAGE_KEY, state("one"));
    await storage.storage.setItem(OFFLINE_DATA_STORAGE_KEY, state("two"));
    await storage.storage.setItem(OFFLINE_DATA_STORAGE_KEY, state("latest"));
    await storage.flush();

    await expect(storage.storage.getItem(OFFLINE_DATA_STORAGE_KEY))
      .resolves.toEqual(state("latest"));
  });

  it("persists a reversion that arrives while an intermediate write is in flight", async () => {
    const indexedDb = new IDBFactory();
    const storage = createStorage(indexedDb, "in-flight-reversion");
    await storage.prepare();
    const durable = state("durable");
    await storage.writeDurably(OFFLINE_DATA_STORAGE_KEY, durable);

    await storage.storage.setItem(OFFLINE_DATA_STORAGE_KEY, state("intermediate"));
    const flushing = storage.flush();
    await storage.storage.setItem(OFFLINE_DATA_STORAGE_KEY, durable);
    await flushing;

    await expect(storage.storage.getItem(OFFLINE_DATA_STORAGE_KEY)).resolves.toEqual(durable);
  });

  it("retains a failed background snapshot and retries it on the next flush", async () => {
    const unavailable = {
      open: () => {
        throw new DOMException("unavailable", "UnknownError");
      },
    } as unknown as IDBFactory;
    const recoveringStorage = new RecoveringStorage();
    recoveringStorage.failWrites = false;
    recoveringStorage.setItem(OFFLINE_DATA_STORAGE_KEY, JSON.stringify(state("base")));
    recoveringStorage.failWrites = true;
    const storage = createStorage(unavailable, "retry-background-write", 0, recoveringStorage);
    await storage.prepare();

    await storage.storage.setItem(OFFLINE_DATA_STORAGE_KEY, state("retry"));
    await new Promise((resolve) => setTimeout(resolve, 5));

    expect(storage.getSnapshot().writeError?.code).toBe("QUOTA_EXCEEDED");
    expect(recoveringStorage.getItem(OFFLINE_DATA_STORAGE_KEY))
      .toBe(JSON.stringify(state("base")));

    recoveringStorage.failWrites = false;
    await storage.flush();

    expect(storage.getSnapshot().writeError).toBeNull();
    expect(recoveringStorage.getItem(OFFLINE_DATA_STORAGE_KEY))
      .toBe(JSON.stringify(state("retry")));
  });

  it("keeps the latest ordinary snapshot when a one-shot durable replacement fails", async () => {
    const unavailable = {
      open: () => {
        throw new DOMException("unavailable", "UnknownError");
      },
    } as unknown as IDBFactory;
    const recoveringStorage = new RecoveringStorage();
    recoveringStorage.failWrites = false;
    recoveringStorage.setItem(OFFLINE_DATA_STORAGE_KEY, JSON.stringify(state("old")));
    const storage = createStorage(unavailable, "durable-rollback", 60_000, recoveringStorage);
    await storage.prepare();

    await storage.storage.setItem(OFFLINE_DATA_STORAGE_KEY, state("current"));
    recoveringStorage.failWhenValueIncludes = '"restore"';

    await expect(storage.writeDurably(OFFLINE_DATA_STORAGE_KEY, state("restore")))
      .rejects.toMatchObject({ code: "QUOTA_EXCEEDED" });

    recoveringStorage.failWhenValueIncludes = null;
    await storage.flush();
    expect(recoveringStorage.getItem(OFFLINE_DATA_STORAGE_KEY))
      .toBe(JSON.stringify(state("current")));
  });

  it("retains legacy data when IndexedDB cannot be opened", async () => {
    const legacy = state("safe");
    localStorage.setItem(OFFLINE_DATA_STORAGE_KEY, JSON.stringify(legacy));
    const unavailable = {
      open: () => {
        throw new DOMException("unavailable", "UnknownError");
      },
    } as unknown as IDBFactory;
    const storage = createStorage(unavailable, "unavailable");

    await expect(storage.prepare()).resolves.toBe("legacy-local-storage");
    await expect(storage.storage.getItem(OFFLINE_DATA_STORAGE_KEY)).resolves.toEqual(legacy);
    expect(localStorage.getItem(OFFLINE_DATA_STORAGE_KEY)).toBe(JSON.stringify(legacy));
  });

  it("does not treat an unavailable authoritative IndexedDB as an empty new store", async () => {
    localStorage.setItem(OFFLINE_DATA_AUTHORITY_MARKER, "indexeddb-v1");
    const unavailable = {
      open: () => {
        throw new DOMException("unavailable", "UnknownError");
      },
    } as unknown as IDBFactory;
    const storage = createStorage(unavailable, "authoritative-unavailable");

    await expect(storage.prepare()).rejects.toBeInstanceOf(OfflineDataStorageError);
  });

  it("does not create an empty localStorage split-brain after a temporary IndexedDB error", async () => {
    const unavailable = {
      open: () => {
        throw new DOMException("temporarily unavailable", "UnknownError");
      },
    } as unknown as IDBFactory;
    const storage = createStorage(unavailable, "temporary-unavailable");

    await expect(storage.prepare()).rejects.toMatchObject({ code: "INDEXED_DB_UNAVAILABLE" });
    expect(localStorage.getItem(OFFLINE_DATA_STORAGE_KEY)).toBeNull();
  });

  it("reopens IndexedDB once when Safari-style connection invalidation occurs", async () => {
    const indexedDb = new IDBFactory();
    let invalidateFirstTransaction = true;
    const reconnectingFactory = {
      open: (name: string, version?: number) => {
        const request = version === undefined ? indexedDb.open(name) : indexedDb.open(name, version);
        request.addEventListener("success", () => {
          const database = request.result;
          const transaction = database.transaction.bind(database);
          Object.defineProperty(database, "transaction", {
            configurable: true,
            value: (...transactionArgs: Parameters<IDBDatabase["transaction"]>) => {
              if (invalidateFirstTransaction) {
                invalidateFirstTransaction = false;
                database.close();
                throw new DOMException("connection closed", "InvalidStateError");
              }
              return transaction(...transactionArgs);
            },
          });
        }, { once: true });
        return request;
      },
    } as unknown as IDBFactory;
    const storage = createStorage(reconnectingFactory, "reconnect-once");

    await expect(storage.prepare()).resolves.toBe("indexeddb");
    await storage.writeDurably(OFFLINE_DATA_STORAGE_KEY, state("after-reconnect"));
    await expect(storage.storage.getItem(OFFLINE_DATA_STORAGE_KEY))
      .resolves.toEqual(state("after-reconnect"));
  });

  it("rejects a stale tab write instead of overwriting a newer IndexedDB snapshot", async () => {
    const indexedDb = new IDBFactory();
    const staleTab = createStorage(indexedDb, "cross-tab-conflict");
    const currentTab = createStorage(indexedDb, "cross-tab-conflict");
    await Promise.all([staleTab.prepare(), currentTab.prepare()]);

    await currentTab.writeDurably(OFFLINE_DATA_STORAGE_KEY, state("current"));
    await expect(staleTab.writeDurably(OFFLINE_DATA_STORAGE_KEY, state("stale")))
      .rejects.toMatchObject({ code: "WRITE_CONFLICT" });

    await expect(currentTab.storage.getItem(OFFLINE_DATA_STORAGE_KEY))
      .resolves.toEqual(state("current"));
  });

  it("leaves malformed legacy bytes untouched instead of replacing them", async () => {
    const malformed = "{not-valid-json";
    localStorage.setItem(OFFLINE_DATA_STORAGE_KEY, malformed);
    const storage = createStorage(new IDBFactory(), "malformed-legacy");

    await expect(storage.prepare()).rejects.toMatchObject({ code: "LEGACY_DATA_INVALID" });
    expect(localStorage.getItem(OFFLINE_DATA_STORAGE_KEY)).toBe(malformed);
  });
});
