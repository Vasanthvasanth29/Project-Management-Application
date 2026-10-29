import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from './appStore';
import { applyTaskStateSnapshot, readTaskStateSnapshot, } from '../utils/taskStatePersistence';
const initialState = useAppStore.getState();
const store = () => useAppStore.getState();
const task = (id = 'task-001') => store().tasks.find((t) => t.id === id);
beforeEach(() => {
    localStorage.clear();
    useAppStore.setState(initialState);
});
describe('addComment', () => {
    it('appends a comment to the right work item without dropping existing comments', () => {
        const before = task().comments.length;
        const ok = store().addComment('task-001', 'u-m-01', '<p>first real comment</p>');
        expect(ok).toBe(true);
        const after = task().comments;
        expect(after).toHaveLength(before + 1);
        const added = after[after.length - 1];
        expect(added.userId).toBe('u-m-01');
        expect(added.content).toBe('<p>first real comment</p>');
        expect(added.createdAt).toBeTruthy();
        expect(added.id).toBeTruthy();
    });
    it('keeps comments isolated per work item when several tasks are commented on', () => {
        store().addComment('task-001', 'u-m-01', '<p>for task one</p>');
        store().addComment('task-002', 'u-m-02', '<p>for task two</p>');
        const t1 = task('task-001').comments;
        const t2 = task('task-002').comments;
        expect(t1.some((c) => c.content === '<p>for task one</p>')).toBe(true);
        expect(t1.some((c) => c.content === '<p>for task two</p>')).toBe(false);
        expect(t2.some((c) => c.content === '<p>for task two</p>')).toBe(true);
        expect(t2.some((c) => c.content === '<p>for task one</p>')).toBe(false);
    });
    it('refuses blank comments however they are submitted', () => {
        const before = task().comments.length;
        expect(store().addComment('task-001', 'u-m-01', '')).toBe(false);
        expect(store().addComment('task-001', 'u-m-01', '   \n  ')).toBe(false);
        expect(store().addComment('task-001', 'u-m-01', '<p></p>')).toBe(false);
        expect(store().addComment('task-001', 'u-m-01', '<p><br></p>')).toBe(false);
        expect(task().comments).toHaveLength(before);
    });
});
describe('editComment', () => {
    it('lets the author edit their own comment and records updatedAt', () => {
        store().addComment('task-001', 'u-m-01', '<p>original</p>');
        const id = task().comments[task().comments.length - 1].id;
        const ok = store().editComment('task-001', id, '<p>revised text</p>', 'u-m-01');
        expect(ok).toBe(true);
        const edited = task().comments.find((c) => c.id === id);
        expect(edited.content).toBe('<p>revised text</p>');
        expect(edited.updatedAt).toBeTruthy();
        expect(edited.userId).toBe('u-m-01');
    });
    it('refuses edits from anyone but the author', () => {
        store().addComment('task-001', 'u-m-01', '<p>mine</p>');
        const id = task().comments[task().comments.length - 1].id;
        // Even an ADMIN cannot rewrite someone else's words.
        expect(store().editComment('task-001', id, '<p>hijacked</p>', 'u-admin-01')).toBe(false);
        expect(task().comments.find((c) => c.id === id).content).toBe('<p>mine</p>');
    });
    it('refuses blank edited content', () => {
        store().addComment('task-001', 'u-m-01', '<p>keep me</p>');
        const id = task().comments[task().comments.length - 1].id;
        expect(store().editComment('task-001', id, '   ', 'u-m-01')).toBe(false);
        expect(task().comments.find((c) => c.id === id).content).toBe('<p>keep me</p>');
    });
    it('returns false for unknown comments/work items', () => {
        expect(store().editComment('task-001', 'nope', '<p>x</p>', 'u-m-01')).toBe(false);
        expect(store().editComment('missing-task', 'nope', '<p>x</p>', 'u-m-01')).toBe(false);
    });
});
describe('deleteComment', () => {
    it('lets the author delete their own comment', () => {
        store().addComment('task-001', 'u-m-01', '<p>to delete</p>');
        const id = task().comments[task().comments.length - 1].id;
        expect(store().deleteComment('task-001', id, 'u-m-01')).toBe(true);
        expect(task().comments.some((c) => c.id === id)).toBe(false);
    });
    it('refuses deletion by non-authors (author-only, store-enforced)', () => {
        store().addComment('task-001', 'u-m-01', '<p>protected</p>');
        const id = task().comments[task().comments.length - 1].id;
        expect(store().deleteComment('task-001', id, 'u-pm-01')).toBe(false);
        expect(store().deleteComment('task-001', id, 'u-admin-01')).toBe(false);
        expect(task().comments.some((c) => c.id === id)).toBe(true);
    });
});
describe('toggleCommentPin', () => {
    it('lets the author pin and unpin their own comment', () => {
        store().addComment('task-001', 'u-m-01', '<p>pinnable</p>');
        const id = task().comments[task().comments.length - 1].id;
        expect(store().toggleCommentPin('task-001', id, 'u-m-01')).toBe(true);
        expect(task().comments.find((c) => c.id === id).pinned).toBe(true);
        expect(store().toggleCommentPin('task-001', id, 'u-m-01')).toBe(true);
        expect(task().comments.find((c) => c.id === id).pinned).toBe(false);
    });
    it('lets a moderator (PM) pin someone else’s comment, but not a plain member', () => {
        store().addComment('task-001', 'u-m-01', '<p>important</p>');
        const id = task().comments[task().comments.length - 1].id;
        expect(store().toggleCommentPin('task-001', id, 'u-m-02')).toBe(false);
        expect(task().comments.find((c) => c.id === id).pinned).toBeUndefined();
        expect(store().toggleCommentPin('task-001', id, 'u-pm-01')).toBe(true);
        expect(task().comments.find((c) => c.id === id).pinned).toBe(true);
    });
});
describe('assignee + status + comments survive a simulated refresh', () => {
    it('replays persisted state onto the seed through the localStorage bridge', () => {
        const seedTasks = store().tasks;
        // 1. Authorized user changes assignee and status, adds a comment.
        store().assignTask('task-001', 'u-m-02', 'u-pm-01');
        const statusRes = store().updateTaskStatus('task-001', 'IN_PROGRESS', 'u-pm-01');
        expect(statusRes.ok).toBe(true);
        store().addComment('task-001', 'u-m-01', '<p>after the change</p>');
        const edited = store().tasks.find((t) => t.id === 'task-001');
        // 2. The store subscription has written the snapshot to localStorage.
        const snapshot = readTaskStateSnapshot();
        expect(snapshot).not.toBeNull();
        expect(snapshot.tasks['task-001'].assigneeId).toBe('u-m-02');
        expect(snapshot.tasks['task-001'].status).toBe('IN_PROGRESS');
        // 3. Simulate a page refresh: apply the snapshot onto the untouched seed.
        const reloaded = applyTaskStateSnapshot(seedTasks, snapshot);
        const restored = reloaded.tasks.find((t) => t.id === 'task-001');
        expect(restored.assigneeId).toBe('u-m-02');
        expect(restored.status).toBe('IN_PROGRESS');
        expect(restored.comments).toEqual(edited.comments);
        expect(restored.comments.some((c) => c.content === '<p>after the change</p>')).toBe(true);
        // The activity the change generated is persisted too.
        expect(reloaded.activities?.some((a) => a.action === 'assigned task')).toBe(true);
    });
    it('an explicit unassign persists as unassigned after reload', () => {
        store().assignTask('task-001', 'u-m-02', 'u-pm-01');
        store().updateTask('task-001', { assigneeId: undefined }, 'u-pm-01');
        expect(store().tasks.find((t) => t.id === 'task-001').assigneeId).toBeUndefined();
        const reloaded = applyTaskStateSnapshot(store().tasks.map((t) => ({ ...t, assigneeId: 'u-m-09' })), readTaskStateSnapshot());
        expect(reloaded.tasks.find((t) => t.id === 'task-001').assigneeId).toBeUndefined();
    });
});
