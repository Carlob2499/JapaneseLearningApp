// jsdom ships no IndexedDB implementation; every store/db.ts-touching test needs this shim.
import 'fake-indexeddb/auto'
