/**
 * Split Tatoeba-style TSV text into rows of fields. Tatoeba exports have no
 * quoting and no embedded tabs/newlines in fields, so a plain split is correct
 * and fast. Blank lines are skipped.
 */
export function parseTsv(text: string): string[][] {
  const rows: string[][] = []
  for (const line of text.split('\n')) {
    if (line.length === 0) continue
    rows.push(line.split('\t'))
  }
  return rows
}
