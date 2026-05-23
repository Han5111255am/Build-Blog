import { Suspense, lazy, type ComponentType } from 'react'
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from '@tanstack/react-router'
import { AppShellLayout } from '@/app/layouts/app-shell-layout'
import { CommandPaletteProvider } from '@/app/providers/command-palette-provider'
import { QuickCreateProvider } from '@/app/providers/quick-create-provider'
import {
  ensureAuthSession,
  hasPersistedAuthenticatedState,
} from '@/features/auth/services/auth-session'
import { AuthLayout } from '@/app/layouts/auth-layout'
import { useTranslation } from '@/features/i18n/use-translation'

function lazyPage<TModule extends Record<string, ComponentType>>(
  loader: () => Promise<TModule>,
  exportName: keyof TModule,
) {
  return lazy(async () => {
    const module = await loader()
    return { default: module[exportName] }
  })
}

function RoutePendingPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-[16rem] items-center justify-center rounded-[1.5rem] border border-border bg-surface/70 px-6 py-10 text-sm text-muted shadow-soft">
      {t('页面加载中...', 'Loading page...')}
    </div>
  )
}

function withRouteSuspense(PageComponent: ComponentType) {
  return function SuspenseRouteComponent() {
    return (
      <Suspense fallback={<RoutePendingPage />}>
        <PageComponent />
      </Suspense>
    )
  }
}

const LoginPage = lazyPage(() => import('@/pages/auth/login-page'), 'LoginPage')
const DashboardPage = lazyPage(() => import('@/pages/dashboard/dashboard-page'), 'DashboardPage')
const PostListPage = lazyPage(() => import('@/pages/posts/post-list-page'), 'PostListPage')
const PostCreatePage = lazyPage(() => import('@/pages/posts/post-create-page'), 'PostCreatePage')
const PostEditPage = lazyPage(() => import('@/pages/posts/post-edit-page'), 'PostEditPage')
const NoteListPage = lazyPage(() => import('@/pages/notes/note-list-page'), 'NoteListPage')
const NoteCreatePage = lazyPage(() => import('@/pages/notes/note-create-page'), 'NoteCreatePage')
const NoteEditPage = lazyPage(() => import('@/pages/notes/note-edit-page'), 'NoteEditPage')
const ProjectListPage = lazyPage(() => import('@/pages/projects/project-list-page'), 'ProjectListPage')
const ProjectCreatePage = lazyPage(() => import('@/pages/projects/project-create-page'), 'ProjectCreatePage')
const ProjectEditPage = lazyPage(() => import('@/pages/projects/project-edit-page'), 'ProjectEditPage')
const TagListPage = lazyPage(() => import('@/pages/tags/tag-list-page'), 'TagListPage')
const TagCreatePage = lazyPage(() => import('@/pages/tags/tag-create-page'), 'TagCreatePage')
const TagEditPage = lazyPage(() => import('@/pages/tags/tag-edit-page'), 'TagEditPage')
const AssetListPage = lazyPage(() => import('@/pages/assets/asset-list-page'), 'AssetListPage')
const PhotoListPage = lazyPage(() => import('@/pages/photos/photo-list-page'), 'PhotoListPage')
const PhotoCreatePage = lazyPage(() => import('@/pages/photos/photo-create-page'), 'PhotoCreatePage')
const PhotoEditPage = lazyPage(() => import('@/pages/photos/photo-edit-page'), 'PhotoEditPage')
const PodcastListPage = lazyPage(() => import('@/pages/podcasts/podcast-list-page'), 'PodcastListPage')
const PodcastCreatePage = lazyPage(() => import('@/pages/podcasts/podcast-create-page'), 'PodcastCreatePage')
const PodcastEditPage = lazyPage(() => import('@/pages/podcasts/podcast-edit-page'), 'PodcastEditPage')
const SystemHealthPage = lazyPage(() => import('@/pages/system/system-health-page'), 'SystemHealthPage')
const SystemTasksPage = lazyPage(() => import('@/pages/system/system-tasks-page'), 'SystemTasksPage')
const SystemCachePage = lazyPage(() => import('@/pages/system/system-cache-page'), 'SystemCachePage')
const SystemSearchPage = lazyPage(() => import('@/pages/system/system-search-page'), 'SystemSearchPage')
const SettingsAccountPage = lazyPage(() => import('@/pages/settings/settings-account-page'), 'SettingsAccountPage')
const SettingsPreferencesPage = lazyPage(() => import('@/pages/settings/settings-preferences-page'), 'SettingsPreferencesPage')

