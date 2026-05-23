import json
from datetime import datetime, timedelta, timezone as dt_timezone
from urllib import error, parse, request

from django.conf import settings
from django.utils import timezone

from .cache_utils import cache
from .security_utils import validate_outbound_http_url


ANALYTICS_SUCCESS_TTL = 300
ANALYTICS_ERROR_TTL = 60
ANALYTICS_OVERVIEW_PERIOD_LAST_30_DAYS = "last_30_days"
ANALYTICS_OVERVIEW_PERIOD_ALL_TIME = "all_time"
ANALYTICS_OVERVIEW_PERIOD_LABELS = {
    ANALYTICS_OVERVIEW_PERIOD_LAST_30_DAYS: "Last 30 Days",
    ANALYTICS_OVERVIEW_PERIOD_ALL_TIME: "All Time",
}


class AnalyticsServiceError(Exception):
    pass


def get_dashboard_analytics_payload(overview_period=ANALYTICS_OVERVIEW_PERIOD_LAST_30_DAYS):
    overview_period = normalize_analytics_overview_period(overview_period)
    status_payload = build_analytics_status()
    payload = {
        "analytics_status": status_payload,
        "analytics_overview": build_default_analytics_overview(overview_period),
        "analytics_referrers": [],
        "analytics_trends": build_default_analytics_trends(),
    }

    if not status_payload["collection_enabled"] or status_payload["status"] != "ready":
        return payload

    cache_key = build_analytics_cache_key(status_payload["provider"], status_payload["site"], overview_period)
    cached_payload = cache.get(cache_key)
    if cached_payload:
        return cached_payload

    try:
        analytics_snapshot = fetch_provider_snapshot(status_payload["provider"], overview_period)
    except AnalyticsServiceError as exc:
        status_payload["data_state"] = "error"
        status_payload["last_error"] = str(exc)
        status_payload["message"] = "Analytics provider is configured, but the dashboard sync failed."
        cache.set(cache_key, payload, ANALYTICS_ERROR_TTL)
        return payload

    status_payload["data_state"] = "available"
    status_payload["last_synced_at"] = timezone.localtime().strftime("%Y-%m-%d %H:%M")
    status_payload["message"] = "Analytics provider is configured and traffic data was synced successfully."
    payload.update(analytics_snapshot)
    cache.set(cache_key, payload, ANALYTICS_SUCCESS_TTL)
    return payload


def build_analytics_status():
    provider = getattr(settings, "ANALYTICS_PROVIDER", "").strip().lower() or None
    site = getattr(settings, "ANALYTICS_SITE", "").strip() or None
    dashboard_url = getattr(settings, "ANALYTICS_DASHBOARD_URL", "").strip() or None
    api_key = getattr(settings, "ANALYTICS_API_KEY", "").strip() or None
    base_url = getattr(settings, "ANALYTICS_API_BASE_URL", "").strip() or None
    missing = []

    if not provider:
        missing.append("provider")
    if not site:
        missing.append("site")
    if not api_key:
        missing.append("api_key")

    if not provider and not site and not api_key:
        return {
            "status": "unconfigured",
            "provider": None,
            "site": None,
            "dashboard_url": dashboard_url,
            "base_url": base_url,
            "missing": missing,
            "collection_enabled": False,
            "data_state": "unavailable",
            "last_error": None,
            "last_synced_at": None,
            "message": "No analytics provider is configured for traffic or referral metrics yet.",
        }

    if provider and provider not in {"plausible", "umami"}:
        return {
            "status": "unsupported",
            "provider": provider,
            "site": site,
            "dashboard_url": dashboard_url,
            "base_url": base_url,
            "missing": missing,
            "collection_enabled": False,
            "data_state": "unavailable",
            "last_error": None,
            "last_synced_at": None,
            "message": "Unsupported analytics provider. Supported values are plausible and umami.",
        }

    if missing:
        return {
            "status": "partial",
            "provider": provider,
            "site": site,
            "dashboard_url": dashboard_url,
            "base_url": base_url,
            "missing": missing,
            "collection_enabled": False,
            "data_state": "unavailable",
            "last_error": None,
            "last_synced_at": None,
            "message": "Analytics configuration is incomplete. Complete the missing settings before surfacing traffic metrics.",
        }

    return {
        "status": "ready",
        "provider": provider,
        "site": site,
        "dashboard_url": dashboard_url,
        "base_url": base_url,
        "missing": [],
        "collection_enabled": True,
        "data_state": "syncing",
        "last_error": None,
        "last_synced_at": None,
        "message": "Analytics provider is configured. Dashboard traffic metrics will load from the provider API.",
    }


