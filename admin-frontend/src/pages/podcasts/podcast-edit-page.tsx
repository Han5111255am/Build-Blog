import { useParams } from '@tanstack/react-router'
import { PodcastEditorShell } from '@/features/podcasts/components/podcast-editor-shell'

export function PodcastEditPage() {
  const { id } = useParams({ from: '/app/podcasts/$id' })
  return <PodcastEditorShell mode="edit" podcastId={id} />
}

