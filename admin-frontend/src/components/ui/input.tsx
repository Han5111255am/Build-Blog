import { ChangeEvent, InputHTMLAttributes, forwardRef } from 'react'
import { useTranslation } from '@/features/i18n/use-translation'
import { cn } from '@/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  onValueChange?: (value: string) => void
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, label, onChange, onValueChange, placeholder, ...props },
  ref,
) {
  const { tt } = useTranslation()

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event)
    onValueChange?.(event.target.value)
  }

  return (
    <label className="flex flex-col gap-2 text-sm text-text">
      <span className="text-[13px] font-semibold">{tt(label)}</span>
      <input
        className={cn(
          'admin-input h-11 px-4 text-sm outline-none placeholder:text-muted',
          error ? 'border-danger focus:border-danger focus:ring-danger/15' : '',
          className,
        )}
        ref={ref}
        onChange={handleChange}
        {...props}
        placeholder={placeholder ? tt(placeholder) : placeholder}
      />
      {error ? <span className="text-xs text-danger">{tt(error)}</span> : null}
    </label>
  )
})
