from django.db import models
from django.utils.text import slugify
from django.core.exceptions import ValidationError


class LanguageChoices(models.TextChoices):
    ENGLISH = 'en', 'English'
    CHINESE = 'zh', 'Chinese'


class StatusChoices(models.TextChoices):
    DRAFT = 'draft', 'Draft'
    PUBLISHED = 'published', 'Published'


class ThemeModeChoices(models.TextChoices):
    LIGHT = 'light', 'Light'
    DARK = 'dark', 'Dark'
    SYSTEM = 'system', 'System'


class TableDensityChoices(models.TextChoices):
    COMFORTABLE = 'comfortable', 'Comfortable'
    COMPACT = 'compact', 'Compact'


class MotionLevelChoices(models.TextChoices):
    FULL = 'full', 'Full'
    REDUCED = 'reduced', 'Reduced'


# ─── Tag ───────────────────────────────────────────────────────────


class Tag(models.Model):
    slug = models.SlugField(max_length=100, unique=True, db_index=True)
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    color = models.CharField(max_length=7, default="#6b7280")
    description = models.CharField(max_length=240, blank=True)

    class Meta:
        db_table = 'tags'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class UserPreference(models.Model):
    user = models.OneToOneField('auth.User', on_delete=models.CASCADE, related_name='ui_preferences')
    theme = models.CharField(max_length=20, choices=ThemeModeChoices.choices, default=ThemeModeChoices.SYSTEM)
    table_density = models.CharField(max_length=20, choices=TableDensityChoices.choices, default=TableDensityChoices.COMFORTABLE)
    motion = models.CharField(max_length=20, choices=MotionLevelChoices.choices, default=MotionLevelChoices.FULL)
    sidebar_collapsed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_preferences'

    def __str__(self):
        return f"Preferences<{self.user_id}>"


# ─── Post ──────────────────────────────────────────────────────────


class Post(models.Model):
    slug = models.SlugField(max_length=200, unique=True, db_index=True)
    title = models.CharField(max_length=500)
    lang = models.CharField(max_length=2, choices=LanguageChoices.choices,
                           default=LanguageChoices.ENGLISH, db_index=True)
    status = models.CharField(max_length=20, choices=StatusChoices.choices,
                             default=StatusChoices.DRAFT, db_index=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name='posts')
    published_at = models.DateTimeField(null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    content_md = models.TextField()
    content_html = models.TextField(blank=True)
    toc_json = models.JSONField(default=dict, blank=True)
    summary = models.TextField(blank=True, max_length=500)
    cover_image = models.URLField(blank=True, max_length=500)
    reading_time = models.IntegerField(default=0)

    class Meta:
        db_table = 'posts'
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['status', 'published_at'], name='idx_post_status_pub'),
            models.Index(fields=['lang', 'status', 'published_at'], name='idx_post_lang_status_pub'),
        ]

    def __str__(self):
        return f"{self.title} ({self.lang})"

    def clean(self):
        super().clean()
        if self.status == StatusChoices.PUBLISHED and not self.published_at:
            raise ValidationError({'published_at': '发布状态的文章必须设置发布时间'})
        if self.lang not in ['en', 'zh']:
            raise ValidationError({'lang': '语言只能是 en 或 zh'})

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        self.full_clean()
        super().save(*args, **kwargs)


# ─── Note ──────────────────────────────────────────────────────────


class Note(models.Model):
    slug = models.SlugField(max_length=200, unique=True, db_index=True)
    title = models.CharField(max_length=500, blank=True)
    lang = models.CharField(max_length=2, choices=LanguageChoices.choices,
                           default=LanguageChoices.ENGLISH, db_index=True)
    status = models.CharField(max_length=20, choices=StatusChoices.choices,
                             default=StatusChoices.DRAFT, db_index=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name='notes')
    published_at = models.DateTimeField(null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    content_md = models.TextField()
    content_html = models.TextField(blank=True)
    toc_json = models.JSONField(default=dict, blank=True)
    summary = models.TextField(blank=True, max_length=500)
    reading_time = models.IntegerField(default=0)

    class Meta:
        db_table = 'notes'
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['status', 'published_at'], name='idx_note_status_pub'),
            models.Index(fields=['lang', 'status', 'published_at'], name='idx_note_lang_status_pub'),
        ]

    def __str__(self):
        return self.title or f"Note #{self.pk}"

    def clean(self):
        super().clean()
        if self.status == StatusChoices.PUBLISHED and not self.published_at:
            raise ValidationError({'published_at': '发布状态须设置发布时间'})

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title) if self.title else f"note-{self.pk or 'new'}"
        self.full_clean()
        super().save(*args, **kwargs)


