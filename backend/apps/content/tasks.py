import re
import markdown
from bs4 import BeautifulSoup
from celery import shared_task
from django.utils import timezone
from .html_sanitizer import sanitize_rendered_html
from .models import Post, Note, Podcast


@shared_task(bind=True, name='content.render_markdown')
def render_markdown_task(self, post_id):
    """
    异步渲染 Post 的 Markdown 到 HTML
    """
    try:
        post = Post.objects.get(id=post_id)
        result = _render_content(post)
        return {
            'status': 'success',
            'post_id': post_id,
            'post_title': post.title,
            'reading_time': result['reading_time'],
        }
    except Post.DoesNotExist:
        return {'status': 'error', 'post_id': post_id, 'message': 'Post not found'}
    except Exception as e:
        return {'status': 'error', 'post_id': post_id, 'message': str(e)}


@shared_task(bind=True, name='content.render_note_markdown')
def render_note_markdown_task(self, note_id):
    """异步渲染 Note 的 Markdown 到 HTML"""
    try:
        note = Note.objects.get(id=note_id)
        result = _render_content(note)
        return {
            'status': 'success',
            'note_id': note_id,
            'reading_time': result['reading_time'],
        }
    except Note.DoesNotExist:
        return {'status': 'error', 'note_id': note_id, 'message': 'Note not found'}
    except Exception as e:
        return {'status': 'error', 'note_id': note_id, 'message': str(e)}


@shared_task(bind=True, name='content.render_podcast_markdown')
def render_podcast_markdown_task(self, podcast_id):
    """异步渲染 Podcast Show Notes 的 Markdown 到 HTML"""
    try:
        podcast = Podcast.objects.get(id=podcast_id)
        if podcast.content_md:
            html_content = _markdown_to_html(podcast.content_md)
            podcast.content_html = html_content
            podcast.save(update_fields=['content_html', 'updated_at'])
        return {'status': 'success', 'podcast_id': podcast_id}
    except Podcast.DoesNotExist:
        return {'status': 'error', 'podcast_id': podcast_id, 'message': 'Podcast not found'}
    except Exception as e:
        return {'status': 'error', 'podcast_id': podcast_id, 'message': str(e)}


def _markdown_to_html(md_text):
    """通用 Markdown → HTML 转换"""
    md = markdown.Markdown(extensions=[
        'extra',
        'codehilite',
        'toc',
        'tables',
        'fenced_code',
        'pymdownx.arithmatex',
    ], extension_configs={
        'pymdownx.arithmatex': {
            # Emit plain span/div wrappers so the existing HTML sanitizer can
            # preserve the math source and let KaTeX render it on the client.
            'generic': True,
        },
    })
    return sanitize_rendered_html(md.convert(md_text))


def _render_content(obj):
    """通用内容渲染：HTML + TOC + summary + reading_time"""
    html_content = _markdown_to_html(obj.content_md)
    toc_json = extract_toc(html_content)
    summary = generate_summary(obj.content_md, obj.summary)
    reading_time = calculate_reading_time(obj.content_md, getattr(obj, 'lang', 'en'))

    obj.content_html = html_content
    obj.toc_json = toc_json
    obj.summary = summary
    obj.reading_time = reading_time
    obj.save(update_fields=['content_html', 'toc_json', 'summary', 'reading_time', 'updated_at'])

    return {'reading_time': reading_time}


def extract_toc(html_content):
    """从 HTML 中提取目录结构"""
    soup = BeautifulSoup(html_content, 'html.parser')
    toc = []
    
    # 查找所有标题标签
    for heading in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
        level = int(heading.name[1])  # h1 -> 1, h2 -> 2, etc.
        text = heading.get_text().strip()
        
        # 生成 anchor id
        anchor_id = re.sub(r'[^\w\s-]', '', text.lower())
        anchor_id = re.sub(r'[-\s]+', '-', anchor_id)
        
        # 为标题添加 id 属性
        if not heading.get('id'):
            heading['id'] = anchor_id
        
        toc.append({
            'level': level,
            'text': text,
            'id': anchor_id,
        })
    
    return toc


def generate_summary(content_md, existing_summary=''):
    """生成文章摘要"""
    if existing_summary:
        return existing_summary
    
    # 移除 Markdown 标记
    text = re.sub(r'#+ ', '', content_md)  # 移除标题标记
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)  # 移除链接
    text = re.sub(r'[*_`]', '', text)  # 移除格式标记
    text = re.sub(r'```[\s\S]*?```', '', text)  # 移除代码块
    text = re.sub(r'\n+', ' ', text)  # 替换换行为空格
    text = text.strip()
    
    # 截取前 200 个字符作为摘要
    if len(text) > 200:
        return text[:200] + '...'
    return text


def calculate_reading_time(content_md, lang='en'):
    """
    计算阅读时长（分钟）
    中文：每分钟 300-400 字
    英文：每分钟 200-250 词
    """
    # 移除代码块（不计入阅读时长）
    text = re.sub(r'```[\s\S]*?```', '', content_md)
    
    if lang == 'zh':
        # 中文：统计字符数（排除空格和标点）
        chinese_chars = len(re.findall(r'[\u4e00-\u9fff]', text))
        reading_time = max(1, round(chinese_chars / 350))  # 每分钟 350 字
    else:
        # 英文：统计单词数
        words = len(re.findall(r'\b\w+\b', text))
        reading_time = max(1, round(words / 225))  # 每分钟 225 词
    
    return reading_time

