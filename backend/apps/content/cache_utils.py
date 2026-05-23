"""
缓存工具函数
"""
from hashlib import md5
import json
from urllib.parse import urlparse

import redis
from django.core.cache import cache


def generate_cache_key(prefix, *args, **kwargs):
    """
    生成缓存键
    
    Args:
        prefix: 缓存键前缀
        *args: 位置参数
        **kwargs: 关键字参数
    
    Returns:
        str: 缓存键
    """
    key_parts = [prefix]
    
    # 添加位置参数
    for arg in args:
        key_parts.append(str(arg))
    
    # 添加关键字参数（排序以保证一致性）
    for k in sorted(kwargs.keys()):
        key_parts.append(f"{k}:{kwargs[k]}")
    
    return ':'.join(key_parts)


def generate_etag(data):
    """
    生成 ETag
    
    Args:
        data: 数据（字典或字符串）
    
    Returns:
        str: ETag 值
    """
    if isinstance(data, dict):
        data = json.dumps(data, sort_keys=True)
    elif not isinstance(data, str):
        data = str(data)
    
    return md5(data.encode('utf-8')).hexdigest()


def get_cached_response(cache_key, generator_func, timeout=300):
    """
    获取缓存的响应，如果不存在则生成并缓存

    Args:
        cache_key: 缓存键
        generator_func: 生成数据的函数
        timeout: 缓存超时时间（秒）

    Returns:
        缓存的数据
    """
    # 尝试从缓存获取
    cached_data = cache.get(cache_key)

    if cached_data is not None:
        return cached_data

    # 生成新数据
    data = generator_func()

    # 存入缓存
    cache.set(cache_key, data, timeout)

    return data


def generate_query_params_cache_key(prefix, query_params, include_keys=None):
    """
    根据请求查询参数生成稳定的列表缓存键。

    Args:
        prefix: 缓存键前缀
        query_params: Django QueryDict 或字典
        include_keys: 允许参与缓存键的参数名列表；为空时默认全量纳入

    Returns:
        str: 缓存键
    """
    include_keys = set(include_keys or [])
    normalized = {}

    for key in sorted(query_params.keys()):
        if include_keys and key not in include_keys:
            continue
        values = query_params.getlist(key) if hasattr(query_params, 'getlist') else [query_params[key]]
        normalized[key] = ','.join(str(value) for value in values)

    return generate_cache_key(prefix, **normalized)


def invalidate_pattern(pattern):
    """
    失效匹配模式的所有缓存键

    Args:
        pattern: 缓存键模式（支持通配符 *）

    Returns:
        int: 删除的键数量
    """
    try:
        if pattern.endswith(':*'):
            base_pattern = pattern[:-2]
            match_prefix = cache.make_key(base_pattern)
        elif '*' in pattern:
            raw_prefix = pattern.split('*', 1)[0]
            match_prefix = cache.make_key(raw_prefix)
        else:
            match_prefix = cache.make_key(pattern)

        try:
            from django_redis import get_redis_connection

            redis_conn = get_redis_connection("default")
            match_pattern = f"{match_prefix}*" if '*' in pattern else match_prefix
            keys = list(redis_conn.scan_iter(match=match_pattern))
            if keys:
                return redis_conn.delete(*keys)
            return 0
        except Exception:
            inner_cache = cache._connections['default']

            # Support Django locmem cache in tests and local development.
            if hasattr(inner_cache, "_cache"):
                matched_keys = [
                    key for key in list(inner_cache._cache.keys())
                    if str(key).startswith(match_prefix)
                ]
                deleted = 0
                for key in matched_keys:
                    inner_cache._cache.pop(key, None)
                    if hasattr(inner_cache, "_expire_info"):
                        inner_cache._expire_info.pop(key, None)
                    deleted += 1
                return deleted

            if not hasattr(inner_cache, "_servers"):
                return 0

            location = inner_cache._servers[0]
            parsed = urlparse(location)
            redis_conn = redis.Redis(
                host=parsed.hostname or 'localhost',
                port=parsed.port or 6379,
                db=int((parsed.path or '/0').lstrip('/')),
                password=parsed.password,
            )
            match_pattern = f"{match_prefix}*" if '*' in pattern else match_prefix
            keys = list(redis_conn.scan_iter(match=match_pattern))
            if keys:
                return redis_conn.delete(*keys)
            return 0
    except Exception:
        return 0


def get_post_cache_key(slug=None, post_id=None, lang=None, page=None):
    """
    获取文章相关的缓存键
    
    Args:
        slug: 文章 slug
        post_id: 文章 ID
        lang: 语言
        page: 页码
    
    Returns:
        str: 缓存键
    """
    if slug:
        return generate_cache_key('post:detail', slug)
    elif post_id:
        return generate_cache_key('post:id', post_id)
    elif lang and page:
        return generate_cache_key('post:list', lang, f'page:{page}')
    elif lang:
        return generate_cache_key('post:list', lang)
    elif page:
        return generate_cache_key('post:list', f'page:{page}')
    else:
        return generate_cache_key('post:list')


def invalidate_post_caches(post_slug=None, post_lang=None):
    """
    失效文章相关的所有缓存
    
    Args:
        post_slug: 文章 slug
        post_lang: 文章语言
    """
    patterns = []
    
    # 文章详情缓存
    if post_slug:
        cache.delete(get_post_cache_key(slug=post_slug))
    
    # 列表缓存
    patterns.append('post:list:*')
    
    # 语言特定的列表缓存
    if post_lang:
        patterns.append(f'post:list:{post_lang}:*')
    
    # 首页聚合缓存
    cache.delete('home:aggregate')
    
    # 失效所有匹配的模式
    for pattern in patterns:
        invalidate_pattern(pattern)

