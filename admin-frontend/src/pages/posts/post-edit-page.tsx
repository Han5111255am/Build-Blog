import { useParams } from '@tanstack/react-router'
import { PostEditorShell } from '@/features/posts/components/post-editor-shell'

export function PostEditPage() {
  const { id } = useParams({ from: '/app/posts/$id' })

  return <PostEditorShell mode="edit" postId={id} />
}

