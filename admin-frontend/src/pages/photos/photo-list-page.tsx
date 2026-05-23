import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { MetricCard, PageHeader } from '@/components/ui/admin-page'
import { Button } from '@/components/ui/button'
import { MediaThumbnail } from '@/components/ui/media-thumbnail'
import { useTranslation } from '@/features/i18n/use-translation'
import { getPhotoList } from '@/features/photos/services/photo-api'
import { photoQueryKeys } from '@/features/photos/utils/photo-query-keys'

export function PhotoListPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const listQuery = useQuery({
    queryKey: photoQueryKeys.list({ page: 1, page_size: 24, ordering: '-taken_at', lang: '' }),
    queryFn: () => getPhotoList({ page: 1, page_size: 24, ordering: '-taken_at', lang: '' }),
  })

  const data = listQuery.data ?? { count: 0, page: 1, page_size: 24, total_pages: 1, results: [] }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button onClick={() => navigate({ to: '/photos/new' })} type="button">
            {t('新建照片', 'New Photo')}
          </Button>
        }
        description={t('查看和维护照片内容。', 'Review and maintain photo entries.')}
        eyebrow={t('媒体中心', 'Media Center')}
        meta={t('保持摄影内容、地点和时间信息清晰。', 'Keep photo content, location, and time details organized.')}
        title={t('图库', 'Photo Library')}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard detail={t('当前列表', 'Current list')} label={t('照片总数', 'Total Photos')} value={data.count} />
        <MetricCard detail={t('最新时间', 'Latest time')} label={t('最近拍摄', 'Latest Shot')} value={data.results[0]?.taken_at ?? t('暂无', 'None')} />
        <MetricCard detail={t('语言统计', 'Language stats')} label={t('英文照片', 'English Photos')} value={data.results.filter((item) => item.lang === 'en').length} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.results.map((photo) => (
          <article key={photo.id} className="rounded-[20px] border border-border bg-surface p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-glass">
            <MediaThumbnail
              alt={t(`照片缩略图：${photo.caption}`, `Photo thumbnail: ${photo.caption}`)}
              className="aspect-[16/10]"
              fallback={t('暂无缩略图', 'No Thumbnail')}
              src={photo.thumbnail_url || photo.original_url}
            />
            <p className="text-sm font-medium text-text">{photo.caption}</p>
            <p className="mt-1 text-xs text-muted">{photo.location}</p>
            <p className="mt-1 text-xs text-muted">{photo.taken_at}</p>
            <div className="mt-3">
              <button
                className="admin-button-secondary admin-button-sm"
                onClick={() => navigate({ to: '/photos/$id', params: { id: String(photo.id) } })}
                type="button"
              >
                {t('编辑照片', 'Edit Photo')}
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
