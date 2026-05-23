from datetime import timedelta
from django.contrib.auth import login, logout, update_session_auth_hash
from django.db.models import Count, Max, Q
from django.db.models.functions import TruncDate
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from rest_framework import filters, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from .admin_serializers import (
    AccountProfileReadSerializer,
    AccountProfileSerializer,
    AdminAssetSerializer,
    AdminNoteSerializer,
    AdminPhotoSerializer,
    AdminPostSerializer,
    AdminPodcastSerializer,
    AdminProjectSerializer,
    AdminTagDetailSerializer,
    AdminTagSerializer,
    AssetUploadSerializer,
    CurrentUserSerializer,
    IdListSerializer,
    LoginSerializer,
    PasswordChangeSerializer,
    TagOptionCreateSerializer,
    TagUsageUnlinkSerializer,
    TagOptionSerializer,
    UserPreferenceSerializer,
)
from .analytics_services import get_dashboard_analytics_payload
from .api_utils import AdminPageNumberPagination, parse_admin_datetime, success_response
from .cache_utils import cache, invalidate_pattern
from config.celery import app as celery_app
from .models import Asset, Note, Photo, Podcast, Post, Project, StatusChoices, Tag, UserPreference
from .performance_monitoring import build_performance_summary_payload
from .search_services import search_content
from .tasks import _markdown_to_html
from .views import get_internal_health_payload


SYSTEM_TASK_EVENT_LIMIT = 12


def invalidate_admin_content_cache(prefix, slug=None):
    invalidate_pattern(f"{prefix}:list:*")
    cache.delete("home:aggregate")
    cache.delete("home:stats")
    if slug:
        cache.delete(f"{prefix}:detail:{slug}")


def invalidate_public_media_cache(prefix, *, invalidate_home=False):
    invalidate_pattern(f"{prefix}:list:*")
    if invalidate_home:
        cache.delete("home:aggregate")
        cache.delete("home:stats")


def format_admin_datetime(dt):
    if not dt:
        return None
    return timezone.localtime(dt).strftime("%Y-%m-%d %H:%M")


def build_task_metrics(items):
    metrics = []
    for item in items:
        value = item.get("value")
        if value is None:
            continue
        metrics.append(
            {
                "label": item["label"],
                "value": value,
            }
        )
    return metrics
def build_task_item(
    *,
    task_id,
    name,
    category,
    status,
    updated_at,
    message,
    metrics=None,
    details=None,
    retryable=False,
    action_label=None,
    events=None,
):
    return {
        "id": task_id,
        "name": name,
        "category": category,
        "status": status,
        "updated_at": updated_at,
        "message": message,
        "retryable": retryable,
        "action_label": action_label,
        "metrics": metrics or [],
        "details": details or [],
        "events": events or [],
    }


def get_task_event_cache_key(task_id):
    return f"admin:system:task-events:{task_id}"


def format_task_event(dt, *, level, message, source="system", event_key=None):
    return {
        "id": event_key or f"{source}-{level}-{int(dt.timestamp() * 1000000)}",
        "time": format_admin_datetime(dt),
        "level": level,
        "source": source,
        "message": message,
    }


def build_generated_task_events(*, updated_at, status, message, details, source):
    event_time = updated_at or timezone.now()
    events = [
        format_task_event(
            event_time,
            level="error" if status == "failed" else "info",
            message=message,
            source=source,
            event_key=f"{source}-summary-{status}-{event_time.strftime('%Y%m%d%H%M%S')}",
        )
    ]
    for index, detail in enumerate(details[:3], start=1):
        events.append(
            format_task_event(
                event_time,
                level="warning" if status in {"pending", "failed"} else "info",
                message=detail,
                source=source,
                event_key=f"{source}-detail-{index}-{status}-{event_time.strftime('%Y%m%d%H%M%S')}",
            )
        )
    return events


def merge_task_events(task_id, generated_events):
    cached_events = cache.get(get_task_event_cache_key(task_id), []) or []
    return (cached_events + generated_events)[:SYSTEM_TASK_EVENT_LIMIT]


def record_task_event(task_id, *, level, message, source):
    current_events = cache.get(get_task_event_cache_key(task_id), []) or []
    new_event = format_task_event(timezone.now(), level=level, message=message, source=source)
    cache.set(get_task_event_cache_key(task_id), [new_event, *current_events][:SYSTEM_TASK_EVENT_LIMIT], timeout=60 * 60 * 24)


