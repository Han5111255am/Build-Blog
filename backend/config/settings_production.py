import os

from django.core.exceptions import ImproperlyConfigured

from .settings import *


DEBUG = False
MIDDLEWARE = ["django.middleware.gzip.GZipMiddleware", *MIDDLEWARE]

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "").strip()
if not SECRET_KEY:
    raise ImproperlyConfigured("Production requires DJANGO_SECRET_KEY.")

ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", [])
if not ALLOWED_HOSTS or "*" in ALLOWED_HOSTS:
    raise ImproperlyConfigured("Production requires explicit ALLOWED_HOSTS without wildcard.")

HEALTH_CHECK_TOKEN = os.getenv("HEALTH_CHECK_TOKEN", "").strip()
if not HEALTH_CHECK_TOKEN:
    raise ImproperlyConfigured("Production requires HEALTH_CHECK_TOKEN for internal diagnostics.")

STATIC_URL = os.getenv("STATIC_URL", "/static/")
STATIC_ROOT = env_path("STATIC_ROOT", REPO_ROOT / "staticfiles")
# If MEDIA_URL is set explicitly (e.g. to an R2 custom domain), honor it.
# Otherwise keep MEDIA_URL computed in base settings (R2-enabled config sets it).
_media_url_override = os.getenv("MEDIA_URL", "").strip()
if _media_url_override:
    MEDIA_URL = _media_url_override
DATABASES["default"]["CONN_MAX_AGE"] = env_int("DJANGO_DB_CONN_MAX_AGE", 60)
DATABASES["default"]["CONN_HEALTH_CHECKS"] = env_bool("DJANGO_DB_CONN_HEALTH_CHECKS", True)

USE_X_FORWARDED_HOST = env_bool("USE_X_FORWARDED_HOST", True)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT", True)
SESSION_COOKIE_SECURE = env_bool("SESSION_COOKIE_SECURE", True)
CSRF_COOKIE_SECURE = env_bool("CSRF_COOKIE_SECURE", True)
SECURE_HSTS_SECONDS = env_int("SECURE_HSTS_SECONDS", 31536000)
SECURE_HSTS_INCLUDE_SUBDOMAINS = env_bool("SECURE_HSTS_INCLUDE_SUBDOMAINS", True)
SECURE_HSTS_PRELOAD = env_bool("SECURE_HSTS_PRELOAD", True)
SECURE_CROSS_ORIGIN_OPENER_POLICY = os.getenv("SECURE_CROSS_ORIGIN_OPENER_POLICY", "same-origin")

REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = [
    'rest_framework.renderers.JSONRenderer',
]

LOG_LEVEL = os.getenv("DJANGO_LOG_LEVEL", "INFO").upper()
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "%(asctime)s %(levelname)s %(name)s %(message)s",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        }
    },
    "root": {
        "handlers": ["console"],
        "level": LOG_LEVEL,
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
        "celery": {
            "handlers": ["console"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
    },
}
