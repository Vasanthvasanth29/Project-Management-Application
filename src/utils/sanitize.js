import DOMPurify from 'dompurify';
const ALLOWED_TAGS = [
    'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
    'ul', 'ol', 'li', 'a', 'span', 'mark', 'h1', 'h2', 'h3',
    'blockquote',
];
const ALLOWED_ATTRS = [
    'href', 'target', 'rel', 'style', 'class',
];
const ALLOWED_STYLES = {
    'color': [],
    'background-color': [],
};
export function sanitizeHtml(dirty) {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS,
        ALLOWED_ATTR: ALLOWED_ATTRS,
        ALLOW_DATA_ATTR: false,
    });
}
export function isEmptyHtml(html) {
    const stripped = html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();
    return stripped.length === 0;
}
