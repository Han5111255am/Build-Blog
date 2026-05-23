import { useEffect, useMemo, useState } from 'react'
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
import { useTranslation } from '@/features/i18n/use-translation'
import { createPhotoFormSchema, type PhotoFormValues } from '@/features/photos/schema/photo-form-schema'
import { createPhoto, deletePhoto, getPhotoDetail, updatePhoto } from '@/features/photos/services/photo-api'
import { buildPhotoFormDefaults } from '@/features/photos/utils/build-photo-form-defaults'
import { mapPhotoDetailToFormValues } from '@/features/photos/utils/map-photo-detail-to-form-values'
import { photoQueryKeys } from '@/features/photos/utils/photo-query-keys'
import type { ApiErrorResponse } from '@/types/api'

interface PhotoEditorShellProps {
  mode: 'create' | 'edit'
  photoId?: string
}

export function PhotoEditorShell({ mode, photoId }: PhotoEditorShellProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { pushToast } = useToast()
  const { openAssetPicker } = useAssetPicker()
  const { language, t, translateOptional } = useTranslation()
  const isCreate = mode === 'create'

  const formSchema = useMemo(() => createPhotoFormSchema(language), [language])
  const defaultValues = useMemo(() => buildPhotoFormDefaults({ language, mode }), [language, mode])
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false)

  const {
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<PhotoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const detailQuery = useQuery({
    queryKey: photoQueryKeys.detail(photoId ?? ''),
    queryFn: () => getPhotoDetail(photoId as string),
    enabled: !isCreate && Boolean(photoId),
  })

  useEffect(() => {
    if (isCreate || !photoId) {
      reset(defaultValues)
      return
    }

    if (!detailQuery.data) {
      return
    }

    reset(mapPhotoDetailToFormValues(detailQuery.data))
  }, [defaultValues, detailQuery.data, isCreate, photoId, reset])

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
    mutationFn: async (data: PhotoFormValues) =>
      isCreate || !photoId ? createPhoto(data) : updatePhoto(photoId, data),
    onSuccess: async (response) => {
      pushToast({
        title: isCreate ? t('创建成功', 'Created Successfully') : t('保存成功', 'Saved Successfully'),
        description: translateOptional(response.message),
        tone: 'success',
      })
      await queryClient.invalidateQueries({ queryKey: photoQueryKeys.lists() })
      if (isCreate && response.data?.id) {
        await navigate({ to: '/photos/$id', params: { id: String(response.data.id) }, replace: true })
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
      if (!photoId) {
        throw new Error('missing-photo-id')
      }
      return deletePhoto(photoId)
    },
    onSuccess: async (response) => {
      pushToast({
        title: t('删除成功', 'Deleted Successfully'),
        description: translateOptional(response.message),
        tone: 'success',
      })
      setConfirmDeleteOpen(false)
      await queryClient.invalidateQueries({ queryKey: photoQueryKeys.lists() })
      await navigate({ to: '/photos' })
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

  const handleBack = () => {
    if (!isDirty) {
      void navigate({ to: '/photos' })
      return
    }
    setConfirmLeaveOpen(true)
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
              <button
                className="admin-button-danger"
                onClick={() => setConfirmDeleteOpen(true)}
                type="button"
              >
                {t('删除', 'Delete')}
              </button>
            ) : null}
            <Button loading={saveMutation.isPending} type="submit">
              {t('保存', 'Save')}
            </Button>
          </div>
          }
          description={t('编辑照片素材和基础信息。', 'Edit photo assets and basic metadata.')}
          eyebrow={t('照片编辑器', 'Photo Editor')}
          meta={t('原图和缩略图可从素材库快速选择。', 'Original and thumbnail assets can be selected from the library.')}
          title={isCreate ? t('新建照片', 'New Photo') : t(`编辑照片 #${photoId}`, `Edit Photo #${photoId}`)}
        />

        <section className="grid gap-6 xl:grid-cols-2">
          <PhotoAssetReferencesSection
            control={control}
            errors={errors}
            onPickOriginal={() =>
              openAssetPicker((url) =>
                setValue('original_url', url, {
                  shouldDirty: true,
                  shouldValidate: true,
                }),
              )
            }
            onPickThumbnail={() =>
              openAssetPicker((url) =>
                setValue('thumbnail_url', url, {
                  shouldDirty: true,
                  shouldValidate: true,
                }),
              )
            }
            setValue={setValue}
          />
          <PhotoBasicInfoSection
            control={control}
            errors={errors}
            setValue={setValue}
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
          '将删除当前照片条目，此操作不可撤销。',
          'This will delete the current photo entry. This action cannot be undone.',
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
          'The form has unsaved changes. Leave this page anyway?',
        )}
        onCancel={() => setConfirmLeaveOpen(false)}
        onConfirm={() => {
          setConfirmLeaveOpen(false)
          void navigate({ to: '/photos' })
        }}
        open={confirmLeaveOpen}
        title={t('未保存提醒', 'Unsaved Changes')}
      />
    </>
  )
}

