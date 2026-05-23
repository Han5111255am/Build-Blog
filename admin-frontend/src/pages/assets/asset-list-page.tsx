import { useMemo, useRef, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/app/providers/toast-provider'
import { MetricCard, PageHeader } from '@/components/ui/admin-page'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { MediaThumbnail } from '@/components/ui/media-thumbnail'
import { useTranslation } from '@/features/i18n/use-translation'
import { deleteAsset, getAssetList, uploadAsset } from '@/features/assets/services/asset-api'
import type { AssetListItem } from '@/features/assets/types/asset'
import { assetQueryKeys } from '@/features/assets/utils/asset-query-keys'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import type { ApiErrorResponse } from '@/types/api'

export function AssetListPage() {
  const queryClient = useQueryClient()
  const { pushToast } = useToast()
  const { t, translateOptional } = useTranslation()
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<AssetListItem | null>(null)

  const listParams = useMemo(
    () => ({ page: 1, page_size: 24, search: debouncedSearch, mime_type: '', storage: '' }),
    [debouncedSearch],
  )
  const listQuery = useQuery({
    queryKey: assetQueryKeys.list(listParams),
    queryFn: () => getAssetList(listParams),
    placeholderData: keepPreviousData,
  })

  const uploadMutation = useMutation({
    mutationFn: uploadAsset,
    onSuccess: async (response) => {
      const message = translateOptional(response.message) || response.message
      pushToast({
        title: t('素材上传完成', 'Asset Uploaded'),
        description: message,
        tone: 'success',
      })
      await queryClient.invalidateQueries({ queryKey: assetQueryKeys.lists() })
    },
    onError: (error) => {
      const apiError = error as unknown as ApiErrorResponse
      pushToast({
        title: t('素材上传失败', 'Failed to Upload Asset'),
        description:
          translateOptional(apiError.message) || t('请稍后重试。', 'Please try again later.'),
        tone: 'error',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!pendingDelete) {
        throw new Error('missing-asset')
      }
      return deleteAsset(pendingDelete.id)
    },
    onSuccess: async (response) => {
      const message = translateOptional(response.message) || response.message
      pushToast({
        title: t('素材已删除', 'Asset Deleted'),
        description: message,
        tone: 'success',
      })
      setConfirmDeleteOpen(false)
      setPendingDelete(null)
      await queryClient.invalidateQueries({ queryKey: assetQueryKeys.lists() })
    },
    onError: (error) => {
      const apiError = error as unknown as ApiErrorResponse
      pushToast({
        title: t('素材删除失败', 'Failed to Delete Asset'),
        description:
          translateOptional(apiError.message) || t('请稍后重试。', 'Please try again later.'),
        tone: 'error',
      })
    },
  })

  const data = listQuery.data ?? { count: 0, page: 1, page_size: 24, total_pages: 1, results: [] }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end">
            <Input
              className="w-full sm:w-72"
              label={t('搜索', 'Search')}
              onValueChange={setSearch}
              placeholder={t('按文件名或 URL 搜索', 'Search by file name or URL')}
              value={search}
            />
          <input
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) {
                return
              }
              void uploadMutation.mutateAsync({ file })
              event.target.value = ''
            }}
            ref={fileRef}
            type="file"
          />
            <button
              className="admin-button-primary h-11 self-start sm:self-end"
              onClick={() => fileRef.current?.click()}
              type="button"
            >
              {t('上传素材', 'Upload Asset')}
            </button>
          </div>
        }
        description={t('集中管理站内图片和素材资源。', 'Manage image and media assets in one place.')}
        eyebrow={t('媒体中心', 'Media Center')}
        meta={t('支持上传、复制链接和删除资源。', 'Upload, copy links, and delete assets.')}
        title={t('素材库', 'Asset Library')}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard detail={t('资源数量', 'Asset count')} label={t('素材总数', 'Total Assets')} value={data.count} />
        <MetricCard
          detail={t('图片类型', 'Image assets')}
          label={t('图片资源', 'Images')}
          value={data.results.filter((item) => item.mime_type.startsWith('image/')).length}
        />
        <MetricCard detail={t('本页显示', 'Shown on this page')} label={t('当前列表', 'Visible Items')} value={data.results.length} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.results.map((asset) => (
          <article key={asset.id} className="rounded-[20px] border border-border bg-surface p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-glass">
            <MediaThumbnail
              alt={t(`素材预览：${asset.name}`, `Asset preview: ${asset.name}`)}
              className="aspect-[16/10]"
              fallback={
                asset.mime_type.startsWith('image/')
                  ? t('预览加载失败', 'Preview unavailable')
                  : t('当前素材不支持预览', 'Preview not available for this asset')
              }
              src={asset.mime_type.startsWith('image/') ? asset.url : ''}
            />
            <p className="text-sm font-medium text-text">{asset.name}</p>
            <p className="mt-1 text-xs text-muted">{asset.mime_type}</p>
            <p className="mt-1 text-xs text-muted">{asset.storage}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className="admin-button-secondary admin-button-sm"
                onClick={() => void navigator.clipboard.writeText(asset.url)}
                type="button"
              >
                {t('复制链接', 'Copy Link')}
              </button>
              <button
                className="admin-button-danger admin-button-sm"
                onClick={() => {
                  setPendingDelete(asset)
                  setConfirmDeleteOpen(true)
                }}
                type="button"
              >
                {t('删除', 'Delete')}
              </button>
            </div>
          </article>
        ))}
      </section>

      <ConfirmDialog
        danger
        description={
          pendingDelete
            ? t(
                `将删除素材“${pendingDelete.name}”。此操作不可撤销。`,
                `This will delete asset "${pendingDelete.name}". This action cannot be undone.`,
              )
            : t('将删除素材。此操作不可撤销。', 'This will delete the asset permanently.')
        }
        loading={deleteMutation.isPending}
        onCancel={() => {
          setConfirmDeleteOpen(false)
          setPendingDelete(null)
        }}
        onConfirm={() => void deleteMutation.mutateAsync()}
        open={confirmDeleteOpen}
        title={t('确认删除素材', 'Delete Asset?')}
      />
    </div>
  )
}
