import { describe, expect, it } from 'vitest';
import { STANDARD_FIELD_DEFS, defaultStandardFieldsForType, } from './fieldConfiguration';
import { applyExistingFieldSelection, buildExistingFieldCandidates, draftStandardKeys, filterExistingCandidates, findDuplicateCustomFieldName, isAlreadyAdded, isReservedFieldName, normalizeFieldName, validateCustomFieldName, } from './existingFields';
const WORK_TYPES = ['EPIC', 'STORY', 'TASK', 'BUG_FIX', 'SUB-TASK'];
const customField = (overrides) => ({
    projectId: 'p1',
    label: undefined,
    type: 'text',
    required: false,
    enabled: true,
    applicableIssueTypes: ['TASK'],
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
});
const draftWith = (standardFields, customFields = []) => ({ standardFields, customFields });
describe('normalizeFieldName', () => {
    it('trims whitespace and lowercases for identity comparison', () => {
        expect(normalizeFieldName('  Client Name ')).toBe('client name');
        expect(normalizeFieldName('CLIENT NAME')).toBe('client name');
    });
});
describe('draftStandardKeys', () => {
    it('falls back to the safe defaults when a type has no saved list', () => {
        expect(draftStandardKeys(draftWith({}), 'TASK')).toEqual(defaultStandardFieldsForType('TASK'));
        expect(draftStandardKeys(draftWith({ TASK: ['dueDate'] }), 'TASK')).toEqual(['dueDate']);
    });
});
describe('field-name validation (Add Custom Field)', () => {
    const draft = draftWith({}, [customField({ id: 'cf-1', name: 'Client Name' })]);
    it('requires a name', () => {
        expect(validateCustomFieldName('', draft)).toMatch(/required/i);
        expect(validateCustomFieldName('   ', draft)).toMatch(/required/i);
    });
    it('rejects reserved built-in system field names', () => {
        expect(isReservedFieldName('Status')).toBe(true);
        expect(isReservedFieldName('  due date ')).toBe(true);
        expect(isReservedFieldName('Target Release')).toBe(true);
        expect(isReservedFieldName('Affected Releases')).toBe(true);
        expect(isReservedFieldName('Modules')).toBe(true);
        expect(isReservedFieldName('Tags')).toBe(true);
        expect(isReservedFieldName('Reporter')).toBe(true);
        expect(isReservedFieldName('Priority')).toBe(true);
        expect(isReservedFieldName('Description')).toBe(true);
        expect(validateCustomFieldName('Parent Link', draft)).toMatch(/standard field/i);
    });
    it('every registry field label is reserved so it can never be shadowed', () => {
        STANDARD_FIELD_DEFS.forEach((def) => expect(isReservedFieldName(def.label)).toBe(true));
    });
    it('rejects case-insensitive duplicates after trimming', () => {
        expect(validateCustomFieldName('client name', draft)).toMatch(/already exists/i);
        expect(validateCustomFieldName('  CLIENT NAME  ', draft)).toMatch(/already exists/i);
        expect(findDuplicateCustomFieldName(' Client Name ', draft)?.id).toBe('cf-1');
    });
    it('allows editing a field without clashing with itself', () => {
        expect(validateCustomFieldName('Client Name', draft, 'cf-1')).toBeNull();
        expect(findDuplicateCustomFieldName('Client Name', draft, 'cf-1')).toBeUndefined();
    });
    it('allows genuinely new names', () => {
        expect(validateCustomFieldName('Customer Segment', draft)).toBeNull();
    });
});
describe('buildExistingFieldCandidates', () => {
    it('lists system registry fields with enabled/eligible state per work type', () => {
        // Explicit per-type configs: TASK already shows dueDate; STORY opted out.
        const draft = draftWith({ TASK: ['dueDate'], STORY: ['description'] });
        const candidates = buildExistingFieldCandidates(draft, WORK_TYPES);
        const dueDate = candidates.find((c) => c.id === 'std:dueDate');
        expect(dueDate).toBeDefined();
        expect(dueDate.kind).toBe('system');
        expect(dueDate.typeLabel).toBe('System');
        expect(dueDate.enabledTypes).toContain('TASK');
        expect(dueDate.eligibleTypes).toContain('STORY');
        expect(dueDate.eligibleTypes).not.toContain('TASK');
    });
    it('marks a field already added for every supported type as Already Added', () => {
        // description applies to every type: enable it everywhere it is supported
        const all = Object.fromEntries(WORK_TYPES.map((t) => [t, defaultStandardFieldsForType(t)]));
        const candidates = buildExistingFieldCandidates(draftWith(all), WORK_TYPES);
        const description = candidates.find((c) => c.id === 'std:description');
        expect(description).toBeDefined();
        expect(isAlreadyAdded(description)).toBe(true);
    });
    it('keeps a field selectable for a type it is not enabled on yet (Task → Story)', () => {
        // STORY has an explicit config without priority yet; types without a saved
        // config fall back to the defaults, which already include priority.
        const draft = draftWith({
            TASK: defaultStandardFieldsForType('TASK'),
            STORY: ['description', 'assignee'],
        });
        const candidates = buildExistingFieldCandidates(draft, ['TASK', 'STORY']);
        const priority = candidates.find((c) => c.id === 'std:priority');
        // Enabled for TASK, still eligible for STORY — selection allowed.
        expect(priority.enabledTypes).toEqual(['TASK']);
        expect(priority.eligibleTypes).toEqual(['STORY']);
        expect(isAlreadyAdded(priority)).toBe(false);
    });
    it('reports this project’s custom fields with their applicability', () => {
        const draft = draftWith({}, [
            customField({ id: 'cf-1', name: 'Client Name', applicableIssueTypes: ['TASK'] }),
        ]);
        const candidates = buildExistingFieldCandidates(draft, WORK_TYPES);
        const cf = candidates.find((c) => c.id === 'cf:cf-1');
        expect(cf.kind).toBe('project');
        expect(cf.enabledTypes).toEqual(['TASK']);
        expect(cf.eligibleTypes).toEqual(['EPIC', 'STORY', 'BUG_FIX', 'SUB-TASK']);
    });
    it('treats an empty applicability list as enabled for every type (never re-offered)', () => {
        const draft = draftWith({}, [
            customField({ id: 'cf-1', name: 'Department', applicableIssueTypes: [] }),
        ]);
        const candidates = buildExistingFieldCandidates(draft, WORK_TYPES);
        const cf = candidates.find((c) => c.id === 'cf:cf-1');
        expect(isAlreadyAdded(cf)).toBe(true);
    });
    it('never emits two candidates with the same normalized name', () => {
        const draft = draftWith({ TASK: ['dueDate'] }, [
            customField({ id: 'cf-1', name: 'Client Name', applicableIssueTypes: ['TASK'] }),
        ]);
        const external = [
            customField({ id: 'ext-1', name: 'client name', projectId: 'p2', applicableIssueTypes: ['EPIC'] }),
            customField({ id: 'ext-2', name: 'Client Name', projectId: 'p3', applicableIssueTypes: [] }),
            customField({ id: 'ext-3', name: 'Budget Owner', projectId: 'p2' }),
        ];
        const candidates = buildExistingFieldCandidates(draft, WORK_TYPES, {
            definitions: external,
            projectNames: { p2: 'Project Two', p3: 'Project Three' },
        });
        const normalized = candidates.map((c) => normalizeFieldName(c.name));
        expect(new Set(normalized).size).toBe(normalized.length);
        // The project's own Client Name wins; externals with the same name are dropped.
        expect(candidates.filter((c) => normalizeFieldName(c.name) === 'client name')).toHaveLength(1);
        expect(candidates.find((c) => c.name === 'Budget Owner')?.source).toBe('Project Two');
    });
});
describe('filterExistingCandidates', () => {
    const candidates = buildExistingFieldCandidates(draftWith({}, [
        customField({ id: 'cf-1', name: 'Client Name', type: 'text' }),
    ]), WORK_TYPES);
    it('matches name, type and source case-insensitively and passes everything for a blank query', () => {
        expect(filterExistingCandidates(candidates, '')).toHaveLength(candidates.length);
        expect(filterExistingCandidates(candidates, 'client').map((c) => c.name)).toContain('Client Name');
        expect(filterExistingCandidates(candidates, 'system').every((c) => c.kind === 'system')).toBe(true);
        expect(filterExistingCandidates(candidates, 'zzz-nothing')).toHaveLength(0);
    });
});
describe('applyExistingFieldSelection', () => {
    it('enables a system field for the chosen type without duplicating the key', () => {
        const draft = draftWith({ TASK: ['priority', 'assignee'], STORY: ['description'] });
        const candidates = buildExistingFieldCandidates(draft, ['TASK', 'STORY']);
        const next = applyExistingFieldSelection(draft, candidates, [{ candidateId: 'std:dueDate', types: ['TASK', 'STORY'] }], ['TASK', 'STORY']);
        expect(next.standardFields.TASK).toEqual(['priority', 'assignee', 'dueDate']);
        expect(next.standardFields.STORY).toEqual(['description', 'dueDate']);
        // Applying again changes nothing (already-added types are ineligible).
        const candidates2 = buildExistingFieldCandidates(next, ['TASK', 'STORY']);
        const again = applyExistingFieldSelection(next, candidates2, [{ candidateId: 'std:dueDate', types: ['TASK', 'STORY'] }], ['TASK', 'STORY']);
        expect(again.standardFields.TASK).toEqual(['priority', 'assignee', 'dueDate']);
        expect(again.standardFields.STORY).toEqual(['description', 'dueDate']);
        expect(new Set(again.standardFields.TASK).size).toBe(again.standardFields.TASK.length);
    });
    it('ignores types the field is already enabled on (never added twice)', () => {
        const draft = draftWith({ TASK: ['priority'], STORY: ['priority'] });
        const candidates = buildExistingFieldCandidates(draft, ['TASK', 'STORY']);
        const next = applyExistingFieldSelection(draft, candidates, [{ candidateId: 'std:priority', types: ['TASK', 'STORY'] }], ['TASK', 'STORY']);
        expect(next.standardFields.TASK).toEqual(['priority']);
        expect(next.standardFields.STORY).toEqual(['priority']);
    });
    it('widens an existing custom definition’s applicability instead of creating a duplicate', () => {
        const field = customField({ id: 'cf-1', name: 'Client Name', applicableIssueTypes: ['TASK'] });
        const draft = draftWith({}, [field]);
        const candidates = buildExistingFieldCandidates(draft, WORK_TYPES);
        const next = applyExistingFieldSelection(draft, candidates, [{ candidateId: 'cf:cf-1', types: ['STORY'] }], WORK_TYPES);
        expect(next.customFields).toHaveLength(1);
        expect(next.customFields[0].id).toBe('cf-1');
        expect(next.customFields[0].applicableIssueTypes?.sort()).toEqual(['STORY', 'TASK']);
    });
    it('copies an external definition exactly once and reuses it for later picks', () => {
        const draft = draftWith({}, []);
        const external = [
            customField({ id: 'ext-1', name: 'Budget Owner', projectId: 'p2', applicableIssueTypes: [] }),
        ];
        const candidates = buildExistingFieldCandidates(draft, WORK_TYPES, { definitions: external });
        const next = applyExistingFieldSelection(draft, candidates, [{ candidateId: 'ext:ext-1', types: ['TASK'] }], WORK_TYPES);
        expect(next.customFields).toHaveLength(1);
        expect(next.customFields[0].name).toBe('Budget Owner');
        expect(next.customFields[0].applicableIssueTypes).toEqual(['TASK']);
        expect(next.customFields[0].id.startsWith('cf-draft-')).toBe(true);
        // The copy is now a project field: picking it again for STORY widens the
        // same definition instead of adding a second row, and an external with the
        // same normalized name is filtered out of the picker entirely.
        const candidates2 = buildExistingFieldCandidates(next, WORK_TYPES, {
            definitions: [customField({ id: 'ext-9', name: 'budget owner', projectId: 'p3' })],
        });
        expect(candidates2.filter((c) => normalizeFieldName(c.name) === 'budget owner')).toHaveLength(1);
        const again = applyExistingFieldSelection(next, candidates2, [{ candidateId: `cf:${next.customFields[0].id}`, types: ['STORY'] }], WORK_TYPES);
        expect(again.customFields).toHaveLength(1);
        expect(again.customFields[0].applicableIssueTypes?.sort()).toEqual(['STORY', 'TASK']);
    });
    it('keeps type configurations independent (Epic/Story/Task/Bug)', () => {
        // EPIC has an explicit config without priority (defaults would already
        // include it and make the pick a no-op).
        const draft = draftWith({ EPIC: ['description'], TASK: ['dueDate'] });
        const candidates = buildExistingFieldCandidates(draft, ['EPIC', 'STORY', 'TASK', 'BUG_FIX']);
        const next = applyExistingFieldSelection(draft, candidates, [{ candidateId: 'std:priority', types: ['EPIC'] }], ['EPIC', 'STORY', 'TASK', 'BUG_FIX']);
        expect(next.standardFields.EPIC).toEqual(['description', 'priority']);
        expect(next.standardFields.TASK).toEqual(['dueDate']);
        expect(next.standardFields.STORY).toBeUndefined();
        expect(next.standardFields.BUG_FIX).toBeUndefined();
    });
});
