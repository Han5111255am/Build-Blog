import {
  type ButtonHTMLAttributes,
  type CSSProperties,
  type MouseEventHandler,
  type PropsWithChildren,
  useId,
  useMemo,
  useState,
} from 'react'
import { useTranslation } from '@/features/i18n/use-translation'
import { cn } from '@/utils/cn'

interface LiquidGlassButtonProps
  extends PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> {
  loading?: boolean
}

const DEFAULT_POINTER_STATE = {
  glowX: 50,
  glowY: 18,
  rotateX: 0,
  rotateY: 0,
  shiftX: 0,
  shiftY: 0,
}

export function LiquidGlassButton({
  children,
  className,
  disabled,
  loading = false,
  onMouseMove,
  onMouseLeave,
  type = 'button',
  ...props
}: LiquidGlassButtonProps) {
  const { t, tt } = useTranslation()
  const filterId = useId().replace(/:/g, '')
  const [pointerState, setPointerState] = useState(DEFAULT_POINTER_STATE)

  const buttonStyle = useMemo(
    () =>
      ({
        '--liquid-button-glow-x': `${pointerState.glowX}%`,
        '--liquid-button-glow-y': `${pointerState.glowY}%`,
        transform: `perspective(900px) rotateX(${pointerState.rotateX}deg) rotateY(${pointerState.rotateY}deg) translate3d(${pointerState.shiftX}px, ${pointerState.shiftY}px, 0)`,
      }) as CSSProperties,
    [
      pointerState.glowX,
      pointerState.glowY,
      pointerState.rotateX,
      pointerState.rotateY,
      pointerState.shiftX,
      pointerState.shiftY,
    ],
  )

  const handleMouseMove: MouseEventHandler<HTMLButtonElement> = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const relativeX = (event.clientX - rect.left) / rect.width
    const relativeY = (event.clientY - rect.top) / rect.height

    setPointerState({
      glowX: relativeX * 100,
      glowY: relativeY * 100,
      rotateX: (0.5 - relativeY) * 3.4,
      rotateY: (relativeX - 0.5) * 5.6,
      shiftX: (relativeX - 0.5) * 3.6,
      shiftY: (relativeY - 0.5) * 2.4,
    })

    onMouseMove?.(event)
  }

  const handleMouseLeave: MouseEventHandler<HTMLButtonElement> = (event) => {
    setPointerState(DEFAULT_POINTER_STATE)
    onMouseLeave?.(event)
  }

  const content =
    loading
      ? t('处理中...', 'Processing...')
      : typeof children === 'string'
        ? tt(children)
        : children

  return (
    <button
      className={cn(
        'liquid-glass-button min-h-[40px] rounded-[12px] px-4 py-2.5 text-sm font-medium text-text focus:outline-none',
        className,
      )}
      disabled={loading || disabled}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      style={buttonStyle}
      type={type}
      {...props}
    >
      <svg aria-hidden="true" className="liquid-glass-button__filter-defs">
        <defs>
          <filter
            colorInterpolationFilters="sRGB"
            id={filterId}
            x="-24%"
            y="-40%"
            width="148%"
            height="180%"
          >
            <feTurbulence
              baseFrequency="0.015 0.024"
              numOctaves="1"
              result="noise"
              seed="21"
              type="fractalNoise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="11"
              xChannelSelector="R"
              yChannelSelector="B"
            />
          </filter>
        </defs>
      </svg>

      <span
        aria-hidden="true"
        className="liquid-glass-button__backdrop"
        style={{ filter: `url(#${filterId})` }}
      />
      <span aria-hidden="true" className="liquid-glass-button__tint" />
      <span aria-hidden="true" className="liquid-glass-button__glow" />
      <span
        aria-hidden="true"
        className="liquid-glass-button__edge liquid-glass-button__edge--soft"
      />
      <span
        aria-hidden="true"
        className="liquid-glass-button__edge liquid-glass-button__edge--strong"
      />
      <span className="liquid-glass-button__content">{content}</span>
    </button>
  )
}
