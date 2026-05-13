import { useCallback } from 'react'
import { useNotificationStore } from '@/store/useNotificationStore'
import { AlertCircle } from 'lucide-react'

/**
 * useNotifications — hook per gestire le notifiche globali e gli errori.
 */
export function useNotifications() {
  const { 
    notifications, 
    addNotification, 
    markAsRead, 
    markAllAsRead, 
    dismiss 
  } = useNotificationStore()

  const unreadCount = notifications.filter((n) => !n.read).length

  const pushError = useCallback((message) => {
    addNotification({
      type: 'error',
      message,
      icon: 'alert-circle',
      category: 'Errore'
    })
  }, [addNotification])

  const pushInfo = useCallback((message, icon = 'info') => {
    addNotification({
      type: 'info',
      message,
      icon,
      category: 'Info'
    })
  }, [addNotification])

  const pushSuccess = useCallback((message, icon = 'check-circle') => {
    addNotification({
      type: 'success',
      message,
      icon,
      category: 'Successo'
    })
  }, [addNotification])

  return { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    dismiss,
    pushError,
    pushInfo,
    pushSuccess
  }
}
