from urllib.parse import urlparse


def validate_outbound_http_url(raw_url, *, setting_name):
    normalized = (raw_url or "").strip()
    if not normalized:
        raise ValueError(f"{setting_name} is not configured")

    parsed = urlparse(normalized)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError(f"{setting_name} must be an absolute http(s) URL")

    return normalized
