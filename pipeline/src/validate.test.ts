import { describe, it, expect } from 'vitest'
import type { ManifestEntry, Pack } from '@hikkoshi/schemas'
import { checkPack } from './validate'
import { sha256 } from './lib/io'

const pack: Pack = {
  schemaVersion: '1.0.0',
  packId: 'vocab.l1.core',
  packVersion: '0.1.0',
  title: 'Vocabulary — L1 (≈N5)',
  license: { spdx: 'CC-BY-SA-4.0' },
  sources: [
    {
      name: 'JMdict (English)',
      url: 'http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz',
      retrieved: '2026-07-11',
      license: 'CC-BY-SA-4.0',
    },
  ],
  verification: { status: 'dataset-verified', method: 'JMdict join', date: '2026-07-11' },
  items: [
    {
      kind: 'vocab',
      id: 'vocab:1358280:たべる',
      jmdictSeq: 1358280,
      expression: '食べる',
      reading: 'たべる',
      senses: [{ gloss: ['to eat'], pos: ['v1'] }],
      level: 'L1',
      modules: [],
    },
  ],
}

function bytesFor(p: unknown): Buffer {
  return Buffer.from(JSON.stringify(p) + '\n')
}

function entryFor(bytes: Buffer, over: Partial<ManifestEntry> = {}): ManifestEntry {
  return {
    packId: 'vocab.l1.core',
    path: 'l1/vocab.json',
    level: 'L1',
    domain: 'vocab',
    packVersion: '0.1.0',
    itemCount: 1,
    sha256: sha256(bytes),
    ...over,
  }
}

describe('checkPack', () => {
  it('passes a valid, provenanced, sha-matched pack', () => {
    const bytes = bytesFor(pack)
    expect(checkPack(entryFor(bytes), bytes)).toEqual([])
  })

  it('flags a sha256 mismatch (pack edited out-of-band)', () => {
    const bytes = bytesFor(pack)
    const tampered = Buffer.from(bytes.toString().replace('食べる', '喰べる'))
    const errs = checkPack(entryFor(bytes), tampered)
    expect(errs.some((e) => e.includes('sha256 mismatch'))).toBe(true)
  })

  it('rejects a pack whose provenance was stripped (D-002 gate)', () => {
    const noSources = { ...pack, sources: [] }
    const bytes = bytesFor(noSources)
    const errs = checkPack(entryFor(bytes), bytes)
    expect(errs.length).toBeGreaterThan(0)
  })

  it('flags an itemCount that disagrees with the manifest', () => {
    const bytes = bytesFor(pack)
    const errs = checkPack(entryFor(bytes, { itemCount: 999 }), bytes)
    expect(errs.some((e) => e.includes('itemCount'))).toBe(true)
  })
})
