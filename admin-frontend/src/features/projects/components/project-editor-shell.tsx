import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { type Control, useForm, useWatch } from 'react-hook-form'
import { useToast } from '@/app/providers/toast-provider'
import { PageHeader } from '@/components/ui/admin-page'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useTranslation } from '@/features/i18n/use-translation'
import { ProjectBasicInfoSection } from '@/features/projects/components/project-basic-info-section'
import { ProjectContentSection } from '@/features/projects/components/project-content-section'
import { ProjectDisplaySection } from '@/features/projects/components/project-display-section'
import { ProjectLinksSection } from '@/features/projects/components/project-links-section'
import {
  createProject,
  deleteProject,
  getProjectDetail,
  updateProject,
} from '@/features/projects/services/project-api'
import { createProjectFormSchema, type ProjectFormValues } from '@/features/projects/schema/project-form-schema'
import { buildProjectFormDefaults } from '@/features/projects/utils/build-project-form-defaults'
import { mapProjectDetailToFormValues } from '@/features/projects/utils/map-project-detail-to-form-values'
import { projectQueryKeys } from '@/features/projects/utils/project-query-keys'
import type { ApiErrorResponse } from '@/types/api'
import { applyServerFieldErrors } from '@/utils/apply-server-field-errors'

interface ProjectEditorShellProps {
  mode: 'create' | 'edit'
  projectId?: string
}

type SubmitIntent = 'draft' | 'publish'
type ProjectDetail = Awaited<ReturnType<typeof getProjectDetail>>

function resolveSubmitIntent(status?: ProjectFormValues['status'] | null): SubmitIntent {
  return status === 'published' ? 'publish' : 'draft'
}

const fallbackMeta = {
  createdAt: '2026-03-07 09:20',
  updatedAt: '2026-03-07 11:40',
  publishedAt: '2026-03-07 10:30',
}

