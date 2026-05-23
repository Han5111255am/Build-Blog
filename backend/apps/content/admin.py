from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import Post, Note, Project, Photo, Podcast, Tag, Asset
from .tasks import render_markdown_task
from .tasks import render_note_markdown_task, render_podcast_markdown_task
from .tasks_helpers import (
    invalidate_cache_task,
    get_post_related_cache_keys,
    get_note_related_cache_keys,
    get_project_related_cache_keys,
    get_photo_related_cache_keys,
    get_podcast_related_cache_keys,
)


def dispatch_cache_invalidation(cache_keys):
    """合并去重后统一投递缓存失效任务。"""
    deduplicated_keys = list(dict.fromkeys(cache_keys))
    if deduplicated_keys:
        invalidate_cache_task.delay(deduplicated_keys)


# ─── Tag ───────────────────────────────────────────────────────────


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'created_at']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}


# ─── Post ──────────────────────────────────────────────────────────


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['title', 'lang', 'status_badge', 'published_at', 'reading_time', 'created_at']
    list_filter = ['status', 'lang', 'created_at', 'published_at']
    search_fields = ['title', 'slug', 'summary', 'content_md']
    fieldsets = (
        ('基本信息', {
            'fields': ('title', 'slug', 'lang', 'status', 'tags')
        }),
        ('内容', {
            'fields': ('content_md', 'summary'),
            'description': '在此编辑 Markdown 内容，保存后将自动渲染为 HTML'
        }),
        ('渲染产物（自动生成）', {
            'fields': ('content_html', 'toc_json', 'reading_time'),
            'classes': ('collapse',),
            'description': '这些字段由系统自动生成，通常不需要手动编辑'
        }),
        ('发布设置', {
            'fields': ('published_at', 'cover_image')
        }),
        ('时间戳', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    # 只读字段
    readonly_fields = ['created_at', 'updated_at', 'content_html', 'toc_json', 'reading_time']

    # 预填充 slug
    prepopulated_fields = {'slug': ('title',)}

    # 日期层级导航
    date_hierarchy = 'published_at'

    # 每页显示数量
    list_per_page = 20

    # 排序
    ordering = ['-published_at', '-created_at']

    def status_badge(self, obj):
        """状态徽章"""
        if obj.status == 'published':
            color = 'green'
            text = '已发布'
        else:
            color = 'orange'
            text = '草稿'
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color, text
        )
    status_badge.short_description = '状态'

    def save_model(self, request, obj, form, change):
        """保存时自动设置发布时间并触发渲染任务"""
        # 自动设置发布时间
        if obj.status == 'published' and not obj.published_at:
            obj.published_at = timezone.now()

        # 先保存对象
        super().save_model(request, obj, form, change)

        # 触发异步渲染任务
        render_markdown_task.delay(obj.id)

        # 触发缓存失效任务
        cache_keys = get_post_related_cache_keys(
            post_id=obj.id,
            post_slug=obj.slug,
            post_lang=obj.lang
        )
        dispatch_cache_invalidation(cache_keys)

        self.message_user(request, f'文章已保存，正在后台渲染 Markdown...')

    # 批量操作
    actions = ['make_published', 'make_draft']

    def make_published(self, request, queryset):
        """批量发布"""
        updated = queryset.update(status='published', published_at=timezone.now())

        all_cache_keys = []

        # 触发每篇文章的渲染任务
        for post in queryset:
            render_markdown_task.delay(post.id)
            all_cache_keys.extend(get_post_related_cache_keys(post.id, post.slug, post.lang))

        dispatch_cache_invalidation(all_cache_keys)

        self.message_user(request, f'成功发布 {updated} 篇文章，正在后台渲染...')
    make_published.short_description = '发布选中的文章'

    def make_draft(self, request, queryset):
        """批量设为草稿"""
        updated = queryset.update(status='draft')
        self.message_user(request, f'成功将 {updated} 篇文章设为草稿')
    make_draft.short_description = '将选中的文章设为草稿'


# ─── Note ──────────────────────────────────────────────────────────


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ['title', 'lang', 'status', 'published_at', 'reading_time', 'created_at']
    list_filter = ['status', 'lang', 'created_at']
    search_fields = ['title', 'slug', 'content_md']
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ['created_at', 'updated_at', 'content_html', 'toc_json', 'reading_time']
    fieldsets = (
        ('基本信息', {'fields': ('title', 'slug', 'lang', 'status', 'tags')}),
        ('内容', {'fields': ('content_md', 'summary')}),
        ('渲染产物', {'fields': ('content_html', 'toc_json', 'reading_time'), 'classes': ('collapse',)}),
        ('发布设置', {'fields': ('published_at',)}),
        ('时间戳', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )
    ordering = ['-published_at', '-created_at']

    def save_model(self, request, obj, form, change):
        if obj.status == 'published' and not obj.published_at:
            obj.published_at = timezone.now()
        super().save_model(request, obj, form, change)
        render_note_markdown_task.delay(obj.id)
        cache_keys = get_note_related_cache_keys(
            note_id=obj.id, note_slug=obj.slug, note_lang=obj.lang
        )
        dispatch_cache_invalidation(cache_keys)
        self.message_user(request, '笔记已保存，正在后台渲染 Markdown...')


# ─── Project ───────────────────────────────────────────────────────


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'lang', 'display_order', 'url', 'created_at']
    list_filter = ['lang']
    search_fields = ['name', 'slug', 'description']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['display_order']
    fieldsets = (
        ('基本信息', {'fields': ('name', 'slug', 'description', 'icon', 'lang', 'tags')}),
        ('链接', {'fields': ('url', 'repo_url')}),
        ('排序', {'fields': ('display_order',)}),
    )

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        cache_keys = get_project_related_cache_keys(
            project_id=obj.id, project_lang=obj.lang
        )
        dispatch_cache_invalidation(cache_keys)
        self.message_user(request, '项目已保存，缓存已更新。')


# ─── Asset ─────────────────────────────────────────────────────────


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'storage_provider', 'mime_type', 'size_bytes', 'width', 'height', 'created_at']
    list_filter = ['storage_provider', 'mime_type']
    search_fields = ['object_key', 'file']
    readonly_fields = ['created_at']


