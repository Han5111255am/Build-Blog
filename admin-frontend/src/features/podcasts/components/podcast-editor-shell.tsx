import type { MutableRefObject } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  type Control,
  type FieldErrors,
  useForm,
  useWatch,
  type UseFormSetValue,
} from 'react-hook-form'
import { useAssetPicker } from '@/app/providers/asset-picker-provider'
import { useToast } from '@/app/providers/toast-provider'
import { PageHeader } from '@/components/ui/admin-page'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { SafeHtml } from '@/components/ui/safe-html'
import { useTranslation } from '@/features/i18n/use-translation'
import { createPodcastFormSchema, type PodcastFormValues } from '@/features/podcasts/schema/podcast-form-schema'
import {
  createPodcast,
  deletePodcast,
  getPodcastDetail,
  reRenderPodcast,
  updatePodcast,
} from '@/features/podcasts/services/podcast-api'
import { buildPodcastFormDefaults } from '@/features/podcasts/utils/build-podcast-form-defaults'
import { mapPodcastDetailToFormValues } from '@/features/podcasts/utils/map-podcast-detail-to-form-values'
import { podcastQueryKeys } from '@/features/podcasts/utils/podcast-query-keys'
import { buildImageMarkdownInsertion } from '@/features/posts/utils/build-image-markdown-insertion'
import type { ApiErrorResponse } from '@/types/api'

interface PodcastEditorShellProps {
  mode: 'create' | 'edit'
  podcastId?: string
}

