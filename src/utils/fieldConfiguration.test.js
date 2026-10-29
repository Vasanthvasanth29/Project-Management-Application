import { describe, expect, it } from 'vitest';
import { STANDARD_FIELD_DEFS, defaultStandardFieldsForType, getStandardFieldConfig, isStandardFieldKey, isStandardFieldShown, normalizeFieldConfig, standardFieldLabel, standardFieldSorter, } from './fieldConfiguration';
const projectWith = (standardFields) => ({ id: 'p1', fieldConfig: { standardFields } });
describe('STANDARD_FIELD_DEFS', () => {
    it('contains no duplicate keys and every key maps to a non-empty label', () => {
        const keys = STANDARD_FIELD_DEFS.map((d) => d.key);
        expect(new Set(keys).size).toBe(keys.length);
        STANDARD_FIELD_DEFS.forEach((d) => expect(d.label.trim()).not.toBe(''));
    });
});
describe('isStandardFieldKey / standardFieldLabel', () => {
    it('recognises every catalog key and falls back to the raw key for unknowns', () => {
        STANDARD_FIELD_DEFS.forEach((d) => {
            expect(isStandardFieldKey(d.key)).toBe(true);
            expect(standardFieldLabel(d.key)).toBe(d.label);
        });
        expect(isStandardFieldKey('client name')).toBe(false);
        expect(standardFieldLabel('not-a-key')).toBe('not-a-key');
    });
});
describe('defaultStandardFieldsForType', () => {
    it('returns every configurable field applicable to the type, in catalog order', () => {
        const taskDefaults = defaultStandardFieldsForType('TASK');
        expect(taskDefaults).toContain('description');
        expect(taskDefaults).toContain('priority');
        expect(taskDefaults).toContain('assignee');
        expect(taskDefaults).toContain('dueDate');
        expect(taskDefaults).toContain('parent');
        expect(taskDefaults).toContain('team');
        // catalog order preserved
        const catalogOrder = STANDARD_FIELD_DEFS.map((d) => d.key);
        const indices = taskDefaults.map((k) => catalogOrder.indexOf(k));
        expect(indices).toEqual([...indices].sort((a, b) => a - b));
    });
    it('excludes fields that do not apply to the type', () => {
        // startDate applies only to INITIATIVE
        expect(defaultStandardFieldsForType('TASK')).not.toContain('startDate');
        expect(defaultStandardFieldsForType('INITIATIVE')).toContain('startDate');
    });
    it('covers every work item type with at least the core-adjacent fields', () => {
        const types = [
            'INITIATIVE', 'FEATURE', 'EPIC', 'STORY', 'TASK', 'SUB-TASK', 'BUG_FIX', 'IMPROVEMENT',
        ];
        types.forEach((t) => {
            const keys = defaultStandardFieldsForType(t);
            expect(keys.length).toBeGreaterThan(0);
            expect(keys).toContain('description');
            expect(keys).toContain('priority');
        });
    });
});
describe('getStandardFieldConfig', () => {
    it('falls back to the safe defaults when the project has no config', () => {
        expect(getStandardFieldConfig(undefined, 'TASK')).toEqual(defaultStandardFieldsForType('TASK'));
        expect(getStandardFieldConfig({}, 'TASK')).toEqual(defaultStandardFieldsForType('TASK'));
        expect(getStandardFieldConfig({ fieldConfig: {} }, 'TASK')).toEqual(defaultStandardFieldsForType('TASK'));
    });
    it('returns the saved keys in order, dropping unknown keys and duplicates', () => {
        const p = projectWith({ TASK: ['dueDate', 'nope', 'priority', 'dueDate', 'assignee'] });
        expect(getStandardFieldConfig(p, 'TASK')).toEqual(['dueDate', 'priority', 'assignee']);
    });
    it('falls back to defaults when the saved list contains only unknown keys', () => {
        const p = projectWith({ TASK: ['bogus', 'also-bogus'] });
        expect(getStandardFieldConfig(p, 'TASK')).toEqual(defaultStandardFieldsForType('TASK'));
    });
    it('keeps projects isolated: one project config never leaks into another type', () => {
        const p = projectWith({ TASK: ['dueDate'] });
        expect(getStandardFieldConfig(p, 'TASK')).toEqual(['dueDate']);
        // STORY has no saved config → safe defaults, not TASK's list
        expect(getStandardFieldConfig(p, 'STORY')).toEqual(defaultStandardFieldsForType('STORY'));
    });
});
describe('isStandardFieldShown', () => {
    it('respects the saved config and the safe defaults', () => {
        const p = projectWith({ BUG_FIX: ['description'] });
        expect(isStandardFieldShown(p, 'BUG_FIX', 'description')).toBe(true);
        expect(isStandardFieldShown(p, 'BUG_FIX', 'priority')).toBe(false);
        // No config → everything applicable shows
        expect(isStandardFieldShown(undefined, 'BUG_FIX', 'priority')).toBe(true);
    });
});
describe('standardFieldSorter', () => {
    it('orders keys by their saved position, sending unknown keys to the end', () => {
        const p = projectWith({ TASK: ['dueDate', 'priority', 'assignee'] });
        const sort = standardFieldSorter(p, 'TASK');
        expect(['assignee', 'dueDate', 'unknown'].sort(sort)).toEqual(['dueDate', 'assignee', 'unknown']);
    });
});
describe('normalizeFieldConfig', () => {
    it('drops empty and unknown entries and de-duplicates', () => {
        const cfg = normalizeFieldConfig({
            TASK: ['dueDate', 'dueDate', 'bogus', 'priority'],
            STORY: [],
            EPIC: ['nope'],
        });
        expect(cfg.standardFields?.TASK).toEqual(['dueDate', 'priority']);
        expect(cfg.standardFields?.STORY).toBeUndefined();
        expect(cfg.standardFields?.EPIC).toBeUndefined();
    });
    it('produces a config that round-trips through getStandardFieldConfig', () => {
        const cfg = normalizeFieldConfig({ TASK: ['dueDate', 'assignee'] });
        const p = { fieldConfig: cfg };
        expect(getStandardFieldConfig(p, 'TASK')).toEqual(['dueDate', 'assignee']);
    });
});
