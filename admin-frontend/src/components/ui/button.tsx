import { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import { useTranslation } from '@/features/i18n/use-translation'
import { cn } from '@/utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'danger'
}

export function Button({
  children,
  className,
  disabled,
  loading = false,
  variant = 'primary',
  ...props
}: PropsWithChildren<ButtonProps>) {
  const { t, tt } = useTranslation()
  const content = loading ? t('处理中...', 'Processing...') : typeof children === 'string' ? tt(children) : children
  const isDisabled = loading || disabled

  if (variant === 'danger') {
    return (
      <button
        className={cn(
          'admin-button-danger focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
          className,
        )}
        disabled={isDisabled}
        {...props}
      >
        {content}
      </button>
    )
  }

  return (
    <button
      className={cn(
        'admin-button-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      disabled={isDisabled}
      {...props}
    >
      {content}
    </button>
  )
}