# ─── Photo ─────────────────────────────────────────────────────────


@admin.register(Photo)
class PhotoAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'taken_at', 'location', 'lang', 'created_at']
    list_filter = ['lang', 'created_at']
    search_fields = ['caption', 'location', 'description']
    raw_id_fields = ['original', 'thumbnail']
    fieldsets = (
        ('图片文件', {'fields': ('original', 'thumbnail')}),
        ('元信息', {'fields': ('taken_at', 'location', 'caption', 'description', 'lang')}),
    )

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        cache_keys = get_photo_related_cache_keys()
        dispatch_cache_invalidation(cache_keys)


# ─── Podcast ───────────────────────────────────────────────────────


@admin.register(Podcast)
class PodcastAdmin(admin.ModelAdmin):
    list_display = ['title', 'platform', 'lang', 'published_at', 'created_at']
    list_filter = ['lang', 'platform']
    search_fields = ['title', 'slug']
    prepopulated_fields = {'slug': ('title',)}
    raw_id_fields = ['cover']
    readonly_fields = ['content_html', 'created_at', 'updated_at']
    fieldsets = (
        ('基本信息', {'fields': ('title', 'slug', 'platform', 'url', 'lang')}),
        ('封面', {'fields': ('cover',)}),
        ('内容', {'fields': ('content_md', 'content_html')}),
        ('发布设置', {'fields': ('published_at',)}),
        ('时间戳', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        cache_keys = get_podcast_related_cache_keys(
            podcast_slug=obj.slug, podcast_lang=obj.lang
        )
        dispatch_cache_invalidation(cache_keys)
        if obj.content_md:
            render_podcast_markdown_task.delay(obj.id)
            self.message_user(request, '播客已保存，正在后台渲染 Show Notes...')
        else:
            self.message_user(request, '播客已保存，缓存已更新。')


