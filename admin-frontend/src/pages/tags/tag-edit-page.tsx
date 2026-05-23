import { useParams } from '@tanstack/react-router'
import { TagEditorShell } from '@/features/tags/components/tag-editor-shell'

export function TagEditPage() {
  const { id } = useParams({ from: '/app/tags/$id' })

  return <TagEditorShell mode="edit" tagId={id} />
}