def normalize_analytics_overview_period(value):
    return value if value in ANALYTICS_OVERVIEW_PERIOD_LABELS else ANALYTICS_OVERVIEW_PERIOD_LAST_30_DAYS


def get_analytics_overview_period_label(overview_period):
    return ANALYTICS_OVERVIEW_PERIOD_LABELS[normalize_analytics_overview_period(overview_period)]


def build_default_analytics_overview(overview_period=ANALYTICS_OVERVIEW_PERIOD_LAST_30_DAYS):
    return {
        "period_label": get_analytics_overview_period_label(overview_period),
        "pageviews": None,
        "visitors": None,
        "visits": None,
        "bounce_rate": None,
        "avg_visit_duration": None,
    }


def build_default_analytics_trends():
    return {
        "period_label": "Last 14 Days",
        "labels": [],
        "pageviews": [],
        "visitors": [],
        "visits": [],
    }


def build_analytics_cache_key(provider, site, overview_period=ANALYTICS_OVERVIEW_PERIOD_LAST_30_DAYS):
    return f"dashboard:analytics:{provider}:{site}:{normalize_analytics_overview_period(overview_period)}"


def fetch_provider_snapshot(provider, overview_period=ANALYTICS_OVERVIEW_PERIOD_LAST_30_DAYS):
    if provider == "plausible":
        return fetch_plausible_snapshot(overview_period)
    if provider == "umami":
        return fetch_umami_snapshot(overview_period)
    raise AnalyticsServiceError("Unsupported analytics provider.")


def fetch_plausible_snapshot(overview_period=ANALYTICS_OVERVIEW_PERIOD_LAST_30_DAYS):
    endpoint = resolve_plausible_endpoint()
    site = settings.ANALYTICS_SITE.strip()
    api_key = settings.ANALYTICS_API_KEY.strip()
    overview_period = normalize_analytics_overview_period(overview_period)
    overview_date_range = "all" if overview_period == ANALYTICS_OVERVIEW_PERIOD_ALL_TIME else "30d"

    summary_response = fetch_json(
        request.Request(
            endpoint,
            data=json.dumps(
                {
                    "site_id": site,
                    "metrics": ["pageviews", "visitors", "visits", "bounce_rate", "visit_duration"],
                    "date_range": overview_date_range,
                }
            ).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            method="POST",
        )
    )
    summary_metrics = extract_first_metrics(summary_response, 5)

    trends_response = fetch_json(
        request.Request(
            endpoint,
            data=json.dumps(
                {
                    "site_id": site,
                    "metrics": ["pageviews", "visitors", "visits"],
                    "date_range": "14d",
                    "dimensions": ["time:day"],
                    "order_by": [["time:day", "asc"]],
                }
            ).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            method="POST",
        )
    )

    referrer_response = fetch_json(
        request.Request(
            endpoint,
            data=json.dumps(
                {
                    "site_id": site,
                    "metrics": ["visitors", "visits", "pageviews"],
                    "date_range": "30d",
                    "dimensions": ["visit:referrer"],
                    "order_by": [["visitors", "desc"]],
                }
            ).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            method="POST",
        )
    )

    return {
        "analytics_overview": {
            "period_label": get_analytics_overview_period_label(overview_period),
            "pageviews": int_or_none(summary_metrics[0]),
            "visitors": int_or_none(summary_metrics[1]),
            "visits": int_or_none(summary_metrics[2]),
            "bounce_rate": float_or_none(summary_metrics[3]),
            "avg_visit_duration": int_or_none(summary_metrics[4]),
        },
        "analytics_referrers": [
            {
                "label": (row.get("dimensions") or ["Direct / None"])[0] or "Direct / None",
                "visitors": int_or_none((row.get("metrics") or [None, None, None])[0]),
                "visits": int_or_none((row.get("metrics") or [None, None, None])[1]),
                "pageviews": int_or_none((row.get("metrics") or [None, None, None])[2]),
            }
            for row in (referrer_response.get("results") or [])[:5]
        ],
        "analytics_trends": build_plausible_trends(trends_response),
    }


