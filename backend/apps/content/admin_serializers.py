from io import BytesIO
from pathlib import PurePosixPath
from urllib.parse import unquote, urlparse

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from django.utils.text import slugify
from PIL import Image, UnidentifiedImageError, features
from rest_framework import serializers

from .asset_references import resolve_asset_reference
from .html_sanitizer import sanitize_html_fields
from .models import (
    Asset,
    MotionLevelChoices,
    Note,
    Photo,
    Podcast,
    Post,
    Project,
    StatusChoices,
    TableDensityChoices,
    Tag,
    ThemeModeChoices,
    UserPreference,
)
from .serializers import TagSerializer
from .tasks import _markdown_to_html, calculate_reading_time, extract_toc, generate_summary


DEFAULT_ASSET_UPLOAD_IMAGE_MAX_BYTES = 30 * 1024 * 1024
DEFAULT_ASSET_UPLOAD_AUDIO_MAX_BYTES = 100 * 1024 * 1024
DEFAULT_ASSET_UPLOAD_VIDEO_MAX_BYTES = 200 * 1024 * 1024
DEFAULT_ASSET_UPLOAD_DOCUMENT_MAX_BYTES = 20 * 1024 * 1024
DEFAULT_ASSET_UPLOAD_FALLBACK_MAX_BYTES = 10 * 1024 * 1024
ASSET_UPLOAD_ALLOWED_MIME_TYPES = {
    "image/png": {".png"},
    "image/jpeg": {".jpg", ".jpeg"},
    "image/webp": {".webp"},
    "image/gif": {".gif"},
    "image/avif": {".avif"},
    "audio/mpeg": {".mp3"},
    "audio/wav": {".wav"},
    "audio/x-wav": {".wav"},
    "audio/ogg": {".ogg"},
    "audio/mp4": {".m4a"},
    "audio/x-m4a": {".m4a"},
    "audio/flac": {".flac"},
    "video/mp4": {".mp4"},
    "video/webm": {".webm"},
    "application/pdf": {".pdf"},
    "text/plain": {".txt"},
    "text/markdown": {".md", ".markdown"},
    "application/json": {".json"},
}
ASSET_UPLOAD_FALLBACK_MIME_TYPES = {"", "application/octet-stream"}
IMAGE_FORMAT_TO_MIME_TYPES = {
    "PNG": "image/png",
    "JPEG": "image/jpeg",
    "WEBP": "image/webp",
    "GIF": "image/gif",
    "AVIF": "image/avif",
}
AVIF_BRANDS = {b"avif", b"avis"}
JPEG_EXTENSIONS = {".jpg", ".jpeg"}


def get_asset_upload_size_limit(mime_type):
    normalized_mime_type = (mime_type or "").strip().lower()
    if normalized_mime_type.startswith("image/"):
        return getattr(settings, "ASSET_UPLOAD_IMAGE_MAX_BYTES", DEFAULT_ASSET_UPLOAD_IMAGE_MAX_BYTES)
    if normalized_mime_type.startswith("audio/"):
        return getattr(settings, "ASSET_UPLOAD_AUDIO_MAX_BYTES", DEFAULT_ASSET_UPLOAD_AUDIO_MAX_BYTES)
    if normalized_mime_type.startswith("video/"):
        return getattr(settings, "ASSET_UPLOAD_VIDEO_MAX_BYTES", DEFAULT_ASSET_UPLOAD_VIDEO_MAX_BYTES)
    if normalized_mime_type.startswith("text/") or normalized_mime_type.startswith("application/"):
        return getattr(settings, "ASSET_UPLOAD_DOCUMENT_MAX_BYTES", DEFAULT_ASSET_UPLOAD_DOCUMENT_MAX_BYTES)
    return getattr(settings, "ASSET_UPLOAD_FALLBACK_MAX_BYTES", DEFAULT_ASSET_UPLOAD_FALLBACK_MAX_BYTES)


