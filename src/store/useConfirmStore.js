import { create } from 'zustand'

export const useConfirmStore = create((set) => ({
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Conferma',
  cancelText: 'Annulla',
  variant: 'primary', // primary | danger | warning
  onConfirm: null,
  onCancel: null,

  confirm: (options = {}) => new Promise((resolve) => {
    set({
      isOpen: true,
      title: options.title || 'Sei sicuro?',
      message: options.message || '',
      confirmText: options.confirmText || 'Conferma',
      cancelText: options.cancelText || 'Annulla',
      variant: options.variant || 'primary',
      onConfirm: () => {
        set({ isOpen: false })
        resolve(true)
      },
      onCancel: () => {
        set({ isOpen: false })
        resolve(false)
      }
    })
  })
}))