export function PodcastEditorShell({ mode, podcastId }: PodcastEditorShellProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { pushToast } = useToast()
  const { openAssetPicker } = useAssetPicker()
  const { language, t, translateOptional } = useTranslation()

  const isCreate = mode === 'create'
  const formSchema = useMemo(() => createPodcastFormSchema(language), [language])
  const defaultValues = useMemo(() => buildPodcastFormDefaults({ language, mode }), [language, mode])

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false)
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null)

  const {
    handleSubmit,
    control,
    getValues,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<PodcastFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const detailQuery = useQuery({
    queryKey: podcastQueryKeys.detail(podcastId ?? ''),
    queryFn: () => getPodcastDetail(podcastId as string),
    enabled: !isCreate && Boolean(podcastId),
  })

  useEffect(() => {
    if (isCreate || !podcastId) {
      reset(defaultValues)
      return
    }
    if (!detailQuery.data) {
      return
    }
    reset(mapPodcastDetailToFormValues(detailQuery.data))
  }, [defaultValues, detailQuery.data, isCreate, podcastId, reset])

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
    mutationFn: async (data: PodcastFormValues) =>
      isCreate || !podcastId ? createPodcast(data) : updatePodcast(podcastId, data),
    onSuccess: async (response) => {
      pushToast({
        title: isCreate ? t('创建成功', 'Created Successfully') : t('保存成功', 'Saved Successfully'),
        description: translateOptional(response.message),
        tone: 'success',
      })
      await queryClient.invalidateQueries({ queryKey: podcastQueryKeys.lists() })
      if (isCreate && response.data?.id) {
        await navigate({ to: '/podcasts/$id', params: { id: String(response.data.id) }, replace: true })
      }
    },
    onError: (error) => {
      const apiError = error as unknown as ApiErrorResponse
      pushToast({
        title: t('保存失败', 'Save Failed'),
        description: translateOptional(apiError.message) || t('请稍后重试。', 'Please try again later.'),
        tone: 'error',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!podcastId) {
        throw new Error('missing-podcast-id')
      }
      return deletePodcast(podcastId)
    },
    onSuccess: async (response) => {
      pushToast({
        title: t('删除成功', 'Deleted Successfully'),
        description: translateOptional(response.message),
        tone: 'success',
      })
      setConfirmDeleteOpen(false)
      await queryClient.invalidateQueries({ queryKey: podcastQueryKeys.lists() })
      await navigate({ to: '/podcasts' })
    },
    onError: (error) => {
      const apiError = error as unknown as ApiErrorResponse
      pushToast({
        title: t('删除失败', 'Delete Failed'),
        description: translateOptional(apiError.message) || t('请稍后重试。', 'Please try again later.'),
        tone: 'error',
      })
    },
  })

  const reRenderMutation = useMutation({
    mutationFn: async () => {
      if (!podcastId) {
        throw new Error('missing-podcast-id')
      }
      return reRenderPodcast(podcastId)
    },
    onSuccess: async (response) => {
      pushToast({
        title: t('已触发重新渲染', 'Re-render Triggered'),
        description: translateOptional(response.message),
        tone: 'success',
      })
      await queryClient.invalidateQueries({ queryKey: podcastQueryKeys.detail(podcastId ?? '') })
      await detailQuery.refetch()
    },
    onError: (error) => {
      const apiError = error as unknown as ApiErrorResponse
      pushToast({
        title: t('重新渲染失败', 'Re-render Failed'),
        description: translateOptional(apiError.message) || t('请稍后重试。', 'Please try again later.'),
        tone: 'error',
      })
    },
  })

  const handleBack = () => {
    if (!isDirty) {
      void navigate({ to: '/podcasts' })
      return
    }
    setConfirmLeaveOpen(true)
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

  const submit = handleSubmit(async (data) => {
    await saveMutation.mutateAsync(data)
  })

  return (
    <>
      <form className="space-y-6" onSubmit={submit}>
        <PageHeader
          actions={
            <div className="flex flex-wrap items-center gap-3">
            <button
              className="admin-button-secondary"
              onClick={handleBack}
              type="button"
            >
              {t('返回列表', 'Back to List')}
            </button>
            {!isCreate ? (
              <>
                <button
                  className="admin-button-danger"
                  onClick={() => setConfirmDeleteOpen(true)}
                  type="button"
                >
                  {t('删除', 'Delete')}
                </button>
                <button
                  className="admin-button-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={reRenderMutation.isPending}
                  onClick={() => void reRenderMutation.mutateAsync()}
                  type="button"
                >
                  {t('立即重渲染', 'Re-render Now')}
                </button>
              </>
            ) : null}
            <Button loading={saveMutation.isPending} type="submit">
              {t('保存', 'Save')}
            </Button>
          </div>
          }
          description={t('编辑播客信息、封面和 Show Notes。', 'Edit podcast details, cover artwork, and show notes.')}
          eyebrow={t('播客编辑器', 'Podcast Editor')}
          meta={t('Show Notes 支持 Markdown 与素材插入。', 'Show notes support Markdown and asset insertion.')}
          title={isCreate ? t('新建播客', 'New Podcast') : t(`编辑播客 #${podcastId}`, `Edit Podcast #${podcastId}`)}
        />

        <section className="grid gap-6 xl:grid-cols-2">
          <PodcastBasicsSection
            control={control}
            errors={errors}
            onPickCoverImage={() =>
              openAssetPicker((url) => {
                setValue('cover_url', url, { shouldDirty: true, shouldValidate: true })
                setValue('cover_asset_id', null, { shouldDirty: true })
              })
            }
            setValue={setValue}
          />
          <PodcastShowNotesSection
            contentHtml={detailQuery.data?.content_html ?? ''}
            control={control}
            isCreate={isCreate}
            onInsertImage={handleInsertInlineImage}
            setValue={setValue}
            textareaRef={contentTextareaRef}
          />
        </section>

        {detailQuery.isLoading ? (
          <p className="text-sm text-muted">{t('正在加载详情...', 'Loading details...')}</p>
        ) : null}
        {detailQuery.error ? (
          <p className="text-sm text-danger">
            {t('详情加载失败，请稍后重试。', 'Failed to load details. Please try again later.')}
          </p>
        ) : null}
      </form>

      <ConfirmDialog
        danger
        description={t(
          '将删除当前播客条目，此操作不可撤销。',
          'This will delete the current podcast entry. This action cannot be undone.',
        )}
        loading={deleteMutation.isPending}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={() => void deleteMutation.mutateAsync()}
        open={confirmDeleteOpen}
        title={t('确认删除', 'Confirm Delete')}
      />

      <ConfirmDialog
        description={t(
          '表单已修改但尚未保存，确认离开吗？',
          'You have unsaved changes. Leave this page anyway?',
        )}
        onCancel={() => setConfirmLeaveOpen(false)}
        onConfirm={() => {
          setConfirmLeaveOpen(false)
          void navigate({ to: '/podcasts' })
        }}
        open={confirmLeaveOpen}
        title={t('未保存提醒', 'Unsaved Changes')}
      />
    </>
  )
}