def looks_like_avif(image_bytes):
    if len(image_bytes) < 16 or image_bytes[4:8] != b"ftyp":
        return False

    brands = {
        image_bytes[index:index + 4]
        for index in range(8, min(len(image_bytes), 32), 4)
        if len(image_bytes[index:index + 4]) == 4
    }
    return bool(brands & AVIF_BRANDS)


def build_normalized_jpeg_upload(upload_name, image):
    output = BytesIO()
    normalized_image = image

    if normalized_image.mode in {"RGBA", "LA"} or (
        normalized_image.mode == "P" and "transparency" in normalized_image.info
    ):
        normalized_rgba = normalized_image.convert("RGBA")
        background = Image.new("RGB", normalized_rgba.size, (255, 255, 255))
        background.paste(normalized_rgba, mask=normalized_rgba.getchannel("A"))
        normalized_image = background
    elif normalized_image.mode != "RGB":
        normalized_image = normalized_image.convert("RGB")

    normalized_image.save(output, format="JPEG", quality=95, optimize=True)
    output.seek(0)

    source_path = PurePosixPath(upload_name or "image.jpg")
    source_stem = source_path.stem or "image"
    normalized_name = f"{source_stem}.jpg"
    return SimpleUploadedFile(normalized_name, output.getvalue(), content_type="image/jpeg")


def inspect_image_upload(upload, resolved_mime_type, normalized_name):
    upload.seek(0)
    image_bytes = upload.read()
    upload.seek(0)

    if not image_bytes:
        raise serializers.ValidationError({"file": ["Uploaded image must not be empty."]})

    if resolved_mime_type == "image/avif" and not features.check("avif"):
        if not looks_like_avif(image_bytes):
            raise serializers.ValidationError({"file": ["Uploaded file is not a valid image."]})
        return {"mime_type": resolved_mime_type, "width": None, "height": None}

    try:
        with Image.open(BytesIO(image_bytes)) as image:
            image.verify()
        with Image.open(BytesIO(image_bytes)) as image:
            image.load()
            detected_format = (image.format or "").upper()
            width, height = image.size
        with Image.open(BytesIO(image_bytes)) as image:
            convertible_image = image.copy()
    except (UnidentifiedImageError, OSError):
        raise serializers.ValidationError({"file": ["Uploaded file is not a valid image."]})

    detected_format_label = detected_format or "UNKNOWN"
    detected_mime_type = IMAGE_FORMAT_TO_MIME_TYPES.get(detected_format)
    is_requested_as_jpeg = resolved_mime_type == "image/jpeg" and PurePosixPath(normalized_name or "").suffix.lower() in JPEG_EXTENSIONS

    if is_requested_as_jpeg and (not detected_mime_type or detected_mime_type != "image/jpeg"):
        normalized_upload = build_normalized_jpeg_upload(normalized_name, convertible_image)
        return {
            "file": normalized_upload,
            "normalized_name": normalized_upload.name,
            "mime_type": "image/jpeg",
            "width": width,
            "height": height,
        }

    if not detected_mime_type:
        raise serializers.ValidationError(
            {"file": [f"Uploaded file uses an unsupported image encoding (detected: {detected_format_label})."]}
        )
    if detected_mime_type != resolved_mime_type:
        raise serializers.ValidationError(
            {
                "file": [
                    "Image content does not match the uploaded MIME type "
                    f"(detected: {detected_mime_type}; expected: {resolved_mime_type})."
                ]
            }
        )

    return {
        "file": upload,
        "normalized_name": normalized_name,
        "mime_type": detected_mime_type,
        "width": width,
        "height": height,
    }


def serialize_roles(user):
    roles = []
    if user.is_superuser:
        roles.append("superuser")
    if user.is_staff:
        roles.append("staff")
    group_names = list(user.groups.values_list("name", flat=True))
    for group_name in group_names:
        if group_name not in roles:
            roles.append(group_name)
    return roles or ["user"]


