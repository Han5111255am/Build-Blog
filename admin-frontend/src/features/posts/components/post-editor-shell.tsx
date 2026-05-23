import type { ReactNode } from 'react'
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import {
  type Control,
  type FieldErrors,
  useForm,
  useWatch,
  type UseFormRegister,
} from 'react-hook-form'
import { useAssetPicker } from '@/app/providers/asset-picker-provider'
import { useToast } from '@/app/providers/toast-provider'
import { PageHeader } from '@/components/ui/admin-page'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useTranslation } from '@/features/i18n/use-translation'
import { PostBasicInfoSection } from '@/features/posts/components/post-basic-info-section'
import { PostContentSection } from '@/features/posts/components/post-content-section'
import { PostPublishingSection } from '@/features/posts/components/post-publishing-section'
import {
  createPost,
  createPostTagOption,
  deletePost,
  getPostDetail,
  getPostTagOptions,
  updatePost,
} from '@/features/posts/services/post-api'
import { createPostFormSchema, type PostFormValues } from '@/features/posts/schema/post-form-schema'
import type { PostMutationPayload } from '@/features/posts/types/post'
import { buildPostFormDefaults } from '@/features/posts/utils/build-post-form-defaults'
import { parsePostListSearch } from '@/features/posts/utils/post-list-search-params'
import { mapPostDetailToFormValues } from '@/features/posts/utils/map-post-detail-to-form-values'
import { postQueryKeys } from '@/features/posts/utils/post-query-keys'
import { buildImageMarkdownInsertion } from '@/features/posts/utils/build-image-markdown-insertion'
import type { ApiErrorResponse } from '@/types/api'
import { applyServerFieldErrors } from '@/utils/apply-server-field-errors'

interface PostEditorShellProps {
  mode: 'create' | 'edit'
  postId?: string
}

type SubmitIntent = 'draft' | 'publish'
type PostDetail = Awaited<ReturnType<typeof getPostDetail>>

function resolveSubmitIntent(status?: PostFormValues['status'] | null): SubmitIntent {
  return status === 'published' ? 'publish' : 'draft'
}

function normalizePublishedAtValue(value: string) {
  const normalizedValue = value.trim()
  return normalizedValue ? normalizedValue : null
}

function resolveCoverImageUrl(url: string) {
  const normalized = url.trim()
  if (!normalized) {
    return ''
  }
  if (/^https?:\/\//i.test(normalized)) {
    return normalized
  }
  if (typeof window === 'undefined') {
    return normalized
  }
  return new URL(normalized, window.location.origin).toString()
}

