from html import escape

from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from django.conf import settings
from django.db import connection
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.utils.feedgenerator import rfc2822_date
from django.core.cache import cache
from .models import FriendLink, Post, Note, Project, Photo, Podcast
from .serializers import PostListSerializer, PostDetailSerializer
from .serializers import (
    FriendLinkApplicationSerializer,
    FriendLinkSerializer,
    NoteListSerializer, NoteDetailSerializer,
    ProjectListSerializer, ProjectDetailSerializer,
    PhotoSerializer,
    PodcastListSerializer, PodcastDetailSerializer,
)
from .cache_utils import (
    generate_etag,
    get_post_cache_key,
    generate_cache_key,
    generate_query_params_cache_key,
    invalidate_pattern,
)
from .pagination import (
    PostStreamCursorPagination,
    NoteStreamCursorPagination,
    PodcastStreamCursorPagination,
)
from .api_security import HealthCheckPermission, PublicContentPermission
from .analytics_services import ANALYTICS_OVERVIEW_PERIOD_ALL_TIME, get_dashboard_analytics_payload
from .search_services import search_content


# ─── 通用已发布查询 mixin ──────────────────────────────────────────

PUBLIC_CONTENT_CACHE_CONTROL = 'public, no-cache, max-age=0, must-revalidate'
DISCOVERY_CACHE_CONTROL = 'public, max-age=300'


def _absolute_url(request, path):
    return request.build_absolute_uri(path)


def _xml_response(content, content_type):
    response = HttpResponse(content, content_type=f'{content_type}; charset=utf-8')
    response['Cache-Control'] = DISCOVERY_CACHE_CONTROL
    return response


def _current_published(model_class):
    return model_class.objects.filter(
        status='published', published_at__lte=timezone.now()
    )


def _public_sitemap_entries(request):
    static_paths = ['/', '/posts', '/notes', '/projects', '/friends', '/friends/apply', '/podcasts', '/photos']
    entries = [
        {
            'loc': _absolute_url(request, path),
            'lastmod': None,
        }
        for path in static_paths
    ]

    for post in _current_published(Post).only('slug', 'updated_at').order_by('-published_at'):
        entries.append({'loc': _absolute_url(request, f'/posts/{post.slug}'), 'lastmod': post.updated_at})

    for note in _current_published(Note).only('slug', 'updated_at').order_by('-published_at'):
        entries.append({'loc': _absolute_url(request, f'/notes/{note.slug}'), 'lastmod': note.updated_at})

    for project in _current_published(Project).only('slug', 'updated_at').order_by('display_order', '-created_at'):
        entries.append({'loc': _absolute_url(request, f'/projects/{project.slug}'), 'lastmod': project.updated_at})

    for podcast in Podcast.objects.filter(published_at__lte=timezone.now()).only('slug', 'updated_at').order_by('-published_at'):
        entries.append({'loc': _absolute_url(request, f'/podcasts/{podcast.slug}'), 'lastmod': podcast.updated_at})

    return entries


def sitemap_view(request):
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for entry in _public_sitemap_entries(request):
        lines.append('  <url>')
        lines.append(f'    <loc>{escape(entry["loc"])}</loc>')
        if entry['lastmod']:
            lines.append(f'    <lastmod>{entry["lastmod"].date().isoformat()}</lastmod>')
        lines.append('  </url>')
    lines.append('</urlset>')
    return _xml_response('\n'.join(lines), 'application/xml')


def robots_view(request):
    content = '\n'.join([
        'User-agent: *',
        'Allow: /',
        f'Sitemap: {_absolute_url(request, "/sitemap.xml")}',
        '',
    ])
    return _xml_response(content, 'text/plain')


def invalidate_friend_link_cache():
    invalidate_pattern('friend-link:list:*')


