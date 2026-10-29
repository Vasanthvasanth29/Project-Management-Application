/**
 * Plain-text ⇄ HTML bridge for the Jira-style comment composer.
 *
 * The Comments thread edits comments in a plain `<textarea>` (Enter submits,
 * Shift+Enter inserts a newline), while `Comment.content` is HTML rendered by
 * `CommentContent`. These helpers convert between the two representations
 * without touching the DOM, so they work identically in the browser and in
 * node-environment tests.
 */
/** Escape text for safe inclusion in HTML, keeping newlines as characters. */
const escapeHtml = (text) => text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
/**
 * Convert composer plain text into comment HTML: HTML-escaped, with each
 * line break rendered as `<br />` so multi-line comments display correctly.
 */
export const commentTextToHtml = (text) => escapeHtml(text).replace(/\r\n?|\n/g, '<br />');
/** Decode the entities `commentTextToHtml` (and the rich-text editor) emit. */
const decodeEntities = (text) => text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&amp;/gi, '&');
/**
 * Recover editable plain text from stored comment HTML: line breaks become
 * newlines, tags are stripped (mention atoms keep their visible text), and
 * common entities are decoded. Used when opening a comment for editing.
 */
export const commentTextFromHtml = (html) => {
    if (!html)
        return '';
    const withBreaks = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
        .replace(/<li[^>]*>/gi, '• ');
    const withoutTags = withBreaks.replace(/<[^>]*>/g, '');
    return decodeEntities(withoutTags)
        .replace(/\u00a0/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
};
/**
 * True when a comment body carries no user-visible text (empty, whitespace,
 * or markup-only such as `<p></p>` / `<p><br></p>`). Used to disable submit
 * in the composer and as a store-side guard so blank comments can never be
 * written, however they are invoked.
 */
export const isBlankCommentHtml = (html) => commentTextFromHtml(html).trim().length === 0;
