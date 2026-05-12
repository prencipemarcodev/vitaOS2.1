import { useState, useCallback } from 'react'

/**
 * useNotifications — hook placeholder.
 * Verrà implementato nella Fase 7 con i trigger reali.
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState([])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const dismiss = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return { notifications, unreadCount, markAsRead, markAllAsRead, dismiss }
}