def build_system_task_items(*, now=None, content_stats=None, health_payload=None, celery_snapshot=None):
    now = now or timezone.now()
    content_stats = content_stats or build_dashboard_content_stats(now=now)
    if health_payload is None:
        health_payload, _status_code = get_internal_health_payload()
    if celery_snapshot is None:
        celery_snapshot = get_celery_snapshot()

    post_stats = content_stats["posts"]
    note_stats = content_stats["notes"]
    project_stats = content_stats["projects"]
    photo_stats = content_stats["photos"]
    podcast_stats = content_stats["podcasts"]

    indexed_documents = (
        post_stats["total"]
        + note_stats["total"]
        + project_stats["total"]
        + photo_stats["total"]
        + podcast_stats["total"]
    )
    post_draft_count = post_stats["draft"]
    note_draft_count = note_stats["draft"]
    project_draft_count = project_stats["draft"]
    draft_count = post_draft_count + note_draft_count + project_draft_count
    post_publish_count = post_stats.get("recent_publishes", 0)
    note_publish_count = note_stats.get("recent_publishes", 0)
    project_publish_count = project_stats.get("recent_publishes", 0)
    podcast_publish_count = podcast_stats.get("recent_publishes", 0)
    recent_publish_count = post_publish_count + note_publish_count + project_publish_count + podcast_publish_count
    task_time = timezone.localtime(now).strftime("%Y-%m-%d %H:%M")
    indexed_by_type = {
        "posts": post_stats["total"],
        "notes": note_stats["total"],
        "projects": project_stats["total"],
        "photos": photo_stats["total"],
        "podcasts": podcast_stats["total"],
    }
    queued_total = celery_snapshot["reserved"] + celery_snapshot["scheduled"]

    health_details = [
        f"Database connectivity: {'ok' if health_payload['database'] else 'failed'}",
        f"Cache connectivity: {'ok' if health_payload['cache'] else 'failed'}",
        f"Search backend: {health_payload['search_backend']}",
    ]
    worker_details = celery_snapshot["worker_details"] or ["No Celery worker details are currently available."]
    active_task_details = celery_snapshot["active_task_details"] or ["No active Celery tasks detected."]
    queued_task_details = celery_snapshot["queued_task_details"] or ["No queued Celery tasks detected."]
    review_details = [
        f"Post drafts: {post_draft_count}",
        f"Note drafts: {note_draft_count}",
        f"Project drafts: {project_draft_count}",
    ]
    publish_details = [
        f"Posts published: {post_publish_count}",
        f"Notes published: {note_publish_count}",
        f"Projects published: {project_publish_count}",
        f"Podcasts published: {podcast_publish_count}",
    ]
    search_details = [
        f"Posts indexed: {indexed_by_type['posts']}",
        f"Notes indexed: {indexed_by_type['notes']}",
        f"Projects indexed: {indexed_by_type['projects']}",
        f"Photos indexed: {indexed_by_type['photos']}",
        f"Podcasts indexed: {indexed_by_type['podcasts']}",
    ]

    tasks = [
        build_task_item(
            task_id="system-health-check",
            name="system.health_check",
            category="system",
            status="success" if health_payload["status"] == "ok" else "failed",
            updated_at=task_time,
            message="Database and cache are healthy." if health_payload["status"] == "ok" else "One or more core services need attention.",
            metrics=build_task_metrics(
                [
                    {"label": "health_status", "value": health_payload["status"]},
                    {"label": "database", "value": "ok" if health_payload["database"] else "failed"},
                    {"label": "cache", "value": "ok" if health_payload["cache"] else "failed"},
                    {"label": "search_backend", "value": health_payload["search_backend"]},
                ]
            ),
            details=health_details,
            events=merge_task_events(
                "system-health-check",
                build_generated_task_events(
                    updated_at=now,
                    status="success" if health_payload["status"] == "ok" else "failed",
                    message="Database and cache are healthy." if health_payload["status"] == "ok" else "One or more core services need attention.",
                    details=health_details,
                    source="system",
                ),
            ),
        ),
        build_task_item(
            task_id="celery-worker-connectivity",
            name="celery.worker_connectivity",
            category="celery",
            status="success" if celery_snapshot["connected"] else "failed",
            updated_at=task_time,
            message=build_celery_connectivity_message(celery_snapshot),
            retryable=True,
            action_label="Recheck",
            metrics=build_task_metrics(
                [
                    {"label": "workers", "value": celery_snapshot["worker_count"]},
                    {"label": "active", "value": celery_snapshot["active"]},
                    {"label": "queued", "value": queued_total},
                ]
            ),
            details=worker_details,
            events=merge_task_events(
                "celery-worker-connectivity",
                build_generated_task_events(
                    updated_at=now,
                    status="success" if celery_snapshot["connected"] else "failed",
                    message=build_celery_connectivity_message(celery_snapshot),
                    details=worker_details,
                    source="celery",
                ),
            ),
        ),
        build_task_item(
            task_id="celery-active-tasks",
            name="celery.active_tasks",
            category="celery",
            status="running" if celery_snapshot["active"] > 0 else "success",
            updated_at=task_time,
            message=f"{celery_snapshot['active']} active tasks across {celery_snapshot['worker_count']} workers.",
            metrics=build_task_metrics(
                [
                    {"label": "active", "value": celery_snapshot["active"]},
                    {"label": "workers", "value": celery_snapshot["worker_count"]},
                ]
            ),
            details=active_task_details,
            events=merge_task_events(
                "celery-active-tasks",
                build_generated_task_events(
                    updated_at=now,
                    status="running" if celery_snapshot["active"] > 0 else "success",
                    message=f"{celery_snapshot['active']} active tasks across {celery_snapshot['worker_count']} workers.",
                    details=active_task_details,
                    source="celery",
                ),
            ),
        ),
        build_task_item(
            task_id="celery-queued-tasks",
            name="celery.queued_tasks",
            category="celery",
            status="pending" if queued_total > 0 else "success",
            updated_at=task_time,
            message=f"{celery_snapshot['reserved']} reserved and {celery_snapshot['scheduled']} scheduled tasks detected.",
            metrics=build_task_metrics(
                [
                    {"label": "reserved", "value": celery_snapshot["reserved"]},
                    {"label": "scheduled", "value": celery_snapshot["scheduled"]},
                    {"label": "total", "value": queued_total},
                ]
            ),
            details=queued_task_details,
            events=merge_task_events(
                "celery-queued-tasks",
                build_generated_task_events(
                    updated_at=now,
                    status="pending" if queued_total > 0 else "success",
                    message=f"{celery_snapshot['reserved']} reserved and {celery_snapshot['scheduled']} scheduled tasks detected.",
                    details=queued_task_details,
                    source="celery",
                ),
            ),
        ),
        build_task_item(
            task_id="content-review-queue",
            name="content.review_queue",
            category="content",
            status="pending" if draft_count > 0 else "success",
            updated_at=task_time,
            message=f"{draft_count} draft items are waiting for review." if draft_count > 0 else "No draft backlog right now.",
            metrics=build_task_metrics(
                [
                    {"label": "posts", "value": post_draft_count},
                    {"label": "notes", "value": note_draft_count},
                    {"label": "projects", "value": project_draft_count},
                    {"label": "total", "value": draft_count},
                ]
            ),
            details=review_details,
            events=merge_task_events(
                "content-review-queue",
                build_generated_task_events(
                    updated_at=now,
                    status="pending" if draft_count > 0 else "success",
                    message=f"{draft_count} draft items are waiting for review." if draft_count > 0 else "No draft backlog right now.",
                    details=review_details,
                    source="content",
                ),
            ),
        ),
        build_task_item(
            task_id="content-daily-publish",
            name="content.daily_publish",
            category="content",
            status="success",
            updated_at=task_time,
            message=f"{recent_publish_count} items were published in the last 24 hours.",
            metrics=build_task_metrics(
                [
                    {"label": "posts", "value": post_publish_count},
                    {"label": "notes", "value": note_publish_count},
                    {"label": "projects", "value": project_publish_count},
                    {"label": "podcasts", "value": podcast_publish_count},
                    {"label": "total", "value": recent_publish_count},
                ]
            ),
            details=publish_details,
            events=merge_task_events(
                "content-daily-publish",
                build_generated_task_events(
                    updated_at=now,
                    status="success",
                    message=f"{recent_publish_count} items were published in the last 24 hours.",
                    details=publish_details,
                    source="content",
                ),
            ),
        ),
        build_task_item(
            task_id="search-index-status",
            name="search.index_status",
            category="search",
            status="success" if indexed_documents > 0 else "pending",
            updated_at=task_time,
            message=f"{indexed_documents} documents are currently searchable.",
            metrics=build_task_metrics(
                [
                    {"label": "backend", "value": "database"},
                    {"label": "indexed", "value": indexed_documents},
                ]
            ),
            details=search_details,
            events=merge_task_events(
                "search-index-status",
                build_generated_task_events(
                    updated_at=now,
                    status="success" if indexed_documents > 0 else "pending",
                    message=f"{indexed_documents} documents are currently searchable.",
                    details=search_details,
                    source="search",
                ),
            ),
        ),
    ]
    return tasks


