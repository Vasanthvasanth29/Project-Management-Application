import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, addEdge, MarkerType, BackgroundVariant, } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toast } from 'sonner';
import { useAppStore } from '../../store/appStore';
import { EmptyState } from '../../components/common/EmptyState';
import { EditorStageNode, EditorStartNode, EditorDoneNode, EditorAnyNode } from './workflow/nodes/EditorNodes';
import { EditorEdge, EDGE_COLORS, edgeColor } from './workflow/components/EditorEdge';
import { WorkflowToolbar } from './workflow/components/WorkflowToolbar';
import { StageConfigPanel } from './workflow/components/StageConfigPanel';
import { TransitionConfigPanel } from './workflow/components/TransitionConfigPanel';
import { AddStageModal } from './workflow/components/AddStageModal';
import { AddTransitionModal } from './workflow/components/AddTransitionModal';
import { workflowToFlowElements, getDefaultWorkflowTransitions, computeInitialPositions, STAGE_TYPE_COLORS, } from './workflow/workflowUtils';
import { classifyTransition, computePreviewPath, hasFailurePath, stageMapOf } from './workflow/editorPreview';
// Editor-only renderers: same node type keys, handles and data as the shared nodes
// (which stay unchanged for the read-only view on the Issue Details page).
const nodeTypes = {
    stageNode: EditorStageNode,
    startNode: EditorStartNode,
    doneNode: EditorDoneNode,
    anyNode: EditorAnyNode,
};
const edgeTypes = { editorEdge: EditorEdge };
/** Local preview pacing at 1× (ms per step, and of that, travel along the connector). */
const PREVIEW_STEP_MS = 1300;
const PREVIEW_TRAVEL_MS = 800;
const usePrefersReducedMotion = () => {
    const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function')
            return undefined;
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        const onChange = () => setReduced(query.matches);
        query.addEventListener?.('change', onChange);
        return () => query.removeEventListener?.('change', onChange);
    }, []);
    return reduced;
};
export const WorkflowBuilder = ({ projectId, workflowId }) => {
    const { workflows, createWorkflow, updateWorkflow, updateProject, projects, teams, users } = useAppStore();
    const workflow = workflows.find((w) => w.id === workflowId || w.projectId === projectId);
    // Local state for interactive canvas
    const [stages, setStages] = useState([]);
    const [transitions, setTransitions] = useState([]);
    const [nodePositions, setNodePositions] = useState({});
    const [workflowStatus, setWorkflowStatus] = useState('ACTIVE');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    // Selection state
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [selectedEdgeId, setSelectedEdgeId] = useState(null);
    // Modal dialog states
    const [isAddStageOpen, setIsAddStageOpen] = useState(false);
    const [isAddTransitionOpen, setIsAddTransitionOpen] = useState(false);
    // React Flow state
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    // Local visual preview of the configured path (display only: never saved, never executed).
    const [preview, setPreview] = useState(null); // { steps, end, index, playing, mode }
    const [previewMode, setPreviewMode] = useState('main');
    const [previewSpeed, setPreviewSpeed] = useState(1);
    const reducedMotion = usePrefersReducedMotion();
    const stopPreview = useCallback(() => setPreview(null), []);
    // Initialize from workflow store
    const initFromWorkflow = useCallback((wf) => {
        const initStages = [...wf.stages];
        const initTransitions = wf.transitions && wf.transitions.length > 0
            ? [...wf.transitions]
            : getDefaultWorkflowTransitions(initStages);
        const initPositions = wf.nodePositions && Object.keys(wf.nodePositions).length > 0
            ? { ...wf.nodePositions }
            : computeInitialPositions(initStages);
        const initStatus = wf.status || 'ACTIVE';
        setStages(initStages);
        setTransitions(initTransitions);
        setNodePositions(initPositions);
        setWorkflowStatus(initStatus);
        setHasUnsavedChanges(false);
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        const { nodes: flowNodes, edges: flowEdges } = workflowToFlowElements({ ...wf, stages: initStages, transitions: initTransitions, nodePositions: initPositions, status: initStatus }, teams, users, null);
        setNodes(flowNodes);
        setEdges(flowEdges);
    }, [teams, users, setNodes, setEdges]);
    useEffect(() => {
        if (workflow) {
            initFromWorkflow(workflow);
        }
    }, [workflow?.id, initFromWorkflow]);
    // Sync flow elements when selection or local state changes
    const syncFlowElements = useCallback((currentStages, currentTransitions, currentPositions, selNodeId, selEdgeId) => {
        if (!workflow)
            return;
        const { nodes: flowNodes, edges: flowEdges } = workflowToFlowElements({
            ...workflow,
            stages: currentStages,
            transitions: currentTransitions,
            nodePositions: currentPositions,
        }, teams, users, selNodeId || selEdgeId);
        setNodes(flowNodes);
        setEdges(flowEdges);
    }, [workflow, teams, users, setNodes, setEdges]);
    // Handle node position changes on drag
    const handleNodesChange = useCallback((changes) => {
        onNodesChange(changes);
        let positionChanged = false;
        const updatedPositions = { ...nodePositions };
        changes.forEach((change) => {
            if (change.type === 'position' && change.position) {
                updatedPositions[change.id] = change.position;
                positionChanged = true;
            }
        });
        if (positionChanged) {
            setNodePositions(updatedPositions);
            setHasUnsavedChanges(true);
        }
    }, [nodePositions, onNodesChange]);
    // Handle node selection
    const onNodeClick = useCallback((_, node) => {
        setPreview(null);
        setSelectedEdgeId(null);
        setSelectedNodeId(node.id);
        syncFlowElements(stages, transitions, nodePositions, node.id, null);
    }, [stages, transitions, nodePositions, syncFlowElements]);
    // Handle edge selection
    const onEdgeClick = useCallback((_, edge) => {
        setPreview(null);
        setSelectedNodeId(null);
        setSelectedEdgeId(edge.id);
        syncFlowElements(stages, transitions, nodePositions, null, edge.id);
    }, [stages, transitions, nodePositions, syncFlowElements]);
    // Handle pane click (deselect)
    const onPaneClick = useCallback(() => {
        if (selectedNodeId || selectedEdgeId) {
            setSelectedNodeId(null);
            setSelectedEdgeId(null);
            syncFlowElements(stages, transitions, nodePositions, null, null);
        }
    }, [selectedNodeId, selectedEdgeId, stages, transitions, nodePositions, syncFlowElements]);
    // Handle direct handle connection
    const onConnect = useCallback((params) => {
        if (!params.source || !params.target || params.source === params.target)
            return;
        setPreview(null);
        const newTransition = {
            id: `tr-${params.source}-${params.target}-${Date.now()}`,
            fromStageId: params.source,
            toStageId: params.target,
            name: '',
            rules: [],
        };
        const updatedTransitions = [...transitions, newTransition];
        setTransitions(updatedTransitions);
        setHasUnsavedChanges(true);
        setEdges((eds) => addEdge({
            ...params,
            id: newTransition.id,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8', width: 14, height: 14 },
            style: { stroke: '#94a3b8', strokeWidth: 1.75 },
        }, eds));
        toast.success('Transition added between stages');
    }, [transitions, setEdges]);
    // Update a stage
    const handleUpdateStage = (updates) => {
        if (!selectedNodeId)
            return;
        const updatedStages = stages.map((s) => (s.id === selectedNodeId ? { ...s, ...updates } : s));
        setStages(updatedStages);
        setHasUnsavedChanges(true);
        syncFlowElements(updatedStages, transitions, nodePositions, selectedNodeId, null);
        toast.success('Stage configuration updated');
    };
    // Delete a stage
    const handleDeleteStage = (stageId) => {
        const updatedStages = stages.filter((s) => s.id !== stageId).map((s, idx) => ({ ...s, order: idx + 1 }));
        const updatedTransitions = transitions.filter((t) => t.fromStageId !== stageId && t.toStageId !== stageId);
        const updatedPositions = { ...nodePositions };
        delete updatedPositions[stageId];
        setStages(updatedStages);
        setTransitions(updatedTransitions);
        setNodePositions(updatedPositions);
        setSelectedNodeId(null);
        setHasUnsavedChanges(true);
        syncFlowElements(updatedStages, updatedTransitions, updatedPositions, null, null);
        toast.success('Stage and connected transitions deleted');
    };
    // Update a transition
    const handleUpdateTransition = (updates) => {
        if (!selectedEdgeId)
            return;
        const updatedTransitions = transitions.map((t) => t.id === selectedEdgeId ? { ...t, ...updates } : t);
        setTransitions(updatedTransitions);
        setHasUnsavedChanges(true);
        syncFlowElements(stages, updatedTransitions, nodePositions, null, selectedEdgeId);
    };
    // Delete a transition
    const handleDeleteTransition = (transitionId) => {
        const updatedTransitions = transitions.filter((t) => t.id !== transitionId);
        setTransitions(updatedTransitions);
        setSelectedEdgeId(null);
        setHasUnsavedChanges(true);
        syncFlowElements(stages, updatedTransitions, nodePositions, null, null);
        toast.success('Transition removed');
    };
    // Add new stage
    const handleAddStage = (stageData) => {
        const newStageId = `stage-${Date.now()}`;
        const newStage = {
            id: newStageId,
            workflowId: workflow?.id || `wf-${projectId}`,
            name: stageData.name,
            type: stageData.type,
            order: stages.length + 1,
            color: stageData.color,
            teamId: stageData.teamId,
            teamLeaderId: stageData.teamLeaderId,
            description: stageData.description,
            allowedNextStages: [],
        };
        // Calculate intelligent position for new node
        const highestY = Object.values(nodePositions).reduce((max, p) => Math.max(max, p.y), 400);
        const updatedPositions = {
            ...nodePositions,
            [newStageId]: { x: 300, y: highestY + 115 },
        };
        const updatedStages = [...stages, newStage];
        setStages(updatedStages);
        setNodePositions(updatedPositions);
        setSelectedNodeId(newStageId);
        setHasUnsavedChanges(true);
        syncFlowElements(updatedStages, transitions, updatedPositions, newStageId, null);
        toast.success(`Stage "${stageData.name}" added to canvas`);
    };
    // Add new transition
    const handleAddTransition = (transitionData) => {
        const newTransitionId = `tr-${transitionData.fromStageId}-${transitionData.toStageId}-${Date.now()}`;
        const newTransition = {
            id: newTransitionId,
            fromStageId: transitionData.fromStageId,
            toStageId: transitionData.toStageId,
            name: '',
            rules: [],
        };
        const updatedTransitions = [...transitions, newTransition];
        setTransitions(updatedTransitions);
        setSelectedEdgeId(newTransitionId);
        setHasUnsavedChanges(true);
        syncFlowElements(stages, updatedTransitions, nodePositions, null, newTransitionId);
        toast.success('Transition added');
    };
    // Save / Update Workflow
    const handleSaveWorkflow = (newStatus) => {
        if (!workflow)
            return;
        setPreview(null);
        const finalStatus = newStatus || workflowStatus;
        updateWorkflow(workflow.id, {
            stages,
            transitions,
            nodePositions,
            status: finalStatus,
        });
        setWorkflowStatus(finalStatus);
        setHasUnsavedChanges(false);
        toast.success('Workflow successfully updated & saved');
    };
    // Discard changes
    const handleDiscardChanges = () => {
        if (workflow) {
            setPreview(null);
            initFromWorkflow(workflow);
            toast.info('Changes discarded. Workflow restored to previous saved state.');
        }
    };
    // Create default workflow if none
    const handleCreateDefaultWorkflow = () => {
        const defaultWorkflowId = workflow?.id || `wf-${projectId}`;
        // Automatically resolve default teams for standard stages if present
        const devTeam = teams.find((t) => t.id === 'team-dev' || t.name.toLowerCase().includes('dev'));
        const qaTeam = teams.find((t) => t.id === 'team-qa' || t.name.toLowerCase().includes('qa') || t.name.toLowerCase().includes('test'));
        const productTeam = teams.find((t) => t.id === 'team-product' || t.name.toLowerCase().includes('product'));
        const defaultStages = [
            {
                id: `${projectId}-plan`,
                workflowId: defaultWorkflowId,
                name: 'Planning',
                type: 'PLANNING',
                order: 1,
                teamId: productTeam?.id,
                teamLeaderId: productTeam?.teamLeaderId,
                color: STAGE_TYPE_COLORS.PLANNING,
                allowedNextStages: [`${projectId}-dev`],
            },
            {
                id: `${projectId}-dev`,
                workflowId: defaultWorkflowId,
                name: 'Development',
                type: 'DEVELOPMENT',
                order: 2,
                teamId: devTeam?.id,
                teamLeaderId: devTeam?.teamLeaderId,
                color: STAGE_TYPE_COLORS.DEVELOPMENT,
                allowedNextStages: [`${projectId}-review`],
            },
            {
                id: `${projectId}-review`,
                workflowId: defaultWorkflowId,
                name: 'Code Review',
                type: 'CODE_REVIEW',
                order: 3,
                teamId: devTeam?.id,
                teamLeaderId: devTeam?.teamLeaderId,
                color: STAGE_TYPE_COLORS.CODE_REVIEW,
                allowedNextStages: [`${projectId}-testing`],
            },
            {
                id: `${projectId}-testing`,
                workflowId: defaultWorkflowId,
                name: 'Testing',
                type: 'TESTING',
                order: 4,
                teamId: qaTeam?.id,
                teamLeaderId: qaTeam?.teamLeaderId,
                color: STAGE_TYPE_COLORS.TESTING,
                allowedNextStages: [`${projectId}-bugfix`],
            },
            {
                id: `${projectId}-bugfix`,
                workflowId: defaultWorkflowId,
                name: 'Bug Fix',
                type: 'BUG_FIX',
                order: 5,
                teamId: devTeam?.id,
                teamLeaderId: devTeam?.teamLeaderId,
                color: STAGE_TYPE_COLORS.BUG_FIX,
                allowedNextStages: [`${projectId}-retest`],
            },
            {
                id: `${projectId}-retest`,
                workflowId: defaultWorkflowId,
                name: 'Re-test',
                type: 'RETEST',
                order: 6,
                teamId: qaTeam?.id,
                teamLeaderId: qaTeam?.teamLeaderId,
                color: STAGE_TYPE_COLORS.RETEST,
                allowedNextStages: [`${projectId}-testing`],
            },
        ];
        const defaultTransitions = getDefaultWorkflowTransitions(defaultStages);
        const defaultPositions = computeInitialPositions(defaultStages);
        if (workflow) {
            updateWorkflow(workflow.id, {
                stages: defaultStages,
                transitions: defaultTransitions,
                nodePositions: defaultPositions,
                status: 'ACTIVE',
            });
            initFromWorkflow({
                ...workflow,
                stages: defaultStages,
                transitions: defaultTransitions,
                nodePositions: defaultPositions,
                status: 'ACTIVE',
            });
        }
        else {
            const targetProject = projects.find((p) => p.id === projectId);
            const newWorkflow = createWorkflow({
                id: defaultWorkflowId,
                projectId,
                name: `${targetProject?.name || 'Project'} Standard Workflow`,
                stages: defaultStages,
                transitions: defaultTransitions,
                nodePositions: defaultPositions,
                status: 'ACTIVE',
            });
            const initialTeamIds = Array.from(new Set([
                ...(targetProject?.teamIds || []),
                devTeam?.id,
                qaTeam?.id,
                productTeam?.id,
            ].filter(Boolean)));
            updateProject(projectId, {
                workflowId: newWorkflow.id,
                currentStageId: defaultStages[0].id,
                teamIds: initialTeamIds.length > 0 ? initialTeamIds : targetProject?.teamIds || [],
            });
            initFromWorkflow(newWorkflow);
        }
        toast.success('Standard Jira-style workflow created');
    };
    /* ---------- Local preview (display only) ---------- */
    const stageById = useMemo(() => stageMapOf(stages), [stages]);
    const reworkAvailable = useMemo(() => hasFailurePath(stages, transitions), [stages, transitions]);
    const previewDisabledReason = transitions.some((t) => t.fromStageId === 'START')
        ? null
        : 'Connect START to a stage to preview the workflow';
    const startPreview = useCallback((mode) => {
        const path = computePreviewPath(stages, transitions, mode);
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setPreview({ ...path, mode, index: 0, playing: true });
    }, [stages, transitions]);
    // Advance one step at a time; pausing simply stops the timer.
    useEffect(() => {
        if (!preview?.playing)
            return undefined;
        const last = preview.steps.length - 1;
        if (preview.index >= last) {
            setPreview((p) => (p ? { ...p, playing: false } : p));
            return undefined;
        }
        const timer = setTimeout(() => setPreview((p) => (p ? { ...p, index: Math.min(p.index + 1, last) } : p)), PREVIEW_STEP_MS / previewSpeed);
        return () => clearTimeout(timer);
    }, [preview, previewSpeed]);
    // The preview reflects the workflow as configured when it started; editing ends it.
    useEffect(() => {
        setPreview(null);
    }, [workflow?.id]);
    const previewControls = {
        playing: !!preview?.playing,
        disabledReason: previewDisabledReason,
        speed: previewSpeed,
        onSpeed: setPreviewSpeed,
        hasReworkPath: reworkAvailable,
        pathMode: previewMode,
        onPathMode: (mode) => {
            setPreviewMode(mode);
            if (preview)
                startPreview(mode);
        },
        onReplay: () => startPreview(previewMode),
        onPlayPause: () => {
            if (!preview)
                return startPreview(previewMode);
            const atEnd = preview.index >= preview.steps.length - 1;
            if (atEnd && !preview.playing)
                return startPreview(previewMode);
            setPreview({ ...preview, playing: !preview.playing });
        },
    };
    const previewState = useMemo(() => {
        if (!preview)
            return null;
        const { steps, index } = preview;
        return {
            current: steps[index]?.nodeId,
            visitedNodes: new Set(steps.slice(0, index).map((s) => s.nodeId)),
            activeEdge: index > 0 ? steps[index].viaTransitionId : null,
            visitedEdges: new Set(steps.slice(1, index).map((s) => s.viaTransitionId)),
        };
    }, [preview]);
    // Display-only overlays: preview state on nodes; colour class, preview state and
    // marker colour on edges. The underlying nodes/edges/transitions are untouched.
    const displayNodes = useMemo(() => (previewState
        ? nodes.map((n) => ({
            ...n,
            data: { ...n.data, preview: n.id === previewState.current ? 'active' : previewState.visitedNodes.has(n.id) ? 'visited' : null },
        }))
        : nodes), [nodes, previewState]);
    const displayEdges = useMemo(() => edges.map((e) => {
        const transition = e.data?.transition || transitions.find((t) => t.id === e.id) || { id: e.id, fromStageId: e.source, toStageId: e.target };
        const kind = classifyTransition(transition, stageById);
        const edgePreview = previewState ? (e.id === previewState.activeEdge ? 'active' : previewState.visitedEdges.has(e.id) ? 'visited' : null) : null;
        const isSelected = !!e.data?.isSelected;
        const color = edgeColor(kind, { selected: isSelected, preview: edgePreview });
        return {
            ...e,
            type: 'editorEdge',
            markerEnd: { type: MarkerType.ArrowClosed, color, width: 14, height: 14 },
            data: { ...e.data, transition, kind, isSelected, preview: edgePreview, reduced: reducedMotion, travelMs: PREVIEW_TRAVEL_MS / previewSpeed },
        };
    }), [edges, transitions, stageById, previewState, reducedMotion, previewSpeed]);
    const nodeLabel = (id) => (id === 'START' ? 'START' : id === 'DONE' ? 'Done' : stageById.get(id)?.name || id);
    if (!workflow) {
        return (<div className="card p-8">
        <EmptyState title="No workflow configured" description="Create a standard visual workflow template to get started with your project pipeline." action={{
                label: 'Create Standard Workflow',
                onClick: handleCreateDefaultWorkflow,
            }}/>
      </div>);
    }
    const selectedStage = stages.find((s) => s.id === selectedNodeId);
    const selectedTransition = transitions.find((t) => t.id === selectedEdgeId);
    const stageNameMap = new Map([
        ['START', 'START'],
        ['DONE', 'Done'],
        ['ANY', 'Any Stage'],
        ...stages.map((s) => [s.id, s.name]),
    ]);
    const previewStep = preview ? preview.steps[preview.index] : null;
    const previewFinished = preview && !preview.playing && preview.index >= preview.steps.length - 1;
    return (<div className="space-y-4 animate-fade-in">
      {/* Main Canvas & Configuration Layout */}
      <div className="relative flex flex-col lg:flex-row gap-4 h-[calc(100vh-210px)] min-h-[580px]">
        {/* Canvas card: header toolbar, canvas, footer */}
        <div className="flex-1 min-w-0 h-full flex flex-col rounded-2xl border border-[#e2e5ea] bg-white shadow-fe-lg overflow-hidden">
          <WorkflowToolbar workflowName={workflow.name} status={workflowStatus} hasUnsavedChanges={hasUnsavedChanges} onAddStage={() => {
            stopPreview();
            setIsAddStageOpen(true);
        }} onAddTransition={() => {
            stopPreview();
            setIsAddTransitionOpen(true);
        }} onUpdateWorkflow={handleSaveWorkflow} onDiscardChanges={handleDiscardChanges} preview={previewControls}/>

          <div className="relative flex-1 min-h-0 bg-[#f8fafc]">
            <ReactFlow nodes={displayNodes} edges={displayEdges} onNodesChange={handleNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={onNodeClick} onEdgeClick={onEdgeClick} onPaneClick={onPaneClick} onNodeDragStart={stopPreview} onConnectStart={stopPreview} nodeTypes={nodeTypes} edgeTypes={edgeTypes} fitView fitViewOptions={{ padding: 0.15 }} minZoom={0.2} maxZoom={1.75} defaultEdgeOptions={{
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8', width: 14, height: 14 },
        }} proOptions={{ hideAttribution: true }} className="flowexec-workflow-canvas">
              <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color="#cbd3dd"/>
              <Controls className="!bg-white !border !border-[#e2e8f0] !rounded-xl !shadow-sm !p-0.5" showInteractive={false}/>
              <MiniMap nodeColor={(n) => {
            if (n.type === 'startNode')
                return '#0f172a';
            if (n.type === 'doneNode')
                return '#059669';
            if (n.type === 'anyNode')
                return '#0891b2';
            return n.data?.stage?.color || '#2563eb';
        }} nodeStrokeWidth={2} maskColor="rgba(241, 245, 249, 0.7)" className="!bg-white !border !border-[#e2e8f0] !rounded-xl !shadow-sm !bottom-3 !right-3 !w-32 !h-20 hidden md:block"/>
            </ReactFlow>
          </div>

          {/* Footer: preview progress, or the hint and colour legend */}
          <div className="relative border-t border-[#eef0f3] bg-white px-3.5 py-2">
            {preview && (<div className="absolute inset-x-0 -top-px h-[2px]" aria-hidden="true">
                <div className="h-full bg-[#0d9488] transition-[width] duration-300" style={{ width: `${((preview.index + 1) / preview.steps.length) * 100}%` }}/>
              </div>)}
            {preview ? (<div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <p className="min-w-0 text-[11px] text-[#0f172a]" aria-live="polite">
                  <span className="font-semibold text-[#0d9488] tabular-nums">Preview · {String(preview.index + 1).padStart(2, '0')}/{String(preview.steps.length).padStart(2, '0')}</span>
                  <span className="mx-1 text-[#cbd5e1]" aria-hidden="true">·</span>
                  <span className="font-semibold">{nodeLabel(previewStep.nodeId)}</span>
                  {previewFinished && (<span className="text-[#64748b]">
                      {preview.end === 'done' ? ' (reached Done)' : preview.end === 'dead-end' ? ' (no further transition configured)' : ' (preview stopped)'}
                    </span>)}
                </p>
                <p className="text-[10.5px] text-[#64748b]">
                  {preview.mode === 'rework' ? 'Rework path' : 'Main path'} · visual preview of configured transitions; nothing is executed or saved
                </p>
              </div>) : (<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <p className="text-[10.5px] text-[#64748b]">Drag nodes to rearrange · Click a node or transition to configure · Drag between handles to connect</p>
                <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-[#64748b]" aria-label="Transition colours">
                  {[
                    ['normal', 'Transition'],
                    ['complete', 'To Done'],
                    ['failure', 'To a Bug Fix stage'],
                    ['rework', 'Back to an earlier stage'],
                ].map(([kind, label]) => (<li key={kind} className="flex items-center gap-1.5">
                      <svg width="18" height="6" aria-hidden="true"><line x1="1" y1="3" x2="17" y2="3" stroke={EDGE_COLORS[kind]} strokeWidth="2" strokeDasharray={kind === 'rework' ? '4 3' : undefined} strokeLinecap="round"/></svg>
                      {label}
                    </li>))}
                </ul>
              </div>)}
          </div>
        </div>

        {/* Right Configuration Sidebar */}
        <div className={`transition-all duration-300 ${selectedStage || selectedTransition
            ? 'w-full lg:w-80 xl:w-96 flex-shrink-0'
            : 'hidden'}`}>
          {selectedStage && (<StageConfigPanel stage={selectedStage} teams={teams} users={users} onUpdateStage={handleUpdateStage} onDeleteStage={handleDeleteStage} onClose={() => {
                setSelectedNodeId(null);
                syncFlowElements(stages, transitions, nodePositions, null, null);
            }}/>)}

          {selectedTransition && (<TransitionConfigPanel transition={selectedTransition} fromName={stageNameMap.get(selectedTransition.fromStageId) || selectedTransition.fromStageId} toName={stageNameMap.get(selectedTransition.toStageId) || selectedTransition.toStageId} onUpdateTransition={handleUpdateTransition} onDeleteTransition={handleDeleteTransition} onClose={() => {
                setSelectedEdgeId(null);
                syncFlowElements(stages, transitions, nodePositions, null, null);
            }}/>)}
        </div>
      </div>

      {/* Add Stage Modal */}
      <AddStageModal isOpen={isAddStageOpen} teams={teams} users={users} onClose={() => setIsAddStageOpen(false)} onAddStage={handleAddStage}/>

      {/* Add Transition Modal */}
      <AddTransitionModal isOpen={isAddTransitionOpen} stages={stages} onClose={() => setIsAddTransitionOpen(false)} onAddTransition={handleAddTransition}/>
    </div>);
};
