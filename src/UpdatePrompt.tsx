import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Update flow per docs/architecture.md §7: new versions never reload silently;
 * the user chooses when. Offline-ready is announced once, quietly.
 */
export default function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!offlineReady && !needRefresh) return null

  return (
    <div className="sw-toast" role="status">
      {needRefresh ? (
        <>
          <span>New version available.</span>
          <button onClick={() => updateServiceWorker(true)}>Reload</button>
          <button className="ghost" onClick={() => setNeedRefresh(false)}>
            Later
          </button>
        </>
      ) : (
        <>
          <span>Ready to work offline.</span>
          <button className="ghost" onClick={() => setOfflineReady(false)}>
            OK
          </button>
        </>
      )}
    </div>
  )
}
