import {
  type CSSProperties,
  type HTMLAttributes,
  type PropsWithChildren,
  useId,
  useMemo,
  useState,
} from 'react'
import { cn } from '@/utils/cn'

interface LiquidGlassPanelProps
  extends PropsWithChildren,
    Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  contentClassName?: string
  radius?: number
}

const DEFAULT_POINTER_STATE = {
  glowX: 50,
  glowY: 22,
  rotateX: 0,
  rotateY: 0,
  shiftX: 0,
  shiftY: 0,
}

export function LiquidGlassPanel({
  children,
  className,
  contentClassName,
  radius = 36,
  onMouseMove,
  onMouseLeave,
  style,
  ...props
}: LiquidGlassPanelProps) {
  const filterId = useId().replace(/:/g, '')
  const [pointerState, setPointerState] = useState(DEFAULT_POINTER_STATE)

  const panelStyle = useMemo(
    () =>
      ({
        ...style,
        '--liquid-filter-url': `url(#${filterId})`,
        '--liquid-radius': `${radius}px`,
        '--liquid-glow-x': `${pointerState.glowX}%`,
        '--liquid-glow-y': `${pointerState.glowY}%`,
        transform: `perspective(1400px) rotateX(${pointerState.rotateX}deg) rotateY(${pointerState.rotateY}deg) translate3d(${pointerState.shiftX}px, ${pointerState.shiftY}px, 0)`,
      }) as CSSProperties,
    [filterId, pointerState.glowX, pointerState.glowY, pointerState.rotateX, pointerState.rotateY, pointerState.shiftX, pointerState.shiftY, radius, style],
  )

  const handleMouseMove: HTMLAttributes<HTMLDivElement>['onMouseMove'] = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const relativeX = (event.clientX - rect.left) / rect.width
    const relativeY = (event.clientY - rect.top) / rect.height

    setPointerState({
      glowX: relativeX * 100,
      glowY: relativeY * 100,
      rotateX: (0.5 - relativeY) * 4.6,
      rotateY: (relativeX - 0.5) * 6.8,
      shiftX: (relativeX - 0.5) * 6,
      shiftY: (relativeY - 0.5) * 4,
    })

    onMouseMove?.(event)
  }

  const handleMouseLeave: HTMLAttributes<HTMLDivElement>['onMouseLeave'] = (event) => {
    setPointerState(DEFAULT_POINTER_STATE)
    onMouseLeave?.(event)
  }

  return (
    <div
      className={cn('liquid-glass-panel', className)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      style={panelStyle}
      {...props}
    >
      <svg aria-hidden="true" className="liquid-glass-panel__filter-defs">
        <defs>
          <filter
            colorInterpolationFilters="sRGB"
            id={filterId}
            x="-24%"
            y="-24%"
            width="148%"
            height="148%"
          >
            <feTurbulence
              baseFrequency="0.012 0.018"
              numOctaves="1"
              result="noise"
              seed="18"
              type="fractalNoise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="14"
              xChannelSelector="R"
              yChannelSelector="B"
            />
          </filter>
        </defs>
      </svg>

      <span aria-hidden="true" className="liquid-glass-panel__backdrop" />
      <span aria-hidden="true" className="liquid-glass-panel__tint" />
      <span aria-hidden="true" className="liquid-glass-panel__glow" />
      <span
        aria-hidden="true"
        className="liquid-glass-panel__edge liquid-glass-panel__edge--soft"
      />
      <span
        aria-hidden="true"
        className="liquid-glass-panel__edge liquid-glass-panel__edge--strong"
      />
      <div className={cn('liquid-glass-panel__content', contentClassName)}>
        {children}
      </div>
    </div>
  )
}
