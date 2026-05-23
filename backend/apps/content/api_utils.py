from math import ceil

from django.http import Http404
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import status
from rest_framework.exceptions import ErrorDetail
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


DEFAULT_SUCCESS_MESSAGE = "Request completed successfully."
DEFAULT_ERROR_MESSAGE = "Request failed."


def success_response(data=None, message=DEFAULT_SUCCESS_MESSAGE, status_code=status.HTTP_200_OK):
    return Response(
        {
            "success": True,
            "message": message,
            "data": data,
        },
        status=status_code,
    )


def parse_admin_datetime(value):
    if not value:
        return None
    if isinstance(value, str):
        parsed = parse_datetime(value.replace(" ", "T"))
        if parsed is None:
            return None
        if timezone.is_naive(parsed):
            return timezone.make_aware(parsed, timezone.get_current_timezone())
        return parsed
    return value


def flatten_error_details(detail):
    if isinstance(detail, dict):
        return {key: flatten_error_details(value) for key, value in detail.items()}
    if isinstance(detail, list):
        return [str(item) for item in detail]
    if isinstance(detail, ErrorDetail):
        return [str(detail)]
    if detail is None:
        return []
    return [str(detail)]


def admin_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    if response is None:
        if isinstance(exc, Http404):
            return Response(
                {
                    "success": False,
                    "message": "Resource not found.",
                    "error_code": "not_found",
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        return response

    raw_data = response.data
    errors = None
    message = DEFAULT_ERROR_MESSAGE

    if isinstance(raw_data, dict):
        if "detail" in raw_data:
            message = str(raw_data["detail"])
        else:
            errors = flatten_error_details(raw_data)
            first_key = next(iter(errors), None) if isinstance(errors, dict) else None
            if first_key and errors[first_key]:
                message = errors[first_key][0]
            else:
                message = "Validation failed."
    elif raw_data:
        message = str(raw_data)

    error_code = None
    if response.status_code == status.HTTP_400_BAD_REQUEST:
        error_code = "bad_request"
    elif response.status_code == status.HTTP_401_UNAUTHORIZED:
        error_code = "authentication_failed"
    elif response.status_code == status.HTTP_403_FORBIDDEN:
        error_code = "permission_denied"
    elif response.status_code == status.HTTP_404_NOT_FOUND:
        error_code = "not_found"
    elif response.status_code == status.HTTP_409_CONFLICT:
        error_code = "conflict"

    payload = {
        "success": False,
        "message": message,
    }
    if error_code:
        payload["error_code"] = error_code
    if errors:
        payload["errors"] = errors

    response.data = payload
    return response


class AdminPageNumberPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_paginated_response(self, data):
        page_size = self.get_page_size(self.request) or self.page.paginator.per_page
        total_pages = ceil(self.page.paginator.count / page_size) if page_size else 1
        return success_response(
            data={
                "count": self.page.paginator.count,
                "page": self.page.number,
                "page_size": page_size,
                "total_pages": total_pages,
                "results": data,
            }
        )
