import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PropsWithChildren, useState } from 'react'
import { AssetPickerProvider } from '@/app/providers/asset-picker-provider'
import { LanguageProvider } from '@/app/providers/language-provider'
import { ThemeProvider } from '@/app/providers/theme-provider'
import { ToastProvider } from '@/app/providers/toast-provider'

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <LanguageProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <AssetPickerProvider>{children}</AssetPickerProvider>
          </ToastProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </LanguageProvider>
  )
}
