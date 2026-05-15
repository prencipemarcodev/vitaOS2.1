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
  const { pushError, pushSuccess } = useNotifications()
  const [loading, setLoading] = useState(false)
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
        pushSuccess(`Nota "${formData.title || 'Senza titolo'}" aggiornata`, 'edit-3')
        toast.success('Nota aggiornata')
      } else {
        const { data, error } = await supabase.from('notes').insert(payload).select().single()
        if (error) throw error
        addNote(data)
        pushSuccess(`Nota "${formData.title || 'Nuova nota'}" creata`, 'sticky-note')
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

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={noteToEdit ? 'Modifica Nota' : 'Nuova Nota'}
      style={{ backgroundColor: formData.color }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="px-4 space-y-2">
          <input 
            type="text"
            placeholder="Titolo" 
            value={formData.title} 
            onChange={e => setFormData({ ...formData, title: e.target.value })} 
            className="w-full border-0 text-2xl font-black p-0 focus:ring-0 shadow-none placeholder:text-black/10 bg-transparent text-black/80"
          />
          <textarea
            placeholder="Inizia a scrivere..."
            className="w-full h-80 resize-none bg-transparent border-0 focus:ring-0 text-base leading-relaxed p-0 scrollbar-hide placeholder:text-black/10 text-black/60"
            value={formData.content}
            onChange={e => setFormData({ ...formData, content: e.target.value })}
            required
          />
        </div>

        <div className="flex flex-col gap-3 pt-3 border-t border-black/5">
          <div className="flex items-center justify-center px-4">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {hexColors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c })}
                  className="w-6 h-6 rounded-full border border-black/5 transition-transform active:scale-90 shrink-0"
                  style={{ 
                    backgroundColor: c,
                    outline: formData.color === c ? '2px solid black' : 'none',
                    outlineOffset: '2px'
                  }}
                />
              ))}
            </div>
          </div>
          
          <div className="flex gap-2 px-4 pb-2">
            <Button variant="ghost" onClick={onClose} className="flex-1 text-black/40 font-bold">Annulla</Button>
            <Button 
              variant="primary" 
              type="submit" 
              loading={loading} 
              className="flex-1 py-5 shadow-xl shadow-black/10 font-black uppercase tracking-widest bg-black text-white"
            >
              Salva
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default NoteEditor
