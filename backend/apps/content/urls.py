from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.content.admin_views import (
    AccountSettingsView,
    AdminAssetViewSet,
    AdminNoteViewSet,
    AdminPhotoViewSet,
    AdminPostViewSet,
    AdminPodcastViewSet,
    AdminProjectViewSet,
    AdminTagViewSet,
    AuthCsrfView,
    CurrentUserView,
    DashboardOverviewView,
    LoginView,
    LogoutView,
    PasswordChangeView,
    PreferenceSettingsView,
    SystemCacheInvalidateView,
    SystemCacheSummaryView,
    SystemHealthView,
    SystemPerformanceSummaryView,
    SystemSearchStatusView,
    SystemSearchTestView,
    SystemTaskRetryView,
    SystemTasksView,
    TagOptionsView,
)
from apps.content.views import (
    PostViewSet,
    NoteViewSet,
    ProjectViewSet,
    PhotoViewSet,
    PodcastViewSet,
    search_view,
    health_view,
    internal_health_view,
    robots_view,
    rss_view,
    sitemap_view,
)

# 创建 DRF Router
router = DefaultRouter()
router.register(r'posts', PostViewSet, basename='post')
router.register(r'notes', NoteViewSet, basename='note')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'photos', PhotoViewSet, basename='photo')
router.register(r'podcasts', PodcastViewSet, basename='podcast')

admin_router = DefaultRouter()
admin_router.register(r'posts', AdminPostViewSet, basename='admin-post')
admin_router.register(r'notes', AdminNoteViewSet, basename='admin-note')
admin_router.register(r'tags', AdminTagViewSet, basename='admin-tag')
admin_router.register(r'assets', AdminAssetViewSet, basename='admin-asset')
admin_router.register(r'photos', AdminPhotoViewSet, basename='admin-photo')
admin_router.register(r'podcasts', AdminPodcastViewSet, basename='admin-podcast')
admin_router.register(r'projects', AdminProjectViewSet, basename='admin-project')

urlpatterns = [
    path('sitemap.xml', sitemap_view, name='public-sitemap'),
    path('robots.txt', robots_view, name='public-robots'),
    path('rss.xml', rss_view, name='public-rss'),
    path('feed.xml', rss_view, name='public-feed'),
    path('api/admin/auth/csrf/', AuthCsrfView.as_view(), name='admin-auth-csrf'),
    path('api/admin/auth/login/', LoginView.as_view(), name='admin-auth-login'),
    path('api/admin/auth/logout/', LogoutView.as_view(), name='admin-auth-logout'),
    path('api/admin/auth/me/', CurrentUserView.as_view(), name='admin-auth-me'),
    path('api/admin/dashboard/', DashboardOverviewView.as_view(), name='admin-dashboard-overview'),
    path('api/admin/settings/account/', AccountSettingsView.as_view(), name='admin-settings-account'),
    path('api/admin/settings/preferences/', PreferenceSettingsView.as_view(), name='admin-settings-preferences'),
    path('api/admin/settings/password/', PasswordChangeView.as_view(), name='admin-settings-password'),
    path('api/admin/system/health/', SystemHealthView.as_view(), name='admin-system-health'),
    path('api/admin/system/performance/', SystemPerformanceSummaryView.as_view(), name='admin-system-performance'),
    path('api/admin/system/tasks/', SystemTasksView.as_view(), name='admin-system-tasks'),
    path('api/admin/system/tasks/<str:task_id>/retry/', SystemTaskRetryView.as_view(), name='admin-system-task-retry'),
    path('api/admin/system/cache/', SystemCacheSummaryView.as_view(), name='admin-system-cache'),
    path('api/admin/system/cache/invalidate/', SystemCacheInvalidateView.as_view(), name='admin-system-cache-invalidate'),
    path('api/admin/system/search/status/', SystemSearchStatusView.as_view(), name='admin-system-search-status'),
    path('api/admin/system/search/test/', SystemSearchTestView.as_view(), name='admin-system-search-test'),
    path('api/admin/options/tags/', TagOptionsView.as_view(), name='admin-options-tags'),
    path('api/admin/', include(admin_router.urls)),
    path('api/search/', search_view, name='content-search'),
    path('api/health/', health_view, name='content-health'),
    path('api/health/internal/', internal_health_view, name='content-health-internal'),
    path('api/', include(router.urls)),
]

