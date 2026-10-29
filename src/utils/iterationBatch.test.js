import { beforeEach, describe, expect, it } from 'vitest';
import { allocateIterationNumbers, compareIterationNumbers, isBatchValid, iterationSeqOf, nextIterationNumber, nextPiNumber, validateIterationBatch, } from './programIncrement';
import { applyProgramIncrementSnapshot, readProgramIncrementSnapshot, resetProgramIncrementPersistenceCache } from './programIncrementPersistence';
import { useAppStore } from '../store/appStore';
import { programIncrements as seedPis, projects as seedProjects, sprints as seedSprints } from '../data/mockData';
const its = (piId, n, ...nums) => nums.map((num, i) => ({ id: `${piId}-s${i}`, piId, iterationNumber: `${n}.${num}`, status: 'PLANNED', startDate: '2020-01-01', endDate: '2020-01-02' }));
describe('PI and iteration numbering', () => {
    it('next PI number continues from the highest existing PI', () => {
        expect(nextPiNumber([])).toBe(1);
        expect(nextPiNumber([1, 2, 3, 4, 5, 6].map((number) => ({ number })))).toBe(7);
        expect(nextPiNumber([{ number: 7 }, { number: 2 }])).toBe(8);
        expect(nextPiNumber([{ number: undefined }, { number: 3 }])).toBe(4);
    });
    it('seed PI 4 (4.1–4.7) continues at 4.8; a batch of 3 is 4.8, 4.9, 4.10', () => {
        const pi4 = seedPis.find((p) => p.id === 'pi-004');
        expect(pi4.number).toBe(4);
        expect(nextIterationNumber(pi4, seedSprints)).toBe('4.8');
        expect(allocateIterationNumbers(pi4, seedSprints, 3)).toEqual(['4.8', '4.9', '4.10']);
        const through48 = [...seedSprints, { id: 'x', piId: 'pi-004', iterationNumber: '4.8' }];
        expect(nextIterationNumber(pi4, through48)).toBe('4.9');
    });
    it('each PI continues from its own highest number (PI 6 → 6.6, 6.9 → 6.10)', () => {
        const pi6 = { id: 'pi-6', number: 6 };
        expect(nextIterationNumber(pi6, [...its('pi-6', 6, 1, 2, 3, 4, 5), ...its('pi-7', 7, 1, 2, 3, 4, 5, 6, 7, 8)])).toBe('6.6');
        expect(nextIterationNumber(pi6, its('pi-6', 6, 1, 9))).toBe('6.10');
        expect(allocateIterationNumbers({ id: 'pi-7', number: 7 }, [], 2)).toEqual(['7.1', '7.2']);
    });
    it('treats 4.10 as greater than 4.9 (numeric, not lexicographic)', () => {
        expect(iterationSeqOf('4.10')).toBe(10);
        expect(compareIterationNumbers('4.10', '4.9')).toBeGreaterThan(0);
        expect(['4.10', '4.2', '4.9', '4.1'].sort(compareIterationNumbers)).toEqual(['4.1', '4.2', '4.9', '4.10']);
        expect(nextIterationNumber({ id: 'p', number: 4 }, its('p', 4, 9, 10))).toBe('4.11');
    });
    it('never produces "undefined" numbers', () => {
        expect(allocateIterationNumbers({ id: 'p', number: undefined }, [], 3)).toEqual([]);
        expect(allocateIterationNumbers({ id: 'p', number: 4 }, [], 0)).toEqual([]);
    });
});
describe('validateIterationBatch', () => {
    const pi = { id: 'pi-6', number: 6, name: 'PI 6', startDate: '2030-01-01', endDate: '2030-03-31' };
    const saved = [{ id: 's1', piId: 'pi-6', iterationNumber: '6.1', status: 'PLANNED', startDate: '2030-01-01', endDate: '2030-01-07' }];
    const entry = (iterationNumber, startDate, endDate, o = {}) => ({ iterationNumber, startDate, endDate, goal: 'Ship', status: 'PLANNED', ...o });
    it('accepts 7-, 10- and 14-day entries with gaps between them', () => {
        const r = validateIterationBatch({ pi, sprints: saved, entries: [
                entry('6.2', '2030-01-10', '2030-01-16'),
                entry('6.3', '2030-01-20', '2030-01-29'),
                entry('6.4', '2030-02-05', '2030-02-18'),
            ] });
        expect(isBatchValid(r)).toBe(true);
    });
    it('rejects an entry overlapping a saved iteration and names it', () => {
        const r = validateIterationBatch({ pi, sprints: saved, entries: [entry('6.2', '2030-01-05', '2030-01-12')] });
        expect(r.entryErrors[0].dates).toMatch(/Overlaps 6\.1 \(01 Jan 2030 – 07 Jan 2030\)/);
    });
    it('rejects entries overlapping each other inside the batch, on both entries', () => {
        const r = validateIterationBatch({ pi, sprints: saved, entries: [entry('6.2', '2030-01-10', '2030-01-20'), entry('6.3', '2030-01-20', '2030-01-25')] });
        expect(r.entryErrors[0].dates).toMatch(/Overlaps 6\.3/);
        expect(r.entryErrors[1].dates).toMatch(/Overlaps 6\.2/);
    });
    it('rejects dates outside the PI, missing dates, inverted ranges and missing goals', () => {
        const r = validateIterationBatch({ pi, sprints: saved, entries: [
                entry('6.2', '2030-03-25', '2030-04-02'),
                entry('6.3', '', ''),
                entry('6.4', '2030-02-10', '2030-02-09'),
                entry('6.5', '2030-02-20', '2030-02-21', { goal: '  ' }),
            ] });
        expect(r.entryErrors[0].dates).toMatch(/within PI 6/);
        expect(Object.keys(r.entryErrors[1])).toEqual(expect.arrayContaining(['startDate', 'endDate']));
        expect(r.entryErrors[2].endDate).toMatch(/not be before/);
        expect(r.entryErrors[3].goal).toMatch(/Goal is required/);
    });
    it('rejects duplicate numbers inside the batch and reused saved numbers', () => {
        const r = validateIterationBatch({ pi, sprints: saved, entries: [entry('6.2', '2030-02-01', '2030-02-05'), entry('6.2', '2030-02-10', '2030-02-15'), entry('6.1', '2030-03-01', '2030-03-05')] });
        expect(r.entryErrors[0].iterationNumber).toMatch(/used twice/);
        expect(r.entryErrors[1].iterationNumber).toMatch(/used twice/);
        expect(r.entryErrors[2].iterationNumber).toMatch(/already exists/);
    });
    it('refuses a completed PI for the whole batch', () => {
        const r = validateIterationBatch({ pi, sprints: [{ ...saved[0], status: 'COMPLETED' }], entries: [entry('6.2', '2030-02-01', '2030-02-05')] });
        expect(r.formError).toMatch(/completed/);
    });
    it('validates other PIs independently', () => {
        const otherPi = [{ id: 'o1', piId: 'pi-9', iterationNumber: '9.1', status: 'PLANNED', startDate: '2030-02-01', endDate: '2030-02-28' }];
        expect(isBatchValid(validateIterationBatch({ pi, sprints: [...saved, ...otherPi], entries: [entry('6.2', '2030-02-01', '2030-02-14')] }))).toBe(true);
    });
});
describe('store: createIterationsBatch', () => {
    const initialState = useAppStore.getState();
    const store = () => useAppStore.getState();
    const entry = (iterationNumber, startDate, endDate, o = {}) => ({ iterationNumber, startDate, endDate, goal: `Goal ${iterationNumber}`, status: 'PLANNED', ...o });
    beforeEach(() => {
        useAppStore.setState(initialState, true);
        globalThis.localStorage.clear();
        resetProgramIncrementPersistenceCache();
    });
    const newPi = () => store().createProgramIncrement({ requestId: 'pi-r', projectId: 'proj-001', number: nextPiNumber(store().pis.filter((p) => p.projectId === 'proj-001')), startDate: '2030-01-01', endDate: '2030-06-30', createdById: 'u-pm-01' });
    it('new PI for proj-001 is PI 6 (after seed PI 1–5) and has no iterations', () => {
        const pi = newPi();
        expect(pi.number).toBe(6);
        expect(store().sprints.filter((s) => s.piId === pi.id)).toHaveLength(0);
    });
    it('saves a valid batch atomically with unique PI-scoped numbers', () => {
        const pi = newPi();
        const before = store().sprints.length;
        const nums = allocateIterationNumbers(pi, store().sprints, 3);
        const created = store().createIterationsBatch({ requestId: 'b-1', projectId: 'proj-001', piId: pi.id, createdById: 'u-pm-01', entries: [
                entry(nums[0], '2030-01-01', '2030-01-07'),
                entry(nums[1], '2030-01-12', '2030-01-21'),
                entry(nums[2], '2030-02-01', '2030-02-14', { status: 'ACTIVE' }),
            ] });
        expect(created.map((s) => s.iterationNumber)).toEqual(['6.1', '6.2', '6.3']);
        expect(created.every((s) => s.piId === pi.id && s.projectId === 'proj-001')).toBe(true);
        expect(created.map((s) => s.status)).toEqual(['PLANNED', 'PLANNED', 'ACTIVE']);
        expect(store().sprints).toHaveLength(before + 3);
        // retrying the same submit does not create the batch twice
        expect(store().createIterationsBatch({ requestId: 'b-1', projectId: 'proj-001', piId: pi.id, entries: [] }).map((s) => s.id)).toEqual(created.map((s) => s.id));
        expect(store().sprints).toHaveLength(before + 3);
    });
    it('saves nothing when any entry of the batch is invalid', () => {
        const pi = newPi();
        const before = store().sprints;
        expect(() => store().createIterationsBatch({ projectId: 'proj-001', piId: pi.id, createdById: 'u-pm-01', entries: [
                entry('6.1', '2030-01-01', '2030-01-07'),
                entry('6.2', '2030-01-07', '2030-01-14'), // shares 07 Jan with 6.1
            ] })).toThrow(/Overlaps/);
        expect(store().sprints).toBe(before);
    });
    it('continues seed PI 4 at 4.8 and refuses completed seed PI 1', () => {
        const pi4 = store().pis.find((p) => p.id === 'pi-004');
        const [n] = allocateIterationNumbers(pi4, store().sprints, 1);
        const [s] = store().createIterationsBatch({ projectId: 'proj-001', piId: pi4.id, createdById: 'u-pm-01', entries: [entry(n, '2031-01-01', '2031-01-10')] });
        expect(s.iterationNumber).toBe('4.8');
        expect(() => store().createIterationsBatch({ projectId: 'proj-001', piId: 'pi-001', createdById: 'u-pm-01', entries: [entry('1.2', '2031-02-01', '2031-02-05')] })).toThrow(/completed/);
    });
    it('persists the batch for reload', () => {
        const pi = newPi();
        const created = store().createIterationsBatch({ projectId: 'proj-001', piId: pi.id, createdById: 'u-pm-01', entries: [entry('6.1', '2030-01-01', '2030-01-07'), entry('6.2', '2030-01-10', '2030-01-20')] });
        const merged = applyProgramIncrementSnapshot(seedPis, seedSprints, seedProjects, readProgramIncrementSnapshot());
        expect(created.every((c) => merged.sprints.some((s) => s.id === c.id && s.piId === pi.id))).toBe(true);
    });
});
