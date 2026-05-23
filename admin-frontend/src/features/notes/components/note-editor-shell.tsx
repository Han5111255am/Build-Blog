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
import { NoteBasicInfoSection } from '@/features/notes/components/note-basic-info-section'
import { NoteContentSection } from '@/features/notes/components/note-content-section'
import { NotePublishingSection } from '@/features/notes/components/note-publishing-section'
import {
  createNote,
  createNoteTagOption,
  deleteNote,
  getNoteDetail,
  getNoteTagOptions,
  updateNote,
} from '@/features/notes/services/note-api'
import { createNoteFormSchema, type NoteFormValues } from '@/features/notes/schema/note-form-schema'
import type { NoteMutationPayload } from '@/features/notes/types/note'
import { buildNoteFormDefaults } from '@/features/notes/utils/build-note-form-defaults'
import { parseNoteListSearch } from '@/features/notes/utils/note-list-search-params'
import { mapNoteDetailToFormValues } from '@/features/notes/utils/map-note-detail-to-form-values'
import { noteQueryKeys } from '@/features/notes/utils/note-query-keys'
import { buildImageMarkdownInsertion } from '@/features/posts/utils/build-image-markdown-insertion'
import type { ApiErrorResponse } from '@/types/api'
import { applyServerFieldErrors } from '@/utils/apply-server-field-errors'

interface NoteEditorShellProps {
  mode: 'create' | 'edit'
  noteId?: string
}

type SubmitIntent = 'draft' | 'publish'
type NoteDetail = Awaited<ReturnType<typeof getNoteDetail>>

function resolveSubmitIntent(status?: NoteFormValues['status'] | null): SubmitIntent {
  return status === 'published' ? 'publish' : 'draft'
}

function normalizePublishedAtValue(value: string) {
  const normalizedValue = value.trim()
  return normalizedValue ? normalizedValue : null
}