def _public_rss_items():
    items = []
    for post in _current_published(Post).only('slug', 'title', 'summary', 'published_at', 'updated_at').order_by('-published_at')[:20]:
        items.append({
            'title': post.title,
            'link_path': f'/posts/{post.slug}',
            'description': post.summary,
            'published_at': post.published_at,
            'updated_at': post.updated_at,
            'guid': f'post:{post.slug}',
        })

    for note in _current_published(Note).only('slug', 'title', 'summary', 'published_at', 'updated_at').order_by('-published_at')[:20]:
        items.append({
            'title': note.title or f'Note {note.pk}',
            'link_path': f'/notes/{note.slug}',
            'description': note.summary,
            'published_at': note.published_at,
            'updated_at': note.updated_at,
            'guid': f'note:{note.slug}',
        })

    items.sort(key=lambda item: item['published_at'], reverse=True)
    return items[:30]


def rss_view(request):
    items = _public_rss_items()
    latest = items[0]['published_at'] if items else timezone.now()
    channel_link = _absolute_url(request, '/')
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0">',
        '  <channel>',
        '    <title>Personal Blog</title>',
        f'    <link>{escape(channel_link)}</link>',
        '    <description>Latest posts and notes from this personal blog.</description>',
        '    <language>zh-CN</language>',
        f'    <lastBuildDate>{rfc2822_date(latest)}</lastBuildDate>',
        f'    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="{escape(_absolute_url(request, "/rss.xml"))}" rel="self" type="application/rss+xml" />',
    ]

    for item in items:
        link = _absolute_url(request, item['link_path'])
        lines.extend([
            '    <item>',
            f'      <title>{escape(item["title"])}</title>',
            f'      <link>{escape(link)}</link>',
            f'      <guid isPermaLink="false">{escape(item["guid"])}</guid>',
            f'      <pubDate>{rfc2822_date(item["published_at"])}</pubDate>',
            f'      <description>{escape(item["description"] or "")}</description>',
            '    </item>',
        ])

    lines.extend([
        '  </channel>',
        '</rss>',
    ])
    return _xml_response('\n'.join(lines), 'application/rss+xml')


def build_public_home_analytics_payload():
    payload = get_dashboard_analytics_payload(overview_period=ANALYTICS_OVERVIEW_PERIOD_ALL_TIME)
    status = payload.get('analytics_status') or {}
    overview = payload.get('analytics_overview') or {}
    trends = payload.get('analytics_trends') or {}

    return {
        'data_state': status.get('data_state'),
        'message': status.get('message'),
        'overview': {
            'period_label': overview.get('period_label'),
            'pageviews': overview.get('pageviews'),
            'visitors': overview.get('visitors'),
            'visits': overview.get('visits'),
        },
        'trends': {
            'period_label': trends.get('period_label'),
            'labels': trends.get('labels') or [],
            'pageviews': trends.get('pageviews') or [],
            'visitors': trends.get('visitors') or [],
            'visits': trends.get('visits') or [],
        },
    }


class PublishedMixin:
    """提取公共的已发布/缓存逻辑"""

    def _published_qs(self, model_class):
        return model_class.objects.filter(
            status='published', published_at__lte=timezone.now()
        ).order_by('-published_at')


class PublicContentViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [PublicContentPermission]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'public_content'

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        if request.method == 'GET' and response.status_code in {200, 304}:
            response['Cache-Control'] = PUBLIC_CONTENT_CACHE_CONTROL
        return response


class FriendLinkViewSet(PublicContentViewSet, viewsets.GenericViewSet):
    queryset = FriendLink.objects.none()
    serializer_class = FriendLinkSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['site_name', 'description']
    ordering_fields = ['display_order', 'created_at', 'site_name']
    ordering = ['display_order', '-reviewed_at', '-created_at']

    def get_queryset(self):
        return FriendLink.objects.filter(status=FriendLink.Status.APPROVED).order_by(
            'display_order',
            '-reviewed_at',
            '-created_at',
        )

    def list(self, request, *args, **kwargs):
        cache_key = generate_query_params_cache_key(
            'friend-link:list',
            request.query_params,
            include_keys=['page', 'search', 'ordering'],
        )

        cached_data = cache.get(cache_key)
        if cached_data:
            response = Response(cached_data)
            response['X-Cache'] = 'HIT'
            return response

        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, 300)
        response['X-Cache'] = 'MISS'
        return response

    @action(detail=False, methods=['post'], url_path='apply', permission_classes=[AllowAny], throttle_scope='friend_link_apply')
    def apply(self, request):
        serializer = FriendLinkApplicationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        friend_link = serializer.save(status=FriendLink.Status.PENDING)
        response_serializer = FriendLinkApplicationSerializer(friend_link)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


