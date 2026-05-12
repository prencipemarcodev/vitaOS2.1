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
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    color: 'bg-white',
    is_pinned: false,
    tags: [],
  })

  useEffect(() => {
    if (noteToEdit) {
      setFormData({
        title: noteToEdit.title || '',
        content: noteToEdit.content || '',
        color: noteToEdit.color || 'bg-white',
        is_pinned: noteToEdit.is_pinned || false,
        tags: noteToEdit.tags || [],
      })
    } else {
      setFormData({ title: '', content: '', color: 'bg-white', is_pinned: false, tags: [] })
    }
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={noteToEdit ? 'Modifica Nota' : 'Nuova Nota'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input 
          placeholder="Titolo" 
          value={formData.title} 
          onChange={e => setFormData({ ...formData, title: e.target.value })} 
          className="border-0 text-lg font-bold p-0 focus:ring-0 shadow-none"
        />
        <textarea
          placeholder="Inizia a scrivere..."
          className="w-full h-40 resize-none bg-transparent border-0 focus:ring-0 text-base lg:text-sm leading-relaxed p-0 scrollbar-hide"
          value={formData.content}
          onChange={e => setFormData({ ...formData, content: e.target.value })}
          required
        />

        <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
          <div className="flex gap-2">
            {COLORS.map(c => (
              <button
                key={c.bg}
                type="button"
                onClick={() => setFormData({ ...formData, color: c.bg })}
                className={`w-6 h-6 rounded-full border-2 ${c.bg} ${c.border} ${formData.color === c.bg ? 'ring-2 ring-[var(--color-primary)] ring-offset-2' : ''}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Annulla</Button>
            <Button variant="primary" type="submit" loading={loading}>Salva</Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default NoteEditor
