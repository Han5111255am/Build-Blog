from celery import shared_task
from django.core.cache import cache
from .cache_utils import invalidate_pattern


@shared_task(bind=True, name='content.invalidate_cache')
def invalidate_cache_task(self, cache_keys):
    """
    精准缓存失效任务

    Args:
        cache_keys: 要失效的缓存键列表或模式
    """
    try:
        if isinstance(cache_keys, str):
            cache_keys = [cache_keys]

        deleted_count = 0
        for key in cache_keys:
            # 如果包含通配符，使用模式匹配删除
            if '*' in key:
                deleted_count += invalidate_pattern(key)
            else:
                if cache.delete(key):
                    deleted_count += 1

        return {
            'status': 'success',
            'deleted_count': deleted_count,
            'total_keys': len(cache_keys)
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }


def get_post_related_cache_keys(post_id, post_slug=None, post_lang=None):
    """
    获取与文章相关的所有缓存键
    
    Args:
        post_id: 文章 ID
        post_slug: 文章 slug
        post_lang: 文章语言
    
    Returns:
        list: 缓存键列表
    """
    keys = []
    
    # 文章详情缓存
    if post_slug:
        keys.append(f'post:detail:{post_slug}')
    
    # 文章列表缓存（需要失效所有分页）
    keys.append('post:list:*')
    
    # 语言过滤的列表缓存
    if post_lang:
        keys.append(f'post:list:{post_lang}:*')
    
    # 首页聚合缓存
    keys.append('home:aggregate')
    
    return keys


def get_note_related_cache_keys(note_id, note_slug=None, note_lang=None):
    """获取与笔记相关的所有缓存键"""
    keys = []
    if note_slug:
        keys.append(f'note:detail:{note_slug}')
    keys.append('note:list:*')
    if note_lang:
        keys.append(f'note:list:{note_lang}:*')
    keys.append('home:aggregate')
    return keys


def get_project_related_cache_keys(project_id=None, project_lang=None):
    """获取与项目相关的所有缓存键"""
    keys = ['project:list:*', 'home:aggregate']
    if project_lang:
        keys.append(f'project:list:{project_lang}:*')
    return keys


def get_photo_related_cache_keys():
    """获取与照片相关的所有缓存键"""
    return ['photo:list:*', 'home:aggregate']


def get_podcast_related_cache_keys(podcast_slug=None, podcast_lang=None):
    """获取与播客相关的所有缓存键"""
    keys = ['podcast:list:*']
    if podcast_slug:
        keys.append(f'podcast:detail:{podcast_slug}')
    if podcast_lang:
        keys.append(f'podcast:list:{podcast_lang}:*')
    return keys
