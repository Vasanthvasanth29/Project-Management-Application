import { beforeEach, describe, expect, it } from 'vitest';
import { canCreateIterationInPi, isIsoDate, nextIterationNumber, piStatusOf, validateIterationDraft, validatePiForm } from './programIncrement';
import { applyProgramIncrementSnapshot, readProgramIncrementSnapshot, resetProgramIncrementPersistenceCache } from './programIncrementPersistence';
import { useAppStore } from '../store/appStore';
import { programIncrements as seedPis, projects as seedProjects, sprints as seedSprints } from '../data/mockData';
// ---------------------------------------------------------------------------
// Create Program Increment + Create Iteration (manual, flexible dates)
// ---------------------------------------------------------------------------
describe('validatePiForm', () => {
    const ok = { number: '7', startDate: '2030-01-01', endDate: '2030-03-31', projectPis: [] };
    it('accepts a valid PI, including a single-day range (end = start)', () => {
        expect(validatePiForm(ok)).toEqual({});
        expect(validatePiForm({ ...ok, endDate: '2030-01-01' })).toEqual({});
    });
    it('requires number and both dates', () => {
        expect(Object.keys(validatePiForm({ ...ok, number: '', startDate: '', endDate: '' })).sort()).toEqual(['endDate', 'number', 'startDate']);
    });
    it('rejects end before start, impossible dates and a duplicate number', () => {
        expect(validatePiForm({ ...ok, endDate: '2029-12-31' }).endDate).toMatch(/on or after/);
        expect(validatePiForm({ ...ok, startDate: '2030-02-31' }).startDate).toMatch(/valid/);
        expect(validatePiForm({ ...ok, projectPis: [{ number: 7 }] }).number).toMatch(/PI 7 already exists/);
    });
});
describe('PI status', () => {
    const pi = { id: 'pi-a', number: 9, name: 'PI 9' };
    it('is PLANNED with no iterations, otherwise derived from its own iterations', () => {
        expect(piStatusOf(pi, [])).toBe('PLANNED');
        expect(piStatusOf(pi, [{ piId: 'pi-a', status: 'COMPLETED' }, { piId: 'pi-a', status: 'ACTIVE' }])).toBe('ACTIVE');
        expect(piStatusOf(pi, [{ piId: 'pi-a', status: 'COMPLETED' }, { piId: 'pi-a', status: 'PLANNED' }])).toBe('PLANNED');
        expect(piStatusOf(pi, [{ piId: 'pi-a', status: 'COMPLETED' }, { piId: 'pi-other', status: 'ACTIVE' }])).toBe('COMPLETED');
    });
    it('only ACTIVE and PLANNED PIs accept new iterations', () => {
        expect(canCreateIterationInPi(pi, [])).toBe(true);
        expect(canCreateIterationInPi(pi, [{ piId: 'pi-a', status: 'ACTIVE' }])).toBe(true);
        expect(canCreateIterationInPi(pi, [{ piId: 'pi-a', status: 'COMPLETED' }])).toBe(false);
    });
});
describe('validateIterationDraft', () => {
    const pi = { id: 'pi-6', number: 6, name: 'PI 6', startDate: '2030-01-01', endDate: '2030-03-31' };
    const it61 = { id: 's1', piId: 'pi-6', iterationNumber: '6.1', status: 'PLANNED', startDate: '2030-01-01', endDate: '2030-01-14' };
    const draft = (o) => validateIterationDraft({ pi, sprints: [it61], iterationNumber: '6.2', ...o });
    it.each([[7, '2030-01-21'], [10, '2030-01-24'], [14, '2030-01-28'], [21, '2030-02-04']])('accepts a %i-day iteration', (_days, end) => {
        expect(draft({ startDate: '2030-01-15', endDate: end })).toEqual({});
    });
    it('accepts a gap between iterations (no full PI coverage required)', () => {
        expect(draft({ startDate: '2030-02-10', endDate: '2030-02-19' })).toEqual({});
    });
    it('rejects overlap, including a shared boundary day, and names the conflicting range', () => {
        expect(draft({ startDate: '2030-01-10', endDate: '2030-01-20' }).dates).toMatch(/Overlaps 6\.1 \(01 Jan 2030 – 14 Jan 2030\)/);
        expect(draft({ startDate: '2030-01-14', endDate: '2030-01-20' }).dates).toMatch(/Overlaps 6\.1/);
    });
    it('rejects dates outside the PI range', () => {
        expect(draft({ startDate: '2029-12-30', endDate: '2030-01-05' }).dates).toMatch(/within PI 6/);
        expect(draft({ startDate: '2030-03-25', endDate: '2030-04-02' }).dates).toMatch(/within PI 6/);
    });
    it('requires dates and rejects end before start', () => {
        expect(Object.keys(draft({ startDate: '', endDate: '' })).sort()).toEqual(['endDate', 'startDate']);
        expect(draft({ startDate: '2030-01-20', endDate: '2030-01-19' }).endDate).toMatch(/not be before/);
    });
    it('validates PIs independently: another PI on the same dates is not a conflict', () => {
        const other = { id: 's9', piId: 'pi-7', iterationNumber: '7.1', status: 'PLANNED', startDate: '2030-01-15', endDate: '2030-01-28' };
        expect(validateIterationDraft({ pi, sprints: [it61, other], iterationNumber: '6.2', startDate: '2030-01-15', endDate: '2030-01-28' })).toEqual({});
    });
    it('rejects a completed PI, a reused number and numbers outside the PI scheme', () => {
        const done = [{ ...it61, status: 'COMPLETED' }];
        expect(validateIterationDraft({ pi, sprints: done, iterationNumber: '6.2', startDate: '2030-02-01', endDate: '2030-02-07' }).piId).toMatch(/completed/);
        expect(draft({ iterationNumber: '6.1', startDate: '2030-02-01', endDate: '2030-02-07' }).iterationNumber).toMatch(/already exists/);
        expect(draft({ iterationNumber: 'undefined.1', startDate: '2030-02-01', endDate: '2030-02-07' }).iterationNumber).toMatch(/numbering/);
        expect(draft({ iterationNumber: '5.2', startDate: '2030-02-01', endDate: '2030-02-07' }).iterationNumber).toMatch(/numbering/);
    });
});
describe('nextIterationNumber', () => {
    it('never yields "undefined" and never reuses a number (archived included)', () => {
        expect(nextIterationNumber({ id: 'x', number: undefined }, [])).toBe('');
        expect(nextIterationNumber({ id: 'x', number: 6 }, [])).toBe('6.1');
        expect(nextIterationNumber({ id: 'x', number: 6 }, [{ piId: 'x', iterationNumber: '6.1' }, { piId: 'x', iterationNumber: '6.2', isArchived: true }])).toBe('6.3');
    });
    it('isIsoDate rejects impossible dates', () => {
        expect(isIsoDate('2030-02-28')).toBe(true);
        expect(isIsoDate('2030-02-30')).toBe(false);
    });
});
describe('store: createProgramIncrement + createSprint', () => {
    const initialState = useAppStore.getState();
    const store = () => useAppStore.getState();
    const piDraft = (o = {}) => ({ requestId: 'r-1', projectId: 'proj-001', number: 61, title: 'Checkout Revamp', description: 'Rebuild checkout', startDate: '2030-01-01', endDate: '2030-03-31', createdById: 'u-pm-01', ...o });
    const iteration = (pi, o = {}) => ({ projectId: 'proj-001', piId: pi.id, iterationNumber: nextIterationNumber(pi, store().sprints), name: '', goal: '', status: 'PLANNED', taskIds: [], createdById: 'u-pm-01', ...o });
    beforeEach(() => {
        useAppStore.setState(initialState, true);
        globalThis.localStorage.clear();
        resetProgramIncrementPersistenceCache();
    });
    it('creates the PI only (no iterations) with its optional name and description', () => {
        const before = store().sprints.length;
        const pi = store().createProgramIncrement(piDraft());
        expect(pi).toMatchObject({ number: 61, name: 'PI 61', title: 'Checkout Revamp', description: 'Rebuild checkout', startDate: '2030-01-01', endDate: '2030-03-31' });
        expect(store().sprints).toHaveLength(before);
        expect(piStatusOf(pi, store().sprints)).toBe('PLANNED');
    });
    it('is idempotent per request id and rejects a duplicate number', () => {
        const a = store().createProgramIncrement(piDraft());
        expect(store().createProgramIncrement(piDraft()).id).toBe(a.id);
        expect(() => store().createProgramIncrement(piDraft({ requestId: 'r-2' }))).toThrow(/PI 61 already exists/);
        expect(store().pis.filter((p) => p.number === 61 && p.projectId === 'proj-001')).toHaveLength(1);
    });
    it('rejects missing dates and an inverted range', () => {
        expect(() => store().createProgramIncrement(piDraft({ requestId: 'r-3', startDate: '' }))).toThrow(/Start date is required/);
        expect(() => store().createProgramIncrement(piDraft({ requestId: 'r-4', endDate: '2029-01-01' }))).toThrow(/on or after/);
    });
    it('accepts user-chosen 7/10/14-day iterations with gaps, numbered 61.1, 61.2, 61.3', () => {
        const pi = store().createProgramIncrement(piDraft());
        const a = store().createSprint(iteration(pi, { startDate: '2030-01-01', endDate: '2030-01-07' }));
        const b = store().createSprint(iteration(pi, { startDate: '2030-01-15', endDate: '2030-01-24' }));
        const c = store().createSprint(iteration(pi, { startDate: '2030-02-01', endDate: '2030-02-14' }));
        expect([a, b, c].map((s) => [s.iterationNumber, s.startDate, s.endDate])).toEqual([
            ['61.1', '2030-01-01', '2030-01-07'], ['61.2', '2030-01-15', '2030-01-24'], ['61.3', '2030-02-01', '2030-02-14'],
        ]);
        expect([a, b, c].every((s) => s.piId === pi.id && s.projectId === 'proj-001' && !/undefined/.test(s.iterationNumber))).toBe(true);
    });
    it('numbers by creation order and never renumbers when created out of date order', () => {
        const pi = store().createProgramIncrement(piDraft());
        const late = store().createSprint(iteration(pi, { startDate: '2030-03-01', endDate: '2030-03-10' }));
        const early = store().createSprint(iteration(pi, { startDate: '2030-01-01', endDate: '2030-01-10' }));
        expect([late.iterationNumber, early.iterationNumber]).toEqual(['61.1', '61.2']);
        expect(store().sprints.find((s) => s.id === late.id)).toMatchObject({ startDate: '2030-03-01', endDate: '2030-03-10' });
    });
    it('rejects overlap, out-of-range and missing dates without touching existing iterations', () => {
        const pi = store().createProgramIncrement(piDraft());
        const first = store().createSprint(iteration(pi, { startDate: '2030-01-01', endDate: '2030-01-14' }));
        const snapshot = store().sprints;
        expect(() => store().createSprint(iteration(pi, { startDate: '2030-01-14', endDate: '2030-01-20' }))).toThrow(/Overlaps 61\.1/);
        expect(() => store().createSprint(iteration(pi, { startDate: '2030-03-25', endDate: '2030-04-05' }))).toThrow(/within PI 61/);
        expect(() => store().createSprint(iteration(pi, { startDate: '', endDate: '' }))).toThrow(/Start date is required/);
        expect(store().sprints).toBe(snapshot);
        expect(store().sprints.find((s) => s.id === first.id)).toMatchObject({ startDate: '2030-01-01', endDate: '2030-01-14' });
    });
    it('validates PIs independently and refuses completed PIs', () => {
        const pi61 = store().createProgramIncrement(piDraft());
        const pi62 = store().createProgramIncrement(piDraft({ requestId: 'r-62', number: 62 }));
        store().createSprint(iteration(pi61, { startDate: '2030-01-01', endDate: '2030-01-14' }));
        expect(() => store().createSprint(iteration(pi62, { startDate: '2030-01-01', endDate: '2030-01-14' }))).not.toThrow();
        // Seed PI 1 of proj-001 only holds iteration 1.1, which is COMPLETED.
        const completed = store().pis.find((p) => p.projectId === 'proj-001' && p.number === 1);
        expect(piStatusOf(completed, store().sprints)).toBe('COMPLETED');
        expect(() => store().createSprint(iteration(completed, { startDate: '2031-01-01', endDate: '2031-01-07' }))).toThrow(/completed/);
    });
    it('persists new PIs and iterations, including iterations added to a seed PI', () => {
        const pi = store().createProgramIncrement(piDraft());
        store().createSprint(iteration(pi, { startDate: '2030-01-01', endDate: '2030-01-07' }));
        const seedPi5 = store().pis.find((p) => p.id === 'pi-010');
        const added = store().createSprint(iteration(seedPi5, { startDate: '2031-06-01', endDate: '2031-06-10' }));
        const snap = readProgramIncrementSnapshot();
        expect(snap.pis.map((p) => p.id)).toEqual([pi.id]);
        expect(snap.sprints.map((s) => s.id)).toContain(added.id);
        const merged = applyProgramIncrementSnapshot(seedPis, seedSprints, seedProjects, snap);
        expect(merged.sprints.find((s) => s.id === added.id)).toMatchObject({ piId: 'pi-010', iterationNumber: added.iterationNumber });
        expect(merged.pis.find((p) => p.id === pi.id)).toMatchObject({ title: 'Checkout Revamp' });
    });
});
