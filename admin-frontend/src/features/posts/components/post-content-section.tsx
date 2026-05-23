import type { MutableRefObject } from 'react'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { useTranslation } from '@/features/i18n/use-translation'
import type { PostFormValues } from '@/features/posts/schema/post-form-schema'

interface PostContentSectionProps {
  errors: FieldErrors<PostFormValues>
  onInsertImage: () => void
  register: UseFormRegister<PostFormValues>
  textareaRef: MutableRefObject<HTMLTextAreaElement | null>
}

export function PostContentSection({
  errors,
  onInsertImage,
  register,
  textareaRef,
}: PostContentSectionProps) {
  const { t } = useTranslation()
  const contentField = register('content_md')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <ToolbarChip label={t('标题1', 'H1')} />
        <ToolbarChip label={t('标题2', 'H2')} />
        <ToolbarChip label={t('链接', 'Link')} />
        <ToolbarChip label={t('图片', 'Image')} onClick={onInsertImage} />
        <ToolbarChip label={t('引用', 'Quote')} />
      </div>
      <label className="flex flex-col gap-2 text-sm text-text">
        <span className="text-[13px] font-semibold">{t('Markdown 正文', 'Markdown Content')}</span>
        <textarea
          className="admin-textarea min-h-[560px] w-full resize-y p-4 text-sm leading-7"
          {...contentField}
          ref={(node) => {
            contentField.ref(node)
            textareaRef.current = node
          }}
        />
        {errors.content_md?.message ? (
          <span className="text-xs text-danger">{errors.content_md.message}</span>
        ) : null}
      </label>
    </div>
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
