import { useEffect, useState } from 'react'
import { cn } from '@/utils/cn'

interface MediaThumbnailProps {
  src?: string | null
  alt: string
  fallback: string
  className?: string
  imageClassName?: string
}

export function MediaThumbnail({
  src,
  alt,
  fallback,
  className,
  imageClassName,
}: MediaThumbnailProps) {
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    setLoadFailed(false)
  }, [src])

  const showImage = Boolean(src) && !loadFailed

  return (
    <div
      className={cn(
        'mb-3 overflow-hidden rounded-[16px] border border-border bg-background',
        className,
      )}
    >
      {showImage ? (
        <img
          alt={alt}
          className={cn('h-full w-full object-cover', imageClassName)}
          decoding="async"
          loading="lazy"
          onError={() => setLoadFailed(true)}
          src={src ?? undefined}
        />
      ) : (
        <div className="flex h-full min-h-[8rem] items-center justify-center px-3 py-10 text-center text-xs font-medium text-muted">
          {fallback}
        </div>
      )}
    </div>
  )
}