def fetch_umami_snapshot(overview_period=ANALYTICS_OVERVIEW_PERIOD_LAST_30_DAYS):
    base_url = resolve_umami_base_url()
    site = settings.ANALYTICS_SITE.strip()
    now = timezone.now()
    end_at = int(now.timestamp() * 1000)
    overview_period = normalize_analytics_overview_period(overview_period)
    summary_start_at = 0 if overview_period == ANALYTICS_OVERVIEW_PERIOD_ALL_TIME else int((now - timedelta(days=30)).timestamp() * 1000)
    referrers_start_at = int((now - timedelta(days=30)).timestamp() * 1000)
    trends_start_at = int((now - timedelta(days=14)).timestamp() * 1000)

    summary_response = fetch_json(
        request.Request(
            f"{base_url}/websites/{site}/stats?{parse.urlencode({'startAt': summary_start_at, 'endAt': end_at})}",
            headers=build_umami_headers(),
            method="GET",
        )
    )
    trends_response = fetch_json(
        request.Request(
            f"{base_url}/websites/{site}/pageviews?{parse.urlencode({'startAt': trends_start_at, 'endAt': end_at, 'unit': 'day', 'timezone': timezone.get_current_timezone_name()})}",
            headers=build_umami_headers(),
            method="GET",
        )
    )
    referrer_response = fetch_json(
        request.Request(
            f"{base_url}/websites/{site}/metrics/expanded?{parse.urlencode({'startAt': referrers_start_at, 'endAt': end_at, 'type': 'referrer', 'limit': 5})}",
            headers=build_umami_headers(),
            method="GET",
        )
    )

    visits = int_or_none(summary_response.get("visits"))
    total_time = int_or_none(summary_response.get("totaltime"))
    bounces = int_or_none(summary_response.get("bounces"))

    return {
        "analytics_overview": {
            "period_label": get_analytics_overview_period_label(overview_period),
            "pageviews": int_or_none(summary_response.get("pageviews")),
            "visitors": int_or_none(summary_response.get("visitors")),
            "visits": visits,
            "bounce_rate": round((bounces / visits) * 100, 2) if visits and bounces is not None else None,
            "avg_visit_duration": round(total_time / visits) if visits and total_time is not None else None,
        },
        "analytics_referrers": [
            {
                "label": item.get("name") or "Direct / None",
                "visitors": int_or_none(item.get("visitors")),
                "visits": int_or_none(item.get("visits")),
                "pageviews": int_or_none(item.get("pageviews")),
            }
            for item in (referrer_response or [])[:5]
        ],
        "analytics_trends": build_umami_trends(trends_response),
    }


def build_plausible_trends(response_payload):
    labels = []
    pageviews = []
    visitors = []
    visits = []

    for row in response_payload.get("results") or []:
        dimensions = row.get("dimensions") or []
        metrics = row.get("metrics") or []
        labels.append(format_date_label(dimensions[0] if dimensions else None))
        pageviews.append(int_or_none(metrics[0]) or 0)
        visitors.append(int_or_none(metrics[1]) or 0)
        visits.append(int_or_none(metrics[2]) or 0)

    return {
        "period_label": "Last 14 Days",
        "labels": labels,
        "pageviews": pageviews,
        "visitors": visitors,
        "visits": visits,
    }


