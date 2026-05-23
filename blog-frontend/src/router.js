import HomePage from './pages/HomePage.vue'
import NotFoundPage from './pages/NotFoundPage.vue'
import PhotosPage from './pages/PhotosPage.vue'
import PodcastDetailPage from './pages/PodcastDetailPage.vue'
import PodcastsPage from './pages/PodcastsPage.vue'
import ProjectDetailPage from './pages/ProjectDetailPage.vue'
import ProjectsPage from './pages/ProjectsPage.vue'
import TextDetailPage from './pages/TextDetailPage.vue'
import TextListPage from './pages/TextListPage.vue'
import { t } from './lib/i18n'

export const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
    meta: { title: '首页' },
  },
  {
    path: '/posts',
    name: 'posts',
    component: TextListPage,
    props: () => ({
      kind: 'posts',
      title: t('posts.title'),
      eyebrow: t('posts.eyebrow'),
      description: t('posts.description'),
    }),
  },
  {
    path: '/posts/:slug',
    name: 'post-detail',
    component: TextDetailPage,
    props: () => ({
      kind: 'posts',
      backLabel: t('posts.back'),
      backTo: '/posts',
    }),
  },
  {
    path: '/notes',
    name: 'notes',
    component: TextListPage,
    props: () => ({
      kind: 'notes',
      title: t('notes.title'),
      eyebrow: t('notes.eyebrow'),
      description: t('notes.description'),
    }),
  },
  {
    path: '/notes/:slug',
    name: 'note-detail',
    component: TextDetailPage,
    props: () => ({
      kind: 'notes',
      backLabel: t('notes.back'),
      backTo: '/notes',
    }),
  },
  {
    path: '/projects',
    name: 'projects',
    component: ProjectsPage,
    meta: { title: 'Projects' },
  },
  {
    path: '/projects/:slug',
    name: 'project-detail',
    component: ProjectDetailPage,
    meta: { title: '项目详情' },
  },
  {
    path: '/podcasts',
    name: 'podcasts',
    component: PodcastsPage,
    meta: { title: 'Podcasts' },
  },
  {
    path: '/podcasts/:slug',
    name: 'podcast-detail',
    component: PodcastDetailPage,
    meta: { title: '播客详情' },
  },
  {
    path: '/photos',
    name: 'photos',
    component: PhotosPage,
    meta: { title: 'Photos' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundPage,
    meta: { title: '页面不存在' },
  },
]
