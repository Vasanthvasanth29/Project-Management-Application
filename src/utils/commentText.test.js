import { describe, expect, it } from 'vitest';
import { commentTextFromHtml, commentTextToHtml, isBlankCommentHtml, } from './commentText';
describe('commentTextToHtml', () => {
    it('escapes HTML so typed markup can never render as markup', () => {
        expect(commentTextToHtml('<script>alert("x")</script>')).toBe('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
        expect(commentTextToHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });
    it('renders each line break as <br />', () => {
        expect(commentTextToHtml('line one\nline two')).toBe('line one<br />line two');
        expect(commentTextToHtml('a\r\nb')).toBe('a<br />b');
        expect(commentTextToHtml('a\rb')).toBe('a<br />b');
    });
    it('keeps single-line text as-is', () => {
        expect(commentTextToHtml('just a note')).toBe('just a note');
    });
});
describe('commentTextFromHtml', () => {
    it('turns <br> and closing block tags back into newlines', () => {
        expect(commentTextFromHtml('line one<br />line two')).toBe('line one\nline two');
        expect(commentTextFromHtml('<p>para one</p><p>para two</p>')).toBe('para one\npara two');
    });
    it('strips tags but keeps visible text (mention atoms keep their name)', () => {
        expect(commentTextFromHtml('hi <span data-mention-id="u-1">@Priya Kumar</span> please review')).toBe('hi @Priya Kumar please review');
        expect(commentTextFromHtml('<strong>bold</strong> text')).toBe('bold text');
    });
    it('decodes the entities commentTextToHtml emits (round trip)', () => {
        const original = 'a < b & c > "d" \'e\'\nsecond line';
        expect(commentTextFromHtml(commentTextToHtml(original))).toBe(original);
    });
    it('returns an empty string for empty/undefined-like input', () => {
        expect(commentTextFromHtml('')).toBe('');
    });
});
describe('isBlankCommentHtml', () => {
    it('treats empty, whitespace-only and markup-only bodies as blank', () => {
        expect(isBlankCommentHtml('')).toBe(true);
        expect(isBlankCommentHtml('   \n\t  ')).toBe(true);
        expect(isBlankCommentHtml('<p></p>')).toBe(true);
        expect(isBlankCommentHtml('<p><br></p>')).toBe(true);
        expect(isBlankCommentHtml('<div>&nbsp;</div>')).toBe(true);
    });
    it('accepts any body with visible content', () => {
        expect(isBlankCommentHtml('<p>real comment</p>')).toBe(false);
        expect(isBlankCommentHtml('x')).toBe(false);
        expect(isBlankCommentHtml('<p> <b>hi</b> </p>')).toBe(false);
    });
});