def build_umami_trends(response_payload):
    labels = []
    pageviews = []
    visitors = []
    visits = []

    pageview_rows = response_payload.get("pageviews") or []
    session_rows = response_payload.get("sessions") or []
    session_map = {item.get("x"): item.get("y") for item in session_rows}

    for row in pageview_rows:
        key = row.get("x")
        labels.append(format_date_label(key))
        pageviews.append(int_or_none(row.get("y")) or 0)
        visitors.append(int_or_none(session_map.get(key)) or 0)
        visits.append(int_or_none(session_map.get(key)) or 0)

    return {
        "period_label": "Last 14 Days",
        "labels": labels,
        "pageviews": pageviews,
        "visitors": visitors,
        "visits": visits,
    }


def fetch_json(request_object):
    try:
        with request.urlopen(request_object, timeout=get_timeout_seconds()) as response:  # nosem: python.lang.security.audit.dynamic-urllib-use-detected.dynamic-urllib-use-detected
            return json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="ignore").strip()
        raise AnalyticsServiceError(body or f"HTTP {exc.code}") from exc
    except (error.URLError, TimeoutError, ValueError, json.JSONDecodeError) as exc:
        raise AnalyticsServiceError(str(exc) or "Analytics request failed.") from exc


def resolve_plausible_endpoint():
    configured = getattr(settings, "ANALYTICS_API_BASE_URL", "").strip()
    if not configured:
        configured = "https://plausible.io"
    configured = validate_outbound_http_url(configured, setting_name="ANALYTICS_API_BASE_URL")
    if configured.endswith("/api/v2/query"):
        return configured
    return f"{configured.rstrip('/')}/api/v2/query"


def resolve_umami_base_url():
    configured = getattr(settings, "ANALYTICS_API_BASE_URL", "").strip()
    if configured:
        return validate_outbound_http_url(configured, setting_name="ANALYTICS_API_BASE_URL").rstrip("/")
    return "https://api.umami.is/v1"


def build_umami_headers():
    api_key = settings.ANALYTICS_API_KEY.strip()
    auth_type = getattr(settings, "ANALYTICS_API_AUTH_TYPE", "auto").strip().lower() or "auto"
    base_url = resolve_umami_base_url()
    headers = {"Accept": "application/json"}

    if auth_type == "auto":
        auth_type = "x-umami-api-key" if "api.umami.is" in base_url else "bearer"

    if auth_type == "bearer":
        headers["Authorization"] = f"Bearer {api_key}"
    else:
        headers["x-umami-api-key"] = api_key
    return headers


def get_timeout_seconds():
    return getattr(settings, "ANALYTICS_TIMEOUT_SECONDS", 5)


def extract_first_metrics(response_payload, expected_length):
    results = response_payload.get("results") or []
    if not results:
        return [None] * expected_length
    metrics = results[0].get("metrics") or []
    return (metrics + ([None] * expected_length))[:expected_length]


def format_date_label(value):
    if not value:
        return "-"
    raw_value = str(value)
    try:
        if raw_value.isdigit():
            parsed = datetime.fromtimestamp(int(raw_value) / 1000, tz=dt_timezone.utc)
        else:
            parsed = datetime.fromisoformat(raw_value.replace("Z", "+00:00"))
            if timezone.is_naive(parsed):
                parsed = timezone.make_aware(parsed, timezone.get_current_timezone())
        return timezone.localtime(parsed).strftime("%m-%d")
    except ValueError:
        return raw_value


def int_or_none(value):
    if value is None:
        return None
    return int(value)


def float_or_none(value):
    if value is None:
        return None
    return round(float(value), 2)
