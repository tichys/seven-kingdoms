import { useEffect, useRef, useCallback } from 'react'

export function usePolling(callback, intervalMs = 30000, enabled = true) {
  const savedCallback = useRef(callback)
  const timerRef = useRef(null)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  const poll = useCallback(async () => {
    try {
      await savedCallback.current()
    } catch {
      // Silent fail — polling should never crash the UI
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    poll()
    timerRef.current = setInterval(poll, intervalMs)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [poll, intervalMs, enabled])
}