def get_celery_snapshot():
    snapshot = {
        "connected": False,
        "worker_count": 0,
        "active": 0,
        "reserved": 0,
        "scheduled": 0,
        "worker_details": [],
        "active_task_details": [],
        "queued_task_details": [],
        "error": None,
    }
    try:
        inspector = celery_app.control.inspect(timeout=1)
        ping_result = inspector.ping() or {}
        stats_result = inspector.stats() or {}
        active_result = inspector.active() or {}
        reserved_result = inspector.reserved() or {}
        scheduled_result = inspector.scheduled() or {}

        worker_names = set(ping_result) | set(stats_result) | set(active_result) | set(reserved_result) | set(scheduled_result)
        snapshot["connected"] = bool(worker_names)
        snapshot["worker_count"] = len(worker_names)
        snapshot["active"] = sum(len(active_result.get(worker, [])) for worker in worker_names)
        snapshot["reserved"] = sum(len(reserved_result.get(worker, [])) for worker in worker_names)
        snapshot["scheduled"] = sum(len(scheduled_result.get(worker, [])) for worker in worker_names)
        snapshot["worker_details"] = [
            f"{worker}: active={len(active_result.get(worker, []))}, reserved={len(reserved_result.get(worker, []))}, scheduled={len(scheduled_result.get(worker, []))}"
            for worker in sorted(worker_names)
        ]
        snapshot["active_task_details"] = [
            f"{worker}: {task.get('name', 'unknown')} ({task.get('id', 'n/a')})"
            for worker in sorted(worker_names)
            for task in active_result.get(worker, [])[:5]
        ]
        snapshot["queued_task_details"] = [
            f"{worker}: reserved {task.get('name', 'unknown')} ({task.get('id', 'n/a')})"
            for worker in sorted(worker_names)
            for task in reserved_result.get(worker, [])[:5]
        ] + [
            f"{worker}: scheduled {task.get('request', {}).get('name', 'unknown')} ({task.get('request', {}).get('id', 'n/a')})"
            for worker in sorted(worker_names)
            for task in scheduled_result.get(worker, [])[:5]
        ]
    except Exception as exc:
        snapshot["error"] = str(exc)
    return snapshot


def build_celery_connectivity_message(snapshot):
    if snapshot["connected"]:
        return f"{snapshot['worker_count']} Celery workers responded successfully."
    if snapshot["error"]:
        return f"Celery inspect failed: {snapshot['error']}"
    return "No Celery workers responded within the timeout window."


def build_status_content_stats(model, *, recent_publish_after=None, stale_draft_before=None):
    aggregate_kwargs = {
        "total": Count("id"),
        "draft": Count("id", filter=Q(status=StatusChoices.DRAFT)),
        "published": Count("id", filter=Q(status=StatusChoices.PUBLISHED)),
        "latest_update_at": Max("updated_at"),
        "latest_publish_at": Max("published_at", filter=Q(status=StatusChoices.PUBLISHED)),
    }
    if recent_publish_after is not None:
        aggregate_kwargs["recent_publishes"] = Count(
            "id",
            filter=Q(status=StatusChoices.PUBLISHED, published_at__gte=recent_publish_after),
        )
    if stale_draft_before is not None:
        aggregate_kwargs["stale_drafts"] = Count(
            "id",
            filter=Q(status=StatusChoices.DRAFT, updated_at__lt=stale_draft_before),
        )

    stats = model.objects.aggregate(**aggregate_kwargs)
    for key in ("total", "draft", "published", "recent_publishes", "stale_drafts"):
        if key in stats:
            stats[key] = stats[key] or 0
    return stats


