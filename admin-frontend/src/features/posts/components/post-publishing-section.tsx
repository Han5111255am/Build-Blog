import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/features/i18n/use-translation'
import type { PostFormValues } from '@/features/posts/schema/post-form-schema'
import type { PostTagOption } from '@/features/posts/types/post'
import { cn } from '@/utils/cn'

interface PostPublishingSectionProps {
  errors: FieldErrors<PostFormValues>
  register: UseFormRegister<PostFormValues>
  coverImage: string
  selectedTagIds: number[]
  tagOptions: PostTagOption[]
  tagOptionsError?: string
  tagOptionsLoading: boolean
  submitIntent: 'draft' | 'publish'
  publishedAt: string
  status: PostFormValues['status']
  tagSearch: string
  canCreateTag: boolean
  creatingTag: boolean
  onPickCoverImage: () => void
  onCreateTag: () => void
  onTagSearchChange: (value: string) => void
  onToggleTag: (tagId: number) => void
}

export function PostPublishingSection({
  errors,
  register,
  coverImage,
  selectedTagIds,
  tagOptions,
  tagOptionsError,
  tagOptionsLoading,
  submitIntent,
  publishedAt,
  status,
  tagSearch,
  canCreateTag,
  creatingTag,
  onPickCoverImage,
  onCreateTag,
  onTagSearchChange,
  onToggleTag,
}: PostPublishingSectionProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <PublishingIntentHint publishedAt={publishedAt} status={status} submitIntent={submitIntent} />
      <Input
        label={t('发布时间', 'Publish Time')}
        error={errors.published_at?.message}
        placeholder="YYYY-MM-DD HH:mm"
        {...register('published_at')}
      />
      <Input
        label={t('封面地址', 'Cover Image URL')}
        error={errors.cover_image?.message}
        placeholder={t(
          '可手动填写，或使用下方素材选择器自动回填',
          'Enter it manually or use the asset picker below to fill it automatically.',
        )}
        {...register('cover_image')}
      />
      <CoverImageField coverImage={coverImage} onPickCoverImage={onPickCoverImage} />
      <TagField
        canCreateTag={canCreateTag}
        creatingTag={creatingTag}
        onCreateTag={onCreateTag}
        onTagSearchChange={onTagSearchChange}
        onToggleTag={onToggleTag}
        selectedTagIds={selectedTagIds}
        tagOptions={tagOptions}
        tagOptionsError={tagOptionsError}
        tagOptionsLoading={tagOptionsLoading}
        tagSearch={tagSearch}
      />
    </div>
  )
}

function PublishingIntentHint({
  publishedAt,
  status,
  submitIntent,
}: {
  publishedAt: string
  status: PostFormValues['status']
  submitIntent: 'draft' | 'publish'
}) {
  const { t } = useTranslation()
  const willAutoFillPublishedAt = submitIntent === 'publish' && !publishedAt.trim()
  const toneClass =
    submitIntent === 'publish'
      ? 'border-brand/20 bg-[rgba(0,113,227,0.07)] text-text'
      : 'border-border bg-background text-muted'

  return (
    <div className={`rounded-2xl border px-3 py-3 text-xs leading-6 ${toneClass}`}>
      <p className="font-semibold">
        {t('当前提交意图：', 'Current submit intent:')}
        {submitIntent === 'publish' ? t('发布', 'Publish') : t('保存草稿', 'Save Draft')}
      </p>
      <p>
        {submitIntent === 'publish'
          ? willAutoFillPublishedAt
            ? t(
                '当前未填写发布时间，点击发布后系统将自动补全当前时间。',
                'No publish time is set. Publishing will automatically fill in the current time.',
              )
            : t(
                `当前将按已填写发布时间发布：${publishedAt}`,
                `The post will be published at the specified time: ${publishedAt}`,
              )
          : t(
              '当前保存为草稿，不会作为公开内容展示。',
              'This post will stay as a draft and will not be shown publicly.',
            )}
      </p>
      <p>
        {t('表单当前状态字段：', 'Current form status:')}
        {status === 'published' ? 'published' : 'draft'}
      </p>
    </div>
  )
}