def render_content_fields(instance):
    if hasattr(instance, "content_md") and instance.content_md:
        content_html = _markdown_to_html(instance.content_md)
        instance.content_html = content_html
        if hasattr(instance, "toc_json"):
            instance.toc_json = extract_toc(content_html)
        if hasattr(instance, "summary"):
            instance.summary = generate_summary(instance.content_md, instance.summary)
        if hasattr(instance, "reading_time"):
            instance.reading_time = calculate_reading_time(instance.content_md, getattr(instance, "lang", "en") or "en")
    elif hasattr(instance, "content_html"):
        instance.content_html = ""
    return instance


class AdminDateTimeField(serializers.DateTimeField):
    def __init__(self, **kwargs):
        kwargs.setdefault("format", "%Y-%m-%d %H:%M")
        kwargs.setdefault(
            "input_formats",
            [
                "%Y-%m-%d %H:%M",
                "%Y-%m-%dT%H:%M",
                "%Y-%m-%dT%H:%M:%S",
                "%Y-%m-%dT%H:%M:%S%z",
                "iso-8601",
            ],
        )
        super().__init__(**kwargs)

    def to_internal_value(self, value):
        if isinstance(value, str) and not value.strip() and self.allow_null:
            return None
        return super().to_internal_value(value)


class CurrentUserSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    display_name = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()

    def get_display_name(self, obj):
        return obj.first_name or obj.get_full_name() or obj.username

    def get_roles(self, obj):
        return serialize_roles(obj)


class AccountProfileSerializer(serializers.Serializer):
    username = serializers.CharField(min_length=3, max_length=32)
    display_name = serializers.CharField(min_length=2, max_length=32)

    def validate_username(self, value):
        user = self.context["request"].user
        normalized = value.strip()
        if user.__class__.objects.exclude(pk=user.pk).filter(username=normalized).exists():
            raise serializers.ValidationError("This username is already in use.")
        return normalized

    def validate_display_name(self, value):
        return value.strip()

    def update(self, instance, validated_data):
        update_fields = []
        if "username" in validated_data:
            instance.username = validated_data["username"]
            update_fields.append("username")
        if "display_name" in validated_data:
            instance.first_name = validated_data["display_name"]
            update_fields.append("first_name")
        if update_fields:
            instance.save(update_fields=update_fields)
        return instance

    def to_representation(self, instance):
        return {
            "username": instance.username,
            "display_name": instance.first_name or instance.username,
        }


class AccountProfileReadSerializer(serializers.Serializer):
    username = serializers.CharField(read_only=True)
    display_name = serializers.SerializerMethodField()

    def get_display_name(self, obj):
        return obj.first_name or obj.username


class UserPreferenceSerializer(serializers.ModelSerializer):
    theme = serializers.ChoiceField(choices=ThemeModeChoices.choices, required=False)
    table_density = serializers.ChoiceField(choices=TableDensityChoices.choices, required=False)
    motion = serializers.ChoiceField(choices=MotionLevelChoices.choices, required=False)
    sidebar_collapsed = serializers.BooleanField(required=False)

    class Meta:
        model = UserPreference
        fields = ["theme", "table_density", "motion", "sidebar_collapsed"]


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(trim_whitespace=False)
    new_password = serializers.CharField(trim_whitespace=False, min_length=8, max_length=64)
    confirm_password = serializers.CharField(trim_whitespace=False, required=False, allow_blank=True)

    def validate(self, attrs):
        user = self.context["request"].user
        current_password = attrs["current_password"]
        new_password = attrs["new_password"]
        confirm_password = attrs.get("confirm_password")

        if not current_password:
            raise serializers.ValidationError({"current_password": ["Current password is required."]})

        if not user.check_password(current_password):
            raise serializers.ValidationError({"current_password": ["Current password is incorrect."]})

        if new_password == current_password:
            raise serializers.ValidationError({"new_password": ["New password must be different from the current password."]})

        if confirm_password and new_password != confirm_password:
            raise serializers.ValidationError({"confirm_password": ["The two new password values do not match."]})

        validate_password(new_password, user=user)
        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        new_password = self.validated_data["new_password"]
        validate_password(new_password, user=user)
        user.set_password(new_password)
        user.save(update_fields=["password"])
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(trim_whitespace=False)

    def validate(self, attrs):
        request = self.context.get("request")
        username = attrs.get("username", "").strip()
        password = attrs.get("password", "")
        if not username:
            raise serializers.ValidationError({"username": ["Username is required."]})
        if not password:
            raise serializers.ValidationError({"password": ["Password is required."]})

        user = authenticate(request=request, username=username, password=password)
        if user is None:
            raise serializers.ValidationError({"non_field_errors": ["Invalid username or password."]})
        if not user.is_active:
            raise serializers.ValidationError({"non_field_errors": ["This account is inactive."]})

        attrs["user"] = user
        attrs["username"] = username
        return attrs