# ─── Post ──────────────────────────────────────────────────────────


class PostViewSet(PublicContentViewSet):
    """
    文章 ViewSet（只读）

    list: 获取文章列表
    retrieve: 获取文章详情（通过 slug）
    """
    lookup_field = 'slug'

    # 过滤、搜索、排序
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['lang', 'status']
    search_fields = ['title', 'summary']
    ordering_fields = ['published_at', 'created_at', 'reading_time']
    ordering = ['-published_at']

    def get_queryset(self):
        return Post.objects.filter(
            status='published', published_at__lte=timezone.now()
        ).prefetch_related('tags').order_by('-published_at')

    def get_serializer_class(self):
        """根据 action 选择序列化器"""
        if self.action == 'retrieve':
            return PostDetailSerializer
        return PostListSerializer

    def list(self, request, *args, **kwargs):
        """
        文章列表（带缓存）
        """
        cache_key = generate_query_params_cache_key(
            'post:list',
            request.query_params,
            include_keys=['lang', 'page', 'search', 'ordering'],
        )

        # 尝试从缓存获取
        cached_data = cache.get(cache_key)
        if cached_data:
            response = Response(cached_data)
            response['X-Cache'] = 'HIT'
            return response

        # 调用父类方法获取数据
        response = super().list(request, *args, **kwargs)

        # 缓存响应数据（5分钟）
        cache.set(cache_key, response.data, 300)
        response['X-Cache'] = 'MISS'

        return response

    def retrieve(self, request, *args, **kwargs):
        """
        文章详情（带缓存和 ETag）
        """
        slug = kwargs.get('slug')
        cache_key = get_post_cache_key(slug=slug)

        # 尝试从缓存获取
        cached_data = cache.get(cache_key)

        if cached_data:
            # 生成 ETag
            etag = generate_etag(cached_data)

            # 检查 If-None-Match 头
            if_none_match = request.META.get('HTTP_IF_NONE_MATCH')
            if if_none_match == etag:
                response = Response(status=304)
                response['ETag'] = etag
                response['X-Cache'] = 'HIT'
                return response

            response = Response(cached_data)
            response['ETag'] = etag
            response['X-Cache'] = 'HIT'
            return response

        # 调用父类方法获取数据
        response = super().retrieve(request, *args, **kwargs)

        # 生成 ETag
        etag = generate_etag(response.data)

        # 缓存响应数据（10分钟）
        cache.set(cache_key, response.data, 600)

        response['ETag'] = etag
        response['X-Cache'] = 'MISS'

        return response

    @action(detail=False, methods=['get'], url_path='feed', pagination_class=PostStreamCursorPagination)
    def feed(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = PostListSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=['get'], url_path='home')
    def home_aggregate(self, request):
        """
        首页聚合接口（带缓存）
        返回最新文章、置顶文章等
        """
        cache_key = 'home:aggregate'
        stats_cache_key = 'home:stats'

        cached_data = cache.get(cache_key)
        cached_stats = cache.get(stats_cache_key)
        if cached_data and cached_stats:
            response = Response({
                **cached_data,
                'stats': cached_stats,
                'analytics': build_public_home_analytics_payload(),
            })
            response['X-Cache'] = 'HIT'
            return response

        post_qs = self.get_queryset()
        note_qs = Note.objects.filter(
            status='published', published_at__lte=timezone.now()
        ).prefetch_related('tags').order_by('-published_at')
        project_qs = Project.objects.filter(
            status='published', published_at__lte=timezone.now()
        ).prefetch_related('tags').order_by('display_order', '-created_at')

        latest_posts = post_qs[:10]
        posts_by_lang = {
            'en': post_qs.filter(lang='en')[:5],
            'zh': post_qs.filter(lang='zh')[:5],
        }
        latest_notes = note_qs[:5]
        featured_projects = project_qs[:6]

        data = {
            'latest': PostListSerializer(latest_posts, many=True).data,
            'by_lang': {
                'en': PostListSerializer(posts_by_lang['en'], many=True).data,
                'zh': PostListSerializer(posts_by_lang['zh'], many=True).data,
            },
            'latest_notes': NoteListSerializer(latest_notes, many=True).data,
            'featured_projects': ProjectListSerializer(featured_projects, many=True).data,
        }
        stats = {
            'total_posts': post_qs.count(),
            'en_posts': post_qs.filter(lang='en').count(),
            'zh_posts': post_qs.filter(lang='zh').count(),
            'total_notes': note_qs.count(),
            'total_projects': project_qs.count(),
            'total_photos': Photo.objects.count(),
        }

        cache.set(cache_key, data, 300)
        cache.set(stats_cache_key, stats, 600)

        response = Response({
            **data,
            'stats': stats,
            'analytics': build_public_home_analytics_payload(),
        })
        response['X-Cache'] = 'MISS'
        return response


