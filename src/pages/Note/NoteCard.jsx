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

  // Dimensioni dinamiche basate sul contenuto
  const contentLength = note.content?.length || 0
  const size = contentLength < 80 ? 'small' : contentLength < 250 ? 'medium' : 'large'

  return (
    <Card 
      padding="sm" 
      onClick={() => onEdit(note)}
      style={{ backgroundColor: note.color || '#ffffff' }}
      className={clsx(
        'group cursor-pointer transition-all hover:shadow-md relative break-inside-avoid mb-4 border-none shadow-sm',
        size === 'small' ? 'min-h-[100px]' : size === 'medium' ? 'min-h-[160px]' : 'min-h-[220px]'
      )}
    >
      <div className="flex justify-between items-start mb-1">
        <h4 className="text-[13px] font-black text-black/80 leading-tight pr-6">{note.title}</h4>
        <button 
          onClick={handleTogglePin}
          className={clsx(
            'absolute top-2 right-2 p-1 rounded-md transition-colors',
            note.is_pinned ? 'text-orange-600 bg-orange-100' : 'text-gray-400 hover:bg-black/5'
          )}
        >
          <Pin size={12} className={note.is_pinned ? 'fill-current' : ''} />
        </button>
      </div>

      <p className={clsx(
        'text-xs text-black/60 leading-relaxed whitespace-pre-wrap',
        size === 'small' ? 'line-clamp-4' : size === 'medium' ? 'line-clamp-8' : 'line-clamp-[15]'
      )}>
        {note.content}
      </p>

      <div className="mt-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[8px] font-black text-black/30 uppercase tracking-tighter">
          {new Date(note.updated_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
        </span>
        <div className="flex gap-0.5">
          <button onClick={(e) => { e.stopPropagation(); onEdit(note) }} className="p-1 text-black/40 hover:text-black">
            <Edit2 size={10} />
          </button>
          <button onClick={handleDelete} className="p-1 text-black/40 hover:text-red-500">
            <Trash2 size={10} />
          </button>
        </div>
      </div>
    </Card>
  )
}

export default NoteCard
