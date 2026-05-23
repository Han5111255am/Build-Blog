export const systemQueryKeys = {
  all: ['system'] as const,
  health: () => [...systemQueryKeys.all, 'health'] as const,
  performance: () => [...systemQueryKeys.all, 'performance'] as const,
  tasks: () => [...systemQueryKeys.all, 'tasks'] as const,
  cache: () => [...systemQueryKeys.all, 'cache'] as const,
  searchStatus: () => [...systemQueryKeys.all, 'search', 'status'] as const,
  searchTest: (query: string) => [...systemQueryKeys.all, 'search', 'test', query] as const,
}