export function NoteEditorShell({ mode, noteId }: NoteEditorShellProps) {
  const navigate = useNavigate()
  const search = useSearch({ strict: false })
  const queryClient = useQueryClient()
  const { openAssetPicker } = useAssetPicker()
  const { pushToast } = useToast()
  const { language, t, translateOptional } = useTranslation()
  const isCreate = mode === 'create'
  const formSchema = useMemo(() => createNoteFormSchema(language), [language])
  const defaultValues = useMemo(() => buildNoteFormDefaults({ language, mode }), [language, mode])
  const listSearchParams = useMemo(() => parseNoteListSearch(search), [search])
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
  } = useForm<NoteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const detailQuery = useQuery({
    queryKey: noteQueryKeys.detail(noteId ?? ''),
    queryFn: () => getNoteDetail(noteId as string),
    enabled: !isCreate && Boolean(noteId),
  })

  const tagOptionsQuery = useQuery({
    queryKey: noteQueryKeys.tagOptions(deferredTagSearch),
    queryFn: () => getNoteTagOptions(deferredTagSearch),
  })

  useEffect(() => {
    if (isCreate || !noteId) {
      reset(defaultValues)
      setSubmitIntent(resolveSubmitIntent(defaultValues.status))
      return
    }

    if (!detailQuery.data) {
      return
    }

    const mappedValues = mapNoteDetailToFormValues(detailQuery.data)
    reset(mappedValues)
    setSubmitIntent(resolveSubmitIntent(mappedValues.status))
  }, [defaultValues, detailQuery.data, isCreate, noteId, reset])

  useEffect(() => {
    if (!detailQuery.error) {
      return
    }

    const apiError = detailQuery.error as unknown as ApiErrorResponse
    pushToast({
      title: t('笔记详情加载失败', 'Failed to Load Note'),
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
    mutationFn: async ({ data, intent }: { data: NoteFormValues; intent: SubmitIntent }) => {
      const nextStatus: NoteFormValues['status'] = intent === 'publish' ? 'published' : 'draft'
      const payload: NoteMutationPayload = {
        ...data,
        status: nextStatus,
        published_at: normalizePublishedAtValue(data.published_at),
      }
      return isCreate || !noteId ? createNote(payload) : updateNote(noteId, payload)
    },
    onSuccess: async (response, variables) => {
      const successTitle =
        variables.intent === 'publish'
          ? t('笔记已发布', 'Note Published')
          : t('笔记已保存', 'Note Saved')
      const successMessage =
        variables.intent === 'publish'
          ? t('笔记已发布，已同步最新内容。', 'The note has been published and synced.')
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
      await queryClient.invalidateQueries({ queryKey: noteQueryKeys.lists() })

      const targetId = response.data?.id ?? (noteId ? Number(noteId) : undefined)
      if (targetId) {
        await queryClient.invalidateQueries({
          queryKey: noteQueryKeys.detail(String(targetId)),
        })
      }

      const submittedValues = mapNoteDetailToFormValues(response.data)
      reset(submittedValues)
      setSubmitIntent(resolveSubmitIntent(response.data.status))

      if (isCreate && response.data?.id) {
        await navigate({
          to: '/notes/$id',
          params: { id: String(response.data.id) },
          search: listSearchParams,
          replace: true,
        })
      }
    },
    onError: (error) => {
      const apiError = error as unknown as ApiErrorResponse
      applyServerFieldErrors<NoteFormValues>(apiError.errors, setError)
      const message =
        translateOptional(apiError.message) ||
        t('保存失败，请检查表单后重试。', 'Save failed. Check the form and try again.')
      setSubmitMessage(message)
      pushToast({
        title: t('笔记保存失败', 'Failed to Save Note'),
        description: message,
        tone: 'error',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!noteId) {
        throw new Error('missing-note-id')
      }
      return deleteNote(noteId)
    },
    onSuccess: async (response) => {
      pushToast({
        title: t('笔记已删除', 'Note Deleted'),
        description: translateOptional(response.message),
        tone: 'success',
      })
      setConfirmDeleteOpen(false)
      await queryClient.invalidateQueries({ queryKey: noteQueryKeys.lists() })
      await navigate({ to: '/notes', search: listSearchParams })
    },
    onError: (error) => {
      const apiError = error as unknown as ApiErrorResponse
      pushToast({
        title: t('笔记删除失败', 'Failed to Delete Note'),
        description: translateOptional(apiError.message) || t('请稍后重试。', 'Please try again later.'),
        tone: 'error',
      })
    },
  })

  const createTagMutation = useMutation({
    mutationFn: async () => createNoteTagOption({ name: tagSearch.trim() }),
    onSuccess: async (response) => {
      const createdTag = response.data
      pushToast({
        title: t('标签已创建', 'Tag Created'),
        description: translateOptional(response.message),
        tone: 'success',
      })
      await queryClient.invalidateQueries({ queryKey: noteQueryKeys.options() })
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
      t('笔记详情加载失败，请稍后重试。', 'Failed to load note details. Please try again later.')
    : ''
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

  const submitNoteWithIntent = async (intent: SubmitIntent) => {
    setSubmitIntent(intent)
    await handleSubmit(async (data) => {
      setSubmitMessage('')
      await saveMutation.mutateAsync({ data, intent })
    })()
  }

  const handleDelete = async () => {
    if (!noteId) {
      pushToast({
        title: t('当前笔记尚未保存', 'Note Has Not Been Saved Yet'),
        description: t('请先保存笔记，再执行删除。', 'Save the note before deleting it.'),
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

    void navigate({ to: '/notes', search: listSearchParams })
  }

  return (
    <>
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault()
          void submitNoteWithIntent('draft')
        }}
      >
        <PageHeader
          actions={
            <div className="flex flex-wrap items-center gap-3">
            <Button
              loading={saveMutation.isPending && submitIntent === 'draft'}
              onClick={() => void submitNoteWithIntent('draft')}
              type="button"
            >
              {t('保存草稿', 'Save Draft')}
            </Button>
            <button
              className="admin-button-primary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={saveMutation.isPending}
              onClick={() => void submitNoteWithIntent('publish')}
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
              {t('删除笔记', 'Delete Note')}
            </button>
          </div>
          }
          description={t(
            '编辑笔记内容、发布时间和标签信息。',
            'Edit note content, publish timing, and tag information.',
          )}
          eyebrow={t('笔记编辑器', 'Note Editor')}
          meta={
            submitMessage ||
            loadError ||
            t(
              '表单未保存时，离开当前页面会先提示确认。',
              'If the form has unsaved changes, leaving this page will ask for confirmation.',
            )
          }
          title={isCreate ? t('新建笔记', 'New Note') : t(`编辑笔记 #${noteId}`, `Edit Note #${noteId}`)}
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(280px,340px)_minmax(0,1fr)_minmax(280px,320px)]">
          <aside className="space-y-6">
            <EditorCard
              title={t('基本信息', 'Basic Info')}
              description={t('标题、别名和摘要。', 'Title, slug, and summary.')}
            >
              <NoteBasicInfoSection errors={errors} register={register} />
            </EditorCard>
            <EditorCard
              title={t('发布设置', 'Publishing')}
              description={t('发布时间和标签。', 'Publish time and tags.')}
            >
              <NotePublishingCard
                control={control}
                canCreateTag={Boolean(tagSearch.trim())}
                creatingTag={createTagMutation.isPending}
                errors={errors}
                onCreateTag={() => void handleCreateTag()}
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
              <NoteContentSection
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
              <NotePreviewCard control={control} detail={detail} />
            </EditorCard>
            <EditorCard
              title={t('系统信息', 'System Info')}
              description={t('只读字段。', 'Read-only fields.')}
            >
              <NoteSystemInfoCard control={control} detail={detail} />
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
          void navigate({ to: '/notes', search: listSearchParams })
        }}
        open={confirmLeaveOpen}
        title={t('确认返回列表？', 'Leave and Return to the List?')}
      />

      <ConfirmDialog
        confirmLabel={t('确认删除', 'Confirm Delete')}
        danger
        description={
          isCreate
            ? t(
                '当前是新建模式，删除仅会关闭提示，不会发起后端请求。',
                'This item has not been created yet. Deleting will only close the dialog.',
              )
            : t(
                '删除后不可恢复，并且将从笔记列表中移除。',
                'Deletion cannot be undone and the note will be removed from the list.',
              )
        }
        loading={deleteMutation.isPending}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={() => void handleDelete()}
        open={confirmDeleteOpen}
        title={t('确认删除当前笔记？', 'Delete This Note?')}
      />
    </>
  )
}

interface EditorCardProps {
  title: string
  description?: string
  children: ReactNode
}

function EditorCard({ children, description, title }: EditorCardProps) {
  return (
    <section className="rounded-[20px] border border-border bg-surface p-5 shadow-soft">
      <div className="mb-4">
        <h2 className="text-[15px] font-semibold text-text">{title}</h2>
        {description ? (
          <p className="mt-1 text-[13px] leading-5 text-muted">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function NotePublishingCard({
  canCreateTag,
  control,
  creatingTag,
  errors,
  onCreateTag,
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
  control: Control<NoteFormValues>
  creatingTag: boolean
  errors: FieldErrors<NoteFormValues>
  onCreateTag: () => void
  onTagSearchChange: (value: string) => void
  onToggleTag: (tagId: number) => void
  register: UseFormRegister<NoteFormValues>
  submitIntent: SubmitIntent
  tagOptions: Awaited<ReturnType<typeof getNoteTagOptions>>
  tagOptionsError?: string
  tagOptionsLoading: boolean
  tagSearch: string
}) {
  const publishedAt = useWatch({ control, name: 'published_at' }) ?? ''
  const selectedTagIds = useWatch({ control, name: 'tag_ids' }) ?? []
  const status = useWatch({ control, name: 'status' }) ?? 'draft'

  return (
    <NotePublishingSection
      canCreateTag={canCreateTag}
      creatingTag={creatingTag}
      errors={errors}
      onCreateTag={onCreateTag}
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

function NotePreviewCard({
  control,
  detail,
}: {
  control: Control<NoteFormValues>
  detail: NoteDetail | null
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

function NoteSystemInfoCard({
  control,
  detail,
}: {
  control: Control<NoteFormValues>
  detail: NoteDetail | null
}) {
  const { t } = useTranslation()
  const status = useWatch({ control, name: 'status' }) ?? 'draft'

  return (
    <ul className="space-y-2 text-sm text-muted">
      <li>
        {t('创建时间：', 'Created At:')}
        {detail?.created_at || '-'}
      </li>
      <li>
        {t('最后更新：', 'Updated At:')}
        {detail?.updated_at || '-'}
      </li>
      <li>
        {t('阅读时长：', 'Reading Time:')}
        {detail ? t(`${detail.reading_time} 分钟`, `${detail.reading_time} min`) : '-'}
      </li>
      <li>
        {t('发布状态：', 'Status:')}
        {status}
      </li>
    </ul>
  )
}

function addTagId(tagIds: number[], tagId: number) {
  return tagIds.includes(tagId) ? tagIds : [...tagIds, tagId]
}