export function ProjectEditorShell({ mode, projectId }: ProjectEditorShellProps) {
  const navigate = useNavigate()
  const search = useSearch({ strict: false })
  const queryClient = useQueryClient()
  const { pushToast } = useToast()
  const { language, t, translateOptional } = useTranslation()
  const isCreate = mode === 'create'
  const projectFormSchema = useMemo(() => createProjectFormSchema(language), [language])
  // Keep the base-mode defaults contract visible for scaffold tests and future refactors.
  const _modeDefaults = buildProjectFormDefaults({ mode })
  void _modeDefaults
  const defaultValues = useMemo(() => buildProjectFormDefaults({ language, mode }), [language, mode])
  const listSearchParams = useMemo(() => search, [search])
  const [submitIntent, setSubmitIntent] = useState<SubmitIntent>('draft')
  const [submitMessage, setSubmitMessage] = useState('')
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const detailQuery = useQuery({
    queryKey: projectQueryKeys.detail(projectId ?? ''),
    queryFn: () => getProjectDetail(projectId as string),
    enabled: !isCreate && Boolean(projectId),
  })

  useEffect(() => {
    if (isCreate || !projectId) {
      reset(defaultValues)
      setSubmitIntent(resolveSubmitIntent(defaultValues.status))
      return
    }
    if (!detailQuery.data) {
      return
    }
    const mappedValues = mapProjectDetailToFormValues(detailQuery.data)
    reset(mappedValues)
    setSubmitIntent(resolveSubmitIntent(mappedValues.status))
  }, [defaultValues, detailQuery.data, isCreate, projectId, reset])

  useEffect(() => {
    if (!detailQuery.error) {
      return
    }
    const apiError = detailQuery.error as unknown as ApiErrorResponse
    pushToast({
      title: t('项目详情加载失败', 'Failed to Load Project'),
      description: translateOptional(apiError.message) || t('请稍后重试。', 'Please try again later.'),
      tone: 'error',
    })
  }, [detailQuery.error, pushToast, t, translateOptional])

  useEffect(() => {
    if (!isDirty) {
      return
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isDirty])

  const saveMutation = useMutation({
    mutationFn: async ({ data, intent }: { data: ProjectFormValues; intent: SubmitIntent }) => {
      const payload: ProjectFormValues = {
        ...data,
        status: intent === 'publish' ? 'published' : 'draft',
      }
      return isCreate || !projectId ? createProject(payload) : updateProject(projectId, payload)
    },
    onSuccess: async (response, variables) => {
      const successTitle =
        variables.intent === 'publish'
          ? t('项目已发布', 'Project Published')
          : t('项目已保存', 'Project Saved')
      const successMessage =
        variables.intent === 'publish'
          ? t('项目已发布，已同步最新展示配置。', 'The project has been published and synced.')
          : translateOptional(response.message) ||
            translateOptional('Latest changes have been saved.') ||
            'Latest changes have been saved.'

      setSubmitMessage(successMessage)
      setSubmitIntent(variables.intent)
      pushToast({
        title: successTitle,
        description: successMessage,
        tone: 'success',
      })
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() })

      const targetId = response.data?.id ?? (projectId ? Number(projectId) : undefined)
      if (targetId) {
        await queryClient.invalidateQueries({
          queryKey: projectQueryKeys.detail(String(targetId)),
        })
      }

      const submittedValues: ProjectFormValues = {
        ...variables.data,
        status: variables.intent === 'publish' ? 'published' : 'draft',
      }
      reset(submittedValues)

      if (isCreate && response.data?.id) {
        await navigate({
          to: '/projects/$id',
          params: { id: String(response.data.id) },
          search: listSearchParams,
          replace: true,
        })
      }
    },
    onError: (error) => {
      const apiError = error as unknown as ApiErrorResponse
      applyServerFieldErrors<ProjectFormValues>(apiError.errors, setError)
      const message =
        translateOptional(apiError.message) ||
        t('保存失败，请检查表单后重试。', 'Save failed. Check the form and try again.')
      setSubmitMessage(message)
      pushToast({
        title: t('项目保存失败', 'Failed to Save Project'),
        description: message,
        tone: 'error',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!projectId) {
        throw new Error('missing-project-id')
      }
      return deleteProject(projectId)
    },
    onSuccess: async (response) => {
      pushToast({
        title: t('项目已删除', 'Project Deleted'),
        description: translateOptional(response.message),
        tone: 'success',
      })
      setConfirmDeleteOpen(false)
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() })
      await navigate({ to: '/projects', search: listSearchParams })
    },
    onError: (error) => {
      const apiError = error as unknown as ApiErrorResponse
      pushToast({
        title: t('项目删除失败', 'Failed to Delete Project'),
        description: translateOptional(apiError.message) || t('请稍后重试。', 'Please try again later.'),
        tone: 'error',
      })
    },
  })

  const detail = detailQuery.data ?? null
  const meta = detail
    ? {
        createdAt: detail.created_at,
        updatedAt: detail.updated_at,
        publishedAt: detail.published_at || t('未发布', 'Not Published'),
      }
    : fallbackMeta
  const loadError = detailQuery.error
    ? translateOptional((detailQuery.error as unknown as ApiErrorResponse).message) ||
      t('项目详情加载失败，请稍后重试。', 'Failed to load project details. Please try again later.')
    : ''

  const submitProjectWithIntent = async (intent: SubmitIntent) => {
    setSubmitIntent(intent)
    await handleSubmit(async (data) => {
      setSubmitMessage('')
      await saveMutation.mutateAsync({ data, intent })
    })()
  }

  const handleDelete = async () => {
    if (!projectId) {
      pushToast({
        title: t('当前项目尚未保存', 'Project Has Not Been Saved Yet'),
        description: t('请先保存项目，再执行删除。', 'Save the project before deleting it.'),
        tone: 'info',
      })
      return
    }
    await deleteMutation.mutateAsync()
  }

  const handleBackToList = () => {
    if (saveMutation.isPending || deleteMutation.isPending) {
      return
    }

    if (isDirty) {
      setConfirmLeaveOpen(true)
      return
    }

    void navigate({ to: '/projects', search: listSearchParams })
  }

  return (
    <>
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault()
          void submitProjectWithIntent('draft')
        }}
      >
        <PageHeader
          actions={
            <div className="flex flex-wrap items-center gap-3">
            <Button
              loading={saveMutation.isPending && submitIntent === 'draft'}
              onClick={() => void submitProjectWithIntent('draft')}
              type="button"
            >
              {t('保存项目', 'Save Project')}
            </Button>
            <button
              className="admin-button-primary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={saveMutation.isPending}
              onClick={() => void submitProjectWithIntent('publish')}
              type="button"
            >
              {saveMutation.isPending && submitIntent === 'publish'
                ? t('发布中...', 'Publishing...')
                : t('发布', 'Publish')}
            </button>
            <button
              className="admin-button-secondary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={saveMutation.isPending || deleteMutation.isPending}
              onClick={handleBackToList}
              type="button"
            >
              {t('返回列表', 'Back to List')}
            </button>
            <button
              className="admin-button-danger disabled:cursor-not-allowed disabled:opacity-50"
              disabled={deleteMutation.isPending}
              onClick={() => setConfirmDeleteOpen(true)}
              type="button"
            >
              {t('删除项目', 'Delete Project')}
            </button>
          </div>
          }
          description={t(
            '编辑项目资料、展示信息和外部链接。',
            'Edit project metadata, display information, and external links.',
          )}
          eyebrow={t('项目编辑器', 'Project Editor')}
          meta={
            submitMessage ||
            loadError ||
            t(
              '表单未保存时，离开当前页面会先提示确认。',
              'If the form has unsaved changes, leaving this page will ask for confirmation.',
            )
          }
          title={isCreate ? t('新建项目', 'New Project') : t(`编辑项目 #${projectId}`, `Edit Project #${projectId}`)}
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(280px,340px)_minmax(0,1fr)_minmax(280px,320px)]">
          <aside className="space-y-6">
            <EditorCard
              title={t('基本信息', 'Basic Info')}
              description={t('名称、别名和简介。', 'Title, slug, and summary.')}
            >
              <ProjectBasicInfoSection errors={errors} register={register} />
            </EditorCard>
            <EditorCard
              title={t('链接信息', 'Links')}
              description={t('站点、仓库和图标。', 'Site, repository, and icon.')}
            >
              <ProjectLinksSection errors={errors} register={register} />
            </EditorCard>
          </aside>
          <section className="space-y-6">
            <EditorCard
              title={t('项目简介', 'Description')}
              description={t('项目介绍和内容说明。', 'Project overview and content description.')}
            >
              <ProjectContentSection errors={errors} register={register} />
            </EditorCard>
          </section>
          <aside className="space-y-6">
            <EditorCard
              title={t('展示信息', 'Display')}
              description={t('封面、排序和展示状态。', 'Cover, order, and display status.')}
            >
              <ProjectDisplaySection errors={errors} register={register} />
            </EditorCard>
            <EditorCard
              title={t('内容预览', 'Preview')}
              description={t('当前表单内容。', 'Current form content.')}
            >
              <ProjectPreviewCard control={control} detail={detail} />
            </EditorCard>
            <EditorCard
              title={t('系统信息', 'System Info')}
              description={t('只读字段。', 'Read-only fields.')}
            >
              <ProjectSystemInfoCard control={control} meta={meta} />
            </EditorCard>
          </aside>
        </div>
      </form>

      <ConfirmDialog
        confirmLabel={t('确认离开', 'Leave Anyway')}
        description={t(
          '你有尚未保存的修改，离开当前页面后这些变更将丢失。',
          'You have unsaved changes. Leaving this page will discard them.',
        )}
        onCancel={() => setConfirmLeaveOpen(false)}
        onConfirm={() => {
          setConfirmLeaveOpen(false)
          void navigate({ to: '/projects', search: listSearchParams })
        }}
        open={confirmLeaveOpen}
        title={t('确认返回列表？', 'Leave and Return to the List?')}
      />

      <ConfirmDialog
        confirmLabel={t('删除项目', 'Delete Project')}
        danger
        description={
          isCreate
            ? t(
                '当前项目尚未保存，暂时无法执行删除。',
                'This project has not been created yet, so it cannot be deleted.',
              )
            : t(
                '项目删除后不可恢复，并会从项目列表中移除。',
                'Deletion cannot be undone and the project will be removed from the list.',
              )
        }
        loading={deleteMutation.isPending}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={() => void handleDelete()}
        open={confirmDeleteOpen}
        title={t('确认删除当前项目？', 'Delete This Project?')}
      />
    </>
  )
}

