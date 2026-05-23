from rest_framework.pagination import CursorPagination


class BaseStreamCursorPagination(CursorPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class PostStreamCursorPagination(BaseStreamCursorPagination):
    ordering = '-published_at'


class NoteStreamCursorPagination(BaseStreamCursorPagination):
    ordering = '-published_at'


class PodcastStreamCursorPagination(BaseStreamCursorPagination):
    ordering = '-published_at'

