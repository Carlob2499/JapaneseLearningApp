import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'
import { gunzipSync } from 'node:zlib'

const execFileP = promisify(execFile)

/**
 * Download via `curl`, which honors the environment's HTTPS proxy + CA bundle
 * (and works with direct egress in CI). Node's global fetch does not pick up
 * HTTPS_PROXY automatically, so curl is the portable choice for a build script.
 */
export async function curlDownload(url: string, destPath: string): Promise<void> {
  await execFileP('curl', ['-sSL', '--fail', '--max-time', '180', '-o', destPath, url])
}

/** Fetch a text resource to a string (for small license/HTML checks). */
export async function curlText(url: string): Promise<string> {
  const { stdout } = await execFileP('curl', ['-sSL', '--fail', '--max-time', '60', url], {
    maxBuffer: 32 * 1024 * 1024,
  })
  return stdout
}

export function sha256(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex')
}

export function gunzipIf(buf: Buffer, gzipped: boolean): Buffer {
  return gzipped ? gunzipSync(buf) : buf
}
