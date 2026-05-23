import { useParams } from '@tanstack/react-router'
import { ProjectEditorShell } from '@/features/projects/components/project-editor-shell'

export function ProjectEditPage() {
  const { id } = useParams({ from: '/app/projects/$id' })

  return <ProjectEditorShell mode="edit" projectId={id} />
}