function CoverImageField({
  coverImage,
  onPickCoverImage,
}: {
  coverImage: string
  onPickCoverImage: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-background/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-text">{t('封面素材', 'Cover Asset')}</p>
        <button
          className="admin-button-secondary admin-button-sm"
          onClick={onPickCoverImage}
          type="button"
        >
          {t('选择封面素材', 'Choose Cover Asset')}
        </button>
      </div>
      {coverImage ? (
        <div className="space-y-2">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <img alt={t('文章封面预览', 'Post Cover Preview')} className="h-40 w-full object-cover" src={coverImage} />
          </div>
          <p className="break-all text-xs text-muted">{coverImage}</p>
        </div>
      ) : (
        <p className="text-xs text-muted">
          {t(
            '当前未选择封面素材，可从素材库选择图片后自动回填到封面地址。',
            'No cover asset is selected yet. Choose an image from the asset library to fill the cover URL automatically.',
          )}
        </p>
      )}
    </div>
  )
}

function TagField({
  canCreateTag,
  creatingTag,
  onCreateTag,
  onTagSearchChange,
  onToggleTag,
  selectedTagIds,
  tagOptions,
  tagOptionsError,
  tagOptionsLoading,
  tagSearch,
}: {
  canCreateTag: boolean
  creatingTag: boolean
  onCreateTag: () => void
  onTagSearchChange: (value: string) => void
  onToggleTag: (tagId: number) => void
  selectedTagIds: number[]
  tagOptions: PostTagOption[]
  tagOptionsError?: string
  tagOptionsLoading: boolean
  tagSearch: string
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-3 text-sm text-text">
      <Input
        label={t('搜索标签', 'Search Tags')}
        onValueChange={onTagSearchChange}
        placeholder={t('输入名称或 slug 进行远程搜索', 'Search remotely by name or slug')}
        value={tagSearch}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">{t('标签', 'Tags')}</p>
        <div className="flex items-center gap-2">
          {tagOptionsLoading ? <span className="text-xs text-muted">{t('加载中...', 'Loading...')}</span> : null}
          <button
            className="admin-button-secondary admin-button-sm border-dashed disabled:cursor-not-allowed disabled:opacity-60"
            disabled={creatingTag}
            onClick={onCreateTag}
            type="button"
          >
            {creatingTag ? t('创建中...', 'Creating...') : t('+ 新建标签', '+ New Tag')}
          </button>
        </div>
      </div>
      {tagOptionsError ? <p className="text-xs text-danger">{tagOptionsError}</p> : null}
      {tagSearch.trim() ? (
        <p className="text-xs text-muted">{t(`当前搜索：${tagSearch}`, `Current search: ${tagSearch}`)}</p>
      ) : (
        <p className="text-xs text-muted">
          {t(
            '当前展示最近可用标签，可通过搜索缩小范围或直接创建新标签。',
            'Recent available tags are shown here. Search to narrow results or create a new tag directly.',
          )}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {tagOptions.map((tag) => (
          <TagChip
            key={tag.id}
            active={selectedTagIds.includes(tag.id)}
            label={tag.name}
            onClick={() => onToggleTag(tag.id)}
          />
        ))}
      </div>
      {tagOptions.length === 0 && !tagOptionsLoading ? (
        <p className="text-xs text-muted">
          {canCreateTag
            ? t('没有匹配标签，可以直接创建当前搜索词。', 'No matching tags were found. Create the current search term directly.')
            : t('没有匹配标签，请继续调整搜索词。', 'No matching tags were found. Adjust the search term and try again.')}
        </p>
      ) : null}
      {selectedTagIds.length > 0 ? (
        <p className="text-xs text-muted">
          {t(
            `已选择 ${selectedTagIds.length} 个标签，支持继续远程搜索并补充新标签。`,
            `${selectedTagIds.length} tag(s) selected. You can keep searching remotely and add new tags.`,
          )}
        </p>
      ) : (
        <p className="text-xs text-muted">
          {t(
            '当前尚未选择标签，可通过远程搜索快速定位并多选。',
            'No tags are selected yet. Use remote search to find and select multiple tags quickly.',
          )}
        </p>
      )}
    </div>
  )
}

function TagChip({
  active = false,
  disabled = false,
  label,
  onClick,
}: {
  active?: boolean
  disabled?: boolean
  label: string
  onClick?: () => void
}) {
  return (
    <button
      className={cn(
        'admin-button-sm transition',
        active ? 'admin-button-primary' : 'admin-button-secondary',
        disabled ? 'cursor-not-allowed opacity-60' : 'hover:opacity-90',
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}
