import { isOverdue } from './dateUtils';
import { isCancelledWorkItem } from './roleUtils';
import { resolveLinkedEpics } from './initiativeEpics';
const isCompletedWorkItem = (task) => !isCancelledWorkItem(task) && (task.status === 'DONE' || task.status === 'COMPLETED');
/**
 * Collects a linked Epic plus every descendant reachable through parentId
 * links inside the same project. Cycles (corrupt data) terminate safely.
 */
function collectEpicSubtree(epic, tasks) {
    const childrenByParent = new Map();
    for (const t of tasks) {
        if (t.projectId !== epic.projectId || !t.parentId)
            continue;
        const bucket = childrenByParent.get(t.parentId);
        if (bucket)
            bucket.push(t);
        else
            childrenByParent.set(t.parentId, [t]);
    }
    const collected = [epic];
    const seen = new Set([epic.id]);
    const queue = [epic.id];
    while (queue.length > 0) {
        const parentId = queue.shift();
        for (const child of childrenByParent.get(parentId) ?? []) {
            if (seen.has(child.id))
                continue;
            seen.add(child.id);
            collected.push(child);
            queue.push(child.id);
        }
    }
    return collected;
}
/** Computes an Initiative's progress from its linked Epics (see module doc). */
export function calculateInitiativeProgress(initiative, tasks) {
    const linkedEpics = resolveLinkedEpics(initiative, tasks);
    if (linkedEpics.length === 0) {
        return { total: 0, completed: 0, percent: null, hasLinkedWork: false };
    }
    const measured = new Map();
    for (const epic of linkedEpics) {
        for (const item of collectEpicSubtree(epic, tasks)) {
            measured.set(item.id, item);
        }
    }
    const items = [...measured.values()];
    const completed = items.filter(isCompletedWorkItem).length;
    const total = items.length;
    return {
        total,
        completed,
        percent: total > 0 ? Math.round((completed / total) * 100) : null,
        hasLinkedWork: total > 0,
    };
}
/**
 * True when the Initiative has a target (due) date that has passed and it is
 * not yet Completed — the same overdue convention the boards and date utils
 * use for work items.
 */
export const isInitiativeOverdue = (initiative) => initiative.status !== 'COMPLETED' && isOverdue(initiative.dueDate);