function PhotoAssetReferencesSection({
  control,
  errors,
  onPickOriginal,
  onPickThumbnail,
  setValue,
}: {
  control: Control<PhotoFormValues>
  errors: FieldErrors<PhotoFormValues>
  onPickOriginal: () => void
  onPickThumbnail: () => void
  setValue: UseFormSetValue<PhotoFormValues>
}) {
  const { t } = useTranslation()
  const originalUrl = useWatch({ control, name: 'original_url' }) ?? ''
  const thumbnailUrl = useWatch({ control, name: 'thumbnail_url' }) ?? ''

  return (
    <article className="rounded-[20px] border border-border bg-surface p-5 shadow-soft">
      <h2 className="text-[15px] font-semibold text-text">
        {t('素材引用', 'Asset References')}
      </h2>
      <div className="mt-4 grid gap-4">
        <Input
          error={errors.original_url?.message}
          label={t('原图 URL', 'Original URL')}
          onValueChange={(value) => setValue('original_url', value, { shouldDirty: true })}
          value={originalUrl}
        />
        <Button onClick={onPickOriginal} type="button">
          {t('选择原图', 'Choose Original')}
        </Button>
        <Input
          error={errors.thumbnail_url?.message}
          label={t('缩略图 URL', 'Thumbnail URL')}
          onValueChange={(value) => setValue('thumbnail_url', value, { shouldDirty: true })}
          value={thumbnailUrl}
        />
        <Button onClick={onPickThumbnail} type="button">
          {t('选择缩略图', 'Choose Thumbnail')}
        </Button>
      </div>
    </article>
  )
}

function PhotoBasicInfoSection({
  control,
  errors,
  setValue,
}: {
  control: Control<PhotoFormValues>
  errors: FieldErrors<PhotoFormValues>
  setValue: UseFormSetValue<PhotoFormValues>
}) {
  const { t } = useTranslation()
  const caption = useWatch({ control, name: 'caption' }) ?? ''
  const slug = useWatch({ control, name: 'slug' }) ?? ''
  const location = useWatch({ control, name: 'location' }) ?? ''
  const takenAt = useWatch({ control, name: 'taken_at' }) ?? ''
  const description = useWatch({ control, name: 'description' }) ?? ''

  return (
    <article className="rounded-[20px] border border-border bg-surface p-5 shadow-soft">
      <h2 className="text-[15px] font-semibold text-text">
        {t('基础信息', 'Basic Info')}
      </h2>
      <div className="mt-4 grid gap-4">
        <Input
          error={errors.caption?.message}
          label={t('照片标题', 'Caption')}
          onValueChange={(value) => setValue('caption', value, { shouldDirty: true })}
          value={caption}
        />
        <Input
          error={errors.slug?.message}
          label={t('别名', 'Slug')}
          onValueChange={(value) => setValue('slug', value, { shouldDirty: true })}
          value={slug}
        />
        <Input
          error={errors.location?.message}
          label={t('地点', 'Location')}
          onValueChange={(value) => setValue('location', value, { shouldDirty: true })}
          value={location}
        />
        <Input
          error={errors.taken_at?.message}
          label={t('拍摄时间', 'Taken At')}
          onValueChange={(value) => setValue('taken_at', value, { shouldDirty: true })}
          value={takenAt}
        />
        <Input
          error={errors.description?.message}
          label={t('描述', 'Description')}
          onValueChange={(value) => setValue('description', value, { shouldDirty: true })}
          value={description}
        />
      </div>
    </article>
  )
}
