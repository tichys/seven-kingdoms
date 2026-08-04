import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) return { toast: () => {} }
  return ctx
}

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    if (timers.current[id]) {
      clearTimeout(timers.current[id])
      delete timers.current[id]
    }
  }, [])

  const toast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    timers.current[id] = setTimeout(() => remove(id), duration)
  }, [remove])

  const toastSuccess = useCallback((msg, dur) => toast(msg, 'success', dur), [toast])
  const toastError = useCallback((msg, dur) => toast(msg, 'error', dur), [toast])
  const toastInfo = useCallback((msg, dur) => toast(msg, 'info', dur), [toast])

  return (
    <ToastContext.Provider value={{ toast, toastSuccess, toastError, toastInfo }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`} onClick={() => remove(t.id)}>
            <span className="toast-icon">
              {t.type === 'success' ? '\u2713' : t.type === 'error' ? '\u2717' : '\u2139'}
            </span>
            <span className="toast-message">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
