from rest_framework import serializers

from .asset_references import find_asset_by_url
from .html_sanitizer import sanitize_html_fields
from .models import FriendLink, Post, Note, Project, Photo, Podcast, Tag


# ─── Tag ───────────────────────────────────────────────────────────


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'slug', 'name']
        read_only_fields = fields


class FriendLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = FriendLink
        fields = [
            'id',
            'site_name',
            'site_url',
            'logo_url',
            'description',
            'display_order',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields


class FriendLinkApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = FriendLink
        fields = [
            'id',
            'site_name',
            'site_url',
            'logo_url',
            'description',
            'contact_email',
            'contact_note',
            'status',
            'created_at',
        ]
        read_only_fields = ['id', 'status', 'created_at']

    def validate_site_name(self, value):
        normalized = value.strip()
        if not normalized:
            raise serializers.ValidationError('Site name is required.')
        return normalized

    def validate_description(self, value):
        return value.strip()

    def validate_contact_note(self, value):
        return value.strip()

    def validate_site_url(self, value):
        normalized = value.strip()
        if FriendLink.objects.exclude(status=FriendLink.Status.REJECTED).filter(site_url=normalized).exists():
            raise serializers.ValidationError('This site URL already has an active application.')
        return normalized

    def validate_logo_url(self, value):
        return value.strip()


class PostListSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Post
        fields = [
            'id', 'slug', 'title', 'lang', 'status', 'summary',
            'cover_image', 'reading_time', 'tags',
            'published_at', 'created_at', 'updated_at',
        ]
        read_only_fields = fields


class PostDetailSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Post
        fields = [
            'id', 'slug', 'title', 'lang', 'status',
            'content_html', 'toc_json', 'summary',
            'cover_image', 'reading_time', 'tags',
            'published_at', 'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def to_representation(self, instance):
        data = super().to_representation(instance)
        return sanitize_html_fields(data, "content_html")


# ─── Note ──────────────────────────────────────────────────────────


class NoteListSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Note
        fields = [
            'id', 'slug', 'title', 'lang', 'status', 'summary',
            'reading_time', 'tags',
            'published_at', 'created_at', 'updated_at',
        ]
        read_only_fields = fields


class NoteDetailSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Note
        fields = [
            'id', 'slug', 'title', 'lang', 'status',
            'content_html', 'toc_json', 'summary',
            'reading_time', 'tags',
            'published_at', 'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def to_representation(self, instance):
        data = super().to_representation(instance)
        return sanitize_html_fields(data, "content_html")


# ─── Project ───────────────────────────────────────────────────────


class ProjectListSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'slug', 'name', 'description', 'url', 'repo_url',
            'icon', 'lang', 'summary', 'cover_image', 'tags', 'display_order',
            'published_at',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields


class ProjectDetailSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    cover_image_width = serializers.SerializerMethodField()
    cover_image_height = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'slug', 'name', 'description', 'url', 'repo_url',
            'icon', 'lang', 'summary', 'cover_image', 'cover_image_width', 'cover_image_height',
            'content_html', 'tags', 'display_order',
            'published_at', 'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_cover_asset(self, obj):
        if not hasattr(obj, "_cover_image_asset_cache"):
            obj._cover_image_asset_cache = find_asset_by_url(obj.cover_image)
        return obj._cover_image_asset_cache

    def get_cover_image_width(self, obj):
        asset = self.get_cover_asset(obj)
        return asset.width if asset else None

    def get_cover_image_height(self, obj):
        asset = self.get_cover_asset(obj)
        return asset.height if asset else None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        return sanitize_html_fields(data, "content_html")


# ─── Photo ─────────────────────────────────────────────────────────


class PhotoSerializer(serializers.ModelSerializer):
    original_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    width = serializers.SerializerMethodField()
    height = serializers.SerializerMethodField()

    class Meta:
        model = Photo
        fields = [
            'id', 'taken_at', 'location', 'caption', 'lang',
            'description', 'width', 'height',
            'original_url', 'thumbnail_url',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_original_url(self, obj):
        return obj.original.url if obj.original else None

    def get_thumbnail_url(self, obj):
        return obj.thumbnail.url if obj.thumbnail else self.get_original_url(obj)

    def get_width(self, obj):
        return obj.original.width if obj.original else None

    def get_height(self, obj):
        return obj.original.height if obj.original else None


# ─── Podcast ───────────────────────────────────────────────────────


class PodcastListSerializer(serializers.ModelSerializer):
    cover_url = serializers.SerializerMethodField()

    class Meta:
        model = Podcast
        fields = [
            'id', 'slug', 'title', 'platform', 'url', 'lang',
            'cover_url', 'published_at', 'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_cover_url(self, obj):
        return obj.cover.url if obj.cover else None


class PodcastDetailSerializer(serializers.ModelSerializer):
    cover_url = serializers.SerializerMethodField()

    class Meta:
        model = Podcast
        fields = [
            'id', 'slug', 'title', 'platform', 'url', 'lang',
            'cover_url', 'content_html',
            'published_at', 'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_cover_url(self, obj):
        return obj.cover.url if obj.cover else None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        return sanitize_html_fields(data, "content_html")

