import { useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { sortProjectSprints } from '../utils/sprintIssues';
import { groupSprintsByPi } from '../utils/programIncrement';
import { formatSprintDateRange } from '../utils/sprintIdentifier';
const planStatusOf = (s) => s.status === 'ACTIVE' ? 'ACTIVE' : s.status === 'PLANNED' ? 'PLANNED' : 'COMPLETED';
/**
 * Build the hierarchical PI → Sprint plan for one project from the raw
 * store arrays. Reuses the app's standard ranking (ACTIVE → PLANNED →
 * COMPLETED) and PI grouping; archived sprints are excluded. PI status is
 * derived: owns an ACTIVE sprint → ACTIVE, else owns a PLANNED sprint →
 * PLANNED, else COMPLETED. PI dates derive from its sprints' min/max dates.
 */
export const buildPiPlan = (pis, sprints, projectId) => {
    const projectSprints = sortProjectSprints(sprints, projectId).filter((s) => !s.isArchived);
    const groups = groupSprintsByPi(projectSprints, pis, projectId);
    return groups.map((group) => {
        const planSprints = group.sprints.map((s) => ({
            id: s.id,
            name: s.name,
            // Display convention from the Iteration Overview: "4.2 [13 OCT - 26 OCT]".
            displayName: `${s.iterationNumber || s.name} [${formatSprintDateRange(s)}]`,
            startDate: s.startDate,
            endDate: s.endDate,
            status: planStatusOf(s),
            piId: s.piId,
        }));
        // A PI with no iterations yet is PLANNED (it was previously reported as
        // COMPLETED, which would block adding its first iteration).
        const status = group.sprints.length === 0
            ? 'PLANNED'
            : group.sprints.some((s) => s.status === 'ACTIVE')
                ? 'ACTIVE'
                : group.sprints.some((s) => s.status === 'PLANNED')
                    ? 'PLANNED'
                    : 'COMPLETED';
        const starts = group.sprints.map((s) => s.startDate).filter(Boolean).sort();
        const ends = group.sprints.map((s) => s.endDate).filter(Boolean).sort();
        return {
            id: group.piId || group.key,
            name: group.label,
            number: group.number,
            status,
            startDate: starts[0] || '',
            endDate: ends[ends.length - 1] || '',
            sprints: planSprints,
        };
    });
};
/**
 * Split a plan into the Overview's ACTIVE / PLANNED / COMPLETED sections by
 * each sprint's OWN status — never the PI's derived status. A PI can hold a
 * mix (e.g. PI 4 with completed 4.1–4.2, active 4.3, planned 4.4–4.7) and
 * every sprint lands in the section matching its status while staying grouped
 * under its original PI. Completed PIs are ordered ascending by number so the
 * history reads chronologically.
 */
export const splitPiPlanSections = (plan) => {
    const bySprintStatus = (status) => plan
        .map((pi) => ({
        ...pi,
        sprints: pi.sprints.filter((s) => s.status === status),
    }))
        .filter((pi) => pi.sprints.length > 0);
    const completed = bySprintStatus('COMPLETED').sort((a, b) => (a.number ?? Number.MAX_SAFE_INTEGER) - (b.number ?? Number.MAX_SAFE_INTEGER));
    return {
        active: bySprintStatus('ACTIVE'),
        planned: bySprintStatus('PLANNED'),
        completed,
    };
};
/**
 * Reactive hook form of {@link buildPiPlan}, reading `pis` and `sprints`
 * from the app store — the one API all UI consumers use.
 */
export const usePiPlan = (projectId) => {
    const pis = useAppStore((s) => s.pis);
    const sprints = useAppStore((s) => s.sprints);
    return useMemo(() => buildPiPlan(pis, sprints, projectId), [pis, sprints, projectId]);
};
/**
 * Default sprint selection for the Move Work Item flow, derived from the
 * project's own data (never hardcoded):
 *   1. the item's own sprint when it belongs to the same project and is
 *      not archived — e.g. an item in 4.1 keeps 4.1 selected, so moving
 *      without edits is a no-op, never a silent move;
 *   2. 'BACKLOG' (Work Queue) when the item has no sprint — the WORK QUEUE
 *      group is the first entry in the Move dropdown, so this default always
 *      resolves to a visible option.
 */
export const resolveDefaultSprintId = (sprints, projectId, ownSprintId) => {
    const own = ownSprintId ? sprints.find((s) => s.id === ownSprintId) : undefined;
    if (own && own.projectId === projectId && !own.isArchived)
        return own.id;
    return 'BACKLOG';
};
