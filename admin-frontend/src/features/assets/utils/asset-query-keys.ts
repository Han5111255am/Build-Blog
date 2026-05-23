import type { AssetListParams } from '@/features/assets/types/asset'

export const assetQueryKeys = {
  all: ['assets'] as const,
  lists: () => [...assetQueryKeys.all, 'list'] as const,
  list: (params: AssetListParams) => [...assetQueryKeys.lists(), params] as const,
}

