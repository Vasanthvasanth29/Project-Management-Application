import { describe, expect, it } from 'vitest';
import { customFieldValueForDraft, effectiveCustomFieldValue, fieldLabel, getIssueCustomFields, isStandardFieldName, validateCustomFieldValues, } from './customFields';
const field = (partial) => ({
    projectId: 'p1',
    name: partial.name ?? partial.id,
    type: 'text',
    enabled: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...partial,
});
const task = (partial = {}) => ({ projectId: 'p1', type: 'TASK', ...partial });
describe('getIssueCustomFields', () => {
    it('scopes fields to the task project', () => {
        const defs = [
            field({ id: 'a', projectId: 'p1' }),
            field({ id: 'b', projectId: 'p2' }),
        ];
        const result = getIssueCustomFields(defs, task());
        expect(result.map((f) => f.id)).toEqual(['a']);
    });
    it('shows fields with no applicableIssueTypes on every type', () => {
        const defs = [field({ id: 'all-types', applicableIssueTypes: [] })];
        expect(getIssueCustomFields(defs, task({ type: 'BUG_FIX' }))).toHaveLength(1);
        expect(getIssueCustomFields(defs, task({ type: 'EPIC' }))).toHaveLength(1);
    });
    it('restricts fields to their configured work item types', () => {
        const defs = [
            field({ id: 'story-only', applicableIssueTypes: ['STORY'] }),
            field({ id: 'bug-only', applicableIssueTypes: ['BUG_FIX'] }),
        ];
        expect(getIssueCustomFields(defs, task({ type: 'STORY' })).map((f) => f.id)).toEqual(['story-only']);
        expect(getIssueCustomFields(defs, task({ type: 'BUG_FIX' })).map((f) => f.id)).toEqual(['bug-only']);
        expect(getIssueCustomFields(defs, task({ type: 'TASK' }))).toHaveLength(0);
    });
    it('includes disabled fields here — the caller filters by enabled-or-has-value', () => {
        const defs = [field({ id: 'off', enabled: false })];
        expect(getIssueCustomFields(defs, task())).toHaveLength(1);
    });
    it('no longer requires a stored value key (project/type scoping)', () => {
        const defs = [field({ id: 'never-touched' })];
        const bareTask = { projectId: 'p1', type: 'TASK' };
        expect(getIssueCustomFields(defs, bareTask)).toHaveLength(1);
    });
    it('sorts by configured order ascending, unordered last, stable on ties', () => {
        const defs = [
            field({ id: 'c', order: 3 }),
            field({ id: 'a', order: 1 }),
            field({ id: 'z-unordered' }),
            field({ id: 'b', order: 2 }),
        ];
        expect(getIssueCustomFields(defs, task()).map((f) => f.id)).toEqual(['a', 'b', 'c', 'z-unordered']);
    });
});
describe('isStandardFieldName', () => {
    it('flags standard work item field labels case-insensitively', () => {
        expect(isStandardFieldName('Priority')).toBe(true);
        expect(isStandardFieldName('  status ')).toBe(true);
        expect(isStandardFieldName('Assignee')).toBe(true);
        expect(isStandardFieldName('Parent Link')).toBe(true);
        expect(isStandardFieldName('Due Date')).toBe(true);
    });
    it('allows custom names that do not collide', () => {
        expect(isStandardFieldName('Client Name')).toBe(false);
        expect(isStandardFieldName('Business Unit')).toBe(false);
        expect(isStandardFieldName('Priority Level')).toBe(false);
    });
});
describe('validateCustomFieldValues', () => {
    it('rejects an empty required field', () => {
        const defs = [field({ id: 'req', name: 'Client', required: true })];
        expect(validateCustomFieldValues(defs, { req: '' })).toEqual(['Client is required.']);
    });
    it('accepts a filled required field', () => {
        const defs = [field({ id: 'req', name: 'Client', required: true })];
        expect(validateCustomFieldValues(defs, { req: 'Acme' })).toEqual([]);
    });
    it('skips disabled fields even when required and empty', () => {
        const defs = [field({ id: 'req', name: 'Client', required: true, enabled: false })];
        expect(validateCustomFieldValues(defs, { req: '' })).toEqual([]);
    });
    it('validates numeric, email and url shapes', () => {
        const defs = [
            field({ id: 'n', name: 'Score', type: 'number' }),
            field({ id: 'e', name: 'Contact', type: 'email' }),
            field({ id: 'u', name: 'Link', type: 'url' }),
        ];
        expect(validateCustomFieldValues(defs, { n: 'abc' })).toEqual(['Score must be a number.']);
        expect(validateCustomFieldValues(defs, { e: 'nope' })).toEqual(['Contact must be a valid email address.']);
        expect(validateCustomFieldValues(defs, { u: 'not a url' })).toEqual(['Link must be a valid URL.']);
        expect(validateCustomFieldValues(defs, { n: '42', e: 'a@b.com', u: 'https://x.dev' })).toEqual([]);
    });
});
describe('effectiveCustomFieldValue', () => {
    it('prefers a stored value over the default', () => {
        const f = field({ id: 'cf', defaultValue: 'from-default' });
        expect(effectiveCustomFieldValue(f, { cf: 'stored' })).toBe('stored');
    });
    it('falls back to the configured default when the key is absent', () => {
        const f = field({ id: 'cf', defaultValue: 'from-default' });
        expect(effectiveCustomFieldValue(f, {})).toBe('from-default');
    });
    it('keeps a user-cleared value cleared instead of snapping back to default', () => {
        const f = field({ id: 'cf', defaultValue: 'from-default' });
        expect(effectiveCustomFieldValue(f, { cf: '' })).toBe('');
    });
});
describe('customFieldValueForDraft', () => {
    it('returns the configured default when present', () => {
        const f = field({ id: 'cf', type: 'text', defaultValue: 'seed' });
        expect(customFieldValueForDraft(f)).toBe('seed');
    });
    it('uses type-appropriate empty drafts', () => {
        expect(customFieldValueForDraft(field({ id: 'ms', type: 'multi_select' }))).toEqual([]);
        expect(customFieldValueForDraft(field({ id: 'cb', type: 'checkbox' }))).toBe(false);
        expect(customFieldValueForDraft(field({ id: 'tx', type: 'text' }))).toBe('');
    });
    it('multi_select always drafts to an empty list even with a default', () => {
        const f = field({ id: 'ms', type: 'multi_select', defaultValue: ['a'] });
        expect(customFieldValueForDraft(f)).toEqual([]);
    });
});
describe('fieldLabel', () => {
    it('prefers the label and falls back to the machine name', () => {
        expect(fieldLabel(field({ id: 'cf', name: 'client_name', label: 'Client Name' }))).toBe('Client Name');
        expect(fieldLabel(field({ id: 'cf', name: 'client_name' }))).toBe('client_name');
    });
});
