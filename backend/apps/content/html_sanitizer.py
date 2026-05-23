from bs4 import BeautifulSoup, Comment
import bleach


UNSAFE_CONTENT_TAGS = {
    "script",
    "style",
    "iframe",
    "object",
    "embed",
    "form",
    "input",
    "button",
    "textarea",
    "select",
    "option",
    "link",
    "meta",
    "base",
    "svg",
    "math",
}

ALLOWED_TAGS = sorted(
    set(bleach.sanitizer.ALLOWED_TAGS).union(
        {
            "p",
            "br",
            "hr",
            "div",
            "span",
            "pre",
            "code",
            "blockquote",
            "ul",
            "ol",
            "li",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "table",
            "thead",
            "tbody",
            "tfoot",
            "tr",
            "th",
            "td",
            "img",
        }
    )
)

ALLOWED_ATTRIBUTES = {
    "*": ["id", "class"],
    "a": ["href", "title", "target", "rel"],
    "img": ["src", "alt", "title", "width", "height", "loading"],
    "th": ["colspan", "rowspan", "scope"],
    "td": ["colspan", "rowspan"],
}

ALLOWED_PROTOCOLS = sorted(set(bleach.sanitizer.ALLOWED_PROTOCOLS).union({"mailto"}))

HTML_CLEANER = bleach.Cleaner(
    tags=ALLOWED_TAGS,
    attributes=ALLOWED_ATTRIBUTES,
    protocols=ALLOWED_PROTOCOLS,
    strip=True,
)


def sanitize_rendered_html(html):
    if not html:
        return ""

    soup = BeautifulSoup(html, "html.parser")

    for comment in soup.find_all(string=lambda value: isinstance(value, Comment)):
        comment.extract()

    for tag in soup.find_all(UNSAFE_CONTENT_TAGS):
        tag.decompose()

    cleaned_html = HTML_CLEANER.clean(str(soup))
    normalized = BeautifulSoup(cleaned_html, "html.parser")

    for link in normalized.find_all("a"):
        if link.get("target") == "_blank":
            rel_values = set(link.get("rel") or [])
            rel_values.update({"noopener", "noreferrer"})
            link["rel"] = sorted(rel_values)

    return str(normalized)


def sanitize_html_fields(data, *field_names):
    for field_name in field_names:
        field_value = data.get(field_name)
        if isinstance(field_value, str):
            data[field_name] = sanitize_rendered_html(field_value)
    return data
