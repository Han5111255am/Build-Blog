import type { MutableRefObject } from 'react'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { useTranslation } from '@/features/i18n/use-translation'
import type { NoteFormValues } from '@/features/notes/schema/note-form-schema'

interface NoteContentSectionProps {
  errors: FieldErrors<NoteFormValues>
  onInsertImage: () => void
  register: UseFormRegister<NoteFormValues>
  textareaRef: MutableRefObject<HTMLTextAreaElement | null>
}

export function NoteContentSection({
  errors,
  onInsertImage,
  register,
  textareaRef,
}: NoteContentSectionProps) {
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
          className="admin-textarea min-h-[520px] resize-y px-4 py-3 text-sm leading-7 placeholder:text-muted"
          placeholder={t(
            '# 输入你的笔记内容\n\n从这里开始整理想法与结论。',
            '# Enter your note content\n\nStart organizing ideas and conclusions here.',
          )}
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