def build_podcast_content_stats(*, recent_publish_after=None):
    aggregate_kwargs = {
        "total": Count("id"),
        "draft": Count("id", filter=Q(published_at__isnull=True)),
        "published": Count("id", filter=Q(published_at__isnull=False)),
        "latest_update_at": Max("updated_at"),
        "latest_publish_at": Max("published_at"),
    }
    if recent_publish_after is not None:
        aggregate_kwargs["recent_publishes"] = Count(
            "id",
            filter=Q(published_at__gte=recent_publish_after),
        )

    stats = Podcast.objects.aggregate(**aggregate_kwargs)
    for key in ("total", "draft", "published", "recent_publishes"):
        if key in stats:
            stats[key] = stats[key] or 0
    return stats


def build_photo_content_stats():
    stats = Photo.objects.aggregate(total=Count("id"), latest_update_at=Max("updated_at"))
    total = stats["total"] or 0
    return {
        "total": total,
        "draft": 0,
        "published": total,
        "latest_update_at": stats["latest_update_at"],
    }


def build_asset_content_stats():
    return {"total": Asset.objects.aggregate(total=Count("id"))["total"] or 0}


def build_dashboard_content_stats(now=None):
    now = now or timezone.now()
    recent_publish_after = now - timedelta(days=1)
    stale_draft_before = now - timedelta(days=14)

    return {
        "posts": build_status_content_stats(
            Post,
            recent_publish_after=recent_publish_after,
            stale_draft_before=stale_draft_before,
        ),
        "notes": build_status_content_stats(
            Note,
            recent_publish_after=recent_publish_after,
            stale_draft_before=stale_draft_before,
        ),
        "projects": build_status_content_stats(
            Project,
            recent_publish_after=recent_publish_after,
            stale_draft_before=stale_draft_before,
        ),
        "photos": build_photo_content_stats(),
        "podcasts": build_podcast_content_stats(recent_publish_after=recent_publish_after),
        "assets": build_asset_content_stats(),
    }


def build_daily_count_map(model, field_name, *, start_day, filters=None):
    queryset = model.objects
    if filters is not None:
        queryset = queryset.filter(filters)
    return {
        item["day"]: item["count"]
        for item in queryset.filter(**{f"{field_name}__date__gte": start_day})
        .annotate(day=TruncDate(field_name))
        .values("day")
        .annotate(count=Count("id"))
    }


def build_recent_activity_items(limit=5, per_model_limit=3):
    recent_records = []
    querysets = [
        (
            "post",
            Post.objects.order_by("-updated_at").values("id", "title", "updated_at")[:per_model_limit],
            lambda item: item["title"],
        ),
        (
            "note",
            Note.objects.order_by("-updated_at").values("id", "title", "updated_at")[:per_model_limit],
            lambda item: item["title"] or f"Note #{item['id']}",
        ),
        (
            "project",
            Project.objects.order_by("-updated_at").values("id", "name", "updated_at")[:per_model_limit],
            lambda item: item["name"],
        ),
        (
            "photo",
            Photo.objects.order_by("-updated_at").values("id", "caption", "updated_at")[:per_model_limit],
            lambda item: item["caption"] or f"Photo #{item['id']}",
        ),
        (
            "podcast",
            Podcast.objects.order_by("-updated_at").values("id", "title", "updated_at")[:per_model_limit],
            lambda item: item["title"],
        ),
    ]

    for model_name, queryset, title_getter in querysets:
        for record in queryset:
            recent_records.append(
                {
                    "id": f"{model_name}-{record['id']}",
                    "type": model_name,
                    "title": title_getter(record),
                    "updated_at": record["updated_at"],
                    "time": format_admin_datetime(record["updated_at"]),
                }
            )

    recent_records.sort(key=lambda item: item["updated_at"], reverse=True)
    return [
        {
            "id": item["id"],
            "type": item["type"],
            "title": item["title"],
            "time": item["time"],
        }
        for item in recent_records[:limit]
    ]