function PodcastBasicsSection({
  control,
  errors,
  onPickCoverImage,
  setValue,
}: {
  control: Control<PodcastFormValues>
  errors: FieldErrors<PodcastFormValues>
  onPickCoverImage: () => void
  setValue: UseFormSetValue<PodcastFormValues>
}) {
  const { t } = useTranslation()
  const title = useWatch({ control, name: 'title' }) ?? ''
  const slug = useWatch({ control, name: 'slug' }) ?? ''
  const platform = useWatch({ control, name: 'platform' }) ?? 'spotify'
  const url = useWatch({ control, name: 'url' }) ?? ''
  const lang = useWatch({ control, name: 'lang' }) ?? 'zh'
  const publishedAt = useWatch({ control, name: 'published_at' }) ?? ''
  const coverUrl = useWatch({ control, name: 'cover_url' }) ?? ''

  return (
    <article className="rounded-[20px] border border-border bg-surface p-5 shadow-soft">
      <h2 className="text-[15px] font-semibold text-text">
        {t('封面与基础信息', 'Cover and Basics')}
      </h2>
      <div className="mt-4 grid gap-4">
        <Input
          error={errors.title?.message}
          label={t('标题', 'Title')}
          onValueChange={(value) => setValue('title', value, { shouldDirty: true })}
          value={title}
        />
        <Input
          error={errors.slug?.message}
          label={t('别名', 'Slug')}
          onValueChange={(value) => setValue('slug', value, { shouldDirty: true })}
          value={slug}
        />
        <Input
          error={errors.platform?.message}
          label={t('平台 (spotify/apple/youtube/rss)', 'Platform (spotify/apple/youtube/rss)')}
          onValueChange={(value) =>
            setValue('platform', value as PodcastFormValues['platform'], {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          value={platform}
        />
        <Input
          error={errors.url?.message}
          label={t('播客 URL', 'Podcast URL')}
          onValueChange={(value) => setValue('url', value, { shouldDirty: true })}
          value={url}
        />
        <Input
          error={errors.lang?.message}
          label={t('语言 (zh/en)', 'Language (zh/en)')}
          onValueChange={(value) =>
            setValue('lang', value as PodcastFormValues['lang'], {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          value={lang}
        />
        <Input
          error={errors.published_at?.message}
          label={t('发布时间', 'Publish Time')}
          onValueChange={(value) => setValue('published_at', value, { shouldDirty: true })}
          value={publishedAt}
        />
        <Input
          error={errors.cover_url?.message}
          label={t('封面 URL', 'Cover URL')}
          onValueChange={(value) => setValue('cover_url', value, { shouldDirty: true })}
          value={coverUrl}
        />
        <Button onClick={onPickCoverImage} type="button">
          {t('选择封面素材', 'Choose Cover Asset')}
        </Button>
      </div>
    </article>
  )
}

function PodcastShowNotesSection({
  contentHtml,
  control,
  isCreate,
  onInsertImage,
  setValue,
  textareaRef,
}: {
  contentHtml: string
  control: Control<PodcastFormValues>
  isCreate: boolean
  onInsertImage: () => void
  setValue: UseFormSetValue<PodcastFormValues>
  textareaRef: MutableRefObject<HTMLTextAreaElement | null>
}) {
  const { t } = useTranslation()
  const contentMd = useWatch({ control, name: 'content_md' }) ?? ''

  return (
    <article className="rounded-[20px] border border-border bg-surface p-5 shadow-soft">
      <h2 className="text-[15px] font-semibold text-text">{t('节目摘要', 'Show Notes')}</h2>
      <div className="mt-4 grid gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <ToolbarChip label={t('标题1', 'H1')} />
          <ToolbarChip label={t('标题2', 'H2')} />
          <ToolbarChip label={t('链接', 'Link')} />
          <ToolbarChip label={t('图片', 'Image')} onClick={onInsertImage} />
          <ToolbarChip label={t('引用', 'Quote')} />
        </div>
        <label className="flex flex-col gap-2 text-sm text-text">
          <span className="text-[13px] font-semibold">{t('内容', 'Content')}</span>
          <textarea
            className="admin-textarea min-h-[320px] resize-y p-4 text-sm leading-7 placeholder:text-muted"
            onChange={(event) => setValue('content_md', event.target.value, { shouldDirty: true })}
            placeholder={t('输入 Show Notes Markdown...', 'Enter show notes markdown...')}
            ref={(node) => {
              textareaRef.current = node
            }}
            value={contentMd}
          />
        </label>

        {!isCreate ? (
          <div className="rounded-2xl border border-border bg-background/70 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted">
              {t('预览', 'Preview')}
            </p>
            <SafeHtml className="mt-3 text-sm text-text" html={contentHtml} />
          </div>
        ) : (
          <p className="text-sm text-muted">
            {t('保存后可查看内容预览。', 'Preview becomes available after the first save.')}
          </p>
        )}
      </div>
    </article>
  )
}

function ToolbarChip({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      className="admin-button-secondary admin-button-sm"
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}