export function PostEditorShell({ mode, postId }: PostEditorShellProps) {
  const navigate = useNavigate()
  const search = useSearch({ strict: false })
  const queryClient = useQueryClient()
  const { openAssetPicker } = useAssetPicker()
  const { pushToast } = useToast()
  const { language, t, translateOptional } = useTranslation()
  const isCreate = mode === 'create'
  const formSchema = useMemo(() => createPostFormSchema(language), [language])
  const defaultValues = useMemo(() => buildPostFormDefaults({ language, mode }), [language, mode])
  const listSearchParams = useMemo(() => parsePostListSearch(search), [search])
  const [submitIntent, setSubmitIntent] = useState<SubmitIntent>('draft')
  const [submitMessage, setSubmitMessage] = useState('')
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false)
  const [tagSearch, setTagSearch] = useState('')
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const deferredTagSearch = useDeferredValue(tagSearch)

  const {
    register,
    handleSubmit,
    control,
    getValues,
    reset,
    setError,
    setValue,
    formState: { errors, isDirty },
  } = useForm<PostFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const detailQuery = useQuery({
    queryKey: postQueryKeys.detail(postId ?? ''),
    queryFn: () => getPostDetail(postId as string),
    enabled: !isCreate && Boolean(postId),
  })

  const tagOptionsQuery = useQuery({
    queryKey: postQueryKeys.tagOptions(deferredTagSearch),
    queryFn: () => getPostTagOptions(deferredTagSearch),
  })

  useEffect(() => {
    if (isCreate || !postId) {
      reset(defaultValues)
      setSubmitIntent(resolveSubmitIntent(defaultValues.status))
      return
    }
    if (!detailQuery.data) {
      return
    }
    const mappedValues = mapPostDetailToFormValues(detailQuery.data)
    reset(mappedValues)
    setSubmitIntent(resolveSubmitIntent(mappedValues.status))
  }, [defaultValues, detailQuery.data, isCreate, postId, reset])

  useEffect(() => {
    if (!detailQuery.error) {
      return
    }
    const apiError = detailQuery.error as unknown as ApiErrorResponse
    pushToast({
      title: t('文章详情加载失败', 'Failed to Load Post'),
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
    mutationFn: async ({ data, intent }: { data: PostFormValues; intent: SubmitIntent }) => {
      const nextStatus: PostFormValues['status'] = intent === 'publish' ? 'published' : 'draft'
      const payload: PostMutationPayload = {
        ...data,
        status: nextStatus,
        published_at: normalizePublishedAtValue(data.published_at),
      }
      return isCreate || !postId ? createPost(payload) : updatePost(postId, payload)
    },
    onSuccess: async (response, variables) => {
      const successTitle =
        variables.intent === 'publish'
          ? t('文章已发布', 'Post Published')
          : t('文章已保存', 'Post Saved')
      const successMessage =
        variables.intent === 'publish'
          ? t('文章已发布，已同步最新内容。', 'The post has been published and synced.')
          : translateOptional(response.message) ||
            translateOptional('Latest changes have been saved.') ||
            'Latest changes have been saved.'

      setSubmitMessage(successMessage)
      setSubmitIntent(variables.intent)
      pushToast({ title: successTitle, description: successMessage, tone: 'success' })
      await queryClient.invalidateQueries({ queryKey: postQueryKeys.lists() })

      const targetId = response.data?.id ?? (postId ? Number(postId) : undefined)
      if (targetId) {
        await queryClient.invalidateQueries({ queryKey: postQueryKeys.detail(String(targetId)) })
      }

      const submittedValues = mapPostDetailToFormValues(response.data)
      reset(submittedValues)
      setSubmitIntent(resolveSubmitIntent(response.data.status))

      if (isCreate && response.data?.id) {
        await navigate({
          to: '/posts/$id',
          params: { id: String(response.data.id) },
          search: listSearchParams,
          replace: true,
        })
      }
    },
    onError: (error) => {
      const apiError = error as unknown as ApiErrorResponse
      applyServerFieldErrors<PostFormValues>(apiError.errors, setError)
      const message =
        translateOptional(apiError.message) ||
        t('保存失败，请检查表单后重试。', 'Save failed. Check the form and try again.')
      setSubmitMessage(message)
      pushToast({
        title: t('文章保存失败', 'Failed to Save Post'),
        description: message,
        tone: 'error',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!postId) {
        throw new Error('missing-post-id')
      }
      return deletePost(postId)
    },
    onSuccess: async (response) => {
      pushToast({
        title: t('文章已删除', 'Post Deleted'),
        description: translateOptional(response.message),
        tone: 'success',
      })
      setConfirmDeleteOpen(false)
      await queryClient.invalidateQueries({ queryKey: postQueryKeys.lists() })
      await navigate({ to: '/posts', search: listSearchParams })
    },
    onError: (error) => {
      const apiError = error as unknown as ApiErrorResponse
      pushToast({
        title: t('文章删除失败', 'Failed to Delete Post'),
        description: translateOptional(apiError.message) || t('请稍后重试。', 'Please try again later.'),
        tone: 'error',
      })
    },
  })

  const createTagMutation = useMutation({
    mutationFn: async () => createPostTagOption({ name: tagSearch.trim() }),
    onSuccess: async (response) => {
      const createdTag = response.data
      pushToast({
        title: t('标签已创建', 'Tag Created'),
        description: translateOptional(response.message),
        tone: 'success',
      })
      await queryClient.invalidateQueries({ queryKey: postQueryKeys.options() })
      const currentTagIds = getValues('tag_ids') ?? []
      setValue('tag_ids', addTagId(currentTagIds, createdTag.id), {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      })
      setTagSearch('')
    },
    onError: (error) => {
      const apiError = error as unknown as ApiErrorResponse
      pushToast({
        title: t('标签创建失败', 'Failed to Create Tag'),
        description: translateOptional(apiError.message) || t('请稍后重试。', 'Please try again later.'),
        tone: 'error',
      })
    },
  })

  const detail = detailQuery.data ?? null
  const loadError = detailQuery.error
    ? translateOptional((detailQuery.error as unknown as ApiErrorResponse).message) ||
      t('文章详情加载失败，请稍后重试。', 'Failed to load post details. Please try again later.')
    : ''
  const meta = detail
    ? {
        readingTime: t(`${detail.reading_time} 分钟`, `${detail.reading_time} min`),
        updatedAt: detail.updated_at,
        createdAt: detail.created_at,
        toc: detail.toc_json || '-',
      }
    : {
        readingTime: t('8 分钟', '8 min'),
        updatedAt: '2026-03-07 11:20',
        createdAt: '2026-03-07 09:40',
        toc: '-',
      }

  const tagOptions = tagOptionsQuery.data ?? []
  const tagOptionsError = tagOptionsQuery.error
    ? translateOptional((tagOptionsQuery.error as unknown as ApiErrorResponse).message) ||
      t('标签选项加载失败，请稍后重试。', 'Failed to load tag options. Please try again later.')
    : ''

  const handleToggleTag = (tagId: number) => {
    const selectedTagIds = getValues('tag_ids') ?? []
    const nextTagIds = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : addTagId(selectedTagIds, tagId)
    setValue('tag_ids', nextTagIds, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }

  const handleCreateTag = async () => {
    if (createTagMutation.isPending) {
      return
    }
    if (!tagSearch.trim()) {
      pushToast({
        title: t('请输入标签名称', 'Enter a Tag Name'),
        description: t('先在搜索框输入标签名称，再点击“新建标签”。', 'Type a tag name in the search box before creating it.'),
        tone: 'info',
      })
      return
    }
    await createTagMutation.mutateAsync()
  }

  const handleInsertInlineImage = () => {
    openAssetPicker((assetUrl) => {
      const normalizedAssetUrl = assetUrl.trim()
      if (!normalizedAssetUrl) {
        return
      }

      const currentContent = getValues('content_md') ?? ''
      const textarea = contentTextareaRef.current
      const insertion = buildImageMarkdownInsertion({
        altText: t('图片描述', 'Image description'),
        imageUrl: normalizedAssetUrl,
        selectionStart: textarea?.selectionStart ?? currentContent.length,
        selectionEnd: textarea?.selectionEnd ?? currentContent.length,
        source: currentContent,
      })

      setValue('content_md', insertion.nextValue, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      })

      requestAnimationFrame(() => {
        const nextTextarea = contentTextareaRef.current
        if (!nextTextarea) {
          return
        }
        nextTextarea.focus()
        nextTextarea.setSelectionRange(insertion.selectionStart, insertion.selectionEnd)
      })
    })
  }

  const submitPostWithIntent = async (intent: SubmitIntent) => {
    setSubmitIntent(intent)
    await handleSubmit(async (data) => {
      setSubmitMessage('')
      await saveMutation.mutateAsync({ data, intent })
    })()
  }

  const handleDelete = async () => {
    if (!postId) {
      pushToast({
        title: t('当前文章尚未保存', 'Post Has Not Been Saved Yet'),
        description: t('请先保存文章，再执行删除。', 'Save the post before deleting it.'),
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
    void navigate({ to: '/posts', search: listSearchParams })
  }

  return (
    <>
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault()
          void submitPostWithIntent('draft')
        }}
      >
        <PageHeader
          actions={
            <div className="flex flex-wrap items-center gap-3">
            <Button
              loading={saveMutation.isPending && submitIntent === 'draft'}
              onClick={() => void submitPostWithIntent('draft')}
              type="button"
            >
              {t('保存草稿', 'Save Draft')}
            </Button>
            <button
              className="admin-button-primary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={saveMutation.isPending}
              onClick={() => void submitPostWithIntent('publish')}
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
              {t('删除文章', 'Delete Post')}
            </button>
          </div>
          }
          description={t(
            '编辑文章内容、发布设置和标签信息。',
            'Edit post content, publishing settings, and tags.',
          )}
          eyebrow={t('文章编辑器', 'Post Editor')}
          meta={
            submitMessage ||
            loadError ||
            t(
              '表单未保存时，离开当前页面会先提示确认。',
              'If the form has unsaved changes, leaving this page will ask for confirmation.',
            )
          }
          title={isCreate ? t('新建文章', 'New Post') : t(`编辑文章 #${postId}`, `Edit Post #${postId}`)}
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(280px,340px)_minmax(0,1fr)_minmax(280px,320px)]">
          <aside className="space-y-6">
            <EditorCard
              title={t('基本信息', 'Basic Info')}
              description={t('标题、别名和摘要。', 'Title, slug, and summary.')}
            >
              <PostBasicInfoSection errors={errors} register={register} />
            </EditorCard>
            <EditorCard
              title={t('发布设置', 'Publishing')}
              description={t('发布时间、封面和标签。', 'Publish time, cover, and tags.')}
            >
              <PostPublishingCard
                control={control}
                canCreateTag={Boolean(tagSearch.trim())}
                creatingTag={createTagMutation.isPending}
                errors={errors}
                onCreateTag={() => void handleCreateTag()}
                onPickCoverImage={() =>
                  openAssetPicker((url) =>
                    setValue('cover_image', resolveCoverImageUrl(url), {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    }),
                  )
                }
                onTagSearchChange={setTagSearch}
                onToggleTag={handleToggleTag}
                register={register}
                submitIntent={submitIntent}
                tagOptions={tagOptions}
                tagOptionsError={tagOptionsError}
                tagOptionsLoading={tagOptionsQuery.isLoading}
                tagSearch={tagSearch}
              />
            </EditorCard>
          </aside>
          <section className="space-y-6">
            <EditorCard
              title={t('内容编辑', 'Content')}
              description={t('正文内容。', 'Main body content.')}
            >
              <PostContentSection
                errors={errors}
                onInsertImage={handleInsertInlineImage}
                register={register}
                textareaRef={contentTextareaRef}
              />
            </EditorCard>
          </section>
          <aside className="space-y-6">
            <EditorCard
              title={t('内容预览', 'Preview')}
              description={t('当前表单内容。', 'Current form content.')}
            >
              <PostPreviewCard control={control} detail={detail} />
            </EditorCard>
            <EditorCard
              title={t('系统信息', 'System Info')}
              description={t('只读字段。', 'Read-only fields.')}
            >
              <dl className="space-y-3 text-sm">
                <MetaRow label={t('阅读时长', 'Reading Time')} value={meta.readingTime} />
                <MetaRow label={t('创建时间', 'Created At')} value={meta.createdAt} />
                <MetaRow label={t('最后更新', 'Updated At')} value={meta.updatedAt} />
                <MetaRow label={t('目录 JSON', 'TOC JSON')} value={meta.toc} />
              </dl>
            </EditorCard>
            <EditorCard
              title={t('操作说明', 'Actions')}
              description={t('当前页面支持的操作。', 'Available actions on this page.')}
            >
              <ul className="space-y-2 text-sm text-muted">
                <li>{t('保存草稿', 'Save Draft')}</li>
                <li>{t('发布文章', 'Publish Post')}</li>
                <li>{t('删除当前文章', 'Delete Current Post')}</li>
              </ul>
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
          void navigate({ to: '/posts', search: listSearchParams })
        }}
        open={confirmLeaveOpen}
        title={t('确认返回列表？', 'Leave and Return to the List?')}
      />

      <ConfirmDialog
        confirmLabel={t('删除文章', 'Delete Post')}
        danger
        description={
          isCreate
            ? t(
                '当前文章尚未保存，暂时无法执行删除。',
                'This post has not been created yet, so it cannot be deleted.',
              )
            : t(
                '文章删除后不可恢复，并会从文章列表中移除。',
                'Deletion cannot be undone and the post will be removed from the list.',
              )
        }
        loading={deleteMutation.isPending}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={() => void handleDelete()}
        open={confirmDeleteOpen}
        title={t('确认删除当前文章？', 'Delete This Post?')}
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
      {children}
    </section>
  )
}

