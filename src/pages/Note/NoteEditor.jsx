import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useNoteStore } from '@/store/useNoteStore'
import { useNotifications } from '@/hooks/useNotifications'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { toast } from 'sonner'

const COLORS = [
  { name: 'Default', bg: 'bg-white', border: 'border-[var(--border-subtle)]' },
  { name: 'Yellow', bg: 'bg-[#fff9c4]', border: 'border-[#fff176]' },
  { name: 'Blue', bg: 'bg-[#e3f2fd]', border: 'border-[#90caf9]' },
  { name: 'Green', bg: 'bg-[#f1f8e9]', border: 'border-[#c5e1a5]' },
  { name: 'Red', bg: 'bg-[#ffebee]', border: 'border-[#ef9a9a]' },
  { name: 'Purple', bg: 'bg-[#f3e5f5]', border: 'border-[#ce93d8]' },
]

function NoteEditor({ isOpen, onClose, noteToEdit = null }) {
  const { addNote, updateNote } = useNoteStore()
  const { pushError } = useNotifications()
  const [loading, setLoading] = useState(false)
  const [showAllColors, setShowAllColors] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    color: '#ffffff',
    is_pinned: false,
    tags: [],
  })

  useEffect(() => {
    if (noteToEdit) {
      setFormData({
        title: noteToEdit.title || '',
        content: noteToEdit.content || '',
        color: noteToEdit.color || '#ffffff',
        is_pinned: noteToEdit.is_pinned || false,
        tags: noteToEdit.tags || [],
      })
    } else {
      setFormData({ title: '', content: '', color: '#ffffff', is_pinned: false, tags: [] })
    }
    setShowAllColors(false)
  }, [noteToEdit, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.content.trim()) return
    setLoading(true)

    try {
      const payload = { ...formData, updated_at: new Date().toISOString() }
      if (noteToEdit) {
        const { data, error } = await supabase.from('notes').update(payload).eq('id', noteToEdit.id).select().single()
        if (error) throw error
        updateNote(noteToEdit.id, data)
        toast.success('Nota aggiornata')
      } else {
        const { data, error } = await supabase.from('notes').insert(payload).select().single()
        if (error) throw error
        addNote(data)
        toast.success('Nota creata')
      }
      onClose()
    } catch (err) {
      pushError('Errore nel salvataggio')
    } finally {
      setLoading(false)
    }
  }

  const hexColors = [
    '#ffffff', '#fff9c4', '#e3f2fd', '#f1f8e9', '#ffebee', '#f3e5f5', '#e0f2f1', '#fff3e0'
  ]

  const visibleColors = showAllColors ? hexColors : hexColors.slice(0, 4)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={noteToEdit ? 'Modifica Nota' : 'Nuova Nota'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="px-1 space-y-3">
          <Input 
            placeholder="Titolo" 
            value={formData.title} 
            onChange={e => setFormData({ ...formData, title: e.target.value })} 
            className="border-0 text-xl font-black p-0 focus:ring-0 shadow-none placeholder:text-gray-300"
          />
          <textarea
            placeholder="Inizia a scrivere..."
            className="w-full h-48 resize-none bg-transparent border-0 focus:ring-0 text-base leading-relaxed p-0 scrollbar-hide placeholder:text-gray-300"
            value={formData.content}
            onChange={e => setFormData({ ...formData, content: e.target.value })}
            required
          />
        </div>

        <div className="flex flex-col gap-4 pt-4 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {visibleColors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c })}
                  className="w-7 h-7 rounded-full border border-[var(--border-subtle)] transition-transform active:scale-90"
                  style={{ 
                    backgroundColor: c,
                    ring: formData.color === c ? '2px solid var(--color-primary)' : 'none',
                    outline: formData.color === c ? '2px solid var(--color-primary)' : 'none',
                    outlineOffset: '2px'
                  }}
                />
              ))}
              {!showAllColors && (
                <button 
                  type="button"
                  onClick={() => setShowAllColors(true)}
                  className="w-7 h-7 rounded-full border border-[var(--border-subtle)] bg-gray-50 flex items-center justify-center text-[var(--text-muted)] hover:bg-gray-100"
                >
                  <span className="text-xs font-bold">...</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} className="flex-1">Annulla</Button>
            <Button variant="primary" type="submit" loading={loading} className="flex-[2] py-6 shadow-lg shadow-black/5 font-black uppercase tracking-widest">Salva</Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default NoteEditor