class IdListSerializer(serializers.Serializer):
    ids = serializers.ListField(child=serializers.IntegerField(min_value=1), allow_empty=False)


class AdminContentSerializerMixin(serializers.ModelSerializer):
    tag_ids = serializers.ListField(child=serializers.IntegerField(min_value=1), write_only=True, required=False)
    tags = TagSerializer(many=True, read_only=True)

    def validate_slug(self, value):
        return value.strip()

    def validate(self, attrs):
        status_value = attrs.get("status", getattr(self.instance, "status", StatusChoices.DRAFT))
        if status_value == StatusChoices.PUBLISHED:
            if "published_at" in attrs:
                if not attrs.get("published_at"):
                    attrs["published_at"] = timezone.now()
            elif not getattr(self.instance, "published_at", None):
                attrs["published_at"] = timezone.now()
        return attrs

    def _save_tags(self, instance, tag_ids):
        if tag_ids is not None:
            instance.tags.set(Tag.objects.filter(id__in=tag_ids))


class AdminPostSerializer(AdminContentSerializerMixin):
    published_at = AdminDateTimeField(required=False, allow_null=True)
    created_at = AdminDateTimeField(read_only=True)
    updated_at = AdminDateTimeField(read_only=True)

    class Meta:
        model = Post
        fields = [
            "id",
            "slug",
            "title",
            "lang",
            "status",
            "summary",
            "cover_image",
            "reading_time",
            "tag_ids",
            "tags",
            "published_at",
            "created_at",
            "updated_at",
            "content_md",
            "content_html",
            "toc_json",
        ]
        read_only_fields = ["id", "reading_time", "created_at", "updated_at", "content_html", "toc_json"]
        extra_kwargs = {
            "slug": {"required": False, "allow_blank": True},
            "published_at": {"required": False, "allow_null": True},
        }

    def create(self, validated_data):
        tag_ids = validated_data.pop("tag_ids", [])
        instance = Post(**validated_data)
        if not instance.slug:
            instance.slug = slugify(instance.title)
        render_content_fields(instance)
        instance.save()
        self._save_tags(instance, tag_ids)
        return instance

    def update(self, instance, validated_data):
        tag_ids = validated_data.pop("tag_ids", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if not instance.slug:
            instance.slug = slugify(instance.title)
        render_content_fields(instance)
        instance.save()
        self._save_tags(instance, tag_ids)
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["tag_ids"] = list(instance.tags.values_list("id", flat=True))
        return sanitize_html_fields(data, "content_html")


class AdminNoteSerializer(AdminContentSerializerMixin):
    published_at = AdminDateTimeField(required=False, allow_null=True)
    created_at = AdminDateTimeField(read_only=True)
    updated_at = AdminDateTimeField(read_only=True)

    class Meta:
        model = Note
        fields = [
            "id",
            "slug",
            "title",
            "lang",
            "status",
            "summary",
            "reading_time",
            "tag_ids",
            "tags",
            "published_at",
            "created_at",
            "updated_at",
            "content_md",
            "content_html",
            "toc_json",
        ]
        read_only_fields = ["id", "reading_time", "created_at", "updated_at", "content_html", "toc_json"]
        extra_kwargs = {
            "slug": {"required": False, "allow_blank": True},
            "published_at": {"required": False, "allow_null": True},
        }

    def create(self, validated_data):
        tag_ids = validated_data.pop("tag_ids", [])
        instance = Note(**validated_data)
        if not instance.slug:
            instance.slug = slugify(instance.title)
        render_content_fields(instance)
        instance.save()
        self._save_tags(instance, tag_ids)
        return instance

    def update(self, instance, validated_data):
        tag_ids = validated_data.pop("tag_ids", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if not instance.slug:
            instance.slug = slugify(instance.title)
        render_content_fields(instance)
        instance.save()
        self._save_tags(instance, tag_ids)
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["tag_ids"] = list(instance.tags.values_list("id", flat=True))
        return sanitize_html_fields(data, "content_html")


class AdminTagSerializer(serializers.ModelSerializer):
    created_at = AdminDateTimeField(read_only=True)
    updated_at = AdminDateTimeField(read_only=True)

    post_count = serializers.SerializerMethodField()
    note_count = serializers.SerializerMethodField()
    project_count = serializers.SerializerMethodField()
    usage_text = serializers.SerializerMethodField()

    class Meta:
        model = Tag
        fields = [
            "id",
            "slug",
            "name",
            "color",
            "description",
            "post_count",
            "note_count",
            "project_count",
            "usage_text",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "post_count", "note_count", "project_count", "usage_text", "created_at", "updated_at"]
        extra_kwargs = {
            "slug": {"required": False, "allow_blank": True},
        }

    def validate_slug(self, value):
        return value.strip()

    def create(self, validated_data):
        if not validated_data.get("slug"):
            validated_data["slug"] = slugify(validated_data["name"])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if "slug" in validated_data and not validated_data["slug"]:
            validated_data["slug"] = slugify(validated_data.get("name", instance.name))
        return super().update(instance, validated_data)

    def _resolve_usage_count(self, obj, attr_name, relation_name):
        annotated_count = getattr(obj, attr_name, None)
        if annotated_count is not None:
            return annotated_count
        return getattr(obj, relation_name).count()

    def get_post_count(self, obj):
        return self._resolve_usage_count(obj, "post_count", "posts")

    def get_note_count(self, obj):
        return self._resolve_usage_count(obj, "note_count", "notes")

    def get_project_count(self, obj):
        return self._resolve_usage_count(obj, "project_count", "projects")

    def get_usage_text(self, obj):
        return f"{self.get_post_count(obj)} posts, {self.get_note_count(obj)} notes, {self.get_project_count(obj)} projects"


class AdminTagUsageItemSerializer(serializers.Serializer):
    content_type = serializers.ChoiceField(choices=["post", "note", "project"])
    item_id = serializers.IntegerField()
    title = serializers.CharField()
    slug = serializers.CharField()
    status = serializers.CharField(allow_blank=True)
    updated_at = AdminDateTimeField()


class AdminTagDetailSerializer(AdminTagSerializer):
    usage_items = serializers.SerializerMethodField()

    class Meta(AdminTagSerializer.Meta):
        fields = [*AdminTagSerializer.Meta.fields, "usage_items"]
        read_only_fields = [*AdminTagSerializer.Meta.read_only_fields, "usage_items"]

    def get_usage_items(self, obj):
        usage_items = []
        for post in obj.posts.only("id", "title", "slug", "status", "updated_at").order_by("-updated_at", "-id"):
            usage_items.append(
                {
                    "content_type": "post",
                    "item_id": post.id,
                    "title": post.title,
                    "slug": post.slug,
                    "status": post.status,
                    "updated_at": post.updated_at,
                }
            )
        for note in obj.notes.only("id", "title", "slug", "status", "updated_at").order_by("-updated_at", "-id"):
            usage_items.append(
                {
                    "content_type": "note",
                    "item_id": note.id,
                    "title": note.title or f"Note #{note.id}",
                    "slug": note.slug,
                    "status": note.status,
                    "updated_at": note.updated_at,
                }
            )
        for project in obj.projects.only("id", "name", "slug", "status", "updated_at").order_by("-updated_at", "-id"):
            usage_items.append(
                {
                    "content_type": "project",
                    "item_id": project.id,
                    "title": project.name,
                    "slug": project.slug,
                    "status": project.status,
                    "updated_at": project.updated_at,
                }
            )
        usage_items.sort(key=lambda item: (item["updated_at"], item["item_id"]), reverse=True)
        return AdminTagUsageItemSerializer(usage_items, many=True).data


class TagUsageUnlinkSerializer(serializers.Serializer):
    content_type = serializers.ChoiceField(choices=["post", "note", "project"])
    item_id = serializers.IntegerField(min_value=1)


class AdminProjectSerializer(serializers.ModelSerializer):
    published_at = AdminDateTimeField(required=False, allow_null=True)
    created_at = AdminDateTimeField(read_only=True)
    updated_at = AdminDateTimeField(read_only=True)

    title = serializers.CharField(source="name")
    site_url = serializers.URLField(source="url", allow_blank=True, required=False)

    class Meta:
        model = Project
        fields = [
            "id",
            "slug",
            "title",
            "lang",
            "status",
            "summary",
            "site_url",
            "repo_url",
            "icon",
            "cover_image",
            "display_order",
            "published_at",
            "created_at",
            "updated_at",
            "content_md",
            "content_html",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "content_html"]
        extra_kwargs = {
            "slug": {"required": False, "allow_blank": True},
            "published_at": {"required": False, "allow_null": True},
        }

    def validate(self, attrs):
        status_value = attrs.get("status", getattr(self.instance, "status", StatusChoices.DRAFT))
        if status_value == StatusChoices.PUBLISHED and not attrs.get("published_at") and not getattr(self.instance, "published_at", None):
            attrs["published_at"] = timezone.now()
        return attrs

    def create(self, validated_data):
        instance = Project(**validated_data)
        if not instance.slug:
            instance.slug = slugify(instance.name)
        instance.description = instance.summary
        render_content_fields(instance)
        instance.save()
        return instance

    def update(self, instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if not instance.slug:
            instance.slug = slugify(instance.name)
        instance.description = instance.summary
        render_content_fields(instance)
        instance.save()
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        return sanitize_html_fields(data, "content_html")


class TagOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "slug", "name"]
        read_only_fields = fields


class TagOptionCreateSerializer(serializers.ModelSerializer):
    slug = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Tag
        fields = ["id", "slug", "name"]
        read_only_fields = ["id"]

    def validate_slug(self, value):
        return value.strip()

    def validate_name(self, value):
        return value.strip()

    def create(self, validated_data):
        if not validated_data.get("slug"):
            validated_data["slug"] = slugify(validated_data["name"])
        return super().create(validated_data)


class AdminAssetSerializer(serializers.ModelSerializer):
    created_at = AdminDateTimeField(read_only=True)

    name = serializers.SerializerMethodField()
    url = serializers.SerializerMethodField()
    storage = serializers.CharField(source="storage_provider", read_only=True)
    size = serializers.IntegerField(source="size_bytes", read_only=True)

    class Meta:
        model = Asset
        fields = ["id", "name", "url", "mime_type", "storage", "size", "created_at"]
        read_only_fields = fields

    def get_name(self, obj):
        raw_name = obj.object_key or (obj.file.name if obj.file else "")
        if not raw_name:
            return f"asset-{obj.pk}"

        parsed_path = urlparse(raw_name).path or raw_name
        return unquote(PurePosixPath(parsed_path).name)

    def get_url(self, obj):
        return obj.url


class AssetUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    storage = serializers.ChoiceField(
        choices=Asset.StorageProvider.choices,
        required=False,
        default=Asset.StorageProvider.LOCAL,
    )

    def validate(self, attrs):
        upload = attrs["file"]
        normalized_name = PurePosixPath((getattr(upload, "name", "") or "").replace("\\", "/")).name.strip()
        if not normalized_name or normalized_name in {".", ".."}:
            raise serializers.ValidationError({"file": ["A valid file name is required."]})

        size_bytes = getattr(upload, "size", 0) or 0
        if size_bytes <= 0:
            raise serializers.ValidationError({"file": ["Uploaded file must not be empty."]})

        extension = PurePosixPath(normalized_name).suffix.lower()
        if not extension:
            raise serializers.ValidationError({"file": ["Uploaded file must include a supported extension."]})

        raw_mime_type = ((getattr(upload, "content_type", "") or "").split(";", 1)[0]).strip().lower()
        if raw_mime_type in ASSET_UPLOAD_ALLOWED_MIME_TYPES:
            if extension not in ASSET_UPLOAD_ALLOWED_MIME_TYPES[raw_mime_type]:
                raise serializers.ValidationError({"file": ["File extension does not match the uploaded MIME type."]})
            resolved_mime_type = raw_mime_type
        elif raw_mime_type in ASSET_UPLOAD_FALLBACK_MIME_TYPES:
            resolved_mime_type = next(
                (
                    mime_type
                    for mime_type, allowed_extensions in ASSET_UPLOAD_ALLOWED_MIME_TYPES.items()
                    if extension in allowed_extensions
                ),
                "",
            )
            if not resolved_mime_type:
                raise serializers.ValidationError({"file": ["Unsupported file type."]})
        else:
            raise serializers.ValidationError({"file": ["Unsupported file type."]})

        max_bytes = get_asset_upload_size_limit(resolved_mime_type)
        if size_bytes > max_bytes:
            raise serializers.ValidationError(
                {"file": [f"Uploaded file exceeds the {max_bytes} byte limit for {resolved_mime_type}."]}
            )

        image_metadata = None
        if resolved_mime_type.startswith("image/"):
            image_metadata = inspect_image_upload(upload, resolved_mime_type, normalized_name)
            upload = image_metadata["file"]
            resolved_mime_type = image_metadata["mime_type"]
            normalized_name = image_metadata["normalized_name"]

        upload.name = normalized_name
        attrs["file"] = upload
        attrs["normalized_name"] = normalized_name
        attrs["resolved_mime_type"] = resolved_mime_type
        attrs["image_width"] = image_metadata["width"] if image_metadata else None
        attrs["image_height"] = image_metadata["height"] if image_metadata else None
        return attrs

    def create(self, validated_data):
        upload = validated_data["file"]
        storage_provider = validated_data.get("storage", Asset.StorageProvider.LOCAL)
        normalized_name = validated_data.get("normalized_name", upload.name)
        resolved_mime_type = validated_data.get("resolved_mime_type", "")
        image_width = validated_data.get("image_width")
        image_height = validated_data.get("image_height")
        return Asset.objects.create(
            storage_provider=storage_provider,
            file=upload,
            object_key=normalized_name,
            mime_type=resolved_mime_type,
            size_bytes=getattr(upload, "size", 0) or 0,
            width=image_width,
            height=image_height,
        )


class AdminPhotoSerializer(serializers.ModelSerializer):
    taken_at = AdminDateTimeField()
    created_at = AdminDateTimeField(read_only=True)
    updated_at = AdminDateTimeField(read_only=True)
    original_url = serializers.CharField(write_only=True)
    thumbnail_url = serializers.CharField(write_only=True)
    slug = serializers.CharField(required=False, allow_blank=True)
    original_asset_id = serializers.IntegerField(source="original.id", read_only=True)
    thumbnail_asset_id = serializers.IntegerField(source="thumbnail.id", read_only=True)
    original_url_display = serializers.SerializerMethodField()
    thumbnail_url_display = serializers.SerializerMethodField()

    class Meta:
        model = Photo
        fields = [
            "id",
            "caption",
            "slug",
            "lang",
            "location",
            "taken_at",
            "original_url",
            "thumbnail_url",
            "original_url_display",
            "thumbnail_url_display",
            "original_asset_id",
            "thumbnail_asset_id",
            "created_at",
            "updated_at",
            "description",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "original_asset_id", "thumbnail_asset_id", "original_url_display", "thumbnail_url_display"]

    def validate_slug(self, value):
        return value.strip()

    def create(self, validated_data):
        original_url = validated_data.pop("original_url")
        thumbnail_url = validated_data.pop("thumbnail_url")
        validated_data["original"] = resolve_asset_reference(url=original_url)
        validated_data["thumbnail"] = resolve_asset_reference(url=thumbnail_url)
        if not validated_data.get("slug"):
            validated_data["slug"] = slugify(validated_data["caption"])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        original_url = validated_data.pop("original_url", None)
        thumbnail_url = validated_data.pop("thumbnail_url", None)
        if original_url is not None:
            instance.original = resolve_asset_reference(url=original_url)
        if thumbnail_url is not None:
            instance.thumbnail = resolve_asset_reference(url=thumbnail_url)
        if "slug" in validated_data and not validated_data["slug"]:
            validated_data["slug"] = slugify(validated_data.get("caption", instance.caption))
        return super().update(instance, validated_data)

    def get_original_url_display(self, obj):
        return obj.original.url if obj.original else ""

    def get_thumbnail_url_display(self, obj):
        return obj.thumbnail.url if obj.thumbnail else ""

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["original_url"] = data.pop("original_url_display")
        data["thumbnail_url"] = data.pop("thumbnail_url_display")
        return data


class AdminPodcastSerializer(serializers.ModelSerializer):
    published_at = AdminDateTimeField(required=False, allow_null=True)
    created_at = AdminDateTimeField(read_only=True)
    updated_at = AdminDateTimeField(read_only=True)
    slug = serializers.CharField(required=False, allow_blank=True)
    cover_asset_id = serializers.IntegerField(required=False, allow_null=True)
    cover_url = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Podcast
        fields = [
            "id",
            "title",
            "slug",
            "platform",
            "url",
            "lang",
            "cover_asset_id",
            "cover_url",
            "published_at",
            "created_at",
            "updated_at",
            "content_md",
            "content_html",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "content_html"]

    def validate_slug(self, value):
        return value.strip()

    def create(self, validated_data):
        cover_asset_id = validated_data.pop("cover_asset_id", None)
        cover_url = validated_data.pop("cover_url", "")
        validated_data["cover"] = resolve_asset_reference(url=cover_url, asset_id=cover_asset_id)
        if not validated_data.get("slug"):
            validated_data["slug"] = slugify(validated_data["title"])
        instance = Podcast(**validated_data)
        if instance.content_md:
            instance.content_html = _markdown_to_html(instance.content_md)
        instance.save()
        return instance

    def update(self, instance, validated_data):
        cover_asset_id = validated_data.pop("cover_asset_id", None)
        cover_url = validated_data.pop("cover_url", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if cover_asset_id is not None or cover_url is not None:
            instance.cover = resolve_asset_reference(url=cover_url, asset_id=cover_asset_id)
        if not instance.slug:
            instance.slug = slugify(instance.title)
        if instance.content_md:
            instance.content_html = _markdown_to_html(instance.content_md)
        else:
            instance.content_html = ""
        instance.save()
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["cover_asset_id"] = instance.cover_id
        data["cover_url"] = instance.cover.url if instance.cover else ""
        return sanitize_html_fields(data, "content_html")
