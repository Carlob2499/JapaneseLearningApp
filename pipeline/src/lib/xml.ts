const NAMED: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
}

/** Decode the five predefined XML entities plus numeric character references. */
export function decodeXml(s: string): string {
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-z]+);/g, (whole, ent: string) => {
    if (ent.startsWith('#')) {
      const cp =
        ent[1] === 'x' || ent[1] === 'X' ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10)
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : whole
    }
    return NAMED[ent] ?? whole
  })
}
