import { createContext, PropsWithChildren, useContext, useDeferredValue, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/features/i18n/use-translation'
import { getAssetList } from '@/features/assets/services/asset-api'
import { assetQueryKeys } from '@/features/assets/utils/asset-query-keys'

interface AssetPickerContextValue {
  openAssetPicker: (onSelect?: (assetUrl: string) => void) => void
  closeAssetPicker: () => void
}

const AssetPickerContext = createContext<AssetPickerContextValue | null>(null)

export function AssetPickerProvider({ children }: PropsWithChildren) {
  const { tt } = useTranslation()
  const [open, setOpen] = useState(false)
  const [onSelect, setOnSelect] = useState<((assetUrl: string) => void) | null>(null)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)

  const listQuery = useQuery({
    queryKey: assetQueryKeys.list({ page: 1, page_size: 30, search: deferredSearch, mime_type: 'image/', storage: '' }),
    queryFn: () => getAssetList({ page: 1, page_size: 30, search: deferredSearch, mime_type: 'image/', storage: '' }),
    enabled: open,
  })

  const assets = listQuery.data?.results ?? []

  const value = useMemo<AssetPickerContextValue>(
    () => ({
      openAssetPicker: (callback) => {
        setOnSelect(() => callback ?? null)
        setOpen(true)
      },
      closeAssetPicker: () => setOpen(false),
    }),
    [],
  )

  return (
    <AssetPickerContext.Provider value={value}>
      {children}
      {open ? (
        <div className="fixed inset-0 z-[68] flex items-center justify-center bg-[rgba(15,23,42,0.45)] px-4">
          <div className="w-full max-w-3xl rounded-2xl border border-border bg-panel p-6 shadow-soft backdrop-blur-glass">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted">{tt('素材库')}</p>
                <h2 className="mt-2 text-xl font-semibold text-text">{tt('素材选择器')}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{tt('选择图片素材并回填到当前表单。')}</p>
              </div>
              <button className="rounded-lg border border-border px-4 py-2 text-sm text-muted transition hover:text-text" onClick={() => setOpen(false)} type="button">
                {tt('关闭')}
              </button>
            </div>
            <div className="mb-4">
              <Input label="搜索图片素材" onValueChange={setSearch} placeholder="按文件名/URL 搜索" value={search} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  className="rounded-xl border border-border bg-white/10 p-4 text-left transition hover:bg-white/16 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
                  onClick={() => {
                    onSelect?.(asset.url)
                    setOpen(false)
                  }}
                  type="button"
                >
                  <div className="mb-3 rounded-lg border border-dashed border-border bg-surface/40 px-3 py-8 text-center text-xs text-muted">
                    {tt('图片资源')}
                  </div>
                  <p className="text-sm font-medium text-text">{asset.name}</p>
                  <p className="mt-1 text-xs text-muted">{asset.mime_type}</p>
                  <p className="mt-1 break-all text-xs text-muted">{asset.url}</p>
                </button>
              ))}
            </div>
            {listQuery.isLoading ? <p className="mt-4 text-sm text-muted">{tt('加载中...')}</p> : null}
            {listQuery.error ? <p className="mt-4 text-sm text-danger">{tt('素材加载失败，请稍后重试。')}</p> : null}
          </div>
        </div>
      ) : null}
    </AssetPickerContext.Provider>
  )
}

export function useAssetPicker() {
  const context = useContext(AssetPickerContext)
  if (!context) {
    throw new Error('useAssetPicker must be used within AssetPickerProvider')
  }
  return context
}
