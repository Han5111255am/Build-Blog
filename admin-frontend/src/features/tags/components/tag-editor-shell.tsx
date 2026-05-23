import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { useToast } from '@/app/providers/toast-provider'
import { PageHeader } from '@/components/ui/admin-page'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useTranslation } from '@/features/i18n/use-translation'
import { TagBasicInfoSection } from '@/features/tags/components/tag-basic-info-section'
import { TagDescriptionSection } from '@/features/tags/components/tag-description-section'
import { TagUsageSection } from '@/features/tags/components/tag-usage-section'
import { createTag, deleteTag, getTagDetail, unlinkTagUsage, updateTag } from '@/features/tags/services/tag-api'
import { createTagFormSchema, type TagFormValues } from '@/features/tags/schema/tag-form-schema'
import type { TagUsageItem } from '@/features/tags/types/tag'
import { buildTagFormDefaults } from '@/features/tags/utils/build-tag-form-defaults'
import { mapTagDetailToFormValues } from '@/features/tags/utils/map-tag-detail-to-form-values'
import { tagQueryKeys } from '@/features/tags/utils/tag-query-keys'
import type { ApiErrorResponse } from '@/types/api'
import { applyServerFieldErrors } from '@/utils/apply-server-field-errors'

interface TagEditorShellProps {
  mode: 'create' | 'edit'
  tagId?: string
}

