/**
 * Workflow editor — display-only helpers.
 *
 * `classifyTransition` decides how a transition is drawn, using only configured
 * data (never screen position or stage names):
 *   - complete: it leads to the Done node;
 *   - failure:  it leads to a stage whose saved type is BUG_FIX;
 *   - rework:   it leads back to a stage earlier in the saved stage order;
 *   - normal:   anything else.
 *
 * `computePreviewPath` walks the configured transitions from START to build a
 * local, visual-only preview. Nothing here changes stages, transitions, tasks
 * or the store.
 */
export const TRANSITION_KINDS = ['complete', 'failure', 'rework', 'normal'];
export const classifyTransition = (transition, stageById) => {
    if (transition.toStageId === 'DONE')
        return 'complete';
    const to = stageById.get(transition.toStageId);
    if (to?.type === 'BUG_FIX')
        return 'failure';
    const from = stageById.get(transition.fromStageId);
    if (from && to && typeof from.order === 'number' && typeof to.order === 'number' && to.order < from.order)
        return 'rework';
    return 'normal';
};
export const stageMapOf = (stages) => new Map(stages.map((s) => [s.id, s]));
/** Whether the workflow has a failure transition, i.e. a rework preview is meaningful. */
export const hasFailurePath = (stages, transitions) => {
    const byId = stageMapOf(stages);
    return transitions.some((t) => classifyTransition(t, byId) === 'failure');
};
const targetOrder = (t, byId) => (t.toStageId === 'DONE' ? Infinity : byId.get(t.toStageId)?.order ?? Infinity);
/**
 * Preview route through the configured transitions.
 *
 * `main`:   prefer finishing at Done, otherwise the next forward stage.
 * `rework`: at the first stage with a failure transition, take it; then take
 *           the rework transition back; then continue as `main`.
 *
 * Each transition is used at most twice, and the walk stops at Done, at a
 * stage with nowhere to go, or after `maxSteps`.
 *
 * Returns `{ steps: [{ nodeId, viaTransitionId }], end: 'done' | 'dead-end' | 'limit' }`.
 */
export const computePreviewPath = (stages, transitions, mode = 'main', maxSteps = 30) => {
    const byId = stageMapOf(stages);
    const used = new Map();
    const steps = [{ nodeId: 'START', viaTransitionId: null }];
    let current = 'START';
    let phase = mode === 'rework' ? 'seek-failure' : 'main';
    while (steps.length < maxSteps) {
        if (current === 'DONE')
            return { steps, end: 'done' };
        const options = transitions
            .filter((t) => t.fromStageId === current && (used.get(t.id) || 0) < 2)
            .map((t) => ({ t, kind: classifyTransition(t, byId), order: targetOrder(t, byId) }));
        const pick = (kinds) => {
            for (const kind of kinds) {
                const matches = options.filter((o) => o.kind === kind).sort((a, b) => a.order - b.order);
                if (matches.length)
                    return matches[0];
            }
            return null;
        };
        const choice = phase === 'seek-failure'
            ? pick(['failure', 'normal', 'complete'])
            : phase === 'seek-rework'
                ? pick(['rework', 'normal', 'complete'])
                : pick(['complete', 'normal']);
        if (!choice)
            return { steps, end: 'dead-end' };
        if (choice.kind === 'failure' && phase === 'seek-failure')
            phase = 'seek-rework';
        else if (choice.kind === 'rework' && phase === 'seek-rework')
            phase = 'main';
        used.set(choice.t.id, (used.get(choice.t.id) || 0) + 1);
        current = choice.t.toStageId;
        steps.push({ nodeId: current, viaTransitionId: choice.t.id });
    }
    return { steps, end: current === 'DONE' ? 'done' : 'limit' };
};
