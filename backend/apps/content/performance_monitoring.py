import time

from django.conf import settings
from django.utils import timezone

from .cache_utils import cache


PERFORMANCE_SUMMARY_CACHE_KEY = "admin:performance:summary"
PERFORMANCE_SUMMARY_TTL = 60 * 60
PERFORMANCE_MAX_ROUTES = 20


def is_performance_monitoring_enabled():
    return getattr(settings, "PERFORMANCE_MONITORING_ENABLED", True)


def get_slow_request_threshold_ms():
    return getattr(settings, "PERFORMANCE_SLOW_REQUEST_MS", 400)


def should_monitor_request(request):
    return is_performance_monitoring_enabled() and request.path.startswith("/api/")


def build_route_key(request):
    resolver_match = getattr(request, "resolver_match", None)
    route = getattr(resolver_match, "route", None)
    return route or request.path


def build_route_category(path):
    if path.startswith("/api/admin/"):
        return "admin"
    if path.startswith("/api/"):
        return "public"
    return "other"


def get_default_performance_snapshot(now=None):
    now = now or timezone.now().isoformat()
    return {
        "window_started_at": now,
        "window_updated_at": now,
        "totals": {
            "count": 0,
            "slow_requests": 0,
            "max_duration_ms": 0.0,
            "total_duration_ms": 0.0,
            "avg_duration_ms": 0.0,
        },
        "routes": {},
    }


def update_stats_bucket(bucket, *, duration_ms, status_code, now_iso, slow_threshold_ms):
    bucket["count"] = bucket.get("count", 0) + 1
    bucket["slow_requests"] = bucket.get("slow_requests", 0) + int(duration_ms >= slow_threshold_ms)
    bucket["max_duration_ms"] = max(bucket.get("max_duration_ms", 0.0), duration_ms)
    bucket["total_duration_ms"] = bucket.get("total_duration_ms", 0.0) + duration_ms
    bucket["avg_duration_ms"] = round(bucket["total_duration_ms"] / bucket["count"], 2)
    bucket["last_duration_ms"] = round(duration_ms, 2)
    bucket["last_status_code"] = status_code
    bucket["last_seen_at"] = now_iso


def trim_route_stats(routes):
    if len(routes) <= PERFORMANCE_MAX_ROUTES:
        return routes

    ranked_routes = sorted(
        routes.items(),
        key=lambda item: (
            item[1].get("count", 0),
            item[1].get("max_duration_ms", 0.0),
            item[1].get("last_seen_at", ""),
        ),
        reverse=True,
    )
    return dict(ranked_routes[:PERFORMANCE_MAX_ROUTES])


def record_request_metric(request, *, duration_ms, status_code):
    now_iso = timezone.now().isoformat()
    slow_threshold_ms = get_slow_request_threshold_ms()
    snapshot = cache.get(PERFORMANCE_SUMMARY_CACHE_KEY) or get_default_performance_snapshot(now_iso)
    routes = snapshot.setdefault("routes", {})
    route_key = build_route_key(request)
    route_bucket = routes.setdefault(
        route_key,
        {
            "route": route_key,
            "path": request.path,
            "method": request.method,
            "category": build_route_category(request.path),
            "count": 0,
            "slow_requests": 0,
            "max_duration_ms": 0.0,
            "total_duration_ms": 0.0,
            "avg_duration_ms": 0.0,
            "last_duration_ms": 0.0,
            "last_status_code": status_code,
            "last_seen_at": now_iso,
        },
    )
    update_stats_bucket(
        route_bucket,
        duration_ms=duration_ms,
        status_code=status_code,
        now_iso=now_iso,
        slow_threshold_ms=slow_threshold_ms,
    )
    update_stats_bucket(
        snapshot.setdefault(
            "totals",
            {
                "count": 0,
                "slow_requests": 0,
                "max_duration_ms": 0.0,
                "total_duration_ms": 0.0,
                "avg_duration_ms": 0.0,
            },
        ),
        duration_ms=duration_ms,
        status_code=status_code,
        now_iso=now_iso,
        slow_threshold_ms=slow_threshold_ms,
    )
    snapshot["window_updated_at"] = now_iso
    snapshot["routes"] = trim_route_stats(routes)
    cache.set(PERFORMANCE_SUMMARY_CACHE_KEY, snapshot, PERFORMANCE_SUMMARY_TTL)


def build_performance_summary_payload():
    snapshot = cache.get(PERFORMANCE_SUMMARY_CACHE_KEY) or get_default_performance_snapshot()
    routes = sorted(
        snapshot.get("routes", {}).values(),
        key=lambda item: (
            item.get("avg_duration_ms", 0.0),
            item.get("max_duration_ms", 0.0),
            item.get("count", 0),
        ),
        reverse=True,
    )
    return {
        "enabled": is_performance_monitoring_enabled(),
        "slow_threshold_ms": get_slow_request_threshold_ms(),
        "window_started_at": snapshot["window_started_at"],
        "window_updated_at": snapshot["window_updated_at"],
        "total_requests": snapshot["totals"]["count"],
        "slow_requests": snapshot["totals"]["slow_requests"],
        "avg_duration_ms": snapshot["totals"]["avg_duration_ms"],
        "max_duration_ms": round(snapshot["totals"]["max_duration_ms"], 2),
        "top_routes": [
            {
                "route": item["route"],
                "path": item["path"],
                "method": item["method"],
                "category": item["category"],
                "count": item["count"],
                "slow_requests": item["slow_requests"],
                "avg_duration_ms": item["avg_duration_ms"],
                "max_duration_ms": round(item["max_duration_ms"], 2),
                "last_duration_ms": item["last_duration_ms"],
                "last_status_code": item["last_status_code"],
                "last_seen_at": item["last_seen_at"],
            }
            for item in routes[:10]
        ],
    }


class PerformanceMonitoringMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not should_monitor_request(request):
            return self.get_response(request)

        start = time.perf_counter()
        response = None
        try:
            response = self.get_response(request)
            return response
        finally:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            status_code = getattr(response, "status_code", 500)
            record_request_metric(request, duration_ms=duration_ms, status_code=status_code)
            if response is not None:
                existing = response.headers.get("Server-Timing")
                current = f"app;dur={duration_ms}"
                response.headers["Server-Timing"] = f"{existing}, {current}" if existing else current