class SearchView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'search'

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        limit = min(int(request.query_params.get('limit', 10) or 10), 50)
        if not query:
            return Response({'detail': 'Missing query parameter q'}, status=status.HTTP_400_BAD_REQUEST)
        result = search_content(query, limit=limit)
        return Response(result)


def get_internal_health_payload():
    db_ok = True
    cache_ok = True
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
            cursor.fetchone()
    except Exception:
        db_ok = False

    try:
        cache.set('health:check', 'ok', 5)
        cache_ok = cache.get('health:check') == 'ok'
    except Exception:
        cache_ok = False

    status_code = status.HTTP_200_OK if db_ok and cache_ok else status.HTTP_503_SERVICE_UNAVAILABLE
    payload = {
        'status': 'ok' if status_code == status.HTTP_200_OK else 'degraded',
        'database': db_ok,
        'cache': cache_ok,
        'search_backend': getattr(settings, 'SEARCH_BACKEND', 'database'),
        'broker_configured': bool(getattr(settings, 'CELERY_BROKER_URL', '')),
        'result_backend_configured': bool(getattr(settings, 'CELERY_RESULT_BACKEND', '')),
    }
    return payload, status_code


class PublicHealthView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'health_public'

    def get(self, request):
        return Response({
            'status': 'ok',
            'service': 'backend',
        }, status=status.HTTP_200_OK)


class InternalHealthCheckView(APIView):
    permission_classes = [HealthCheckPermission]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'health_internal'

    def get(self, request):
        payload, status_code = get_internal_health_payload()
        return Response(payload, status=status_code)


# ─── Note ──────────────────────────────────────────────────────────


