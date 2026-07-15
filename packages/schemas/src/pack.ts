import { z } from 'zod'
import { Level, LicenseRef, Source, Verification } from './common'
import { Item } from './items'

/**
 * Pack envelope — every emitted pack, no exceptions (D-002, D-005).
 * The content-integrity gate is structural: `sources` must be non-empty and
 * `verification` is required, so a pack without provenance cannot parse.
 */
export const Pack = z.object({
  schemaVersion: z.string().min(1),
  packId: z.string().min(1),
  packVersion: z.string().min(1),
  title: z.string().min(1),
  license: LicenseRef,
  sources: z.array(Source).min(1),
  levelTagSource: z.string().optional(),
  levelTagLicense: z.string().optional(),
  verification: Verification,
  items: z.array(Item).min(1),
})
export type Pack = z.infer<typeof Pack>

export const PackDomain = z.enum(['vocab', 'kanji', 'kana', 'grammar', 'sentence', 'strokes', 'phrase', 'scene'])
export type PackDomain = z.infer<typeof PackDomain>

/** One row in the pack manifest — enough to load, verify, and precache a pack. */
export const ManifestEntry = z.object({
  packId: z.string().min(1),
  path: z.string().min(1),
  level: Level,
  domain: PackDomain,
  packVersion: z.string().min(1),
  itemCount: z.number().int().nonnegative(),
  sha256: z.string().length(64),
})
export type ManifestEntry = z.infer<typeof ManifestEntry>

/** Top-level manifest of all committed packs (content/packs/manifest.json). */
export const Manifest = z.object({
  schemaVersion: z.string().min(1),
  generatedAt: z.string().min(1),
  packs: z.array(ManifestEntry),
})
export type Manifest = z.infer<typeof Manifest>

/** Current pack schema version. Bump major on breaking changes (architecture §4). */
export const SCHEMA_VERSION = '1.0.0'
