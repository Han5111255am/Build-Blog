import { useParams } from '@tanstack/react-router'
import { PhotoEditorShell } from '@/features/photos/components/photo-editor-shell'

export function PhotoEditPage() {
  const { id } = useParams({ from: '/app/photos/$id' })
  return <PhotoEditorShell mode="edit" photoId={id} />
}

