import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// pipeline/src/lib/paths.ts → repo root is three directories up.
const HERE = dirname(fileURLToPath(import.meta.url))

export const REPO_ROOT = join(HERE, '..', '..', '..')
export const CACHE_DIR = join(REPO_ROOT, 'pipeline', '.cache')
export const DOWNLOADS_DIR = join(CACHE_DIR, 'downloads')
export const INTERMEDIATES_DIR = join(CACHE_DIR, 'intermediates')
export const CONTENT_DIR = join(REPO_ROOT, 'content')
export const PACKS_DIR = join(CONTENT_DIR, 'packs')
