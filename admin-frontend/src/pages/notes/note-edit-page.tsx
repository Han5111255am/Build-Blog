import { useParams } from '@tanstack/react-router'
import { NoteEditorShell } from '@/features/notes/components/note-editor-shell'

export function NoteEditPage() {
  const { id } = useParams({ from: '/app/notes/$id' })

  return <NoteEditorShell mode="edit" noteId={id} />
}

