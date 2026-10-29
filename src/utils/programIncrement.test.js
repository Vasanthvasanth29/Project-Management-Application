import { beforeEach, describe, expect, it } from 'vitest';
import { PI_GENERATION_MODES, addIsoDays, generatePiIterations, validatePiDraft } from './programIncrement';
import { PROGRAM_INCREMENT_STORAGE_KEY, applyProgramIncrementSnapshot, persistProgramIncrements, readProgramIncrementSnapshot, resetProgramIncrementPersistenceCache, } from './programIncrementPersistence';
import { useAppStore } from '../store/appStore';
import { programIncrements as seedPis, projects as seedProjects, sprints as seedSprints } from '../data/mockData';
const { FILL, COUNT } = PI_GENERATION_MODES;
describe('addIsoDays', () => {
    it('crosses month and year boundaries', () => {
        expect(addIsoDays('2030-01-31', 1)).toBe('2030-02-01');
        expect(addIsoDays('2030-12-25', 13)).toBe('2031-01-07');
    });
});
describe('generatePiIterations', () => {
    it('generates back-to-back 14-day iterations numbered from the PI', () => {
        const { iterations } = generatePiIterations({
            piNumber: 6, startDate: '2030-01-07', endDate: '2030-03-03', durationDays: 14, mode: FILL,
        });
        expect(iterations.map((i) => [i.iterationNumber, i.startDate, i.endDate])).toEqual([
            ['6.1', '2030-01-07', '2030-01-20'],
            ['6.2', '2030-01-21', '2030-02-03'],
            ['6.3', '2030-02-04', '2030-02-17'],
            ['6.4', '2030-02-18', '2030-03-03'],
        ]);
        expect(iterations.every((i) => i.days === 14 && !i.isPartial)).toBe(true);
    });
    it('shortens the final iteration so nothing passes the PI end date', () => {
        // 10 weeks with 3-week iterations → 21 + 21 + 21 + 7
        const { iterations } = generatePiIterations({
            piNumber: 2, startDate: '2030-01-07', endDate: '2030-03-17', durationDays: 21, mode: FILL,
        });
        expect(iterations).toHaveLength(4);
        const last = iterations[3];
        expect(last).toMatchObject({ iterationNumber: '2.4', startDate: '2030-03-11', endDate: '2030-03-17', days: 7, isPartial: true });
        expect(iterations.slice(0, 3).every((i) => !i.isPartial)).toBe(true);
    });
    it('ends exactly on the PI end date when the last period has one day left', () => {
        const { iterations } = generatePiIterations({
            piNumber: 1, startDate: '2030-01-01', endDate: '2030-01-15', durationDays: 14, mode: FILL,
        });
        expect(iterations.map((i) => [i.startDate, i.endDate, i.days])).toEqual([
            ['2030-01-01', '2030-01-14', 14],
            ['2030-01-15', '2030-01-15', 1],
        ]);
    });
    it('COUNT mode stops at the requested number of iterations', () => {
        const { iterations, fitsCount } = generatePiIterations({
            piNumber: 3, startDate: '2030-01-01', endDate: '2030-12-31', durationDays: 14, mode: COUNT, count: 2,
        });
        expect(fitsCount).toBe(true);
        expect(iterations.map((i) => i.iterationNumber)).toEqual(['3.1', '3.2']);
    });
    it('COUNT mode reports when the requested iterations do not fit', () => {
        const { iterations, fitsCount } = generatePiIterations({
            piNumber: 3, startDate: '2030-01-01', endDate: '2030-01-28', durationDays: 14, mode: COUNT, count: 3,
        });
        expect(fitsCount).toBe(false);
        expect(iterations).toHaveLength(2);
    });
});
describe('validatePiDraft', () => {
    const base = {
        number: '7', goal: 'Ship it', startDate: '2030-01-07', endDate: '2030-03-03',
        durationDays: 14, mode: FILL, count: 4, projectPis: [], projectSprints: [],
    };
    it('accepts a valid draft', () => {
        const { errors, iterations } = validatePiDraft(base);
        expect(errors).toEqual({});
        expect(iterations).toHaveLength(4);
    });
    it('requires number, goal and dates', () => {
        const { errors } = validatePiDraft({ ...base, number: '', goal: '  ', startDate: '', endDate: '' });
        expect(Object.keys(errors).sort()).toEqual(['endDate', 'goal', 'number', 'startDate']);
    });
    it('rejects an end date on or before the start date', () => {
        expect(validatePiDraft({ ...base, endDate: '2030-01-07' }).errors.endDate).toMatch(/after the start/);
        expect(validatePiDraft({ ...base, endDate: '2029-12-01' }).errors.endDate).toMatch(/after the start/);
    });
    it('rejects non-positive PI numbers and durations', () => {
        expect(validatePiDraft({ ...base, number: '0' }).errors.number).toBeDefined();
        expect(validatePiDraft({ ...base, number: '2.5' }).errors.number).toBeDefined();
        expect(validatePiDraft({ ...base, durationDays: 0 }).errors.duration).toBeDefined();
    });
    it('rejects a PI number that already exists in the project', () => {
        const { errors } = validatePiDraft({ ...base, projectPis: [{ id: 'pi-x', number: 7 }] });
        expect(errors.number).toMatch(/already exists/);
    });
    it('rejects generated iterations that overlap existing ones', () => {
        const { errors } = validatePiDraft({
            ...base,
            projectSprints: [{ id: 's', iterationNumber: '6.4', startDate: '2030-01-01', endDate: '2030-01-10' }],
        });
        expect(errors.dates).toMatch(/overlaps existing iteration 6\.4/);
    });
    it('rejects a COUNT that does not fit in the PI', () => {
        const { errors } = validatePiDraft({ ...base, mode: COUNT, count: 9 });
        expect(errors.count).toMatch(/Only 4 iterations/);
    });
});
describe('createProgramIncrementWithIterations (store)', () => {
    const initialState = useAppStore.getState();
    const store = () => useAppStore.getState();
    const draft = (overrides = {}) => ({
        requestId: 'req-1', projectId: 'proj-001', number: 60, goal: 'Checkout v2',
        startDate: '2030-01-07', endDate: '2030-03-17', durationDays: 21, mode: FILL, createdById: 'u-pm-01',
        ...overrides,
    });
    beforeEach(() => {
        useAppStore.setState(initialState, true);
        globalThis.localStorage.clear();
        resetProgramIncrementPersistenceCache();
    });
    it('creates the PI and its PLANNED iterations linked to PI + project', () => {
        const before = store().sprints.length;
        const { pi, sprints, duplicate } = store().createProgramIncrementWithIterations(draft());
        expect(duplicate).toBe(false);
        expect(pi).toMatchObject({ projectId: 'proj-001', number: 60, name: 'PI 60', goal: 'Checkout v2', startDate: '2030-01-07', endDate: '2030-03-17' });
        expect(sprints.map((s) => s.iterationNumber)).toEqual(['60.1', '60.2', '60.3', '60.4']);
        expect(sprints.every((s) => s.piId === pi.id && s.projectId === 'proj-001' && s.status === 'PLANNED')).toBe(true);
        expect(store().sprints).toHaveLength(before + 4);
    });
    it('leaves existing iterations and work items untouched', () => {
        const sprintsBefore = store().sprints;
        const tasksBefore = store().tasks;
        store().createProgramIncrementWithIterations(draft());
        expect(store().sprints.slice(0, sprintsBefore.length)).toEqual(sprintsBefore);
        expect(store().tasks).toBe(tasksBefore);
    });
    it('is idempotent for a retried request id', () => {
        const first = store().createProgramIncrementWithIterations(draft());
        const count = store().sprints.length;
        const retry = store().createProgramIncrementWithIterations(draft());
        expect(retry.duplicate).toBe(true);
        expect(retry.pi.id).toBe(first.pi.id);
        expect(store().sprints).toHaveLength(count);
        expect(store().pis.filter((p) => p.number === 60 && p.projectId === 'proj-001')).toHaveLength(1);
    });
    it('rejects a duplicate PI number even with a new request id', () => {
        store().createProgramIncrementWithIterations(draft());
        expect(() => store().createProgramIncrementWithIterations(draft({ requestId: 'req-2', startDate: '2031-01-01', endDate: '2031-02-01' })))
            .toThrow(/PI 60 already exists/);
    });
    it('rejects overlap with seed iterations and creates nothing', () => {
        const pisBefore = store().pis.length;
        const sprintsBefore = store().sprints.length;
        expect(() => store().createProgramIncrementWithIterations(draft({ startDate: '2024-07-01', endDate: '2024-08-01' })))
            .toThrow(/overlaps existing iteration/);
        expect(store().pis).toHaveLength(pisBefore);
        expect(store().sprints).toHaveLength(sprintsBefore);
    });
    it('persists only user-created PIs and their iterations', () => {
        const { pi } = store().createProgramIncrementWithIterations(draft());
        const snapshot = readProgramIncrementSnapshot();
        expect(snapshot.pis.map((p) => p.id)).toEqual([pi.id]);
        expect(snapshot.sprints).toHaveLength(4);
        expect(snapshot.sprints.every((s) => s.piId === pi.id)).toBe(true);
    });
});
describe('programIncrementPersistence', () => {
    beforeEach(() => {
        globalThis.localStorage.clear();
        resetProgramIncrementPersistenceCache();
    });
    it('re-applies a stored PI and its iterations onto the seed', () => {
        const pi = { id: 'pi-new', projectId: 'proj-001', number: 70, name: 'PI 70' };
        const sprint = { id: 'spr-new', projectId: 'proj-001', piId: 'pi-new', iterationNumber: '70.1', startDate: '2030-01-01', endDate: '2030-01-14' };
        persistProgramIncrements([...seedPis, pi], [...seedSprints, sprint], new Set(seedPis.map((p) => p.id)));
        const merged = applyProgramIncrementSnapshot(seedPis, seedSprints, seedProjects);
        expect(merged.pis).toHaveLength(seedPis.length + 1);
        expect(merged.sprints.at(-1)).toEqual(sprint);
    });
    it('prunes records for unknown projects and seed collisions', () => {
        const snapshot = {
            pis: [
                { id: 'pi-ghost', projectId: 'proj-missing', number: 1 },
                { id: 'pi-clash', projectId: 'proj-001', number: 1 },
            ],
            sprints: [{ id: 'spr-ghost', piId: 'pi-ghost' }],
        };
        const merged = applyProgramIncrementSnapshot(seedPis, seedSprints, seedProjects, snapshot);
        expect(merged.pis).toBe(seedPis);
        expect(merged.sprints).toBe(seedSprints);
    });
    it('ignores corrupt storage', () => {
        globalThis.localStorage.setItem(PROGRAM_INCREMENT_STORAGE_KEY, '{not json');
        expect(readProgramIncrementSnapshot()).toEqual({ pis: [], sprints: [] });
    });
});
