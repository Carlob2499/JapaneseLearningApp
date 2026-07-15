import { openDB, type IDBPDatabase } from 'idb'
import type { ItemState, JournalEntry } from '@hikkoshi/schemas'

// Progress persistence lives in IndexedDB (D-001); settings would use localStorage.
const DB_NAME = 'hikkoshi'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase> | null = null

function db(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(d) {
        if (!d.objectStoreNames.contains('itemStates')) {
          d.createObjectStore('itemStates', { keyPath: 'itemId' })
        }
        if (!d.objectStoreNames.contains('journal')) {
          d.createObjectStore('journal', { autoIncrement: true })
        }
      },
    })
  }
  return dbPromise
}

export async function getAllItemStates(): Promise<ItemState[]> {
  return (await db()).getAll('itemStates') as Promise<ItemState[]>
}

export async function putItemState(state: ItemState): Promise<void> {
  await (await db()).put('itemStates', state)
}

/** Write many item states in one transaction — the placement probe seeds a level's worth at once. */
export async function putItemStates(states: readonly ItemState[]): Promise<void> {
  if (states.length === 0) return
  const tx = (await db()).transaction('itemStates', 'readwrite')
  await Promise.all([...states.map((s) => tx.store.put(s)), tx.done])
}

export async function appendJournal(entry: JournalEntry): Promise<void> {
  await (await db()).add('journal', entry)
}

/** Append many journal entries in one transaction — used when restoring an imported backup. */
export async function appendJournalEntries(entries: readonly JournalEntry[]): Promise<void> {
  if (entries.length === 0) return
  const tx = (await db()).transaction('journal', 'readwrite')
  await Promise.all([...entries.map((e) => tx.store.add(e)), tx.done])
}

/** The full append-only review log — read for leech detection (fails in a trailing window). */
export async function getJournal(): Promise<JournalEntry[]> {
  return (await db()).getAll('journal') as Promise<JournalEntry[]>
}