# ─── Project ───────────────────────────────────────────────────────


class Project(models.Model):
    slug = models.SlugField(max_length=200, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    url = models.URLField(blank=True, max_length=500)
    repo_url = models.URLField(blank=True, max_length=500)
    icon = models.CharField(max_length=100, blank=True)
    lang = models.CharField(max_length=2, choices=LanguageChoices.choices,
                           null=True, blank=True, db_index=True)
    status = models.CharField(max_length=20, choices=StatusChoices.choices,
                              default=StatusChoices.DRAFT, db_index=True)
    summary = models.CharField(max_length=240, blank=True)
    cover_image = models.URLField(blank=True, max_length=500)
    published_at = models.DateTimeField(null=True, blank=True, db_index=True)
    content_md = models.TextField(blank=True)
    content_html = models.TextField(blank=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name='projects')
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'projects'
        ordering = ['display_order', '-created_at']
        indexes = [
            models.Index(fields=['display_order', '-created_at'], name='idx_project_display_created'),
            models.Index(fields=['lang', 'display_order'], name='idx_project_lang_display'),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


# ─── Asset ─────────────────────────────────────────────────────────


class Asset(models.Model):
    class StorageProvider(models.TextChoices):
        LOCAL = 'local', 'Local'
        MINIO = 'minio', 'MinIO'
        S3 = 's3', 'Amazon S3'

    storage_provider = models.CharField(
        max_length=20, choices=StorageProvider.choices,
        default=StorageProvider.LOCAL)
    file = models.FileField(upload_to='assets/%Y/%m/', blank=True)
    object_key = models.CharField(max_length=500, blank=True)
    mime_type = models.CharField(max_length=100, blank=True)
    size_bytes = models.BigIntegerField(default=0)
    sha256 = models.CharField(max_length=64, blank=True, db_index=True)
    width = models.IntegerField(null=True, blank=True)
    height = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'assets'

    def __str__(self):
        return self.object_key or (self.file.name if self.file else f"Asset #{self.pk}")

    @property
    def url(self):
        if self.file:
            return self.file.url
        return self.object_key or ''


# ─── Photo ─────────────────────────────────────────────────────────


class Photo(models.Model):
    slug = models.SlugField(max_length=200, unique=True, db_index=True, blank=True)
    original = models.ForeignKey(
        Asset, on_delete=models.CASCADE, related_name='photo_originals')
    thumbnail = models.ForeignKey(
        Asset, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='photo_thumbnails')
    taken_at = models.DateTimeField(null=True, blank=True, db_index=True)
    location = models.CharField(max_length=200, blank=True)
    caption = models.TextField(blank=True)
    lang = models.CharField(max_length=2, choices=LanguageChoices.choices,
                           null=True, blank=True, db_index=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'photos'
        ordering = ['-taken_at', '-created_at']
        indexes = [
            models.Index(fields=['taken_at'], name='idx_photo_taken_at'),
        ]

    def __str__(self):
        return self.caption[:50] if self.caption else f"Photo #{self.pk}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.caption) or f"photo-{self.pk or 'new'}"
        super().save(*args, **kwargs)


# ─── Podcast ───────────────────────────────────────────────────────


class Podcast(models.Model):
    slug = models.SlugField(max_length=200, unique=True, db_index=True)
    title = models.CharField(max_length=500)
    platform = models.CharField(max_length=100, blank=True)
    url = models.URLField(max_length=500)
    lang = models.CharField(max_length=2, choices=LanguageChoices.choices,
                           default=LanguageChoices.ENGLISH, db_index=True)
    published_at = models.DateTimeField(null=True, blank=True, db_index=True)
    cover = models.ForeignKey(
        Asset, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='podcast_covers')
    content_md = models.TextField(blank=True)
    content_html = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'podcasts'
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['lang', '-published_at'], name='idx_podcast_lang_pub'),
            models.Index(fields=['platform', '-published_at'], name='idx_podcast_platform_pub'),
        ]

    def __str__(self):
        return self.title