def build_dashboard_payload():
    now = timezone.now()
    content_stats = build_dashboard_content_stats(now=now)
    health_payload, _status_code = get_internal_health_payload()
    celery_snapshot = get_celery_snapshot()
    start_day = timezone.localdate(now - timedelta(days=6))
    labels = [(start_day + timedelta(days=index)).strftime("%a") for index in range(7)]

    post_updates = build_daily_count_map(Post, "updated_at", start_day=start_day)
    note_updates = build_daily_count_map(Note, "updated_at", start_day=start_day)
    project_updates = build_daily_count_map(Project, "updated_at", start_day=start_day)
    photo_updates = build_daily_count_map(Photo, "updated_at", start_day=start_day)
    podcast_updates = build_daily_count_map(Podcast, "updated_at", start_day=start_day)

    post_publishes = build_daily_count_map(
        Post,
        "published_at",
        start_day=start_day,
        filters=Q(status=StatusChoices.PUBLISHED),
    )
    note_publishes = build_daily_count_map(
        Note,
        "published_at",
        start_day=start_day,
        filters=Q(status=StatusChoices.PUBLISHED),
    )
    project_publishes = build_daily_count_map(
        Project,
        "published_at",
        start_day=start_day,
        filters=Q(status=StatusChoices.PUBLISHED),
    )
    podcast_publishes = build_daily_count_map(Podcast, "published_at", start_day=start_day)

    content_updates = []
    published_content = []
    for offset in range(7):
        day = start_day + timedelta(days=offset)
        content_updates.append(
            post_updates.get(day, 0)
            + note_updates.get(day, 0)
            + project_updates.get(day, 0)
            + photo_updates.get(day, 0)
            + podcast_updates.get(day, 0)
        )
        published_content.append(
            post_publishes.get(day, 0)
            + note_publishes.get(day, 0)
            + project_publishes.get(day, 0)
            + podcast_publishes.get(day, 0)
        )

    post_stats = content_stats["posts"]
    note_stats = content_stats["notes"]
    project_stats = content_stats["projects"]
    photo_stats = content_stats["photos"]
    podcast_stats = content_stats["podcasts"]

    post_draft_count = post_stats["draft"]
    note_draft_count = note_stats["draft"]
    project_draft_count = project_stats["draft"]
    draft_count = post_draft_count + note_draft_count + project_draft_count
    post_published_total = post_stats["published"]
    note_published_total = note_stats["published"]
    project_published_total = project_stats["published"]
    podcast_published_total = podcast_stats["published"]
    published_count = (
        post_published_total
        + note_published_total
        + project_published_total
        + podcast_published_total
    )
    post_total = post_stats["total"]
    note_total = note_stats["total"]
    project_total = project_stats["total"]
    photo_total = photo_stats["total"]
    podcast_total = podcast_stats["total"]
    asset_count = content_stats["assets"]["total"]
    tasks = build_system_task_items(
        now=now,
        content_stats=content_stats,
        health_payload=health_payload,
        celery_snapshot=celery_snapshot,
    )
    failed_task_count = len([task for task in tasks if task["status"] == "failed"])
    pending_task_count = len([task for task in tasks if task["status"] == "pending"])
    completion_base = draft_count + published_count
    completion_rate = round((published_count / completion_base) * 100) if completion_base else 100
    updates_last_7_days = sum(content_updates)
    publishes_last_7_days = sum(published_content)
    stale_draft_count = (
        post_stats.get("stale_drafts", 0)
        + note_stats.get("stale_drafts", 0)
        + project_stats.get("stale_drafts", 0)
    )
    latest_publish_at = max(
        [
            value
            for value in [
                post_stats["latest_publish_at"],
                note_stats["latest_publish_at"],
                project_stats["latest_publish_at"],
                podcast_stats["latest_publish_at"],
            ]
            if value is not None
        ],
        default=None,
    )
    latest_update_at = max(
        [
            value
            for value in [
                post_stats["latest_update_at"],
                note_stats["latest_update_at"],
                project_stats["latest_update_at"],
                photo_stats["latest_update_at"],
                podcast_stats["latest_update_at"],
            ]
            if value is not None
        ],
        default=None,
    )
    activity_items = build_recent_activity_items()
    analytics_payload = get_dashboard_analytics_payload()

    payload = {
        "summary": {
            "pending_content": draft_count,
            "published_content": published_count,
            "assets": asset_count,
            "system_alerts": failed_task_count,
        },
        "system_overview": {
            "status": "online" if health_payload["status"] == "ok" else "attention",
            "health_status": health_payload["status"],
            "database": health_payload["database"],
            "cache": health_payload["cache"],
            "search_backend": health_payload["search_backend"],
            "task_count": len(tasks),
            "pending_task_count": pending_task_count,
            "completion_rate": completion_rate,
        },
        "trends": {
            "labels": labels,
            "content_updates": content_updates,
            "published_content": published_content,
        },
        "content_breakdown": {
            "posts": {"total": post_total, "draft": post_draft_count, "published": post_published_total},
            "notes": {"total": note_total, "draft": note_draft_count, "published": note_published_total},
            "projects": {"total": project_total, "draft": project_draft_count, "published": project_published_total},
            "photos": {"total": photo_total, "draft": 0, "published": photo_total},
            "podcasts": {"total": podcast_total, "draft": max(podcast_total - podcast_published_total, 0), "published": podcast_published_total},
        },
        "publishing_snapshot": {
            "updates_last_7_days": updates_last_7_days,
            "publishes_last_7_days": publishes_last_7_days,
            "stale_drafts": stale_draft_count,
            "latest_publish_at": format_admin_datetime(latest_publish_at),
            "latest_update_at": format_admin_datetime(latest_update_at),
        },
        "analytics_status": analytics_payload["analytics_status"],
        "analytics_overview": analytics_payload["analytics_overview"],
        "analytics_referrers": analytics_payload["analytics_referrers"],
        "analytics_trends": analytics_payload["analytics_trends"],
        "recent_activity": activity_items,
    }
    return payload


class AdminLookupMixin:
    lookup_url_kwarg = "pk"
    slug_lookup_field = "slug"

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_value = self.kwargs.get(self.lookup_url_kwarg or self.lookup_field)
        if lookup_value and str(lookup_value).isdigit():
            filter_kwargs = {"pk": int(lookup_value)}
        else:
            filter_kwargs = {self.slug_lookup_field: lookup_value}
        obj = get_object_or_404(queryset, **filter_kwargs)
        self.check_object_permissions(self.request, obj)
        return obj


