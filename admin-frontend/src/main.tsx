import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppProviders } from '@/app/providers/app-providers'
import { AppRouterProvider } from '@/app/router/router-provider'
import '@/styles/globals.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppProviders>
      <AppRouterProvider />
    </AppProviders>
  </React.StrictMode>,
)