function MetaRow({ label, value }: { label: string; value: unknown }) {
  const displayValue = formatMetaValue(value)
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right text-text">{displayValue}</dd>
    </div>
  )
}

function formatMetaValue(value: unknown): string {
  if (typeof value === 'string') {
    return value || '-'
  }
  if (value == null) {
    return '-'
  }
  try {
    return JSON.stringify(value)
  } catch {
    return '-'
  }
}

function PostPublishingCard({
  canCreateTag,
  control,
  creatingTag,
  errors,
  onCreateTag,
  onPickCoverImage,
  onTagSearchChange,
  onToggleTag,
  register,
  submitIntent,
  tagOptions,
  tagOptionsError,
  tagOptionsLoading,
  tagSearch,
}: {
  canCreateTag: boolean
  control: Control<PostFormValues>
  creatingTag: boolean
  errors: FieldErrors<PostFormValues>
  onCreateTag: () => void
  onPickCoverImage: () => void
  onTagSearchChange: (value: string) => void
  onToggleTag: (tagId: number) => void
  register: UseFormRegister<PostFormValues>
  submitIntent: SubmitIntent
  tagOptions: Awaited<ReturnType<typeof getPostTagOptions>>
  tagOptionsError?: string
  tagOptionsLoading: boolean
  tagSearch: string
}) {
  const coverImage = useWatch({ control, name: 'cover_image' }) ?? ''
  const publishedAt = useWatch({ control, name: 'published_at' }) ?? ''
  const selectedTagIds = useWatch({ control, name: 'tag_ids' }) ?? []
  const status = useWatch({ control, name: 'status' }) ?? 'draft'

  return (
    <PostPublishingSection
      canCreateTag={canCreateTag}
      coverImage={coverImage}
      creatingTag={creatingTag}
      errors={errors}
      onCreateTag={onCreateTag}
      onPickCoverImage={onPickCoverImage}
      onTagSearchChange={onTagSearchChange}
      onToggleTag={onToggleTag}
      publishedAt={publishedAt}
      register={register}
      selectedTagIds={selectedTagIds}
      status={status}
      submitIntent={submitIntent}
      tagOptions={tagOptions}
      tagOptionsError={tagOptionsError}
      tagOptionsLoading={tagOptionsLoading}
      tagSearch={tagSearch}
    />
  )
}

function PostPreviewCard({
  control,
  detail,
}: {
  control: Control<PostFormValues>
  detail: PostDetail | null
}) {
  const { t } = useTranslation()
  const title = useWatch({ control, name: 'title' }) ?? ''
  const summary = useWatch({ control, name: 'summary' }) ?? ''

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
    </div>
  )
}

function addTagId(tagIds: number[], tagId: number) {
  return tagIds.includes(tagId) ? tagIds : [...tagIds, tagId]
}