class NoteViewSet(PublicContentViewSet):
    """笔记 ViewSet（只读）"""
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['lang']
    search_fields = ['title', 'summary']
    ordering_fields = ['published_at', 'created_at']
    ordering = ['-published_at']

    def get_queryset(self):
        return Note.objects.filter(
            status='published', published_at__lte=timezone.now()
        ).prefetch_related('tags').order_by('-published_at')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return NoteDetailSerializer
        return NoteListSerializer

    def list(self, request, *args, **kwargs):
        cache_key = generate_query_params_cache_key(
            'note:list',
            request.query_params,
            include_keys=['lang', 'page', 'search', 'ordering'],
        )

        cached_data = cache.get(cache_key)
        if cached_data:
            response = Response(cached_data)
            response['X-Cache'] = 'HIT'
            return response

        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, 300)
        response['X-Cache'] = 'MISS'
        return response

    def retrieve(self, request, *args, **kwargs):
        slug = kwargs.get('slug')
        cache_key = generate_cache_key('note:detail', slug)

        cached_data = cache.get(cache_key)
        if cached_data:
            etag = generate_etag(cached_data)
            if_none_match = request.META.get('HTTP_IF_NONE_MATCH')
            if if_none_match == etag:
                resp = Response(status=304)
                resp['ETag'] = etag
                resp['X-Cache'] = 'HIT'
                return resp
            response = Response(cached_data)
            response['ETag'] = etag
            response['X-Cache'] = 'HIT'
            return response

        response = super().retrieve(request, *args, **kwargs)
        etag = generate_etag(response.data)
        cache.set(cache_key, response.data, 600)
        response['ETag'] = etag
        response['X-Cache'] = 'MISS'
        return response


    @action(detail=False, methods=['get'], url_path='feed', pagination_class=NoteStreamCursorPagination)
    def feed(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = NoteListSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)



class ProjectViewSet(PublicContentViewSet):
    """项目 ViewSet（只读）"""
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['lang']
    search_fields = ['name']
    ordering_fields = ['display_order', 'created_at']
    ordering = ['display_order', '-created_at']

    def get_queryset(self):
        return Project.objects.filter(
            status='published', published_at__lte=timezone.now()
        ).prefetch_related('tags').order_by('display_order', '-created_at')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProjectDetailSerializer
        return ProjectListSerializer

    def list(self, request, *args, **kwargs):
        cache_key = generate_query_params_cache_key(
            'project:list',
            request.query_params,
            include_keys=['lang', 'search', 'ordering', 'page'],
        )

        cached_data = cache.get(cache_key)
        if cached_data:
            response = Response(cached_data)
            response['X-Cache'] = 'HIT'
            return response

        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, 600)
        response['X-Cache'] = 'MISS'
        return response


# ─── Photo ─────────────────────────────────────────────────────────


class PhotoViewSet(PublicContentViewSet):
    """照片 ViewSet（只读，必须分页）"""
    queryset = Photo.objects.select_related('original', 'thumbnail').all()
    serializer_class = PhotoSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['lang']
    ordering_fields = ['taken_at', 'created_at']
    ordering = ['-taken_at', '-created_at']

    def list(self, request, *args, **kwargs):
        cache_key = generate_query_params_cache_key(
            'photo:list',
            request.query_params,
            include_keys=['lang', 'page', 'ordering'],
        )

        cached_data = cache.get(cache_key)
        if cached_data:
            response = Response(cached_data)
            response['X-Cache'] = 'HIT'
            return response

        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, 600)
        response['X-Cache'] = 'MISS'
        return response


# ─── Podcast ───────────────────────────────────────────────────────


class PodcastViewSet(PublicContentViewSet):
    """播客/媒体 ViewSet（只读）"""
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['lang', 'platform']
    search_fields = ['title']
    ordering_fields = ['published_at', 'created_at']
    ordering = ['-published_at']

    def get_queryset(self):
        return Podcast.objects.select_related('cover').filter(
            published_at__lte=timezone.now()
        ).order_by('-published_at')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PodcastDetailSerializer
        return PodcastListSerializer

    def list(self, request, *args, **kwargs):
        cache_key = generate_query_params_cache_key(
            'podcast:list',
            request.query_params,
            include_keys=['lang', 'platform', 'page', 'search', 'ordering'],
        )

        cached_data = cache.get(cache_key)
        if cached_data:
            response = Response(cached_data)
            response['X-Cache'] = 'HIT'
            return response

        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, 600)
        response['X-Cache'] = 'MISS'
        return response





    @action(detail=False, methods=['get'], url_path='feed', pagination_class=PodcastStreamCursorPagination)
    def feed(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = PodcastListSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)


search_view = SearchView.as_view()
health_view = PublicHealthView.as_view()
internal_health_view = InternalHealthCheckView.as_view()
