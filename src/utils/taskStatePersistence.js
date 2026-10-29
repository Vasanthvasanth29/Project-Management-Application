/**
 * localStorage bridge so work-item changes made through the Details page —
 * assignee, status (with its transition history) and comments — plus the
 * activity log survive a page refresh, exactly like the existing custom-field
 * and field-configuration bridges (the app store itself resets to seed data on
 * reload).
 *
 * Frontend-only persistence — no backend is involved. DOCUMENTED MULTI-USER
 * LIMITATION: this storage is per-browser, so only the browser that made a
 * change sees it after a refresh; another user/machine starts from seed data.
 * Task creation/deletion is not part of this snapshot either — only the
 * mutable state listed in `PersistedTaskState` is replayed onto the seed.
 */
const STORAGE_KEY = 'flowexec-task-state-v1';
/** Extract the persisted slice of one task (all tracked fields always present). */
const taskSlice = (task) => ({
    assigneeId: task.assigneeId ?? null,
    status: task.status,
    resolution: task.resolution ?? null,
    resolvedAt: task.resolvedAt ?? null,
    completedAt: task.completedAt ?? null,
    initiativePreviousStatus: task.initiativePreviousStatus ?? null,
    comments: task.comments ?? [],
    statusTransitions: task.statusTransitions ?? [],
    updatedAt: task.updatedAt ?? null,
});
/** Read the persisted snapshot, or null when absent/unreadable. */
export const readTaskStateSnapshot = () => {
    try {
        const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
        if (!raw)
            return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object')
            return null;
        return parsed;
    }
    catch {
        return null;
    }
};
/** Serialize every task's mutable slice + the activity log into JSON. */
export const serializeTaskStateSnapshot = (tasks, activities) => {
    const slices = {};
    tasks.forEach((task) => {
        slices[task.id] = taskSlice(task);
    });
    return JSON.stringify({ tasks: slices, activities });
};
/** Write the snapshot; silently no-ops when storage is unavailable. */
const writeSnapshot = (serialized) => {
    try {
        globalThis.localStorage?.setItem(STORAGE_KEY, serialized);
    }
    catch {
        /* quota exceeded / storage unavailable — state stays in-memory */
    }
};
let lastSerialized = null;
/**
 * Store hook: serialize the mutable task state + activity log and write to
 * localStorage, deduplicated so unchanged state never hits storage.
 */
export const persistTaskState = (tasks, activities) => {
    try {
        const next = serializeTaskStateSnapshot(tasks, activities);
        if (next === lastSerialized)
            return;
        lastSerialized = next;
        writeSnapshot(next);
    }
    catch {
        /* serialization failure — ignore */
    }
};
/**
 * Hydrate seed tasks (and the seed activity log) from a persisted snapshot.
 * Presence-checked field by field so a partial/older snapshot can never wipe
 * a value it does not carry (e.g. a pre-assignee snapshot must not unassign);
 * `null` stored for a nullable field explicitly means "cleared". Task ids the
 * seed no longer contains are ignored.
 */
export const applyTaskStateSnapshot = (seedTasks, snapshot) => {
    if (!snapshot || (!snapshot.tasks && !Array.isArray(snapshot.activities))) {
        return { tasks: seedTasks };
    }
    const slices = snapshot.tasks ?? {};
    const tasks = seedTasks.map((task) => {
        const state = slices[task.id];
        if (!state)
            return task;
        const next = { ...task };
        if ('assigneeId' in state)
            next.assigneeId = state.assigneeId ?? undefined;
        if (typeof state.status === 'string' && state.status)
            next.status = state.status;
        if ('resolution' in state)
            next.resolution = state.resolution ?? undefined;
        if ('resolvedAt' in state)
            next.resolvedAt = state.resolvedAt ?? undefined;
        if ('completedAt' in state)
            next.completedAt = state.completedAt ?? undefined;
        if ('initiativePreviousStatus' in state) {
            next.initiativePreviousStatus = state.initiativePreviousStatus ?? undefined;
        }
        if (Array.isArray(state.comments))
            next.comments = state.comments;
        if (Array.isArray(state.statusTransitions))
            next.statusTransitions = state.statusTransitions;
        if ('updatedAt' in state && state.updatedAt)
            next.updatedAt = state.updatedAt;
        return next;
    });
    return {
        tasks,
        activities: Array.isArray(snapshot.activities) ? snapshot.activities : undefined,
    };
};
