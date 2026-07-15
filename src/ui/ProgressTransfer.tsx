import { useRef, useState } from 'react'
import { appendJournalEntries, getAllItemStates, getJournal, putItemStates } from '../store/db'
import { buildProgressExport, exportFilename, parseProgressExport } from '../store/transfer'

type Status = { kind: 'idle' } | { kind: 'error'; msg: string } | { kind: 'restored'; count: number }

/**
 * Back up / restore progress as a single JSON file (E7 / D-022) — no backend, nothing uploaded.
 * Import merges (item states overwrite by id, journal entries append), so restoring is never
 * destructive to progress the backup doesn't mention; a malformed file is rejected before any
 * write (parseProgressExport is the trust boundary).
 */
export default function ProgressTransfer() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleExport() {
    try {
      const [states, journal] = await Promise.all([getAllItemStates(), getJournal()])
      const snapshot = buildProgressExport(states, journal, new Date().toISOString())
      const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' }))
      const a = document.createElement('a')
      a.href = url
      a.download = exportFilename(snapshot.exportedAt)
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setStatus({ kind: 'idle' })
    } catch {
      setStatus({ kind: 'error', msg: 'Could not export your progress.' })
    }
  }

  async function handleFile(file: File) {
    try {
      const snapshot = parseProgressExport(JSON.parse(await file.text()))
      await putItemStates(snapshot.itemStates)
      await appendJournalEntries(snapshot.journalTail)
      setStatus({ kind: 'restored', count: snapshot.itemStates.length })
    } catch {
      setStatus({ kind: 'error', msg: "That file isn't a valid Hikkoshi backup." })
    }
  }

  return (
    <div className="progress-transfer">
      <p>
        <strong>Back up &amp; restore.</strong> Save your progress to a file, or restore it on another
        device. It stays on your device — nothing is uploaded.
      </p>
      <div className="progress-transfer-actions">
        <button type="button" className="ghost-btn" onClick={() => void handleExport()}>
          Export backup
        </button>
        <button type="button" className="ghost-btn" onClick={() => fileRef.current?.click()}>
          Restore from a backup…
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          data-testid="progress-import"
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = '' // let the same file be re-picked after an error
            if (f) void handleFile(f)
          }}
        />
      </div>
      {status.kind === 'error' && <p className="progress-transfer-status error">{status.msg}</p>}
      {status.kind === 'restored' && (
        <p className="progress-transfer-status ok">
          Restored {status.count.toLocaleString()} items.{' '}
          <button type="button" className="link-btn" onClick={() => location.reload()}>
            Reload to apply
          </button>
        </p>
      )}
    </div>
  )
}