const LoginRoutePage = withRouteSuspense(LoginPage)
const DashboardRoutePage = withRouteSuspense(DashboardPage)
const PostListRoutePage = withRouteSuspense(PostListPage)
const PostCreateRoutePage = withRouteSuspense(PostCreatePage)
const PostEditRoutePage = withRouteSuspense(PostEditPage)
const NoteListRoutePage = withRouteSuspense(NoteListPage)
const NoteCreateRoutePage = withRouteSuspense(NoteCreatePage)
const NoteEditRoutePage = withRouteSuspense(NoteEditPage)
const ProjectListRoutePage = withRouteSuspense(ProjectListPage)
const ProjectCreateRoutePage = withRouteSuspense(ProjectCreatePage)
const ProjectEditRoutePage = withRouteSuspense(ProjectEditPage)
const TagListRoutePage = withRouteSuspense(TagListPage)
const TagCreateRoutePage = withRouteSuspense(TagCreatePage)
const TagEditRoutePage = withRouteSuspense(TagEditPage)
const AssetListRoutePage = withRouteSuspense(AssetListPage)
const PhotoListRoutePage = withRouteSuspense(PhotoListPage)
const PhotoCreateRoutePage = withRouteSuspense(PhotoCreatePage)
const PhotoEditRoutePage = withRouteSuspense(PhotoEditPage)
const PodcastListRoutePage = withRouteSuspense(PodcastListPage)
const PodcastCreateRoutePage = withRouteSuspense(PodcastCreatePage)
const PodcastEditRoutePage = withRouteSuspense(PodcastEditPage)
const SystemHealthRoutePage = withRouteSuspense(SystemHealthPage)
const SystemTasksRoutePage = withRouteSuspense(SystemTasksPage)
const SystemCacheRoutePage = withRouteSuspense(SystemCachePage)
const SystemSearchRoutePage = withRouteSuspense(SystemSearchPage)
const SettingsAccountRoutePage = withRouteSuspense(SettingsAccountPage)
const SettingsPreferencesRoutePage = withRouteSuspense(SettingsPreferencesPage)

const rootRoute = createRootRoute({
  component: () => (
    <CommandPaletteProvider>
      <QuickCreateProvider>
        <Outlet />
      </QuickCreateProvider>
    </CommandPaletteProvider>
  ),
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: async () => {
    if (!hasPersistedAuthenticatedState()) {
      return
    }

    const isAuthenticated = await ensureAuthSession()
    if (isAuthenticated) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: () => (
    <AuthLayout>
      <LoginRoutePage />
    </AuthLayout>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: async () => {
    throw redirect({ to: '/login' })
  },
})

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  beforeLoad: async ({ location }) => {
    const isAuthenticated = await ensureAuthSession()
    if (!isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: () => <AppShellLayout />,
})

const dashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/dashboard',
  component: DashboardRoutePage,
})

const postsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/posts',
  component: PostListRoutePage,
})

const postCreateRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/posts/new',
  component: PostCreateRoutePage,
})

const postEditRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/posts/$id',
  component: PostEditRoutePage,
})

const notesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/notes',
  component: NoteListRoutePage,
})

const noteCreateRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/notes/new',
  component: NoteCreateRoutePage,
})

const noteEditRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/notes/$id',
  component: NoteEditRoutePage,
})

const projectsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/projects',
  component: ProjectListRoutePage,
})

const projectCreateRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/projects/new',
  component: ProjectCreateRoutePage,
})

const projectEditRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/projects/$id',
  component: ProjectEditRoutePage,
})

const tagsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/tags',
  component: TagListRoutePage,
})

const tagCreateRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/tags/new',
  component: TagCreateRoutePage,
})

const tagEditRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/tags/$id',
  component: TagEditRoutePage,
})

const assetsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/assets',
  component: AssetListRoutePage,
})

const photosRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/photos',
  component: PhotoListRoutePage,
})

const photoCreateRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/photos/new',
  component: PhotoCreateRoutePage,
})

const photoEditRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/photos/$id',
  component: PhotoEditRoutePage,
})

const podcastsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/podcasts',
  component: PodcastListRoutePage,
})

const podcastCreateRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/podcasts/new',
  component: PodcastCreateRoutePage,
})

const podcastEditRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/podcasts/$id',
  component: PodcastEditRoutePage,
})

const systemHealthRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/system/health',
  component: SystemHealthRoutePage,
})

const systemTasksRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/system/tasks',
  component: SystemTasksRoutePage,
})

const systemCacheRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/system/cache',
  component: SystemCacheRoutePage,
})

const systemSearchRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/system/search',
  component: SystemSearchRoutePage,
})

const settingsAccountRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/settings/account',
  component: SettingsAccountRoutePage,
})

const settingsPreferencesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/settings/preferences',
  component: SettingsPreferencesRoutePage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  appRoute.addChildren([
    dashboardRoute,
    postsRoute,
    postCreateRoute,
    postEditRoute,
    notesRoute,
    noteCreateRoute,
    noteEditRoute,
    projectsRoute,
    projectCreateRoute,
    projectEditRoute,
    tagsRoute,
    tagCreateRoute,
    tagEditRoute,
    assetsRoute,
    photosRoute,
    photoCreateRoute,
    photoEditRoute,
    podcastsRoute,
    podcastCreateRoute,
    podcastEditRoute,
    systemHealthRoute,
    systemTasksRoute,
    systemCacheRoute,
    systemSearchRoute,
    settingsAccountRoute,
    settingsPreferencesRoute,
  ]),
])

function NotFoundPage() {
  const { tt } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-text">
      <h1 className="text-3xl font-semibold">{tt('页面不存在')}</h1>
      <Link className="text-brand underline-offset-4 hover:underline" to="/dashboard">
        {tt('返回仪表盘')}
      </Link>
    </div>
  )
}

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultNotFoundComponent: NotFoundPage,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export function AppRouterProvider() {
  return <RouterProvider router={router} />
}
