// Dependency-free placeholder icon generator (session 4 scaffold).
// Draws the Hikkoshi mark — a torii silhouette over a rising sun on indigo —
// into public/icons/*.png (and public/favicon.svg). The visual-identity session
// (architecture §9, item 8) will replace these; regenerate with `npm run icons`.
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// ---------- tiny PNG encoder (truecolor+alpha, no interlace) ----------
const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c
})
function crc32(buf) {
  let c = -1
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}
function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  const raw = Buffer.alloc(height * (1 + width * 4))
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0 // filter: none
    rgba.copy(raw, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ---------- rasterizer: indigo field, sun disc, white torii ----------
const INDIGO = [0x17, 0x14, 0x1f, 255]
const RED = [0xbc, 0x00, 0x2d, 255]
const WHITE = [0xf6, 0xf4, 0xef, 255]

function drawIcon(size) {
  const px = Buffer.alloc(size * size * 4)
  const put = (x, y, [r, g, b, a]) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    px[i] = r
    px[i + 1] = g
    px[i + 2] = b
    px[i + 3] = a
  }
  const rect = (x0, y0, w, h, c) => {
    for (let y = Math.round(y0); y < Math.round(y0 + h); y++)
      for (let x = Math.round(x0); x < Math.round(x0 + w); x++) put(x, y, c)
  }

  // full-bleed background (maskable-safe)
  rect(0, 0, size, size, INDIGO)

  // rising sun, upper-center (kept inside the 80% safe zone)
  const cx = size * 0.5
  const cy = size * 0.42
  const r = size * 0.27
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) put(x, y, RED)

  // torii silhouette in white — two beams, two pillars
  const u = size / 100
  rect(18 * u, 34 * u, 64 * u, 7 * u, WHITE) // kasagi (top beam)
  rect(24 * u, 46 * u, 52 * u, 5 * u, WHITE) // nuki (lower beam)
  rect(28 * u, 34 * u, 6.5 * u, 46 * u, WHITE) // left pillar
  rect(65.5 * u, 34 * u, 6.5 * u, 46 * u, WHITE) // right pillar

  return encodePng(size, size, px)
}

mkdirSync(join(root, 'public/icons'), { recursive: true })
for (const size of [192, 512]) {
  writeFileSync(join(root, `public/icons/icon-${size}.png`), drawIcon(size))
  console.log(`wrote public/icons/icon-${size}.png`)
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="18" fill="#17141f"/>
  <circle cx="50" cy="42" r="27" fill="#bc002d"/>
  <g fill="#f6f4ef">
    <rect x="18" y="34" width="64" height="7"/>
    <rect x="24" y="46" width="52" height="5"/>
    <rect x="28" y="34" width="6.5" height="46"/>
    <rect x="65.5" y="34" width="6.5" height="46"/>
  </g>
</svg>
`
writeFileSync(join(root, 'public/favicon.svg'), svg)
console.log('wrote public/favicon.svg')
