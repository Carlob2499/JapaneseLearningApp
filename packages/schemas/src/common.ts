import { z } from 'zod'

/** Six-level progression (design-options.md §0): L0 kana/survival … L5 ≈ N1. */
export const Level = z.enum(['L0', 'L1', 'L2', 'L3', 'L4', 'L5'])
export type Level = z.infer<typeof Level>

/** Real-world modules M1–M10, exactly as defined in curriculum.md §4. */
export const ModuleTag = z.enum([
  'M1_katakana',
  'M2_konbini',
  'M3_transit',
  'M4_counters',
  'M5_casual',
  'M6_onomatopoeia',
  'M7_keigo',
  'M8_bureaucracy',
  'M9_medical',
  'M10_handwriting',
])
export type ModuleTag = z.infer<typeof ModuleTag>

/** Speech registers (architecture.md §4). */
export const Register = z.enum([
  'plain',
  'polite',
  'keigo_respectful',
  'keigo_humble',
  'casual',
  'service_script',
])
export type Register = z.infer<typeof Register>

/** Provenance record — one dataset/source behind a pack (D-002). */
export const Source = z.object({
  name: z.string().min(1),
  url: z.url(),
  retrieved: z.string().min(1), // ISO date the source was fetched
  license: z.string().min(1), // SPDX id or license name
})
export type Source = z.infer<typeof Source>

/** SPDX license reference for the pack as a whole. */
export const LicenseRef = z.object({
  spdx: z.string().min(1),
  notes: z.string().optional(),
})
export type LicenseRef = z.infer<typeof LicenseRef>

/** Verification status stamped into every pack (D-002). */
export const VerificationStatus = z.enum(['dataset-verified', 'curated-cited', 'unverified'])
export type VerificationStatus = z.infer<typeof VerificationStatus>

export const Verification = z.object({
  status: VerificationStatus,
  method: z.string().min(1),
  date: z.string().min(1),
})
export type Verification = z.infer<typeof Verification>