class AdminResponseMixin:
    success_list_message = "List fetched successfully."
    success_detail_message = "Record fetched successfully."
    success_create_message = "Created successfully."
    success_update_message = "Updated successfully."
    success_delete_message = "Deleted successfully."

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return success_response(serializer.data, message=self.success_list_message)

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())
        return success_response(serializer.data, message=self.success_detail_message)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return success_response(serializer.data, message=self.success_create_message, status_code=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return success_response(serializer.data, message=self.success_update_message)

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return success_response(None, message=self.success_delete_message)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = CurrentUserSerializer(request.user)
        return success_response(serializer.data, message="Current user fetched successfully.")


@method_decorator(ensure_csrf_cookie, name="dispatch")
class AuthCsrfView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return success_response(None, message="CSRF cookie initialized successfully.")


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        login(request, user)
        return success_response(
            CurrentUserSerializer(user).data,
            message="Logged in successfully.",
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return success_response(None, message="Logged out successfully.")


@method_decorator(ensure_csrf_cookie, name="dispatch")
class AccountSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = AccountProfileReadSerializer(request.user)
        return success_response(serializer.data, message="Account profile fetched successfully.")

    def patch(self, request):
        serializer = AccountProfileSerializer(request.user, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(serializer.data, message="Account profile updated successfully.")


class PreferenceSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        preference, _created = UserPreference.objects.get_or_create(user=request.user)
        serializer = UserPreferenceSerializer(preference)
        return success_response(serializer.data, message="Preferences fetched successfully.")

    def patch(self, request):
        preference, _created = UserPreference.objects.get_or_create(user=request.user)
        serializer = UserPreferenceSerializer(preference, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(serializer.data, message="Preferences updated successfully.")


class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        update_session_auth_hash(request, user)
        return success_response(None, message="Password updated successfully.")


class TagOptionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        search = (request.query_params.get("search") or "").strip()
        queryset = Tag.objects.order_by("name")
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(slug__icontains=search))
        serializer = TagOptionSerializer(queryset[:20], many=True)
        return success_response(serializer.data, message="Tag options fetched successfully.")

    def post(self, request):
        serializer = TagOptionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(serializer.data, message="Tag created successfully.", status_code=status.HTTP_201_CREATED)


class AdminPostViewSet(AdminLookupMixin, AdminResponseMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Post.objects.prefetch_related("tags").all().order_by("-updated_at")
    serializer_class = AdminPostSerializer
    pagination_class = AdminPageNumberPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["lang", "status"]
    search_fields = ["title", "summary", "slug"]
    ordering_fields = ["published_at", "created_at", "updated_at", "reading_time", "title"]
    ordering = ["-updated_at"]

    def perform_create(self, serializer):
        instance = serializer.save()
        invalidate_admin_content_cache("post", slug=instance.slug)

    def perform_update(self, serializer):
        instance = serializer.save()
        invalidate_admin_content_cache("post", slug=instance.slug)

    def perform_destroy(self, instance):
        slug = instance.slug
        instance.delete()
        invalidate_admin_content_cache("post", slug=slug)

    @action(detail=True, methods=["post"], url_path="publish")
    def publish(self, request, pk=None):
        post = self.get_object()
        published_at = parse_admin_datetime(request.data.get("published_at")) or timezone.now()
        post.status = StatusChoices.PUBLISHED
        post.published_at = published_at
        post.save(update_fields=["status", "published_at", "updated_at"])
        invalidate_admin_content_cache("post", slug=post.slug)
        return success_response(None, message="Post published successfully.")

    @action(detail=True, methods=["post"], url_path="unpublish")
    def unpublish(self, request, pk=None):
        post = self.get_object()
        post.status = StatusChoices.DRAFT
        post.published_at = None
        post.save(update_fields=["status", "published_at", "updated_at"])
        invalidate_admin_content_cache("post", slug=post.slug)
        return success_response(None, message="Post unpublished successfully.")

    @action(detail=False, methods=["post"], url_path="batch-publish")
    def batch_publish(self, request):
        serializer = IdListSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        Post.objects.filter(id__in=serializer.validated_data["ids"]).update(status=StatusChoices.PUBLISHED, published_at=timezone.now())
        invalidate_admin_content_cache("post")
        return success_response(None, message="Posts published successfully.")

    @action(detail=False, methods=["post"], url_path="batch-unpublish")
    def batch_unpublish(self, request):
        serializer = IdListSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        Post.objects.filter(id__in=serializer.validated_data["ids"]).update(status=StatusChoices.DRAFT, published_at=None)
        invalidate_admin_content_cache("post")
        return success_response(None, message="Posts unpublished successfully.")

    @action(detail=False, methods=["post"], url_path="batch-delete")
    def batch_delete(self, request):
        serializer = IdListSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        Post.objects.filter(id__in=serializer.validated_data["ids"]).delete()
        invalidate_admin_content_cache("post")
        return success_response(None, message="Posts deleted successfully.")


class AdminNoteViewSet(AdminLookupMixin, AdminResponseMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Note.objects.prefetch_related("tags").all().order_by("-updated_at")
    serializer_class = AdminNoteSerializer
    pagination_class = AdminPageNumberPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["lang", "status"]
    search_fields = ["title", "summary", "slug"]
    ordering_fields = ["published_at", "created_at", "updated_at", "reading_time", "title"]
    ordering = ["-updated_at"]

    def perform_create(self, serializer):
        instance = serializer.save()
        invalidate_admin_content_cache("note", slug=instance.slug)

    def perform_update(self, serializer):
        instance = serializer.save()
        invalidate_admin_content_cache("note", slug=instance.slug)

    def perform_destroy(self, instance):
        slug = instance.slug
        instance.delete()
        invalidate_admin_content_cache("note", slug=slug)

    @action(detail=True, methods=["post"], url_path="publish")
    def publish(self, request, pk=None):
        note = self.get_object()
        published_at = parse_admin_datetime(request.data.get("published_at")) or timezone.now()
        note.status = StatusChoices.PUBLISHED
        note.published_at = published_at
        note.save(update_fields=["status", "published_at", "updated_at"])
        invalidate_admin_content_cache("note", slug=note.slug)
        return success_response(None, message="Note published successfully.")

    @action(detail=True, methods=["post"], url_path="unpublish")
    def unpublish(self, request, pk=None):
        note = self.get_object()
        note.status = StatusChoices.DRAFT
        note.published_at = None
        note.save(update_fields=["status", "published_at", "updated_at"])
        invalidate_admin_content_cache("note", slug=note.slug)
        return success_response(None, message="Note unpublished successfully.")

    @action(detail=False, methods=["post"], url_path="batch-publish")
    def batch_publish(self, request):
        serializer = IdListSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        Note.objects.filter(id__in=serializer.validated_data["ids"]).update(status=StatusChoices.PUBLISHED, published_at=timezone.now())
        invalidate_admin_content_cache("note")
        return success_response(None, message="Notes published successfully.")

    @action(detail=False, methods=["post"], url_path="batch-unpublish")
    def batch_unpublish(self, request):
        serializer = IdListSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        Note.objects.filter(id__in=serializer.validated_data["ids"]).update(status=StatusChoices.DRAFT, published_at=None)
        invalidate_admin_content_cache("note")
        return success_response(None, message="Notes unpublished successfully.")

    @action(detail=False, methods=["post"], url_path="batch-delete")
    def batch_delete(self, request):
        serializer = IdListSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        Note.objects.filter(id__in=serializer.validated_data["ids"]).delete()
        invalidate_admin_content_cache("note")
        return success_response(None, message="Notes deleted successfully.")


class AdminTagViewSet(AdminLookupMixin, AdminResponseMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = AdminTagSerializer
    pagination_class = AdminPageNumberPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "slug", "description"]
    ordering_fields = ["name", "created_at", "updated_at"]
    ordering = ["name"]

    def get_queryset(self):
        return Tag.objects.annotate(
            post_count=Count("posts", distinct=True),
            note_count=Count("notes", distinct=True),
            project_count=Count("projects", distinct=True),
        ).order_by(*self.ordering)

    def get_serializer_class(self):
        if self.action in {"retrieve", "unlink"}:
            return AdminTagDetailSerializer
        return super().get_serializer_class()

    @action(detail=True, methods=["post"], url_path="unlink")
    def unlink(self, request, pk=None):
        tag = self.get_object()
        serializer = TagUsageUnlinkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        content_type = serializer.validated_data["content_type"]
        item_id = serializer.validated_data["item_id"]
        content_model_map = {
            "post": Post,
            "note": Note,
            "project": Project,
        }
        content_object = get_object_or_404(content_model_map[content_type], pk=item_id)
        content_object.tags.remove(tag)

        if content_type == "post":
            invalidate_admin_content_cache("post", slug=content_object.slug)
        elif content_type == "note":
            invalidate_admin_content_cache("note", slug=content_object.slug)
        else:
            invalidate_pattern("project:list:*")
            cache.delete("home:aggregate")

        refreshed_tag = self.get_queryset().get(pk=tag.pk)
        response_serializer = self.get_serializer(refreshed_tag)
        return success_response(response_serializer.data, message="Tag reference removed successfully.")


class AdminProjectViewSet(AdminLookupMixin, AdminResponseMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Project.objects.all().order_by("display_order", "-updated_at")
    serializer_class = AdminProjectSerializer
    pagination_class = AdminPageNumberPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["lang", "status"]
    search_fields = ["name", "summary", "slug"]
    ordering_fields = ["display_order", "created_at", "updated_at", "published_at", "name"]
    ordering = ["display_order", "-updated_at"]

    def perform_create(self, serializer):
        serializer.save()
        invalidate_pattern("project:list:*")
        cache.delete("home:aggregate")

    def perform_update(self, serializer):
        serializer.save()
        invalidate_pattern("project:list:*")
        cache.delete("home:aggregate")

    def perform_destroy(self, instance):
        instance.delete()
        invalidate_pattern("project:list:*")
        cache.delete("home:aggregate")

    @action(detail=False, methods=["post"], url_path="reorder")
    def reorder(self, request):
        serializer = IdListSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        id_position_map = {project_id: index for index, project_id in enumerate(serializer.validated_data["ids"], start=1)}
        for project in Project.objects.filter(id__in=id_position_map.keys()):
            project.display_order = id_position_map[project.id]
            project.save(update_fields=["display_order", "updated_at"])
        invalidate_pattern("project:list:*")
        cache.delete("home:aggregate")
        return success_response(None, message="Projects reordered successfully.")


class AdminAssetViewSet(
    AdminLookupMixin,
    AdminResponseMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAuthenticated]
    queryset = Asset.objects.all().order_by("-created_at")
    serializer_class = AdminAssetSerializer
    pagination_class = AdminPageNumberPagination
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    success_delete_message = "Asset deleted successfully."

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get("search", "").strip()
        mime_type = self.request.query_params.get("mime_type", "").strip()
        storage = self.request.query_params.get("storage", "").strip()

        if search:
            queryset = queryset.filter(
                Q(object_key__icontains=search)
                | Q(file__icontains=search)
                | Q(mime_type__icontains=search)
            )
        if mime_type:
            queryset = queryset.filter(mime_type__icontains=mime_type)
        if storage:
            queryset = queryset.filter(storage_provider=storage)
        return queryset

    @action(detail=False, methods=["post"], url_path="upload")
    def upload(self, request):
        serializer = AssetUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        asset = serializer.save()
        return success_response(
            AdminAssetSerializer(asset).data,
            message="Asset uploaded successfully.",
            status_code=status.HTTP_201_CREATED,
        )


class AdminPhotoViewSet(AdminLookupMixin, AdminResponseMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Photo.objects.select_related("original", "thumbnail").all().order_by("-taken_at", "-updated_at")
    serializer_class = AdminPhotoSerializer
    pagination_class = AdminPageNumberPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["lang"]
    ordering_fields = ["taken_at", "created_at", "updated_at"]
    ordering = ["-taken_at", "-updated_at"]

    def perform_create(self, serializer):
        serializer.save()
        invalidate_public_media_cache("photo", invalidate_home=True)

    def perform_update(self, serializer):
        serializer.save()
        invalidate_public_media_cache("photo", invalidate_home=True)

    def perform_destroy(self, instance):
        instance.delete()
        invalidate_public_media_cache("photo", invalidate_home=True)


class AdminPodcastViewSet(AdminLookupMixin, AdminResponseMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Podcast.objects.select_related("cover").all().order_by("-published_at", "-updated_at")
    serializer_class = AdminPodcastSerializer
    pagination_class = AdminPageNumberPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["lang", "platform"]
    search_fields = ["title", "slug"]
    ordering_fields = ["published_at", "created_at", "updated_at", "title"]
    ordering = ["-published_at", "-updated_at"]

    def perform_create(self, serializer):
        serializer.save()
        invalidate_public_media_cache("podcast")

    def perform_update(self, serializer):
        serializer.save()
        invalidate_public_media_cache("podcast")

    def perform_destroy(self, instance):
        instance.delete()
        invalidate_public_media_cache("podcast")

    @action(detail=True, methods=["post"], url_path="re-render")
    def re_render(self, request, pk=None):
        podcast = self.get_object()
        podcast.content_html = _markdown_to_html(podcast.content_md) if podcast.content_md else ""
        podcast.save(update_fields=["content_html", "updated_at"])
        return success_response({"id": podcast.id}, message="Podcast content re-rendered successfully.")


class SystemHealthView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        payload, status_code = get_internal_health_payload()
        return success_response(payload, message="System health fetched successfully.", status_code=status_code)


class SystemPerformanceSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return success_response(
            build_performance_summary_payload(),
            message="System performance summary fetched successfully.",
        )


class DashboardOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return success_response(build_dashboard_payload(), message="Dashboard overview fetched successfully.")


class SystemTasksView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return success_response(build_system_task_items(), message="System tasks fetched successfully.")


class SystemTaskRetryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, task_id):
        if task_id == "celery-worker-connectivity":
            snapshot = get_celery_snapshot()
            if snapshot["connected"]:
                record_task_event(
                    task_id,
                    level="info",
                    message=f"Connectivity probe succeeded with {snapshot['worker_count']} workers online.",
                    source="celery",
                )
                return success_response(
                    {
                        "worker_count": snapshot["worker_count"],
                        "active": snapshot["active"],
                        "reserved": snapshot["reserved"],
                        "scheduled": snapshot["scheduled"],
                    },
                    message="Celery workers responded successfully.",
                )
            record_task_event(
                task_id,
                level="error",
                message=build_celery_connectivity_message(snapshot),
                source="celery",
            )
            return success_response(None, message=build_celery_connectivity_message(snapshot))

        record_task_event(
            task_id,
            level="info",
            message=f"Retry requested for task {task_id}.",
            source="system",
        )
        return success_response(None, message=f"Retry requested for task {task_id}.")


class SystemCacheSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        keys = 0
        memory_mb = 0.0
        hit_rate = 0.0
        inner_cache = getattr(cache, "_cache", None)
        if inner_cache is not None:
            try:
                keys = len(inner_cache)
            except TypeError:
                keys = 0
        summary = {
            "keys": keys,
            "memory_mb": memory_mb,
            "hit_rate": hit_rate,
            "updated_at": timezone.localtime().strftime("%Y-%m-%d %H:%M"),
        }
        return success_response(summary, message="Cache summary fetched successfully.")


class SystemCacheInvalidateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        scope = (request.data.get("scope") or "").strip()
        scope_to_patterns = {
            "posts": ["post:list:*"],
            "notes": ["note:list:*"],
            "projects": ["project:list:*"],
            "photos": ["photo:list:*"],
            "podcasts": ["podcast:list:*"],
            "home": ["home:aggregate"],
            "all_content": ["post:list:*", "note:list:*", "project:list:*", "photo:list:*", "podcast:list:*", "home:aggregate"],
        }
        patterns = scope_to_patterns.get(scope)
        if not patterns:
            return success_response(None, message="Cache invalidation request accepted.")

        for pattern in patterns:
            if "*" in pattern:
                invalidate_pattern(pattern)
            else:
                cache.delete(pattern)

        return success_response(None, message=f"Cache invalidated for scope {scope}.")


class SystemSearchStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        payload = {
            "backend": "database",
            "healthy": True,
            "indexed_documents": Post.objects.count() + Note.objects.count() + Project.objects.count() + Photo.objects.count() + Podcast.objects.count(),
            "updated_at": timezone.localtime().strftime("%Y-%m-%d %H:%M"),
        }
        return success_response(payload, message="Search status fetched successfully.")


class SystemSearchTestView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = (request.query_params.get("q") or "").strip()
        results = []
        took_ms = 0
        if query:
            started_at = timezone.now()
            search_result = search_content(query, limit=10)
            took_ms = int((timezone.now() - started_at).total_seconds() * 1000)
            for item in search_result.get("results", []):
                results.append(
                    {
                        "id": str(item.get("id", "")),
                        "type": item.get("type", "post"),
                        "title": item.get("title", ""),
                        "score": item.get("score", 1),
                    }
                )

        payload = {
            "query": query,
            "took_ms": took_ms,
            "results": results,
        }
        return success_response(payload, message="Search test completed successfully.")
