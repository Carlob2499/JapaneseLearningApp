# Hikkoshi（引っ越し）— Japanese Learning Game

A life in Japan, one day at a time. An installable, offline-capable web game covering the
full JLPT N5–N1 curriculum **plus the real-world Japanese the exam skips** — konbini and
train-station scripts, keigo at work, bureaucracy, medical and emergency language,
handwriting, katakana decoding. The core design constraint: **maximum repetition without
perceived repetition** — your daily errands *are* the review queue.

**Live build:** deployed to GitHub Pages via CI (see Actions).

## Project documents (the source of truth)

| Doc | Contents |
|---|---|
| [`docs/research.md`](docs/research.md) | Session 1 — competitor analysis, coverage audit, repetition-disguise patterns (P1–P8) |
| [`docs/curriculum.md`](docs/curriculum.md) | Session 2 — N5→N1 progression map, real-world modules M1–M10, interleaving architecture |
| [`docs/design-options.md`](docs/design-options.md) | Session 3 — three concepts on one shared engine (E1–E8); Concept A selected |
| [`docs/architecture.md`](docs/architecture.md) | Session 4 — component map, pack schemas, SRS design, content pipeline, build order |
| [`docs/decisions.md`](docs/decisions.md) | Standing decisions D-001+ (stack, content integrity, tag provenance, concept selection) |

## Content integrity (non-negotiable)

No generated language content. All language data is pipeline-imported from licensed open
datasets with provenance recorded in pack metadata: **JMdict** and **KANJIDIC2**
(CC BY-SA 4.0, EDRDG), **KanjiVG** (CC BY-SA 3.0), **Tatoeba** (CC BY 2.0 FR), JLPT level
tags from Jonathan Waller's lists (CC BY). JLPT level tags are **community estimates** —
no official lists have been published since the 2010 revision, and the app says so.

## Development

```bash
npm ci          # install
npm run dev     # dev server
npm run typecheck
npm run lint    # oxlint
npm test        # vitest (jsdom)
npm run build   # tsc -b && vite build (PWA precache generated from output)
npm run icons   # regenerate placeholder icons (tools/gen-icons.mjs)
```

Stack: Vite + React + TypeScript PWA; IndexedDB for progress/SRS state; localStorage for
settings only; no backend. Deployed statically to GitHub Pages by `.github/workflows/ci.yml`
(typecheck → lint → test → build → deploy).

## Status

Session 4, build-order item 1 (scaffold + CI rail). Next: shared Zod schemas and the
content pipeline (`docs/architecture.md` §9).
