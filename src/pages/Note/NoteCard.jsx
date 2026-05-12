import { Pin, Trash2, Edit2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useNoteStore } from '@/store/useNoteStore'
import { toast } from 'sonner'
import Card from '@/components/ui/Card'
import clsx from 'clsx'

function NoteCard({ note, onEdit }) {
  const { removeNote, updateNote } = useNoteStore()

  const handleTogglePin = async (e) => {
    e.stopPropagation()
    const { data, error } = await supabase.from('notes').update({ is_pinned: !note.is_pinned }).eq('id', note.id).select().single()
    if (!error) updateNote(note.id, data)
  }

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!confirm('Eliminare questa nota?')) return
    const { error } = await supabase.from('notes').delete().eq('id', note.id)
    if (!error) {
      removeNote(note.id)
      toast.success('Nota eliminata')
    }
  }

  return (
    <Card 
      padding="md" 
      onClick={() => onEdit(note)}
      className={clsx(
        'group cursor-pointer transition-all hover:shadow-md relative break-inside-avoid mb-4',
        note.color || 'bg-white',
        'border border-[var(--border-subtle)]'
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-bold text-[var(--text-primary)] line-clamp-2">{note.title}</h4>
        <button 
          onClick={handleTogglePin}
          className={clsx(
            'p-1 rounded-md transition-colors',
            note.is_pinned ? 'text-[var(--color-primary)] bg-[var(--color-primary-ghost)]' : 'text-[var(--text-muted)] hover:bg-black/5'
          )}
        >
          <Pin size={14} className={note.is_pinned ? 'fill-current' : ''} />
        </button>
      </div>

      <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap line-clamp-[10]">
        {note.content}
      </p>

      <div className="mt-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">
          {new Date(note.updated_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
        </span>
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); onEdit(note) }} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--color-primary)]">
            <Edit2 size={12} />
          </button>
          <button onClick={handleDelete} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--color-danger)]">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </Card>
  )
}

export default NoteCard
