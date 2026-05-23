import { PropsWithChildren } from 'react'

export function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="relative isolate flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <div className="relative z-10 w-full max-w-[28rem] rounded-[28px] border border-border bg-surface px-8 py-9 shadow-glass sm:px-10 sm:py-10">
        {children}
      </div>
    </div>
  )
}
