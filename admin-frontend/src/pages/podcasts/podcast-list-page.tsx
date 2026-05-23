import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { MetricCard, PageHeader } from '@/components/ui/admin-page'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/features/i18n/use-translation'
import { getPodcastList } from '@/features/podcasts/services/podcast-api'
import { podcastQueryKeys } from '@/features/podcasts/utils/podcast-query-keys'

export function PodcastListPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const listQuery = useQuery({
    queryKey: podcastQueryKeys.list({ page: 1, page_size: 20, search: '', platform: '', lang: '' }),
    queryFn: () => getPodcastList({ page: 1, page_size: 20, search: '', platform: '', lang: '' }),
  })

  const data = listQuery.data ?? { count: 0, page: 1, page_size: 20, total_pages: 1, results: [] }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button onClick={() => navigate({ to: '/podcasts/new' })} type="button">
            {t('新建播客', 'New Podcast')}
          </Button>
        }
        description={t('查看已发布条目并维护播客元数据。', 'Review published entries and maintain podcast metadata.')}
        eyebrow={t('媒体中心', 'Media Center')}
        meta={t('统一管理平台、封面和发布时间。', 'Manage platform, artwork, and publish time in one place.')}
        title={t('播客库', 'Podcast Library')}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard detail={t('当前列表', 'Current List')} label={t('播客总数', 'Total Podcasts')} value={data.count} />
        <MetricCard detail={t('带有封面的条目', 'Entries with Artwork')} label={t('已有封面', 'With Cover')} value={data.results.filter((item) => Boolean(item.cover_url)).length} />
        <MetricCard detail={t('去重后的分发目标', 'Unique Distribution Targets')} label={t('分发平台', 'Platforms')} value={new Set(data.results.map((item) => item.platform)).size} />
      </section>

      <section className="admin-table overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="px-4 py-3 font-medium">{t('标题', 'Title')}</th>
                <th className="px-4 py-3 font-medium">{t('平台', 'Platform')}</th>
                <th className="px-4 py-3 font-medium">{t('语言', 'Language')}</th>
                <th className="px-4 py-3 font-medium">{t('发布时间', 'Published At')}</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((item) => (
                <tr key={item.id} className="border-t border-border text-sm transition hover:bg-background/60">
                  <td className="px-4 py-4 font-medium text-text">
                    <button
                      className="text-left transition hover:text-brand"
                      onClick={() => navigate({ to: '/podcasts/$id', params: { id: String(item.id) } })}
                      type="button"
                    >
                      {item.title}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-muted">{item.platform}</td>
                  <td className="px-4 py-4 text-muted">{item.lang}</td>
                  <td className="px-4 py-4 text-muted">{item.published_at}</td>
                </tr>
              ))}
              {listQuery.isLoading ? (
                <tr className="border-t border-border text-sm">
                  <td className="px-4 py-4 text-muted" colSpan={4}>
                    {t('正在加载播客列表...', 'Loading podcast list...')}
                  </td>
                </tr>
              ) : null}
              {listQuery.error ? (
                <tr className="border-t border-border text-sm">
                  <td className="px-4 py-4 text-danger" colSpan={4}>
                    {t('播客列表加载失败，请稍后重试。', 'Failed to load podcast list. Please try again later.')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
