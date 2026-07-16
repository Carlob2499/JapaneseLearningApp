import { useEffect, useState } from 'react'
import { timeBucket, type TimeBucket } from '../lib/timeOfDay'
import { season, type Season } from '../lib/season'

/** Re-read cadence: the ground only needs to notice an hour/season change, not track seconds. */
const REFRESH_MS = 10 * 60_000

export interface AmbientGround {
  tod: TimeBucket
  season: Season
}

function current(): AmbientGround {
  const now = new Date()
  return { tod: timeBucket(now.getHours()), season: season(now.getMonth() + 1) }
}

/**
 * The living ground (D-033): stamps the current time-of-day and kisetsu season onto
 * `<html data-tod data-season>` — where index.css's ground tokens read them — and mirrors them
 * into state for the AmbientLayer. Refreshes on a slow interval and whenever the tab becomes
 * visible again (a phone left overnight wakes to the right morning). Called once, in App.
 */
export function useAmbientGround(): AmbientGround {
  const [ground, setGround] = useState<AmbientGround>(current)

  useEffect(() => {
    const apply = () => {
      const next = current()
      document.documentElement.dataset.tod = next.tod
      document.documentElement.dataset.season = next.season
      setGround((prev) => (prev.tod === next.tod && prev.season === next.season ? prev : next))
    }
    apply()
    const onVisible = () => {
      if (!document.hidden) apply()
    }
    const timer = setInterval(apply, REFRESH_MS)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return ground
}
