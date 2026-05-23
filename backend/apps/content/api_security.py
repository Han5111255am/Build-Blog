from django.conf import settings
from rest_framework.permissions import AllowAny, BasePermission


class HealthCheckPermission(BasePermission):
    """
    Allow access to health diagnostics for trusted callers only.

    Trusted callers are:
    - authenticated staff users
    - requests carrying the configured health check token
    """

    message = "Authentication credentials were not provided for this endpoint."

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if user and user.is_authenticated and user.is_staff:
            return True

        configured_token = getattr(settings, "HEALTH_CHECK_TOKEN", "")
        if not configured_token:
            return False

        supplied_token = request.headers.get("X-Health-Check-Token", "").strip()
        return supplied_token and supplied_token == configured_token


class PublicContentPermission(AllowAny):
    """Marker permission for explicitly public content endpoints."""

