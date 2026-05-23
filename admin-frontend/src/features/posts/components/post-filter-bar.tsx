import type { ChangeEvent } from 'react'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/features/i18n/use-translation'
import type { PostListParams } from '@/features/posts/types/post'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

interface PostFilterBarProps {
  value: PostListParams
  onChange: (patch: Partial<PostListParams>) => void
}

export function PostFilterBar({ onChange, value }: PostFilterBarProps) {
  const { t } = useTranslation()
  const [searchDraft, setSearchDraft] = useState(value.search)
  const debouncedSearchDraft = useDebouncedValue(searchDraft, 300)

  useEffect(() => {
    setSearchDraft(value.search)
  }, [value.search])

  useEffect(() => {
    if (debouncedSearchDraft === value.search) {
      return
    }

    onChange({ search: debouncedSearchDraft, page: 1 })
  }, [debouncedSearchDraft, onChange, value.search])

  return (
    <section className="rounded-[20px] border border-border bg-surface p-5 shadow-soft">
      <div className="grid gap-4 xl:grid-cols-[minmax(240px,1.3fr)_repeat(4,minmax(0,1fr))]">
        <Input
          label={t('关键词搜索', 'Keyword Search')}
          onValueChange={setSearchDraft}
          placeholder={t('按标题、Slug 或摘要搜索', 'Search by title, slug, or summary')}
          value={searchDraft}
        />
        <SelectLikeField
          label={t('语言', 'Language')}
          name="lang"
          onChange={(event) =>
            onChange({ lang: event.target.value as PostListParams['lang'], page: 1 })
          }
          options={[
            { label: t('全部语言', 'All Languages'), value: '' },
            { label: t('中文', 'Chinese'), value: 'zh' },
            { label: t('英文', 'English'), value: 'en' },
          ]}
          value={value.lang}
        />
        <SelectLikeField
          label={t('状态', 'Status')}
          name="status"
          onChange={(event) =>
            onChange({ status: event.target.value as PostListParams['status'], page: 1 })
          }
          options={[
            { label: t('全部状态', 'All Statuses'), value: '' },
            { label: t('草稿', 'Draft'), value: 'draft' },
            { label: t('已发布', 'Published'), value: 'published' },
          ]}
          value={value.status}
        />
        <SelectLikeField
          label={t('排序', 'Ordering')}
          name="ordering"
          onChange={(event) => onChange({ ordering: event.target.value, page: 1 })}
          options={[
            { label: t('最近更新', 'Recently Updated'), value: '-updated_at' },
            { label: t('最早更新', 'Least Recently Updated'), value: 'updated_at' },
            { label: t('最新发布', 'Newest Published'), value: '-published_at' },
            { label: t('最早发布', 'Oldest Published'), value: 'published_at' },
            { label: t('标题 A-Z', 'Title A-Z'), value: 'title' },
            { label: t('标题 Z-A', 'Title Z-A'), value: '-title' },
          ]}
          value={value.ordering}
        />
        <PageSizeField
          onChange={(event) => onChange({ page_size: Number(event.target.value), page: 1 })}
          value={String(value.page_size)}
        />
      </div>
    </section>
  )
}

interface SelectLikeFieldProps {
  label: string
  name: string
  options: Array<{ label: string; value: string }>
  value: string
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void
}

function SelectLikeField({ label, name, onChange, options, value }: SelectLikeFieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-text">
      <span className="text-[13px] font-semibold">{label}</span>
      <select
        className="admin-select h-11 px-4 text-sm outline-none"
        name={name}
        onChange={onChange}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value || 'all'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function PageSizeField({
  onChange,
  value,
}: {
  value: string
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void
}) {
  const { t } = useTranslation()

  return (
    <SelectLikeField
      label={t('每页条数', 'Page Size')}
      name="page_size"
      onChange={onChange}
      options={[
        { label: t('20 条/页', '20 per page'), value: '20' },
        { label: t('50 条/页', '50 per page'), value: '50' },
      ]}
      value={value}
    />
  )
}
