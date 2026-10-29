import { beforeEach, describe, expect, it } from 'vitest';
import { applyTaskStateSnapshot, persistTaskState, readTaskStateSnapshot, serializeTaskStateSnapshot, } from './taskStatePersistence';
const baseTask = (overrides) => ({
    id: 'task-001',
    projectId: 'proj-001',
    title: 'Seed task',
    description: 'seed description',
    type: 'TASK',
    status: 'TODO',
    priority: 'MEDIUM',
    createdById: 'u-pm-01',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    tags: [],
    comments: [],
    attachments: [],
    ...overrides,
});
const comment = (overrides) => ({
    id: 'c-1',
    userId: 'u-tl-01',
    content: 'hello',
    createdAt: '2026-01-01T00:00:00.000Z',
    attachments: [],
    ...overrides,
});
const activity = (overrides) => ({
    id: 'a-1',
    organizationId: 'org-001',
    userId: 'u-tl-01',
    action: 'updated status to In Progress',
    entityType: 'TASK',
    entityId: 'task-001',
    entityTitle: 'Seed task',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
});
beforeEach(() => {
    localStorage.clear();
});
describe('serializeTaskStateSnapshot / applyTaskStateSnapshot round trip', () => {
    it('restores assignee, status and comments onto the seed after a "refresh"', () => {
        const seed = [baseTask({})];
        const changed = [
            baseTask({
                assigneeId: 'u-tl-01',
                status: 'IN_PROGRESS',
                comments: [comment({ id: 'c-1', content: 'on it' })],
                updatedAt: '2026-01-02T00:00:00.000Z',
            }),
        ];
        const activities = [activity({})];
        const parsed = JSON.parse(serializeTaskStateSnapshot(changed, activities));
        const result = applyTaskStateSnapshot(seed, parsed);
        expect(result.tasks[0].assigneeId).toBe('u-tl-01');
        expect(result.tasks[0].status).toBe('IN_PROGRESS');
        expect(result.tasks[0].comments).toHaveLength(1);
        expect(result.tasks[0].comments[0].content).toBe('on it');
        // Untouched seed fields (title/description) stay from the seed.
        expect(result.tasks[0].title).toBe('Seed task');
        expect(result.activities).toHaveLength(1);
        expect(result.activities?.[0].action).toBe('updated status to In Progress');
    });
    it('keeps an explicit unassign (assigneeId null) instead of reverting to seed', () => {
        const seed = [baseTask({ assigneeId: 'u-tl-01' })];
        const snapshot = JSON.parse(serializeTaskStateSnapshot([baseTask({ assigneeId: undefined })], []));
        const result = applyTaskStateSnapshot(seed, snapshot);
        expect('assigneeId' in result.tasks[0]).toBe(true);
        expect(result.tasks[0].assigneeId).toBeUndefined();
    });
    it('restores pinned/edited comments exactly as stored', () => {
        const stored = [
            comment({ id: 'c-1', content: 'edited body', updatedAt: '2026-01-03T00:00:00.000Z', pinned: true }),
            comment({ id: 'c-2', content: 'second' }),
        ];
        const snapshot = JSON.parse(serializeTaskStateSnapshot([baseTask({ comments: stored })], []));
        const result = applyTaskStateSnapshot([baseTask({})], snapshot);
        expect(result.tasks[0].comments.map((c) => c.id)).toEqual(['c-1', 'c-2']);
        expect(result.tasks[0].comments[0].pinned).toBe(true);
        expect(result.tasks[0].comments[0].updatedAt).toBe('2026-01-03T00:00:00.000Z');
        expect(result.tasks[0].comments[0].content).toBe('edited body');
    });
    it('ignores snapshot entries for task ids the seed no longer has', () => {
        const snapshot = JSON.parse(serializeTaskStateSnapshot([baseTask({ id: 'deleted-task', status: 'DONE' })], []));
        const result = applyTaskStateSnapshot([baseTask({})], snapshot);
        expect(result.tasks).toHaveLength(1);
        expect(result.tasks[0].id).toBe('task-001');
        expect(result.tasks[0].status).toBe('TODO');
    });
    it('returns the seed untouched for a missing or empty snapshot', () => {
        const seed = [baseTask({ assigneeId: 'u-tl-01' })];
        expect(applyTaskStateSnapshot(seed, null).tasks).toBe(seed);
        expect(applyTaskStateSnapshot(seed, {}).tasks).toBe(seed);
        expect(applyTaskStateSnapshot(seed, {}).activities).toBeUndefined();
    });
    it('does not let a partial older snapshot wipe fields it never carried', () => {
        const seed = [baseTask({ assigneeId: 'u-tl-01', status: 'IN_PROGRESS' })];
        // A snapshot written before assignee/status were tracked: only comments.
        const result = applyTaskStateSnapshot(seed, {
            tasks: { 'task-001': { comments: [comment({})] } },
        });
        expect(result.tasks[0].assigneeId).toBe('u-tl-01');
        expect(result.tasks[0].status).toBe('IN_PROGRESS');
        expect(result.tasks[0].comments).toHaveLength(1);
    });
});
describe('readTaskStateSnapshot / persistTaskState', () => {
    it('persists to localStorage and reads back after a clear-state reload', () => {
        const changed = [baseTask({ assigneeId: 'u-tl-01', status: 'DONE', resolution: 'DONE' })];
        const activities = [activity({ action: 'assigned task' })];
        persistTaskState(changed, activities);
        const read = readTaskStateSnapshot();
        expect(read).not.toBeNull();
        expect(read.tasks['task-001'].assigneeId).toBe('u-tl-01');
        expect(read.tasks['task-001'].status).toBe('DONE');
        expect(read.activities).toHaveLength(1);
        const result = applyTaskStateSnapshot([baseTask({})], read);
        expect(result.tasks[0].status).toBe('DONE');
        expect(result.tasks[0].resolution).toBe('DONE');
    });
    it('returns null for missing or corrupt storage', () => {
        expect(readTaskStateSnapshot()).toBeNull();
        localStorage.setItem('flowexec-task-state-v1', 'not-json{{');
        expect(readTaskStateSnapshot()).toBeNull();
    });
    it('skips the storage write when nothing changed (dedup)', () => {
        const tasks = [baseTask({ assigneeId: 'u-tl-01' })];
        const activities = [activity({})];
        persistTaskState(tasks, activities);
        const first = localStorage.getItem('flowexec-task-state-v1');
        localStorage.setItem('flowexec-task-state-v1', 'sentinel');
        persistTaskState(tasks, activities);
        // Identical payload → no rewrite, sentinel survives.
        expect(localStorage.getItem('flowexec-task-state-v1')).toBe('sentinel');
        expect(first).not.toBe('sentinel');
        // A real change writes again.
        persistTaskState([baseTask({ assigneeId: 'u-admin-01' })], activities);
        expect(localStorage.getItem('flowexec-task-state-v1')).not.toBe('sentinel');
    });
});
