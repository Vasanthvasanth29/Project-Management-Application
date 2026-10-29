import { describe, it, expect } from 'vitest';
import { getDefaultWorkflowTransitions } from './workflowUtils';
import { classifyTransition, computePreviewPath, hasFailurePath, stageMapOf } from './editorPreview';
/** The editor's own "Create Standard Workflow" stages (WorkflowBuilder.handleCreateDefaultWorkflow). */
const standardStages = [
    { id: 'p-plan', name: 'Planning', type: 'PLANNING', order: 1 },
    { id: 'p-dev', name: 'Development', type: 'DEVELOPMENT', order: 2 },
    { id: 'p-review', name: 'Code Review', type: 'CODE_REVIEW', order: 3 },
    { id: 'p-testing', name: 'Testing', type: 'TESTING', order: 4 },
    { id: 'p-bugfix', name: 'Bug Fix', type: 'BUG_FIX', order: 5 },
    { id: 'p-retest', name: 'Re-test', type: 'RETEST', order: 6 },
];
const standardTransitions = getDefaultWorkflowTransitions(standardStages);
const nodesOf = (path) => path.steps.map((s) => s.nodeId);
describe('classifyTransition', () => {
    const byId = stageMapOf(standardStages);
    const kindOf = (from, to) => classifyTransition(standardTransitions.find((t) => t.fromStageId === from && t.toStageId === to), byId);
    it('uses only configured data: Done target, BUG_FIX stage type, and saved stage order', () => {
        expect(kindOf('p-testing', 'DONE')).toBe('complete');
        expect(kindOf('p-testing', 'p-bugfix')).toBe('failure');
        expect(kindOf('p-retest', 'p-testing')).toBe('rework');
        expect(kindOf('p-plan', 'p-dev')).toBe('normal');
        expect(kindOf('START', 'p-plan')).toBe('normal');
    });
    it('ignores stage names: a stage merely called "Bug Fix" with a custom type is not a failure path', () => {
        const stages = [{ id: 'a', name: 'A', type: 'CUSTOM', order: 1 }, { id: 'b', name: 'Bug Fix', type: 'CUSTOM', order: 2 }];
        expect(classifyTransition({ id: 't', fromStageId: 'a', toStageId: 'b' }, stageMapOf(stages))).toBe('normal');
    });
    it('a transition to a stage with a higher order is never rework', () => {
        const stages = [{ id: 'a', type: 'CUSTOM', order: 1 }, { id: 'b', type: 'CUSTOM', order: 2 }];
        expect(classifyTransition({ id: 't', fromStageId: 'b', toStageId: 'a' }, stageMapOf(stages))).toBe('rework');
        expect(classifyTransition({ id: 't', fromStageId: 'a', toStageId: 'b' }, stageMapOf(stages))).toBe('normal');
    });
});
describe('computePreviewPath', () => {
    it('main path follows the configured transitions to Done', () => {
        const path = computePreviewPath(standardStages, standardTransitions, 'main');
        expect(path.end).toBe('done');
        expect(nodesOf(path)).toEqual(['START', 'p-plan', 'p-dev', 'p-review', 'p-testing', 'DONE']);
    });
    it('rework path takes the failure branch, the rework loop, then finishes', () => {
        const path = computePreviewPath(standardStages, standardTransitions, 'rework');
        expect(path.end).toBe('done');
        expect(nodesOf(path)).toEqual(['START', 'p-plan', 'p-dev', 'p-review', 'p-testing', 'p-bugfix', 'p-retest', 'p-testing', 'DONE']);
    });
    it('every step after START follows a real configured transition', () => {
        const path = computePreviewPath(standardStages, standardTransitions, 'rework');
        for (let i = 1; i < path.steps.length; i++) {
            const t = standardTransitions.find((x) => x.id === path.steps[i].viaTransitionId);
            expect(t.fromStageId).toBe(path.steps[i - 1].nodeId);
            expect(t.toStageId).toBe(path.steps[i].nodeId);
        }
    });
    it('stops at a stage with nowhere to go', () => {
        const stages = [{ id: 'a', type: 'CUSTOM', order: 1 }];
        const path = computePreviewPath(stages, [{ id: 't1', fromStageId: 'START', toStageId: 'a' }], 'main');
        expect(path.end).toBe('dead-end');
        expect(nodesOf(path)).toEqual(['START', 'a']);
    });
    it('cannot loop forever: each transition is used at most twice', () => {
        const stages = [{ id: 'a', type: 'CUSTOM', order: 1 }, { id: 'b', type: 'BUG_FIX', order: 2 }];
        const transitions = [
            { id: 's', fromStageId: 'START', toStageId: 'a' },
            { id: 'ab', fromStageId: 'a', toStageId: 'b' },
            { id: 'ba', fromStageId: 'b', toStageId: 'a' },
        ];
        const path = computePreviewPath(stages, transitions, 'rework', 50);
        expect(['dead-end', 'limit']).toContain(path.end);
        expect(path.steps.length).toBeLessThan(10);
    });
    it('handles an empty workflow', () => {
        expect(computePreviewPath([], [], 'main')).toEqual({ steps: [{ nodeId: 'START', viaTransitionId: null }], end: 'dead-end' });
    });
    it('reports whether a failure path exists', () => {
        expect(hasFailurePath(standardStages, standardTransitions)).toBe(true);
        expect(hasFailurePath(standardStages, standardTransitions.filter((t) => t.toStageId !== 'p-bugfix'))).toBe(false);
    });
});