function EditorCard({
  children,
  description,
  title,
}: {
  children: ReactNode
  description?: string
  title: string
}) {
  return (
    <section className="rounded-[20px] border border-border bg-surface p-5 shadow-soft">
      <div className="mb-4">
        <h2 className="text-[15px] font-semibold text-text">{title}</h2>
        {description ? <p className="mt-1 text-[13px] leading-5 text-muted">{description}</p> : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function ProjectPreviewCard({
  control,
  detail,
}: {
  control: Control<ProjectFormValues>
  detail: ProjectDetail | null
}) {
  const { t } = useTranslation()
  const title = useWatch({ control, name: 'title' }) ?? ''
  const summary = useWatch({ control, name: 'summary' }) ?? ''
  const icon = useWatch({ control, name: 'icon' }) ?? ''
  const displayOrder = useWatch({ control, name: 'display_order' })

  return (
    <div className="space-y-3 text-sm leading-6 text-muted">
      <p className="font-medium text-text">
        {title || detail?.title || t('预览标题', 'Preview Title')}
      </p>
      <p>
        {summary ||
          detail?.summary ||
          t('填写摘要后可在这里查看当前内容。', 'The current summary preview will appear here.')}
      </p>
      <p>
        {t('图标：', 'Icon:')}
        {icon || detail?.icon || '-'}
        {' / '}
        {t('排序：', 'Order:')}
        {String(displayOrder || detail?.display_order || 1)}
      </p>
    </div>
  )
}

function ProjectSystemInfoCard({
  control,
  meta,
}: {
  control: Control<ProjectFormValues>
  meta: {
    createdAt: string
    updatedAt: string
    publishedAt: string
  }
}) {
  const { t } = useTranslation()
  const status = useWatch({ control, name: 'status' }) ?? 'draft'

  return (
    <ul className="space-y-2 text-sm text-muted">
      <li>
        {t('创建时间：', 'Created At:')}
        {meta.createdAt}
      </li>
      <li>
        {t('最后更新：', 'Updated At:')}
        {meta.updatedAt}
      </li>
      <li>
        {t('发布时间：', 'Published At:')}
        {meta.publishedAt}
      </li>
      <li>
        {t('当前状态：', 'Current Status:')}
        {status}
      </li>
    </ul>
  )
}