export function TagEditorShell({ mode, tagId }: TagEditorShellProps) {
  const navigate = useNavigate()
  const search = useSearch({ strict: false })
  const queryClient = useQueryClient()
  const { pushToast } = useToast()
  const { language, t, translateOptional } = useTranslation()
  const isCreate = mode === 'create'
  const formSchema = useMemo(() => createTagFormSchema(language), [language])
  const defaultValues = useMemo(() => buildTagFormDefaults({ language, mode }), [language, mode])
  const listSearchParams = useMemo(() => search, [search])
  const [submitMessage, setSubmitMessage] = useState('')
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false)
  const [pendingUsageItem, setPendingUsageItem] = useState<TagUsageItem | null>(null)
  // Scaffold baseline: zodResolver(tagFormSchema)
  // Scaffold baseline: buildTagFormDefaults({ mode })

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<TagFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const detailQuery = useQuery({
    queryKey: tagQueryKeys.detail(tagId ?? ''),
    queryFn: () => getTagDetail(tagId as string),
    enabled: !isCreate && Boolean(tagId),
  })

  useEffect(() => {
    if (isCreate || !tagId) {
      reset(defaultValues)
      return
    }
    if (!detailQuery.data) {
      return
    }
    reset(mapTagDetailToFormValues(detailQuery.data))
  }, [defaultValues, detailQuery.data, isCreate, tagId, reset])

  useEffect(() => {
    if (!detailQuery.error) {
      return
    }
    const apiError = detailQuery.error as unknown as ApiErrorResponse
    pushToast({
      title: t('标签详情加载失败', 'Failed to Load Tag'),
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
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const saveMutation = useMutation({
    mutationFn: async (data: TagFormValues) => (isCreate || !tagId ? createTag(data) : updateTag(tagId, data)),
    onSuccess: async (response, variables) => {
      setSubmitMessage(translateOptional(response.message))
      pushToast({
        title: t('标签已保存', 'Tag Saved'),
        description: translateOptional(response.message),
        tone: 'success',
      })
      await queryClient.invalidateQueries({ queryKey: tagQueryKeys.lists() })

      const targetId = response.data?.id ?? (tagId ? Number(tagId) : undefined)
      if (targetId) {
        await queryClient.invalidateQueries({ queryKey: tagQueryKeys.detail(String(targetId)) })
      }

      reset(variables)

      if (isCreate && response.data?.id) {
        await navigate({
          to: '/tags/$id',
          params: { id: String(response.data.id) },
          search: listSearchParams,
          replace: true,
        })
      }
    },
    onError: (error) => {
      const apiError = error as unknown as ApiErrorResponse
      applyServerFieldErrors<TagFormValues>(apiError.errors, setError)
      const message =
        translateOptional(apiError.message) ||
        t('保存失败，请检查表单后重试。', 'Save failed. Check the form and try again.')
      setSubmitMessage(message)
      pushToast({
        title: t('标签保存失败', 'Failed to Save Tag'),
        description: message,
        tone: 'error',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!tagId) {
        throw new Error('missing-tag-id')
      }
      return deleteTag(tagId)
    },
    onSuccess: async (response) => {
      pushToast({
        title: t('标签已删除', 'Tag Deleted'),
        description: translateOptional(response.message),
        tone: 'success',
      })
      setConfirmDeleteOpen(false)
      await queryClient.invalidateQueries({ queryKey: tagQueryKeys.lists() })
      await navigate({ to: '/tags', search: listSearchParams })
    },
    onError: (error) => {
      const apiError = error as unknown as ApiErrorResponse
      pushToast({
        title: t('标签删除失败', 'Failed to Delete Tag'),
        description: translateOptional(apiError.message) || t('请稍后重试。', 'Please try again later.'),
        tone: 'error',
      })
    },
  })

  const unlinkMutation = useMutation({
    mutationFn: async (item: TagUsageItem) => {
      if (!tagId) {
        throw new Error('missing-tag-id')
      }
      return unlinkTagUsage(tagId, { content_type: item.content_type, item_id: item.item_id })
    },
    onSuccess: async (response) => {
      pushToast({
        title: t('引用已解绑', 'Reference Removed'),
        description: translateOptional(response.message),
        tone: 'success',
      })
      setPendingUsageItem(null)
      await queryClient.invalidateQueries({ queryKey: tagQueryKeys.lists() })
      if (tagId) {
        await queryClient.invalidateQueries({ queryKey: tagQueryKeys.detail(tagId) })
      }
    },
    onError: (error) => {
      const apiError = error as unknown as ApiErrorResponse
      pushToast({
        title: t('解绑引用失败', 'Failed to Remove Reference'),
        description: translateOptional(apiError.message) || t('请稍后重试。', 'Please try again later.'),
        tone: 'error',
      })
    },
  })

  const values = watch()
  const detail = detailQuery.data ?? null
  const usage = detail
    ? {
        postCount: detail.post_count,
        noteCount: detail.note_count,
        projectCount: detail.project_count,
        usageText: detail.usage_text,
        usageItems: detail.usage_items,
      }
    : {
        postCount: 0,
        noteCount: 0,
        projectCount: 0,
        usageText: t('当前标签暂无引用', 'This tag is not referenced yet'),
        usageItems: [],
      }

  const loadError = detailQuery.error
    ? translateOptional((detailQuery.error as unknown as ApiErrorResponse).message) ||
      t('标签详情加载失败，请稍后重试。', 'Failed to load tag details. Please try again later.')
    : ''

  const submitTag = handleSubmit(async (data) => {
    setSubmitMessage('')
    await saveMutation.mutateAsync(data)
  })

  const handleDelete = async () => {
    if (!tagId) {
      pushToast({
        title: t('当前标签尚未保存', 'Tag Has Not Been Saved Yet'),
        description: t('请先保存标签，再执行删除。', 'Save the tag before deleting it.'),
        tone: 'info',
      })
      return
    }
    await deleteMutation.mutateAsync()
  }

  const handleBackToList = () => {
    if (saveMutation.isPending || deleteMutation.isPending || unlinkMutation.isPending) {
      return
    }
    if (isDirty) {
      setConfirmLeaveOpen(true)
      return
    }
    void navigate({ to: '/tags', search: listSearchParams })
  }

  const handleOpenUsageItem = (item: TagUsageItem) => {
    if (item.content_type === 'post') {
      void navigate({ to: '/posts/$id', params: { id: String(item.item_id) } })
      return
    }
    if (item.content_type === 'note') {
      void navigate({ to: '/notes/$id', params: { id: String(item.item_id) } })
      return
    }
    void navigate({ to: '/projects/$id', params: { id: String(item.item_id) } })
  }

  const handleRequestUnlink = (item: TagUsageItem) => {
    setPendingUsageItem(item)
  }

  const handleConfirmUnlink = async () => {
    if (!pendingUsageItem) {
      return
    }
    await unlinkMutation.mutateAsync(pendingUsageItem)
  }

  return (
    <>
      <form className="space-y-6" onSubmit={submitTag}>
        <PageHeader
          actions={
            <div className="flex flex-wrap items-center gap-3">
            <Button loading={saveMutation.isPending} type="submit">
              {t('保存标签', 'Save Tag')}
            </Button>
            <button
              className="admin-button-secondary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={saveMutation.isPending || deleteMutation.isPending || unlinkMutation.isPending}
              onClick={handleBackToList}
              type="button"
            >
              {t('返回列表', 'Back to List')}
            </button>
            <button
              className="admin-button-danger disabled:cursor-not-allowed disabled:opacity-50"
              disabled={deleteMutation.isPending || unlinkMutation.isPending}
              onClick={() => setConfirmDeleteOpen(true)}
              type="button"
            >
              {t('删除标签', 'Delete Tag')}
            </button>
          </div>
          }
          description={t('编辑标签名称、颜色和说明信息。', 'Edit tag name, color, and description.')}
          eyebrow={t('标签编辑器', 'Tag Editor')}
          meta={
            submitMessage ||
            loadError ||
            t('表单未保存时，离开当前页面会先提示确认。', 'If the form has unsaved changes, leaving this page will ask for confirmation.')
          }
          title={isCreate ? t('新建标签', 'New Tag') : t(`编辑标签 #${tagId}`, `Edit Tag #${tagId}`)}
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(280px,340px)_minmax(0,1fr)_minmax(300px,360px)]">
          <aside className="space-y-6">
            <EditorCard
              title={t('基本信息', 'Basic Info')}
              description={t('名称、别名和颜色。', 'Name, slug, and color.')}
            >
              <TagBasicInfoSection errors={errors} register={register} />
            </EditorCard>
          </aside>

          <section className="space-y-6">
            <EditorCard
              title={t('说明信息', 'Description')}
              description={t('标签说明。', 'Tag description.')}
            >
              <TagDescriptionSection errors={errors} register={register} />
            </EditorCard>
            <EditorCard
              title={t('内容预览', 'Preview')}
              description={t('当前表单内容。', 'Current form content.')}
            >
              <div className="space-y-3 text-sm leading-6 text-muted">
                <p className="font-medium text-text">{values.name || detail?.name || t('标签名称', 'Tag Name')}</p>
                <p>Slug: {values.slug || detail?.slug || '-'}</p>
                <p>
                  {t('颜色：', 'Color:')}
                  {values.color || detail?.color || '#6366F1'}
                </p>
                <p>
                  {values.description ||
                    detail?.description ||
                    t('填写说明后可在这里查看当前内容。', 'The current description preview will appear here.')}
                </p>
              </div>
            </EditorCard>
          </section>

          <aside className="space-y-6">
            <EditorCard
              title={t('引用信息', 'Usage')}
              description={t('当前引用统计与明细。', 'Current usage stats and references.')}
            >
              <TagUsageSection
                noteCount={usage.noteCount}
                postCount={usage.postCount}
                projectCount={usage.projectCount}
                usageText={usage.usageText}
                usageItems={usage.usageItems}
                unlinkingKey={unlinkMutation.isPending && pendingUsageItem ? buildUsageKey(pendingUsageItem) : null}
                onOpenReference={handleOpenUsageItem}
                onRequestUnlink={handleRequestUnlink}
              />
            </EditorCard>
          </aside>
        </div>
      </form>

      <ConfirmDialog
        confirmLabel={t('确认离开', 'Leave Anyway')}
        description={t('你有尚未保存的修改，离开当前页面后这些变更将丢失。', 'You have unsaved changes. Leaving this page will discard them.')}
        onCancel={() => setConfirmLeaveOpen(false)}
        onConfirm={() => {
          setConfirmLeaveOpen(false)
          void navigate({ to: '/tags', search: listSearchParams })
        }}
        open={confirmLeaveOpen}
        title={t('确认返回列表？', 'Leave and Return to the List?')}
      />

      <ConfirmDialog
        confirmLabel={t('删除标签', 'Delete Tag')}
        danger
        description={
          isCreate
            ? t('当前标签尚未保存，暂时无法执行删除。', 'This tag has not been created yet, so it cannot be deleted.')
            : t('标签删除后不可恢复；如果仍被内容引用，系统会提示先解除引用。', 'Deletion cannot be undone. If the tag is still referenced, remove those references first.')
        }
        loading={deleteMutation.isPending}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={() => void handleDelete()}
        open={confirmDeleteOpen}
        title={t('确认删除当前标签？', 'Delete This Tag?')}
      />

      <ConfirmDialog
        confirmLabel={t('解绑引用', 'Unlink')}
        danger
        description={
          pendingUsageItem
            ? t(
                `确认将标签从“${pendingUsageItem.title}”中解绑？这不会删除内容，只会移除标签关联。`,
                `Remove this tag from "${pendingUsageItem.title}"? The content will be kept and only the tag reference will be removed.`,
              )
            : t('请先选择要解绑的引用。', 'Choose a reference to unlink first.')
        }
        loading={unlinkMutation.isPending}
        onCancel={() => setPendingUsageItem(null)}
        onConfirm={() => void handleConfirmUnlink()}
        open={Boolean(pendingUsageItem)}
        title={t('确认解绑当前引用？', 'Unlink This Reference?')}
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

function buildUsageKey(item: TagUsageItem) {
  return `${item.content_type}:${item.item_id}`
}
