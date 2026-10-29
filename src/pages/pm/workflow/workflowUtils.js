import { MarkerType } from '@xyflow/react';
// Default stage color map matching FlowExec theme
export const STAGE_TYPE_COLORS = {
    PLANNING: '#7c3aed',
    DEVELOPMENT: '#2563eb',
    CODE_REVIEW: '#0891b2',
    TESTING: '#d97706',
    BUG_FIX: '#dc2626',
    RETEST: '#f59e0b',
    UAT: '#059669',
    DEPLOYMENT: '#0f766e',
    COMPLETED: '#10b981',
    CUSTOM: '#64748b',
};
export const COLOR_PALETTE = [
    '#2563eb', // Blue
    '#7c3aed', // Purple
    '#0891b2', // Cyan
    '#d97706', // Amber
    '#dc2626', // Red
    '#f59e0b', // Orange
    '#059669', // Emerald
    '#0f766e', // Teal
    '#10b981', // Green
    '#4f46e5', // Indigo
    '#64748b', // Slate
    '#ec4899', // Pink
];
export const getDefaultWorkflowTransitions = (stages) => {
    const stageMap = new Map(stages.map((s) => [s.name.toLowerCase().replace(/[^a-z]/g, ''), s.id]));
    const planId = stageMap.get('planning') || stages[0]?.id;
    const devId = stageMap.get('development') || stages[1]?.id;
    const reviewId = stageMap.get('codereview') || stages[2]?.id;
    const testId = stageMap.get('testing') || stages[3]?.id;
    const bugfixId = stageMap.get('bugfix') || stages[4]?.id;
    const retestId = stageMap.get('retest') || stages[5]?.id;
    const transitions = [];
    if (planId) {
        transitions.push({
            id: `tr-start-${planId}`,
            fromStageId: 'START',
            toStageId: planId,
            name: '',
        });
    }
    if (planId && devId) {
        transitions.push({
            id: `tr-${planId}-${devId}`,
            fromStageId: planId,
            toStageId: devId,
            name: '',
        });
    }
    if (devId && reviewId) {
        transitions.push({
            id: `tr-${devId}-${reviewId}`,
            fromStageId: devId,
            toStageId: reviewId,
            name: '',
        });
    }
    if (reviewId && testId) {
        transitions.push({
            id: `tr-${reviewId}-${testId}`,
            fromStageId: reviewId,
            toStageId: testId,
            name: '',
        });
    }
    if (testId) {
        transitions.push({
            id: `tr-${testId}-done`,
            fromStageId: testId,
            toStageId: 'DONE',
            name: '',
        });
    }
    if (testId && bugfixId) {
        transitions.push({
            id: `tr-${testId}-${bugfixId}`,
            fromStageId: testId,
            toStageId: bugfixId,
            name: '',
        });
    }
    if (bugfixId && retestId) {
        transitions.push({
            id: `tr-${bugfixId}-${retestId}`,
            fromStageId: bugfixId,
            toStageId: retestId,
            name: '',
        });
    }
    if (retestId && testId) {
        transitions.push({
            id: `tr-${retestId}-${testId}`,
            fromStageId: retestId,
            toStageId: testId,
            name: '',
        });
    }
    return transitions;
};
export const computeInitialPositions = (stages) => {
    const positions = {
        'START': { x: 300, y: 30 },
    };
    const stageMap = new Map(stages.map((s) => [s.name.toLowerCase().replace(/[^a-z]/g, ''), s]));
    // Standard positions for Jira-like flow
    const planStage = stageMap.get('planning') || stages[0];
    const devStage = stageMap.get('development') || stages[1];
    const reviewStage = stageMap.get('codereview') || stages[2];
    const testStage = stageMap.get('testing') || stages[3];
    const bugfixStage = stageMap.get('bugfix') || stages[4];
    const retestStage = stageMap.get('retest') || stages[5];
    if (planStage)
        positions[planStage.id] = { x: 275, y: 110 };
    if (devStage)
        positions[devStage.id] = { x: 275, y: 200 };
    if (reviewStage)
        positions[reviewStage.id] = { x: 275, y: 290 };
    if (testStage)
        positions[testStage.id] = { x: 275, y: 380 };
    if (bugfixStage)
        positions[bugfixStage.id] = { x: 130, y: 490 };
    if (retestStage)
        positions[retestStage.id] = { x: 130, y: 590 };
    positions['DONE'] = { x: 430, y: 490 };
    // For any remaining stages, place them gracefully below
    let currentY = 690;
    stages.forEach((stage) => {
        if (!positions[stage.id]) {
            positions[stage.id] = { x: 275, y: currentY };
            currentY += 90;
        }
    });
    return positions;
};
export const workflowToFlowElements = (workflow, teams, users, selectedId) => {
    const nodePositions = workflow.nodePositions || computeInitialPositions(workflow.stages);
    const transitions = workflow.transitions && workflow.transitions.length > 0
        ? workflow.transitions
        : getDefaultWorkflowTransitions(workflow.stages);
    const teamMap = new Map(teams.map((t) => [t.id, t]));
    const userMap = new Map(users.map((u) => [u.id, u]));
    const nodes = [];
    // 1. START node
    nodes.push({
        id: 'START',
        type: 'startNode',
        position: nodePositions['START'] || { x: 300, y: 30 },
        data: {
            label: 'START',
            isSelected: selectedId === 'START',
        },
        draggable: true,
    });
    // 2. Stage nodes
    workflow.stages.forEach((stage) => {
        const team = stage.teamId ? teamMap.get(stage.teamId) : undefined;
        const leader = stage.teamLeaderId ? userMap.get(stage.teamLeaderId) : undefined;
        const pos = nodePositions[stage.id] || { x: 275, y: 110 + stage.order * 90 };
        nodes.push({
            id: stage.id,
            type: 'stageNode',
            position: pos,
            data: {
                stage,
                teamName: team?.name,
                leaderName: leader?.name,
                leaderAvatarColor: leader?.avatarColor,
                isSelected: selectedId === stage.id,
            },
            draggable: true,
        });
    });
    // 3. DONE node
    nodes.push({
        id: 'DONE',
        type: 'doneNode',
        position: nodePositions['DONE'] || { x: 430, y: 490 },
        data: {
            label: 'Done',
            isSelected: selectedId === 'DONE',
        },
        draggable: true,
    });
    // 4. Any ANY nodes if transitions use 'ANY'
    const hasAnyTransition = transitions.some((t) => t.fromStageId === 'ANY');
    if (hasAnyTransition) {
        nodes.push({
            id: 'ANY',
            type: 'anyNode',
            position: nodePositions['ANY'] || { x: 80, y: 465 },
            data: {
                label: 'ANY',
                isSelected: selectedId === 'ANY',
            },
            draggable: true,
        });
    }
    // 5. Edges
    const stageNameMap = new Map([
        ['START', 'START'],
        ['DONE', 'Done'],
        ['ANY', 'Any Stage'],
        ...workflow.stages.map((s) => [s.id, s.name]),
    ]);
    const edges = transitions.map((t) => {
        const isEdgeSelected = selectedId === t.id;
        const fromName = stageNameMap.get(t.fromStageId) || t.fromStageId;
        const toName = stageNameMap.get(t.toStageId) || t.toStageId;
        return {
            id: t.id,
            source: t.fromStageId,
            target: t.toStageId,
            type: 'smoothstep',
            animated: isEdgeSelected,
            style: {
                stroke: isEdgeSelected ? '#1a73e8' : '#94a3b8',
                strokeWidth: isEdgeSelected ? 2.5 : 1.75,
            },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: isEdgeSelected ? '#1a73e8' : '#94a3b8',
                width: 14,
                height: 14,
            },
            data: {
                transition: t,
                fromName,
                toName,
                isSelected: isEdgeSelected,
            },
        };
    });
    return { nodes, edges };
};
