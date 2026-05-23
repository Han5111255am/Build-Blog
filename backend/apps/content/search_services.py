import json
from urllib import error, request

from django.conf import settings
from django.db.models import Q
from django.utils import timezone

from .models import Note, Podcast, Post, Project
from .security_utils import validate_outbound_http_url


def _serialize_item(item_type, obj):
    published_at = getattr(obj, 'published_at', None)
    created_at = getattr(obj, 'created_at', None)
    return {
        'type': item_type,
        'slug': obj.slug,
        'title': getattr(obj, 'title', getattr(obj, 'name', '')),
        'summary': getattr(obj, 'summary', '') or getattr(obj, 'description', ''),
        'lang': getattr(obj, 'lang', None),
        'published_at': published_at.isoformat() if published_at else None,
        'created_at': created_at.isoformat() if created_at else None,
    }


def _database_search(query, limit):
    now = timezone.now()
    posts = Post.objects.filter(
        status='published', published_at__lte=now
    ).filter(Q(title__icontains=query) | Q(summary__icontains=query))[:limit]
    notes = Note.objects.filter(
        status='published', published_at__lte=now
    ).filter(Q(title__icontains=query) | Q(summary__icontains=query))[:limit]
    podcasts = Podcast.objects.filter(
        published_at__lte=now, title__icontains=query
    )[:limit]
    projects = Project.objects.filter(
        status='published',
        published_at__lte=now,
        name__icontains=query,
    ).order_by('display_order', '-created_at')[:limit]

    items = [
        *[_serialize_item('post', obj) for obj in posts],
        *[_serialize_item('note', obj) for obj in notes],
        *[_serialize_item('podcast', obj) for obj in podcasts],
        *[_serialize_item('project', obj) for obj in projects],
    ]
    items.sort(key=lambda item: item['published_at'] or item['created_at'] or '', reverse=True)
    return {'backend': 'database', 'results': items[:limit]}


def _meilisearch_search(query, limit):
    host = validate_outbound_http_url(
        getattr(settings, 'MEILISEARCH_URL', ''),
        setting_name='MEILISEARCH_URL',
    ).rstrip('/')
    index = getattr(settings, 'MEILISEARCH_INDEX', 'content')
    api_key = getattr(settings, 'MEILISEARCH_API_KEY', '')

    payload = json.dumps({'q': query, 'limit': limit}).encode('utf-8')
    req = request.Request(
        f'{host}/indexes/{index}/search',
        data=payload,
        headers={
            'Content-Type': 'application/json',
            **({'Authorization': f'Bearer {api_key}'} if api_key else {}),
        },
        method='POST',
    )
    with request.urlopen(req, timeout=5) as resp:  # nosem: python.lang.security.audit.dynamic-urllib-use-detected.dynamic-urllib-use-detected
        body = json.loads(resp.read().decode('utf-8'))
    return {'backend': 'meilisearch', 'results': body.get('hits', [])}


def search_content(query, limit=10):
    backend = getattr(settings, 'SEARCH_BACKEND', 'database')
    if backend == 'meilisearch':
        try:
            return _meilisearch_search(query, limit)
        except (ValueError, error.URLError, TimeoutError):
            return _database_search(query, limit)
    return _database_search(query, limit)
