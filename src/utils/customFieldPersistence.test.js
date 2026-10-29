import { describe, expect, it } from 'vitest';
import { applyCustomFieldSnapshot, dedupeCustomFieldDefinitions, readCustomFieldSnapshot, serializeCustomFieldSnapshot, } from './customFieldPersistence';
import { isUnwantedCustomFieldName } from '../data/customFields';
const definition = (id, extra = {}) => ({
    id,
    projectId: 'p1',
    name: id,
    type: 'text',
    enabled: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...extra,
});
const task = (id, customFieldValues) => ({ id, customFieldValues });
describe('serializeCustomFieldSnapshot', () => {
    it('round-trips definitions and per-issue values through JSON', () => {
        const defs = [definition('cf-1', { required: true, order: 2, applicableIssueTypes: ['STORY'] })];
        const tasks = [task('t1', { 'cf-1': 'Acme' })];
        const serialized = serializeCustomFieldSnapshot(defs, tasks);
        expect(JSON.parse(serialized)).toEqual({
            definitions: defs,
            taskValues: { t1: { 'cf-1': 'Acme' } },
        });
    });
    it('omits tasks without custom field values', () => {
        const serialized = serializeCustomFieldSnapshot([definition('cf-1')], [task('t1')]);
        expect(JSON.parse(serialized).taskValues).toEqual({});
    });
});
describe('readCustomFieldSnapshot', () => {
    it('returns null when nothing is stored or the payload is unreadable', () => {
        localStorage.clear();
        expect(readCustomFieldSnapshot()).toBeNull();
        localStorage.setItem('flowexec-custom-fields-v1', '{not json');
        expect(readCustomFieldSnapshot()).toBeNull();
    });
    it('parses a stored snapshot', () => {
        localStorage.setItem('flowexec-custom-fields-v1', JSON.stringify({ definitions: [definition('cf-1')], taskValues: { t1: { 'cf-1': 5 } } }));
        const snap = readCustomFieldSnapshot();
        expect(snap?.definitions?.[0].id).toBe('cf-1');
        expect(snap?.taskValues?.t1['cf-1']).toBe(5);
        localStorage.clear();
    });
});
describe('applyCustomFieldSnapshot', () => {
    it('keeps seed data when no snapshot exists', () => {
        const seeds = [definition('seed-1')];
        const tasks = [task('t1')];
        const result = applyCustomFieldSnapshot(seeds, tasks, null);
        expect(result.definitions).toBe(seeds);
        expect(result.tasks).toBe(tasks);
    });
    it('replaces seed definitions with the persisted set (empty array is valid)', () => {
        const seeds = [definition('seed-1')];
        const result = applyCustomFieldSnapshot(seeds, [task('t1')], { definitions: [] });
        expect(result.definitions).toEqual([]);
    });
    it('layers persisted per-issue values over base tasks', () => {
        const tasks = [task('t1'), task('t2')];
        const result = applyCustomFieldSnapshot([], tasks, {
            definitions: [definition('cf-1')],
            taskValues: { t2: { 'cf-1': 'from-storage' } },
        });
        expect(result.tasks.find((t) => t.id === 't2')?.customFieldValues).toEqual({ 'cf-1': 'from-storage' });
        expect(result.tasks.find((t) => t.id === 't1')?.customFieldValues).toBeUndefined();
    });
    it('drops legacy seed definitions and their injected values', () => {
        const tasks = [task('t1')];
        const result = applyCustomFieldSnapshot([], tasks, {
            definitions: [definition('cf-seed-client-name')],
            taskValues: { t1: { 'cf-seed-client-name': 'Legacy' } },
        });
        expect(result.definitions).toEqual([]);
        expect(result.tasks[0].customFieldValues).toBeUndefined();
    });
});
describe('isUnwantedCustomFieldName', () => {
    it('flags Client Name variants and dept case-insensitively', () => {
        expect(isUnwantedCustomFieldName('Client Name')).toBe(true);
        expect(isUnwantedCustomFieldName('client name')).toBe(true);
        expect(isUnwantedCustomFieldName('CLIENT NAME')).toBe(true);
        expect(isUnwantedCustomFieldName('client_name')).toBe(true);
        expect(isUnwantedCustomFieldName('client-name')).toBe(true);
        expect(isUnwantedCustomFieldName('Clientname')).toBe(true);
        expect(isUnwantedCustomFieldName('dept')).toBe(true);
        expect(isUnwantedCustomFieldName(' Dept ')).toBe(true);
    });
    it('keeps legitimate custom field names', () => {
        expect(isUnwantedCustomFieldName('Business Unit')).toBe(false);
        expect(isUnwantedCustomFieldName('Client Reference')).toBe(false);
        expect(isUnwantedCustomFieldName('Department Code')).toBe(false);
        expect(isUnwantedCustomFieldName('Owner')).toBe(false);
    });
});
describe('applyCustomFieldSnapshot — unwanted field purge', () => {
    it('removes duplicate Client Name and dept definitions on hydration', () => {
        const defs = [
            definition('cf-a', { name: 'Client Name', label: 'Client Name' }),
            definition('cf-b', { name: 'client name', label: 'client name' }),
            definition('cf-c', { name: 'dept', label: 'dept' }),
            definition('cf-keep', { name: 'Business Unit', label: 'Business Unit' }),
        ];
        const result = applyCustomFieldSnapshot([], [task('t1')], { definitions: defs });
        expect(result.definitions.map((d) => d.id)).toEqual(['cf-keep']);
    });
    it('strips stored values keyed to purged definitions', () => {
        const defs = [
            definition('cf-client', { name: 'Client Name' }),
            definition('cf-dept', { name: 'dept' }),
            definition('cf-ok', { name: 'Sponsor' }),
        ];
        const tasks = [task('t1')];
        const result = applyCustomFieldSnapshot([], tasks, {
            definitions: defs,
            taskValues: { t1: { 'cf-client': 'Acme', 'cf-dept': 'IT', 'cf-ok': 'Jane' } },
        });
        expect(result.definitions.map((d) => d.id)).toEqual(['cf-ok']);
        expect(result.tasks[0].customFieldValues).toEqual({ 'cf-ok': 'Jane' });
    });
    it('purges unwanted fields regardless of work item type (project-wide scoping)', () => {
        // The definitions carry no type restriction — under project/type display
        // they would appear on Task, Story and Epic alike. Purging at hydration
        // removes them for every type at once.
        const defs = [definition('cf-client', { name: 'Client Name', applicableIssueTypes: [] })];
        const result = applyCustomFieldSnapshot([], [task('t1')], { definitions: defs });
        expect(result.definitions).toEqual([]);
    });
});
describe('dedupeCustomFieldDefinitions', () => {
    it('keeps only the first occurrence of an exact id duplicate', () => {
        const defs = [
            definition('cf-1', { name: 'Sponsor', order: 0 }),
            definition('cf-1', { name: 'Sponsor Renamed', order: 5 }),
        ];
        const out = dedupeCustomFieldDefinitions(defs);
        expect(out).toHaveLength(1);
        expect(out[0].name).toBe('Sponsor');
    });
    it('collapses same-project same-name definitions, preferring the lower order', () => {
        const defs = [
            definition('cf-a', { name: 'Client Segment', label: 'Client Segment', order: 3 }),
            definition('cf-b', { name: 'client segment', label: 'client segment', order: 1 }),
            definition('cf-c', { name: 'Client Segment', label: 'Client Segment', order: 2 }),
        ];
        const out = dedupeCustomFieldDefinitions(defs);
        expect(out).toHaveLength(1);
        expect(out[0].id).toBe('cf-b'); // order 1 wins
    });
    it('treats a different type-applicability as a distinct field', () => {
        const defs = [
            definition('cf-a', { name: 'Segment', applicableIssueTypes: ['TASK'] }),
            definition('cf-b', { name: 'Segment', applicableIssueTypes: ['STORY'] }),
        ];
        expect(dedupeCustomFieldDefinitions(defs)).toHaveLength(2);
    });
    it('treats the same name in different projects as distinct fields', () => {
        const defs = [
            definition('cf-a', { projectId: 'p1', name: 'Segment' }),
            definition('cf-b', { projectId: 'p2', name: 'Segment' }),
        ];
        expect(dedupeCustomFieldDefinitions(defs)).toHaveLength(2);
    });
    it('preserves the original relative order of survivors', () => {
        const defs = [
            definition('cf-z', { name: 'Zeta', order: 9 }),
            definition('cf-dup1', { name: 'Alpha', order: 0 }),
            definition('cf-dup2', { name: 'Alpha', order: 1 }),
            definition('cf-y', { name: 'Yotta', order: 4 }),
        ];
        const out = dedupeCustomFieldDefinitions(defs);
        expect(out.map((d) => d.id)).toEqual(['cf-z', 'cf-dup1', 'cf-y']);
    });
});
describe('applyCustomFieldSnapshot — duplicate healing', () => {
    it('collapses duplicate name entries on hydration even when ids differ', () => {
        const defs = [
            definition('cf-1', { name: 'Client Segment', label: 'Client Segment', order: 2 }),
            definition('cf-2', { name: 'client segment', label: 'client segment', order: 0 }),
        ];
        const result = applyCustomFieldSnapshot([], [task('t1')], { definitions: defs });
        expect(result.definitions).toHaveLength(1);
        expect(result.definitions[0].id).toBe('cf-2');
    });
});
