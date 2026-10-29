import { beforeEach, describe, expect, it } from 'vitest';
import { applyProjectFieldConfigs, persistProjectFieldConfigs, primeProjectFieldConfigCache, readProjectFieldConfigs, } from './projectFieldConfigPersistence';
const STORAGE_KEY = 'flowexec-project-field-config-v1';
const config = (standardFields) => ({
    standardFields,
});
const project = (id, fieldConfig) => ({ id, name: id, fieldConfig });
beforeEach(() => {
    localStorage.clear();
    primeProjectFieldConfigCache();
});
describe('readProjectFieldConfigs', () => {
    it('returns an empty map when nothing is stored or the payload is unreadable', () => {
        expect(readProjectFieldConfigs()).toEqual({});
        localStorage.setItem(STORAGE_KEY, '{not json');
        expect(readProjectFieldConfigs()).toEqual({});
        localStorage.setItem(STORAGE_KEY, '[1,2,3]');
        expect(readProjectFieldConfigs()).toEqual({});
    });
    it('parses a stored per-project map, skipping malformed entries', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            'proj-1': config({ TASK: ['dueDate'] }),
            'proj-2': 'not-an-object',
            'proj-3': null,
        }));
        const map = readProjectFieldConfigs();
        expect(Object.keys(map)).toEqual(['proj-1']);
        expect(map['proj-1'].standardFields?.TASK).toEqual(['dueDate']);
    });
});
describe('applyProjectFieldConfigs', () => {
    it('overlays saved configs onto projects matched by id', () => {
        const projects = [project('proj-1'), project('proj-2')];
        const out = applyProjectFieldConfigs(projects, {
            'proj-1': config({ TASK: ['dueDate', 'assignee'] }),
        });
        expect(out[0].fieldConfig?.standardFields?.TASK).toEqual(['dueDate', 'assignee']);
        expect(out[1].fieldConfig).toBeUndefined();
    });
    it('does not mutate the input projects', () => {
        const projects = [project('proj-1')];
        applyProjectFieldConfigs(projects, { 'proj-1': config({ TASK: ['dueDate'] }) });
        expect(projects[0].fieldConfig).toBeUndefined();
    });
    it('leaves projects without a saved config untouched (safe defaults apply downstream)', () => {
        const projects = [project('proj-9', config({ TASK: ['priority'] }))];
        const out = applyProjectFieldConfigs(projects, {});
        expect(out[0].fieldConfig?.standardFields?.TASK).toEqual(['priority']);
    });
});
describe('persistProjectFieldConfigs', () => {
    it('stores only projects that carry a non-empty standard-field config, keyed by id', () => {
        persistProjectFieldConfigs([
            project('proj-1', config({ TASK: ['dueDate'] })),
            project('proj-2'),
            project('proj-3', config({})),
        ]);
        const map = readProjectFieldConfigs();
        expect(Object.keys(map)).toEqual(['proj-1']);
        expect(map['proj-1'].standardFields?.TASK).toEqual(['dueDate']);
    });
    it('removes a project entry when its config is cleared', () => {
        persistProjectFieldConfigs([project('proj-1', config({ TASK: ['dueDate'] }))]);
        expect(readProjectFieldConfigs()['proj-1']).toBeDefined();
        persistProjectFieldConfigs([project('proj-1', config({}))]);
        expect(readProjectFieldConfigs()['proj-1']).toBeUndefined();
    });
    it('round-trips through applyProjectFieldConfigs', () => {
        const projects = [
            project('proj-1', config({ TASK: ['dueDate', 'priority'], STORY: ['assignee'] })),
            project('proj-2'),
        ];
        persistProjectFieldConfigs(projects);
        primeProjectFieldConfigCache();
        const rehydrated = applyProjectFieldConfigs([project('proj-1'), project('proj-2')], readProjectFieldConfigs());
        expect(rehydrated[0].fieldConfig?.standardFields).toEqual({
            TASK: ['dueDate', 'priority'],
            STORY: ['assignee'],
        });
        expect(rehydrated[1].fieldConfig).toBeUndefined();
    });
});
