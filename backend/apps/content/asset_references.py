from urllib.parse import unquote, urlparse

from django.conf import settings

from .models import Asset


def build_asset_lookup_candidates(normalized_url: str) -> list[str]:
    media_url = (getattr(settings, "MEDIA_URL", "/media/") or "/media/").strip() or "/media/"
    if not media_url.endswith("/"):
        media_url = f"{media_url}/"

    candidates: list[str] = []
    if normalized_url.startswith(media_url):
        candidates.append(normalized_url[len(media_url):])

    parsed_url = urlparse(normalized_url)
    if parsed_url.path:
        candidates.append(parsed_url.path.lstrip("/"))

        parsed_media_url = urlparse(media_url)
        media_path = parsed_media_url.path or "/"
        if not media_path.endswith("/"):
            media_path = f"{media_path}/"
        if parsed_media_url.netloc and parsed_url.netloc == parsed_media_url.netloc and parsed_url.path.startswith(media_path):
            candidates.append(parsed_url.path[len(media_path):])

    normalized_candidates: list[str] = []
    seen = set()
    for candidate in candidates:
        decoded_candidate = unquote(candidate).lstrip("/")
        if decoded_candidate and decoded_candidate not in seen:
            normalized_candidates.append(decoded_candidate)
            seen.add(decoded_candidate)
    return normalized_candidates


def find_asset_by_url(url: str | None) -> Asset | None:
    normalized_url = (url or "").strip()
    if not normalized_url:
        return None

    for file_name in build_asset_lookup_candidates(normalized_url):
        asset = Asset.objects.filter(file=file_name).first()
        if asset:
            return asset

    return Asset.objects.filter(object_key=normalized_url).first()


def resolve_asset_reference(url: str | None = None, asset_id: int | None = None) -> Asset | None:
    if asset_id:
        return Asset.objects.get(id=asset_id)

    normalized_url = (url or "").strip()
    if not normalized_url:
        return None

    asset = find_asset_by_url(normalized_url)
    if asset:
        return asset

    return Asset.objects.create(object_key=normalized_url)
