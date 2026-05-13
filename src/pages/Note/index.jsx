import { useState, useMemo } from 'react'
import { useNoteStore } from '@/store/useNoteStore'
import Header from '@/components/layout/Header'
import PageWrapper from '@/components/layout/PageWrapper'
import Button from '@/components/ui/Button'
import { Plus, Search, StickyNote } from 'lucide-react'
import NoteCard from './NoteCard'
import NoteEditor from './NoteEditor'

function Note() {
  const { notes, searchQuery, setSearchQuery, loading } = useNoteStore()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingNote, setEditingNote] = useState(null)

  const filteredNotes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return notes
    return notes.filter(n => 
      n.title?.toLowerCase().includes(q) || 
      n.content?.toLowerCase().includes(q)
    )
  }, [notes, searchQuery])

  const handleEdit = (note) => {
    setEditingNote(note)
    setEditorOpen(true)
  }

  const handleNew = () => {
    setEditingNote(null)
    setEditorOpen(true)
  }

  return (
    <>
      <Header 
        title="Note" 
        showNotification 
        actions={
          <div className="flex items-center gap-2">
            <div className="relative max-lg:hidden">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input 
                type="text" 
                placeholder="Cerca note..." 
                className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl pl-9 pr-4 py-1.5 text-xs w-48 focus:w-64 transition-all focus:outline-none"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              icon={Plus} 
              onClick={handleNew}
              className="font-bold !text-sm"
              style={{ fontFamily: 'var(--font-display)' }}
              hideTextMobile
            >
              Nuova Nota
            </Button>
          </div>
        }
      />

      <PageWrapper>
        <div className="h-full overflow-y-auto pr-1">
          {/* Mobile search bar */}
          <div className="lg:hidden mb-4 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input 
              type="text" 
              placeholder="Cerca note..." 
              className="w-full bg-white border border-[var(--border-subtle)] rounded-2xl pl-11 pr-4 py-3 text-sm shadow-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-30">
              <StickyNote size={48} className="mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest">Nessuna nota trovata</p>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
              {filteredNotes.map(note => (
                <NoteCard key={note.id} note={note} onEdit={handleEdit} />
              ))}
            </div>
          )}
        </div>
      </PageWrapper>

      <NoteEditor 
        isOpen={editorOpen} 
        onClose={() => setEditorOpen(false)} 
        noteToEdit={editingNote} 
      />
    </>
  )
}

export default Note
