import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarRange, Clock, AlertTriangle, AlertOctagon, CheckCircle2, Play, ChevronDown, ChevronRight, Link2, Target, ShieldAlert, Ban, UserPlus, ArrowRight, Eye, XCircle, GitBranch, MessageSquareHeart, Flag, MoreHorizontal, GripVertical, CheckSquare, Square, FolderKanban, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { StatusBadge, PriorityBadge, SprintStatusBadge } from '../../components/common/Badges';
import { Avatar } from '../../components/common/Avatar';
import { SprintRetrospectiveModal } from './SprintRetrospectiveModal';
import { formatShortDate, isOverdue, getDueDateLabel, getDueDateClass, getCurrentDate } from '../../utils/dateUtils';
import { safeDaysBetween } from '../../utils/calculationUtils';
import { matchId, toUrlId, matchProject, getProjectUrl } from '../../utils/idUtils';
import { issuePath } from '../../utils/issueUrl';
import { isCancelledWorkItem } from '../../utils/roleUtils';
import { piNumberForSprint } from '../../utils/programIncrement';
const DELAY_REASONS = [
    { value: 'blocked-by-another-task', label: 'Blocked by another task', description: 'A dependency or blocking issue is preventing progress.' },
    { value: 'assignee-workload-issue', label: 'Assignee workload issue', description: 'The assignee has too many tasks or competing priorities.' },
    { value: 'more-time-required', label: 'More time required', description: 'The task is more complex than initially estimated.' },
    { value: 'priority-changed', label: 'Priority changed', description: 'Task priority was raised or lowered during the iteration.' },
    { value: 'other', label: 'Other', description: 'Another reason not listed above.' },
];
const DECISION_OPTIONS = [
    { value: 'continue', label: 'Continue', description: 'Keep the task in the current iteration and continue execution.', icon: <Play className="w-3.5 h-3.5"/>, color: '#059669', bg: '#d1fae5' },
    { value: 'reassign', label: 'Reassign', description: 'Assign this task to another available project member.', icon: <UserPlus className="w-3.5 h-3.5"/>, color: '#2563eb', bg: '#dbeafe' },
    { value: 'move-to-sprint', label: 'Move to Next Iteration', description: 'Move this unfinished task out of the current iteration into the next appropriate iteration.', icon: <GitBranch className="w-3.5 h-3.5"/>, color: '#7c3aed', bg: '#f3e8ff' },
];
const WORKFLOW_STAGES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'TESTING', 'DONE'];
const NEXT_STATUS = {
    TODO: 'IN_PROGRESS',
    IN_PROGRESS: 'IN_REVIEW',
    IN_REVIEW: 'TESTING',
    TESTING: 'DONE',
};
const STATUS_LABELS = {
    IN_PROGRESS: 'Start',
    IN_REVIEW: 'Submit Review',
    TESTING: 'Move to Testing',
    DONE: 'Mark Done',
};
export const SprintDetailPage = () => {
    const { projectId, projectKey, projectName, sprintId, piId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuthStore();
    const { projects, sprints, pis, tasks, users, taskDependencies, updateTaskStatus, updateTask, assignTask, } = useAppStore();
    // Existing state
    const [expandedTaskId, setExpandedTaskId] = useState(null);
    const [showReassignFor, setShowReassignFor] = useState(null);
    const [showMoveSprintFor, setShowMoveSprintFor] = useState(null);

    // Multi-selection state for work items
    const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());

    // Drag-and-drop state
    const [draggedTasks, setDraggedTasks] = useState([]);
    const [dragOverSprintId, setDragOverSprintId] = useState(null);

    // Modals state
    const [confirmMoveData, setConfirmMoveData] = useState(null); // { tasks, targetSprint, targetPi }
    const [showMovePickerForTasks, setShowMovePickerForTasks] = useState(null);
    const [openRowMenuTaskId, setOpenRowMenuTaskId] = useState(null);

    // PM Task Decision Workflow state
    const [reviewingTaskId, setReviewingTaskId] = useState(null);
    const [reviewStep, setReviewStep] = useState('idle');
    const [delayReason, setDelayReason] = useState(null);
    const [decision, setDecision] = useState(null);
    const [selectedAssigneeId, setSelectedAssigneeId] = useState(null);
    const [selectedTargetSprintId, setSelectedTargetSprintId] = useState(null);
    const [showRetroModal, setShowRetroModal] = useState(false);

    const sprint = useMemo(() => sprints.find(s => matchId(s.id, sprintId)), [sprints, sprintId]);
    const project = useMemo(() => {
        if (sprint?.projectId) {
            const found = projects.find(p => p.id === sprint.projectId);
            if (found) return found;
        }
        return projects.find(p => matchProject(p, { projectId, projectKey, projectName }));
    }, [projects, projectId, projectKey, projectName, sprint]);

    // Close row menu on outside click
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (!e.target.closest('[data-row-menu]')) {
                setOpenRowMenuTaskId(null);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    // Project → PI → Iteration breadcrumb context: which PI owns this iteration.
    const sprintPiNumber = useMemo(() => (sprint ? piNumberForSprint(sprint, pis) : undefined), [sprint, pis]);
    const sprintCrumbLabel = useMemo(() => {
        if (!sprint)
            return 'Iteration';
        return sprint.iterationNumber && sprint.name === sprint.iterationNumber
            ? `Iteration ${sprint.name}`
            : sprint.name;
    }, [sprint]);
    const allProjectSprints = useMemo(() => sprints.filter(s => matchId(s.projectId, project?.id || projectId) && !matchId(s.id, sprintId) && s.status !== 'COMPLETED'), [sprints, project, projectId, sprintId]);

    // Program Increments and their Iterations for this project (for cross-PI moves)
    const projectPis = useMemo(() => {
        if (!project) return [];
        return pis.filter(p => p.projectId === project.id).sort((a, b) => (b.number || 0) - (a.number || 0));
    }, [pis, project]);

    const iterationsGroupedByPi = useMemo(() => {
        if (!project) return [];
        return projectPis.map(pi => {
            const piSprints = sprints
                .filter(s => s.piId === pi.id && !s.isArchived)
                .sort((a, b) => {
                    const seqA = parseFloat(a.iterationNumber || '0') || 0;
                    const seqB = parseFloat(b.iterationNumber || '0') || 0;
                    return seqA - seqB;
                });
            return {
                pi,
                sprints: piSprints,
            };
        });
    }, [projectPis, sprints, project]);

    const sprintTasks = useMemo(() => {
        if (!sprint)
            return [];
        return tasks.filter(t => t.sprintId === sprint.id && t.type !== 'EPIC');
    }, [tasks, sprint]);
    const doneTasks = useMemo(() => sprintTasks.filter(t => t.status === 'DONE'), [sprintTasks]);
    const remainingTasks = useMemo(() => sprintTasks.filter(t => t.status !== 'DONE'), [sprintTasks]);
    const overdueTasks = useMemo(() => sprintTasks.filter(t => t.status !== 'DONE' && t.dueDate && isOverdue(t.dueDate)), [sprintTasks]);
    const blockedTasks = useMemo(() => sprintTasks.filter(t => t.status === 'BLOCKED'), [sprintTasks]);
    const highPriorityTasks = useMemo(() => sprintTasks.filter(t => t.priority === 'HIGH' || t.priority === 'CRITICAL'), [sprintTasks]);
    const completionPct = useMemo(() => {
        if (sprintTasks.length === 0)
            return 0;
        return Math.round((doneTasks.length / sprintTasks.length) * 100);
    }, [sprintTasks, doneTasks]);
    const now = getCurrentDate();
    const totalDays = useMemo(() => {
        if (!sprint)
            return 0;
        return Math.max(1, safeDaysBetween(sprint.startDate, sprint.endDate));
    }, [sprint]);
    const elapsedDays = useMemo(() => {
        if (!sprint)
            return 0;
        const end = new Date(sprint.endDate) < now ? new Date(sprint.endDate) : now;
        return Math.max(0, safeDaysBetween(sprint.startDate, end.toISOString()));
    }, [sprint, now]);
    const expectedPct = Math.min(100, Math.round((elapsedDays / totalDays) * 100));
    const daysLeft = useMemo(() => {
        if (!sprint)
            return 0;
        return Math.max(0, safeDaysBetween(now.toISOString(), sprint.endDate));
    }, [sprint, now]);
    const isPastDeadline = useMemo(() => {
        if (!sprint)
            return false;
        return new Date(sprint.endDate) < now;
    }, [sprint, now]);
    const variance = completionPct - expectedPct;
    const getUser = useCallback((id) => users.find(u => u.id === id), [users]);
    const getTaskDependencies = useCallback((taskId) => {
        return taskDependencies.filter(d => d.taskId === taskId || d.dependsOnTaskId === taskId);
    }, [taskDependencies]);
    // Existing handlers
    const handleStatusChange = useCallback((taskId, newStatus) => {
        if (!currentUser)
            return;
        const res = updateTaskStatus(taskId, newStatus, currentUser.id);
        if (!res.ok) {
            toast.error(res.reason || 'That move is not allowed.');
            return;
        }
        // Cancelled is a real status: never carry a stale resolution with it.
        if (newStatus === 'CANCELLED') {
            updateTask(taskId, { resolution: undefined, resolvedAt: undefined, completedAt: undefined });
        }
        toast.success(`Status updated to ${newStatus === 'CANCELLED' ? 'Cancelled' : newStatus.replace(/_/g, ' ')}`);
    }, [currentUser, updateTaskStatus, updateTask]);
    const handleReassign = useCallback((taskId, assigneeId) => {
        if (!currentUser)
            return;
        assignTask(taskId, assigneeId, currentUser.id);
        const user = users.find(u => u.id === assigneeId);
        toast.success(`Reassigned to ${user?.name || 'member'}`);
        setShowReassignFor(null);
    }, [currentUser, assignTask, users]);
    const handleUnassign = useCallback((taskId) => {
        updateTask(taskId, { assigneeId: undefined });
        toast.success('Task unassigned');
        setShowReassignFor(null);
    }, [updateTask]);
    const handleMoveToSprint = useCallback((taskId, targetSprintId) => {
        updateTask(taskId, { sprintId: targetSprintId });
        if (targetSprintId) {
            const target = allProjectSprints.find(s => s.id === targetSprintId);
            toast.success(`Moved to ${target?.name || 'sprint'}`);
        }
        else {
            toast.success('Moved to work queue');
        }
        setShowMoveSprintFor(null);
    }, [updateTask, allProjectSprints]);
    const handlePriorityChange = useCallback((taskId, priority) => {
        updateTask(taskId, { priority });
        toast.success(`Priority changed to ${priority.charAt(0) + priority.slice(1).toLowerCase()}`);
    }, [updateTask]);
    const handleBack = useCallback(() => {
        const effectivePiId = piId || sprint?.piId;
        if (effectivePiId) {
            navigate(`/pi-iterations/${encodeURIComponent(effectivePiId)}`);
            return;
        }
        if (project) {
            navigate(getProjectUrl(project, currentUser?.role || 'PROJECT_MANAGER'));
        }
        else {
            navigate(`/pm/projects/${toUrlId(projectId)}`);
        }
    }, [navigate, piId, sprint, project, projectId, currentUser?.role]);

    // Work item multi-selection handlers
    const toggleSelectTask = useCallback((taskId) => {
        setSelectedTaskIds(prev => {
            const next = new Set(prev);
            if (next.has(taskId)) {
                next.delete(taskId);
            } else {
                next.add(taskId);
            }
            return next;
        });
    }, []);

    const toggleSelectAll = useCallback(() => {
        if (selectedTaskIds.size === sprintTasks.length) {
            setSelectedTaskIds(new Set());
        } else {
            setSelectedTaskIds(new Set(sprintTasks.map(t => t.id)));
        }
    }, [selectedTaskIds.size, sprintTasks]);

    // Drag-and-drop handlers for moving work items across iterations
    const handleTaskDragStart = useCallback((e, task) => {
        let tasksToDrag = [];
        if (selectedTaskIds.has(task.id)) {
            tasksToDrag = sprintTasks.filter(t => selectedTaskIds.has(t.id));
        } else {
            tasksToDrag = [task];
            setSelectedTaskIds(new Set([task.id]));
        }
        setDraggedTasks(tasksToDrag);
        e.dataTransfer.effectAllowed = 'move';
        try {
            e.dataTransfer.setData('text/plain', JSON.stringify({ taskIds: tasksToDrag.map(t => t.id) }));
        } catch {
            // ignore
        }
    }, [selectedTaskIds, sprintTasks]);

    const handleTaskDragEnd = useCallback(() => {
        setDraggedTasks([]);
        setDragOverSprintId(null);
    }, []);

    const handleSprintDragOver = useCallback((e, targetSprint, targetPi) => {
        e.preventDefault();
        if (!draggedTasks || draggedTasks.length === 0) return;

        if (targetSprint.id === sprint?.id) {
            e.dataTransfer.dropEffect = 'none';
            return;
        }

        const isCompletedSprint = targetSprint.status === 'COMPLETED' || targetSprint.iterationStatus === 'Completed';
        const isCompletedPi = targetPi.status === 'COMPLETED';
        if (isCompletedSprint || isCompletedPi) {
            e.dataTransfer.dropEffect = 'none';
            return;
        }

        e.dataTransfer.dropEffect = 'move';
        if (dragOverSprintId !== targetSprint.id) {
            setDragOverSprintId(targetSprint.id);
        }
    }, [draggedTasks, sprint?.id, dragOverSprintId]);

    const handleSprintDragLeave = useCallback((e, targetSprint) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            if (dragOverSprintId === targetSprint.id) {
                setDragOverSprintId(null);
            }
        }
    }, [dragOverSprintId]);

    const handleSprintDrop = useCallback((e, targetSprint, targetPi) => {
        e.preventDefault();
        setDragOverSprintId(null);
        if (!draggedTasks || draggedTasks.length === 0) return;

        if (targetSprint.id === sprint?.id) {
            setDraggedTasks([]);
            return;
        }

        const isCompletedSprint = targetSprint.status === 'COMPLETED' || targetSprint.iterationStatus === 'Completed';
        const isCompletedPi = targetPi.status === 'COMPLETED';
        if (isCompletedSprint || isCompletedPi) {
            toast.error(`${targetSprint.name} is completed. Work items cannot be moved into a completed iteration.`);
            setDraggedTasks([]);
            return;
        }

        const moving = [...draggedTasks];
        setDraggedTasks([]);
        setConfirmMoveData({
            tasks: moving,
            targetSprint,
            targetPi,
        });
    }, [draggedTasks, sprint?.id]);

    const executeConfirmMove = useCallback(() => {
        if (!confirmMoveData) return;
        const { tasks: tasksToMove, targetSprint, targetPi } = confirmMoveData;

        tasksToMove.forEach(t => {
            updateTask(t.id, { sprintId: targetSprint.id });
        });

        toast.success(`Successfully moved ${tasksToMove.length} work item${tasksToMove.length > 1 ? 's' : ''} to ${targetSprint.name} (${targetPi?.name || 'PI'})`);
        setSelectedTaskIds(new Set());
        setConfirmMoveData(null);
        setShowMovePickerForTasks(null);
    }, [confirmMoveData, updateTask]);
    // PM Task Decision Workflow handlers
    const startReview = useCallback((taskId) => {
        // Close any expanded row and reset workflow state
        setExpandedTaskId(null);
        setShowReassignFor(null);
        setShowMoveSprintFor(null);
        setReviewingTaskId(taskId);
        setReviewStep('delay-reason');
        setDelayReason(null);
        setDecision(null);
        setSelectedAssigneeId(null);
        setSelectedTargetSprintId(null);
    }, []);
    const cancelReview = useCallback(() => {
        setReviewingTaskId(null);
        setReviewStep('idle');
        setDelayReason(null);
        setDecision(null);
        setSelectedAssigneeId(null);
        setSelectedTargetSprintId(null);
    }, []);
    const proceedToDecision = useCallback(() => {
        if (!delayReason) {
            toast.error('Please select a delay reason before continuing.');
            return;
        }
        setReviewStep('decision');
    }, [delayReason]);
    const proceedToConfirm = useCallback(() => {
        if (!decision) {
            toast.error('Please select an action before continuing.');
            return;
        }
        if (decision === 'reassign' && !selectedAssigneeId) {
            toast.error('Please select a team member to assign.');
            return;
        }
        if (decision === 'move-to-sprint' && !selectedTargetSprintId) {
            toast.error('Please select a target iteration.');
            return;
        }
        setReviewStep('confirm');
    }, [decision, selectedAssigneeId, selectedTargetSprintId]);
    const executeDecision = useCallback((taskId) => {
        if (!currentUser)
            return;
        const task = tasks.find(t => t.id === taskId);
        if (!task)
            return;
        if (decision === 'continue') {
            // If task is TODO, start it; otherwise keep current status
            if (task.status === 'TODO') {
                const res = updateTaskStatus(taskId, 'IN_PROGRESS', currentUser.id);
                if (res.ok) {
                    toast.success('Task started and kept in current iteration.');
                }
                else {
                    toast.error(res.reason || 'That move is not allowed.');
                }
            }
            else {
                toast.success('Task kept in current iteration. Continue execution.');
            }
        }
        else if (decision === 'reassign' && selectedAssigneeId) {
            assignTask(taskId, selectedAssigneeId, currentUser.id);
            const user = users.find(u => u.id === selectedAssigneeId);
            toast.success(`Task reassigned to ${user?.name || 'member'}.`);
        }
        else if (decision === 'move-to-sprint' && selectedTargetSprintId) {
            updateTask(taskId, { sprintId: selectedTargetSprintId });
            const target = allProjectSprints.find(s => s.id === selectedTargetSprintId);
            toast.success(`Task moved to ${target?.name || 'sprint'}.`);
        }
        setReviewStep('completed');
    }, [currentUser, decision, selectedAssigneeId, selectedTargetSprintId, tasks, updateTaskStatus, assignTask, updateTask, users, allProjectSprints]);
    const closeReviewPanel = useCallback(() => {
        setReviewingTaskId(null);
        setReviewStep('idle');
        setDelayReason(null);
        setDecision(null);
        setSelectedAssigneeId(null);
        setSelectedTargetSprintId(null);
    }, []);
    if (!project || !sprint) {
        return (<div className="p-8 text-center">
        <p className="text-sm text-[#6b7280]">Iteration not found.</p>
        <button onClick={handleBack} className="mt-3 text-sm text-[#0d9488] hover:underline">
          Return to project
        </button>
      </div>);
    }
    const sprintGoal = sprint.goal || 'No iteration goal defined';
    const recommendations = useMemo(() => {
        const recs = [];
        if (overdueTasks.length > 0) {
            recs.push({
                icon: <AlertOctagon className="w-3.5 h-3.5"/>,
                color: '#dc2626',
                bg: '#fee2e2',
                text: `Prioritize ${overdueTasks.length} overdue task${overdueTasks.length !== 1 ? 's' : ''} — review blockers and escalate if needed.`,
            });
        }
        const todoTasks = remainingTasks.filter(t => t.status === 'TODO');
        if (todoTasks.length > 0 && daysLeft <= 3) {
            recs.push({
                icon: <Clock className="w-3.5 h-3.5"/>,
                color: '#d97706',
                bg: '#fef3c7',
                text: `${todoTasks.length} task${todoTasks.length !== 1 ? 's' : ''} haven't started with ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining — start critical items now or move to next iteration.`,
            });
        }
        if (blockedTasks.length > 0) {
            recs.push({
                icon: <Ban className="w-3.5 h-3.5"/>,
                color: '#dc2626',
                bg: '#fee2e2',
                text: `Resolve ${blockedTasks.length} blocked task${blockedTasks.length !== 1 ? 's' : ''} — dependencies are preventing progress.`,
            });
        }
        if (variance < -20) {
            const suggestedMoves = Math.ceil(remainingTasks.length * 0.3);
            recs.push({
                icon: <ArrowRight className="w-3.5 h-3.5"/>,
                color: '#7c3aed',
                bg: '#f3e8ff',
                text: `Move ${suggestedMoves} lower-priority task${suggestedMoves !== 1 ? 's' : ''} to the next iteration — current velocity cannot complete all remaining work.`,
            });
        }
        const unassigned = remainingTasks.filter(t => !t.assigneeId);
        if (unassigned.length > 0) {
            recs.push({
                icon: <UserPlus className="w-3.5 h-3.5"/>,
                color: '#2563eb',
                bg: '#dbeafe',
                text: `Assign ${unassigned.length} unassigned task${unassigned.length !== 1 ? 's' : ''} to team members with capacity.`,
            });
        }
        if (isPastDeadline && completionPct < 50) {
            recs.push({
                icon: <ShieldAlert className="w-3.5 h-3.5"/>,
                color: '#dc2626',
                bg: '#fee2e2',
                text: `Iteration deadline has passed at ${completionPct}% completion — consider closing the iteration and re-planning remaining work.`,
            });
        }
        if (recs.length === 0) {
            recs.push({
                icon: <CheckCircle2 className="w-3.5 h-3.5"/>,
                color: '#059669',
                bg: '#d1fae5',
                text: 'Iteration is on track. Continue monitoring progress and team capacity.',
            });
        }
        return recs;
    }, [overdueTasks, remainingTasks, blockedTasks, daysLeft, variance, isPastDeadline, completionPct]);
    return (<div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f766e 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #0d9488 0%, transparent 50%)' }}/>
        <div className="relative z-10">
          {/* Breadcrumb: Back to Iterations / Project | {project} | PI {n} | {iteration} */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400 mb-4 flex-wrap">
            <button onClick={handleBack} className="inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5"/>
              {piId || sprint?.piId ? 'Back to Iterations' : 'Back to Project'}
            </button>
            <ChevronRight className="w-3 h-3 opacity-60"/>
            <button onClick={handleBack} className="hover:text-white transition-colors cursor-pointer">
              {project.name}
            </button>
            {sprintPiNumber !== undefined && (<>
                <ChevronRight className="w-3 h-3 opacity-60"/>
                <span className="px-1.5 py-0.5 rounded bg-[#0d9488]/30 border border-[#0d9488]/40 text-[#5eead4] font-semibold">
                  PI {sprintPiNumber}
                </span>
              </>)}
            <ChevronRight className="w-3 h-3 opacity-60"/>
            <span className="text-white font-semibold">{sprintCrumbLabel}</span>
          </nav>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 text-[#2dd4bf] text-xs font-semibold mb-3 backdrop-blur-sm border border-white/10">
                <CalendarRange className="w-3.5 h-3.5"/>
                Iteration Review
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight font-display">
                {sprint.name}
              </h1>
              <p className="text-sm text-slate-300 mt-1 max-w-lg">{sprintGoal}</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={() => setShowRetroModal(true)} className="px-3.5 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 font-semibold text-xs flex items-center gap-2 transition-all shadow-xs" title="Open Iteration Retrospective ceremony board">
                <MessageSquareHeart className="w-4 h-4 text-teal-400"/>
                <span>Iteration Retrospective</span>
              </button>
              <SprintStatusBadge status={sprint.status}/>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{completionPct}%</div>
                <div className="text-[10px] text-slate-400">Complete</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Iteration Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] mb-1">Status</div>
          <SprintStatusBadge status={sprint.status}/>
        </div>
        <div className="card p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] mb-1">Duration</div>
          <div className="text-xs font-semibold text-[#1a1d23]">
            {formatShortDate(sprint.startDate)} — {formatShortDate(sprint.endDate)}
          </div>
          <div className="text-[10px] text-[#9ca3af] mt-0.5">
            {isPastDeadline ? (<span className="text-[#dc2626] font-semibold">Deadline passed</span>) : (<span>{daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining</span>)}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] mb-1">Tasks</div>
          <div className="text-xs text-[#1a1d23]">
            <span className="font-bold">{doneTasks.length}</span> done / <span className="font-bold">{sprintTasks.length}</span> total
          </div>
          <div className="text-[10px] text-[#9ca3af] mt-0.5">{remainingTasks.length} remaining</div>
        </div>
        <div className="card p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] mb-1">Progress</div>
          <div className="text-xs text-[#1a1d23]">
            Expected: <span className="font-bold">{expectedPct}%</span>
          </div>
          <div className={`text-[10px] mt-0.5 font-semibold ${variance >= 0 ? 'text-[#059669]' : 'text-[#dc2626]'}`}>
            {variance >= 0 ? '+' : ''}{variance}pp {variance >= 0 ? 'ahead' : 'behind'}
          </div>
        </div>
      </div>

      {/* Health / Warning Summary */}
      <div className={`card p-5 border-l-4 ${isPastDeadline && completionPct < 50 ? 'border-l-[#dc2626] bg-[#fef2f2]/30'
            : variance < -15 ? 'border-l-[#d97706] bg-[#fffbeb]/30'
                : 'border-l-[#059669] bg-[#f0fdf4]/30'}`}>
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isPastDeadline && completionPct < 50 ? 'bg-[#fee2e2]'
            : variance < -15 ? 'bg-[#fef3c7]'
                : 'bg-[#d1fae5]'}`}>
            {isPastDeadline && completionPct < 50 ? (<AlertOctagon className="w-4 h-4 text-[#dc2626]"/>) : variance < -15 ? (<AlertTriangle className="w-4 h-4 text-[#d97706]"/>) : (<CheckCircle2 className="w-4 h-4 text-[#059669]"/>)}
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-bold text-[#1a1d23] mb-1.5 font-display">
              {isPastDeadline && completionPct < 50 ? 'Iteration Deadline Passed — Immediate Action Required'
            : variance < -20 ? 'Iteration Significantly Behind Schedule'
                : variance < -15 ? 'Iteration Falling Behind Schedule'
                    : 'Iteration Health Summary'}
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-[10px]">
              <div>
                <span className="text-[#9ca3af]">Completion:</span>{' '}
                <span className="font-bold text-[#1a1d23]">{completionPct}%</span>
              </div>
              <div>
                <span className="text-[#9ca3af]">Expected:</span>{' '}
                <span className="font-bold text-[#1a1d23]">{expectedPct}%</span>
              </div>
              <div>
                <span className="text-[#9ca3af]">Remaining:</span>{' '}
                <span className="font-bold text-[#1a1d23]">{remainingTasks.length} tasks</span>
              </div>
              <div>
                <span className="text-[#9ca3af]">Overdue:</span>{' '}
                <span className={`font-bold ${overdueTasks.length > 0 ? 'text-[#dc2626]' : 'text-[#059669]'}`}>
                  {overdueTasks.length}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-[#6b7280] mt-2 leading-relaxed">
              {isPastDeadline && completionPct < 50
            ? `The iteration ended ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} ago with only ${completionPct}% of tasks completed. ${remainingTasks.length} task${remainingTasks.length !== 1 ? 's' : ''} remain unfinished. Consider closing this iteration and replanning the remaining work into the next iteration.`
            : variance < -20
                ? `The iteration is ${Math.abs(variance)} percentage points behind expected progress. With ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining, completing all ${remainingTasks.length} remaining tasks is unlikely. Moving lower-priority work to the next iteration is recommended.`
                : variance < -15
                    ? `The iteration is ${Math.abs(variance)} percentage points behind expected progress. With ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining, focus on completing high-priority tasks and reviewing any blockers.`
                    : `The iteration is progressing ${variance >= 0 ? 'on or ahead of' : 'slightly behind'} schedule with ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining. Continue monitoring progress.`}
            </p>
          </div>
        </div>
      </div>

      {/* Recommended Next Actions */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#f1f5f9]">
          <Target className="w-4 h-4 text-[#7c3aed]"/>
          <h2 className="text-sm font-bold text-[#1a1d23] font-display">Recommended Next Actions</h2>
        </div>
        <div className="space-y-2.5">
          {recommendations.map((rec, idx) => (<div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-[#f8fafc] border border-[#f1f5f9]">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: rec.bg }}>
                <span style={{ color: rec.color }}>{rec.icon}</span>
              </div>
              <p className="text-[11px] text-[#4b5563] leading-relaxed flex-1">{rec.text}</p>
            </div>))}
        </div>
      </div>

      {/* Iteration Tasks & Cross-PI Destination Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Tasks Table */}
        <div className="xl:col-span-8 2xl:col-span-9 card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#f1f5f9]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0d9488]"/>
              <h2 className="text-sm font-bold text-[#1a1d23] font-display">Iteration Tasks</h2>
              <span className="text-[10px] font-bold text-[#9ca3af] bg-[#f1f5f9] px-2 py-0.5 rounded-lg ml-1">
                {sprintTasks.length} total &middot; {remainingTasks.length} remaining
              </span>
            </div>
            <div className="flex items-center gap-2">
              {selectedTaskIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setShowMovePickerForTasks(sprintTasks.filter(t => selectedTaskIds.has(t.id)))}
                  className="px-3 py-1.5 rounded-lg bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Move Selected ({selectedTaskIds.size})</span>
                </button>
              )}
            </div>
          </div>

          {sprintTasks.length === 0 ? (<div className="text-center py-8 text-[#9ca3af]">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30"/>
              <p className="text-xs">No tasks in this iteration</p>
            </div>) : (<div className="space-y-2">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-[#9ca3af] border-b border-[#f1f5f9] items-center">
                <div className="col-span-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={sprintTasks.length > 0 && selectedTaskIds.size === sprintTasks.length}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                    title={selectedTaskIds.size === sprintTasks.length ? 'Deselect all' : 'Select all'}
                  />
                  <span>Task</span>
                </div>
                <div className="col-span-1">Component</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1">Priority</div>
                <div className="col-span-2">Assignee</div>
                <div className="col-span-1">Due Date</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

            {sprintTasks
                .sort((a, b) => {
                const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
                const statusOrder = { BLOCKED: 0, TODO: 1, IN_PROGRESS: 2, IN_REVIEW: 3, TESTING: 4, BUG_FIX: 5, RETEST: 6, DONE: 7 };
                const aStatus = statusOrder[a.status] ?? 1;
                const bStatus = statusOrder[b.status] ?? 1;
                if (a.status !== 'DONE' && b.status !== 'DONE') {
                    const aPri = priorityOrder[a.priority] ?? 2;
                    const bPri = priorityOrder[b.priority] ?? 2;
                    return aPri - bPri;
                }
                return aStatus - bStatus;
            })
                .map(task => {
                const assignee = getUser(task.assigneeId);
                const taskOverdue = task.status !== 'DONE' && task.status !== 'CANCELLED' && task.dueDate && isOverdue(task.dueDate);
                const isBlocked = task.status === 'BLOCKED';
                const isExpanded = expandedTaskId === task.id;
                const isReviewing = reviewingTaskId === task.id;
                const nextStatus = NEXT_STATUS[task.status];
                const taskDeps = getTaskDependencies(task.id);
                const isHighPriority = task.priority === 'HIGH' || task.priority === 'CRITICAL';
                const isCompleted = task.status === 'DONE';
                const taskCancelled = isCancelledWorkItem(task);
                const isSelected = selectedTaskIds.has(task.id);
                const isDragged = draggedTasks.some(dt => dt.id === task.id);
                return (<div key={task.id}
                        draggable={!taskCancelled}
                        onDragStart={(e) => handleTaskDragStart(e, task)}
                        onDragEnd={handleTaskDragEnd}
                        className={`rounded-xl border overflow-hidden transition-all ${
                          isSelected ? 'ring-2 ring-teal-500/50 bg-teal-50/20' : ''
                        } ${taskOverdue ? 'border-[#fecaca] bg-[#fef2f2]/20'
                        : isBlocked ? 'border-[#fecaca] bg-[#fef2f2]/10'
                            : task.isFlagged ? 'border-[#fcd34d] bg-[#fefce8]/40'
                                : isHighPriority ? 'border-[#fde68a] bg-[#fffbeb]/20'
                                    : 'border-[#f1f5f9] bg-white hover:bg-[#f8fafc]'} ${
                          isDragged ? 'opacity-40' : ''
                        }`}>
                    {/* Task row */}
                    <div className="grid grid-cols-12 gap-2 items-center px-3 py-2.5">
                      <div className="col-span-4 flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectTask(task.id)}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer flex-shrink-0"
                        />
                        <GripVertical className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing flex-shrink-0" />
                        <button onClick={() => {
                        if (isReviewing) {
                            cancelReview();
                        }
                        else {
                            setExpandedTaskId(isExpanded ? null : task.id);
                        }
                    }} className="flex-shrink-0 cursor-pointer">
                          {(isExpanded || isReviewing) ? (<ChevronDown className="w-3 h-3 text-[#9ca3af]"/>) : (<ChevronRight className="w-3 h-3 text-[#9ca3af]"/>)}
                        </button>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[11px] font-semibold text-[#1a1d23] truncate">{task.title}</span>
                            {task.isFlagged && (<span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold border border-amber-300 flex-shrink-0" title={`Impediment: ${task.flaggedReason || 'Flagged'}`}>
                                <Flag className="w-2.5 h-2.5 fill-amber-600 text-amber-600"/>
                                <span>Impeded</span>
                              </span>)}
                          </div>
                          {task.description && (<p className="text-[10px] text-[#6b7280] line-clamp-1 mt-0.5" title={task.description}>
                              {task.description}
                            </p>)}
                          <div className="flex items-center gap-1 mt-0.5">
                            {taskOverdue && (<span className="text-[8px] font-bold text-[#dc2626] bg-[#fee2e2] px-1 py-0.5 rounded">OVERDUE</span>)}
                            {isBlocked && (<span className="text-[8px] font-bold text-[#dc2626] bg-[#fee2e2] px-1 py-0.5 rounded">BLOCKED</span>)}
                            {task.isFlagged && (<span className="text-[8px] text-amber-800 truncate max-w-[200px]" title={task.flaggedReason}>
                                &middot; {task.flaggedReason}
                              </span>)}
                          </div>
                        </div>
                      </div>
                      <div className="col-span-1">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 truncate max-w-full">
                          {task.component || 'General'}
                        </span>
                      </div>
                      <div className="col-span-1">
                        <StatusBadge status={task.status} resolution={task.resolution}/>
                      </div>
                      <div className="col-span-1">
                        <PriorityBadge priority={task.priority}/>
                      </div>
                      <div className="col-span-2">
                        {assignee ? (<div className="flex items-center gap-1.5">
                            <Avatar name={assignee.name} color={assignee.avatarColor} size="sm" className="w-5 h-5 rounded text-[7px]"/>
                            <span className="text-[10px] text-[#4b5563] truncate">{assignee.name}</span>
                          </div>) : (<span className="text-[10px] text-[#9ca3af] italic">Unassigned</span>)}
                      </div>
                      <div className="col-span-1">
                        <span className={`text-[10px] ${getDueDateClass(task.dueDate)}`}>
                          {getDueDateLabel(task.dueDate)}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-1 relative" data-row-menu>
                        {/* Review button - only for non-DONE tasks */}
                        {!isCompleted && (<button onClick={() => startReview(task.id)} className={`text-[9px] font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer ${isReviewing
                            ? 'bg-[#7c3aed] text-white'
                            : 'bg-[#ede9fe] text-[#7c3aed] hover:bg-[#ddd6fe]'}`}>
                            <Eye className="w-3 h-3 inline mr-0.5"/>
                            Review
                          </button>)}
                        {/* Quick status advance */}
                        {nextStatus && !isCompleted && (<button onClick={() => handleStatusChange(task.id, nextStatus)} className="text-[9px] font-bold px-2 py-1 rounded-lg bg-[#0d9488] text-white hover:bg-[#0f766e] transition-colors cursor-pointer" title={`Move to ${nextStatus.replace(/_/g, ' ')}`}>
                            {STATUS_LABELS[task.status] || 'Advance'}
                          </button>)}
                        <button onClick={() => {
                        // Canonical issue URL — the workspace ignores ?taskId,
                        // so open the issue's own detail page.
                        navigate(issuePath(task));
                    }} className="text-[9px] font-semibold px-2 py-1 rounded-lg bg-[#f1f5f9] text-[#6b7280] hover:bg-[#e2e8f0] transition-colors cursor-pointer">
                          View
                        </button>
                        {/* 3-dot row action menu */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenRowMenuTaskId(openRowMenuTaskId === task.id ? null : task.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="More actions"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                          {openRowMenuTaskId === task.id && (
                            <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-30 animate-in fade-in-50 duration-100 text-left">
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenRowMenuTaskId(null);
                                  setShowMovePickerForTasks([task]);
                                }}
                                className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-800 flex items-center gap-2 cursor-pointer font-medium"
                              >
                                <ArrowRight className="w-3.5 h-3.5 text-teal-600" />
                                <span>Move to Iteration...</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* PM Task Decision Workflow Panel */}
                    {isReviewing && (<div className="px-4 pb-4 pt-2 border-t border-[#ede9fe] bg-[#faf5ff]/30">
                        {/* Workflow Step Indicator */}
                        <div className="flex items-center gap-2 mb-4">
                          {['delay-reason', 'decision', 'confirm', 'completed'].map((step, idx) => (<React.Fragment key={step}>
                              <div className={`flex items-center gap-1.5 text-[9px] font-bold ${reviewStep === step ? 'text-[#7c3aed]'
                                : (['delay-reason', 'decision', 'confirm', 'completed'].indexOf(reviewStep) > idx) ? 'text-[#059669]'
                                    : 'text-[#d1d5db]'}`}>
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${reviewStep === step ? 'bg-[#7c3aed] text-white'
                                : (['delay-reason', 'decision', 'confirm', 'completed'].indexOf(reviewStep) > idx) ? 'bg-[#d1fae5] text-[#059669]'
                                    : 'bg-[#f3f4f6] text-[#d1d5db]'}`}>
                                  {(['delay-reason', 'decision', 'confirm', 'completed'].indexOf(reviewStep) > idx) ? '✓' : idx + 1}
                                </div>
                                <span className="hidden sm:inline">{step === 'delay-reason' ? 'Reason' : step === 'decision' ? 'Decision' : step === 'confirm' ? 'Confirm' : 'Done'}</span>
                              </div>
                              {idx < 3 && <div className={`w-4 h-px ${(['delay-reason', 'decision', 'confirm', 'completed'].indexOf(reviewStep) > idx) ? 'bg-[#059669]' : 'bg-[#e5e7eb]'}`}/>}
                            </React.Fragment>))}
                          <button onClick={cancelReview} className="ml-auto text-[9px] text-[#9ca3af] hover:text-[#6b7280] transition-colors flex items-center gap-1">
                            <XCircle className="w-3 h-3"/>
                            Cancel
                          </button>
                        </div>

                        {/* Step 1: Delay Reason */}
                        {reviewStep === 'delay-reason' && (<div>
                            <h4 className="text-[11px] font-bold text-[#1a1d23] mb-3 font-display">Why is this task delayed?</h4>
                            <div className="space-y-2">
                              {DELAY_REASONS.map(reason => (<button key={reason.value} onClick={() => setDelayReason(reason.value)} className={`w-full text-left p-3 rounded-xl border transition-all ${delayReason === reason.value
                                    ? 'border-[#7c3aed] bg-[#f5f3ff] ring-1 ring-[#7c3aed]/20'
                                    : 'border-[#e5e7eb] bg-white hover:border-[#d1d5db] hover:bg-[#f9fafb]'}`}>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${delayReason === reason.value ? 'border-[#7c3aed] bg-[#7c3aed]' : 'border-[#d1d5db]'}`}>
                                      {delayReason === reason.value && <div className="w-1.5 h-1.5 rounded-full bg-white"/>}
                                    </div>
                                    <div>
                                      <div className="text-[11px] font-semibold text-[#1a1d23]">{reason.label}</div>
                                      <div className="text-[9px] text-[#6b7280]">{reason.description}</div>
                                    </div>
                                  </div>
                                </button>))}
                            </div>
                            <div className="mt-4 flex justify-end">
                              <button onClick={proceedToDecision} disabled={!delayReason} className={`text-[10px] font-bold px-4 py-2 rounded-lg transition-colors ${delayReason
                                ? 'bg-[#7c3aed] text-white hover:bg-[#6d28d9]'
                                : 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'}`}>
                                Continue
                              </button>
                            </div>
                          </div>)}

                        {/* Step 2: Decision */}
                        {reviewStep === 'decision' && (<div>
                            <h4 className="text-[11px] font-bold text-[#1a1d23] mb-1 font-display">What should happen to this task?</h4>
                            <p className="text-[9px] text-[#6b7280] mb-3">
                              Reason selected: <span className="font-semibold text-[#7c3aed]">{DELAY_REASONS.find(r => r.value === delayReason)?.label}</span>
                            </p>
                            <div className="space-y-2">
                              {DECISION_OPTIONS.map(opt => (<button key={opt.value} onClick={() => {
                                    setDecision(opt.value);
                                    setSelectedAssigneeId(null);
                                    setSelectedTargetSprintId(null);
                                }} className={`w-full text-left p-3 rounded-xl border transition-all ${decision === opt.value
                                    ? 'border-[#7c3aed] bg-[#f5f3ff] ring-1 ring-[#7c3aed]/20'
                                    : 'border-[#e5e7eb] bg-white hover:border-[#d1d5db] hover:bg-[#f9fafb]'}`}>
                                  <div className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`} style={{ backgroundColor: opt.bg }}>
                                      <span style={{ color: opt.color }}>{opt.icon}</span>
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-[11px] font-semibold text-[#1a1d23]">{opt.label}</div>
                                      <div className="text-[9px] text-[#6b7280] mt-0.5">{opt.description}</div>
                                    </div>
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${decision === opt.value ? 'border-[#7c3aed] bg-[#7c3aed]' : 'border-[#d1d5db]'}`}>
                                      {decision === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white"/>}
                                    </div>
                                  </div>
                                </button>))}
                            </div>

                            {/* Reassign sub-selection */}
                            {decision === 'reassign' && (<div className="mt-3 p-3 rounded-xl border border-[#dbeafe] bg-[#eff6ff]">
                                <label className="text-[9px] font-bold text-[#2563eb] uppercase tracking-wider">Select new assignee</label>
                                <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                                  {users.filter(u => u.id !== task.assigneeId).map(user => (<button key={user.id} onClick={() => setSelectedAssigneeId(user.id)} className={`w-full text-left px-3 py-2 rounded-lg text-[10px] transition-colors flex items-center gap-2 ${selectedAssigneeId === user.id
                                        ? 'bg-[#dbeafe] border border-[#93c5fd] text-[#1e40af]'
                                        : 'bg-white border border-[#e5e7eb] hover:bg-[#f8fafc] text-[#1a1d23]'}`}>
                                      <Avatar name={user.name} color={user.avatarColor} size="sm" className="w-4 h-4 rounded text-[6px]"/>
                                      {user.name}
                                    </button>))}
                                  {users.filter(u => u.id !== task.assigneeId).length === 0 && (<p className="text-[10px] text-[#6b7280] italic">No other team members available.</p>)}
                                </div>
                              </div>)}

                            {/* Move to Iteration sub-selection */}
                            {decision === 'move-to-sprint' && (<div className="mt-3 p-3 rounded-xl border border-[#f3e8ff] bg-[#faf5ff]">
                                <label className="text-[9px] font-bold text-[#7c3aed] uppercase tracking-wider">Select target iteration</label>
                                <div className="mt-2 space-y-1">
                                  {allProjectSprints.map(s => (<button key={s.id} onClick={() => setSelectedTargetSprintId(s.id)} className={`w-full text-left px-3 py-2 rounded-lg text-[10px] transition-colors ${selectedTargetSprintId === s.id
                                        ? 'bg-[#f3e8ff] border border-[#c4b5fd] text-[#6d28d9]'
                                        : 'bg-white border border-[#e5e7eb] hover:bg-[#f8fafc] text-[#1a1d23]'}`}>
                                      <div className="font-semibold">{s.name}</div>
                                      <div className="text-[9px] text-[#9ca3af]">
                                        {formatShortDate(s.startDate)} — {formatShortDate(s.endDate)} ({s.status})
                                      </div>
                                    </button>))}
                                  {allProjectSprints.length === 0 && (<p className="text-[10px] text-[#6b7280] italic">No eligible next iteration is available.</p>)}
                                </div>
                              </div>)}

                            <div className="mt-4 flex justify-end gap-2">
                              <button onClick={() => setReviewStep('delay-reason')} className="text-[10px] font-semibold px-3 py-2 rounded-lg text-[#6b7280] hover:bg-[#f3f4f6] transition-colors">
                                Back
                              </button>
                              <button onClick={proceedToConfirm} disabled={!decision ||
                                (decision === 'reassign' && !selectedAssigneeId) ||
                                (decision === 'move-to-sprint' && !selectedTargetSprintId)} className={`text-[10px] font-bold px-4 py-2 rounded-lg transition-colors ${decision &&
                                (decision !== 'reassign' || selectedAssigneeId) &&
                                (decision !== 'move-to-sprint' || selectedTargetSprintId)
                                ? 'bg-[#7c3aed] text-white hover:bg-[#6d28d9]'
                                : 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'}`}>
                                Review Decision
                              </button>
                            </div>
                          </div>)}

                        {/* Step 3: Confirmation */}
                        {reviewStep === 'confirm' && (<div>
                            <h4 className="text-[11px] font-bold text-[#1a1d23] mb-3 font-display">Confirm Decision</h4>
                            <div className="p-4 rounded-xl border border-[#e5e7eb] bg-white">
                              <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                  <span className="text-[9px] font-bold text-[#6b7280] uppercase tracking-wider w-20 flex-shrink-0 pt-0.5">Decision</span>
                                  <span className="text-[11px] font-semibold text-[#7c3aed]">
                                    {DECISION_OPTIONS.find(o => o.value === decision)?.label}
                                  </span>
                                </div>
                                <div className="flex items-start gap-3">
                                  <span className="text-[9px] font-bold text-[#6b7280] uppercase tracking-wider w-20 flex-shrink-0 pt-0.5">Task</span>
                                  <span className="text-[11px] text-[#1a1d23]">{task.title}</span>
                                </div>
                                <div className="flex items-start gap-3">
                                  <span className="text-[9px] font-bold text-[#6b7280] uppercase tracking-wider w-20 flex-shrink-0 pt-0.5">Reason</span>
                                  <span className="text-[10px] text-[#6b7280]">
                                    {DELAY_REASONS.find(r => r.value === delayReason)?.label}
                                  </span>
                                </div>
                                {decision === 'continue' && (<div className="flex items-start gap-3">
                                    <span className="text-[9px] font-bold text-[#6b7280] uppercase tracking-wider w-20 flex-shrink-0 pt-0.5">Action</span>
                                    <span className="text-[10px] text-[#1a1d23]">
                                      {task.status === 'TODO' ? 'Task will be started (moved to In Progress).' : 'Task will remain in current iteration with current status.'}
                                    </span>
                                  </div>)}
                                {decision === 'reassign' && (<>
                                    <div className="flex items-start gap-3">
                                      <span className="text-[9px] font-bold text-[#6b7280] uppercase tracking-wider w-20 flex-shrink-0 pt-0.5">Current</span>
                                      <span className="text-[10px] text-[#1a1d23]">{assignee?.name || 'Unassigned'}</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                      <span className="text-[9px] font-bold text-[#6b7280] uppercase tracking-wider w-20 flex-shrink-0 pt-0.5">New assignee</span>
                                      <span className="text-[10px] font-semibold text-[#2563eb]">
                                        {users.find(u => u.id === selectedAssigneeId)?.name || 'Unknown'}
                                      </span>
                                    </div>
                                  </>)}
                                {decision === 'move-to-sprint' && (<>
                                    <div className="flex items-start gap-3">
                                      <span className="text-[9px] font-bold text-[#6b7280] uppercase tracking-wider w-20 flex-shrink-0 pt-0.5">Move from</span>
                                      <span className="text-[10px] text-[#1a1d23]">{sprint.name}</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                      <span className="text-[9px] font-bold text-[#6b7280] uppercase tracking-wider w-20 flex-shrink-0 pt-0.5">Move to</span>
                                      <span className="text-[10px] font-semibold text-[#7c3aed]">
                                        {allProjectSprints.find(s => s.id === selectedTargetSprintId)?.name || 'Unknown'}
                                      </span>
                                    </div>
                                  </>)}
                              </div>
                            </div>
                            <div className="mt-4 flex justify-end gap-2">
                              <button onClick={() => setReviewStep('decision')} className="text-[10px] font-semibold px-3 py-2 rounded-lg text-[#6b7280] hover:bg-[#f3f4f6] transition-colors">
                                Back
                              </button>
                              <button onClick={() => executeDecision(task.id)} className="text-[10px] font-bold px-4 py-2 rounded-lg bg-[#7c3aed] text-white hover:bg-[#6d28d9] transition-colors">
                                Confirm Decision
                              </button>
                            </div>
                          </div>)}

                        {/* Step 4: Completed */}
                        {reviewStep === 'completed' && (<div className="text-center py-4">
                            <div className="w-10 h-10 rounded-full bg-[#d1fae5] flex items-center justify-center mx-auto mb-3">
                              <CheckCircle2 className="w-5 h-5 text-[#059669]"/>
                            </div>
                            <h4 className="text-[11px] font-bold text-[#1a1d23] mb-1 font-display">Decision Applied</h4>
                            <p className="text-[9px] text-[#6b7280] mb-3">
                              {decision === 'continue' && 'Task will continue in the current iteration.'}
                              {decision === 'reassign' && `Task has been reassigned to ${users.find(u => u.id === selectedAssigneeId)?.name || 'the selected member'}.`}
                              {decision === 'move-to-sprint' && `Task has been moved to ${allProjectSprints.find(s => s.id === selectedTargetSprintId)?.name || 'the target iteration'}.`}
                            </p>
                            <button onClick={closeReviewPanel} className="text-[10px] font-bold px-4 py-2 rounded-lg bg-[#0d9488] text-white hover:bg-[#0f766e] transition-colors">
                              Close
                            </button>
                          </div>)}
                      </div>)}

                    {/* Standard expanded details (when not reviewing) */}
                    {isExpanded && !isReviewing && (<div className="px-3 pb-3 pt-2 border-t border-[#f1f5f9]">
                        {task.description && (<div className="mb-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
                            <span className="font-bold text-slate-800 text-[10px] uppercase tracking-wider block mb-1">
                              Task Description
                            </span>
                            <p className="whitespace-pre-line text-[11px] text-slate-600">{task.description}</p>
                          </div>)}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                          {/* Status change */}
                          <div>
                            <label className="text-[9px] font-bold text-[#6b7280] uppercase tracking-wider">Change Status</label>
                            <select value={task.status} disabled={taskCancelled} onChange={(e) => handleStatusChange(task.id, e.target.value)} className="mt-1 w-full text-[10px] px-2 py-1.5 rounded-lg border border-[#e2e5ea] bg-white text-[#1a1d23] focus:outline-none focus:ring-1 focus:ring-[#0d9488] disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed">
                              {taskCancelled ? (
                        /* Cancelled (real status or legacy DONE + resolution) renders as
                           Cancelled, never Done; changes go through the transition UI. */
                        <option value={task.status}>Cancelled</option>) : (['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'TESTING', 'BUG_FIX', 'RETEST', 'BLOCKED', 'DONE', 'CANCELLED'].map(s => (<option key={s} value={s}>{s === 'CANCELLED' ? 'Cancelled' : s.replace(/_/g, ' ')}</option>)))}
                            </select>
                          </div>

                          {/* Priority change */}
                          <div>
                            <label className="text-[9px] font-bold text-[#6b7280] uppercase tracking-wider">Priority</label>
                            <select value={task.priority} onChange={(e) => handlePriorityChange(task.id, e.target.value)} className="mt-1 w-full text-[10px] px-2 py-1.5 rounded-lg border border-[#e2e5ea] bg-white text-[#1a1d23] focus:outline-none focus:ring-1 focus:ring-[#0d9488]">
                              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => (<option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>))}
                            </select>
                          </div>

                          {/* Reassign */}
                          <div className="relative">
                            <label className="text-[9px] font-bold text-[#6b7280] uppercase tracking-wider">Reassign</label>
                            <button onClick={() => setShowReassignFor(showReassignFor === task.id ? null : task.id)} className="mt-1 w-full text-[10px] px-2 py-1.5 rounded-lg border border-[#e2e5ea] bg-white text-left text-[#1a1d23] hover:bg-[#f8fafc] transition-colors flex items-center justify-between">
                              <span>{assignee?.name || 'Assign...'}</span>
                              <ChevronDown className="w-3 h-3 text-[#9ca3af]"/>
                            </button>
                            {showReassignFor === task.id && (<div className="absolute top-full mt-1 left-0 w-56 bg-white rounded-xl shadow-xl border border-[#e2e5ea] z-50 py-1 max-h-48 overflow-y-auto">
                                {assignee && (<button onClick={() => handleUnassign(task.id)} className="w-full text-left px-3 py-2 text-[10px] text-[#dc2626] hover:bg-[#fef2f2] transition-colors">
                                    Unassign
                                  </button>)}
                                {users.filter(u => u.id !== task.assigneeId).map(user => (<button key={user.id} onClick={() => handleReassign(task.id, user.id)} className="w-full text-left px-3 py-2 text-[10px] text-[#1a1d23] hover:bg-[#f1f5f9] transition-colors flex items-center gap-2">
                                    <Avatar name={user.name} color={user.avatarColor} size="sm" className="w-4 h-4 rounded text-[6px]"/>
                                    {user.name}
                                  </button>))}
                              </div>)}
                          </div>

                          {/* Move to sprint */}
                          <div className="relative">
                            <label className="text-[9px] font-bold text-[#6b7280] uppercase tracking-wider">Move to Iteration</label>
                            <button onClick={() => setShowMoveSprintFor(showMoveSprintFor === task.id ? null : task.id)} className="mt-1 w-full text-[10px] px-2 py-1.5 rounded-lg border border-[#e2e5ea] bg-white text-left text-[#1a1d23] hover:bg-[#f8fafc] transition-colors flex items-center justify-between">
                              <span className="truncate">{sprint.name}</span>
                              <ChevronDown className="w-3 h-3 text-[#9ca3af] flex-shrink-0"/>
                            </button>
                            {showMoveSprintFor === task.id && (<div className="absolute top-full mt-1 left-0 w-56 bg-white rounded-xl shadow-xl border border-[#e2e5ea] z-50 py-1">
                                <button onClick={() => handleMoveToSprint(task.id, undefined)} className="w-full text-left px-3 py-2 text-[10px] text-[#6b7280] hover:bg-[#f1f5f9] transition-colors">
                                  Work Queue
                                </button>
                                {allProjectSprints.map(s => (<button key={s.id} onClick={() => handleMoveToSprint(task.id, s.id)} className="w-full text-left px-3 py-2 text-[10px] text-[#1a1d23] hover:bg-[#f1f5f9] transition-colors">
                                    {s.name}
                                    <span className="text-[9px] text-[#9ca3af] ml-1">({s.status})</span>
                                  </button>))}
                              </div>)}
                          </div>
                        </div>

                        {/* Dependencies */}
                        {taskDeps.length > 0 && (<div className="flex items-start gap-1.5 text-[10px] text-[#6b7280]">
                            <Link2 className="w-3 h-3 mt-0.5 flex-shrink-0"/>
                            <span>{taskDeps.length} dependenc{taskDeps.length !== 1 ? 'ies' : 'y'} linked</span>
                          </div>)}
                      </div>)}
                  </div>);
            })}
          </div>)}
        </div>

        {/* Right: Destination Iterations Panel (Drag & Drop Target across PIs) */}
        <div className="xl:col-span-4 2xl:col-span-3 card p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs font-display">
              <FolderKanban className="w-4 h-4 text-teal-600" />
              <span>Destination Iterations</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 leading-normal">
              Drag work items onto any valid iteration to move them across Program Increments.
            </p>
          </div>

          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
            {iterationsGroupedByPi.map(({ pi, sprints: piSprints }) => {
              const isPiCompleted = pi.status === 'COMPLETED';
              return (
                <div key={pi.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 px-1 pt-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-500" />
                      {pi.name} {pi.title ? `– ${pi.title}` : ''}
                    </span>
                    {isPiCompleted && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-semibold uppercase">
                        Completed
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {piSprints.map((s) => {
                      const isCurrent = s.id === sprint?.id;
                      const isCompleted = s.status === 'COMPLETED' || s.iterationStatus === 'Completed' || isPiCompleted;
                      const isDragOver = dragOverSprintId === s.id;
                      const sTasks = tasks.filter(t => t.sprintId === s.id && !isCancelledWorkItem(t));
                      const sDone = sTasks.filter(t => t.status === 'DONE').length;
                      const sPct = s.status === 'COMPLETED' ? 100 : s.status === 'PLANNED' ? 0 : sTasks.length > 0 ? Math.round((sDone / sTasks.length) * 100) : 0;

                      return (
                        <div
                          key={s.id}
                          onDragOver={(e) => handleSprintDragOver(e, s, pi)}
                          onDragLeave={(e) => handleSprintDragLeave(e, s)}
                          onDrop={(e) => handleSprintDrop(e, s, pi)}
                          className={`p-2.5 rounded-xl border text-xs transition-all ${
                            isDragOver
                              ? 'border-teal-500 bg-teal-50/80 shadow-md ring-2 ring-teal-500/30'
                              : isCurrent
                              ? 'border-slate-200 bg-slate-50 opacity-70'
                              : isCompleted
                              ? 'border-slate-100 bg-slate-50/50 opacity-60'
                              : 'border-slate-200 bg-white hover:border-teal-300 hover:shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <div className="min-w-0 flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{s.iterationNumber || s.name}</span>
                              {s.title && <span className="text-[11px] text-slate-600 truncate">{s.title}</span>}
                            </div>
                            <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                              isCurrent
                                ? 'bg-teal-100 text-teal-800'
                                : isCompleted
                                ? 'bg-emerald-50 text-emerald-700'
                                : s.status === 'ACTIVE'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {isCurrent ? 'Current' : isCompleted ? 'Completed' : s.status === 'ACTIVE' ? 'In Progress' : 'Planned'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100">
                            <span>{sTasks.length} items &middot; {sPct}%</span>
                            {!isCurrent && !isCompleted && selectedTaskIds.size > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmMoveData({
                                    tasks: sprintTasks.filter(t => selectedTaskIds.has(t.id)),
                                    targetSprint: s,
                                    targetPi: pi,
                                  });
                                }}
                                className="text-[10px] font-bold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer"
                              >
                                Move Here
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* PM Decision Summary */}
      <div className="card p-5" style={{ background: 'linear-gradient(135deg, #f0fdfa 0%, #f8fafc 50%, #eff6ff 100%)' }}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#ccfbf1] flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-4 h-4 text-[#0d9488]"/>
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-bold text-[#1a1d23] mb-2 font-display">PM Decision Summary</h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-[10px] text-[#4b5563]">
              <div>
                <span className="font-semibold text-[#1a1d23]">What is going wrong?</span>
                <p className="mt-0.5">
                  {isPastDeadline
            ? `Iteration deadline passed with ${100 - completionPct}% of work incomplete.`
            : variance < -15
                ? `Iteration is ${Math.abs(variance)}pp behind expected progress with ${daysLeft} days left.`
                : 'Iteration is progressing within acceptable range.'}
                </p>
              </div>
              <div>
                <span className="font-semibold text-[#1a1d23]">Immediate attention needed:</span>
                <p className="mt-0.5">
                  {overdueTasks.length > 0 && `${overdueTasks.length} overdue task${overdueTasks.length !== 1 ? 's' : ''}. `}
                  {blockedTasks.length > 0 && `${blockedTasks.length} blocked task${blockedTasks.length !== 1 ? 's' : ''}. `}
                  {remainingTasks.filter(t => t.status === 'TODO').length > 0 && `${remainingTasks.filter(t => t.status === 'TODO').length} not yet started. `}
                  {overdueTasks.length === 0 && blockedTasks.length === 0 && 'No critical blockers identified.'}
                </p>
              </div>
              <div>
                <span className="font-semibold text-[#1a1d23]">Who is responsible?</span>
                <p className="mt-0.5">
                  {overdueTasks.length > 0
            ? overdueTasks.map(t => getUser(t.assigneeId)?.name || 'Unassigned').filter((v, i, a) => a.indexOf(v) === i).join(', ')
            : 'No overdue assignees.'}
                </p>
              </div>
              <div>
                <span className="font-semibold text-[#1a1d23]">Realistic completion:</span>
                <p className="mt-0.5">
                  {remainingTasks.length === 0
            ? 'All tasks completed.'
            : `Of ${remainingTasks.length} remaining, ${remainingTasks.filter(t => t.priority === 'HIGH' || t.priority === 'CRITICAL').length} are high/critical priority.`}
                </p>
              </div>
              <div>
                <span className="font-semibold text-[#1a1d23]">What should move to next iteration?</span>
                <p className="mt-0.5">
                  {variance < -15 && remainingTasks.length > 0
            ? `Consider moving ${Math.ceil(remainingTasks.length * 0.3)} lower-priority tasks.`
            : 'Current pace may allow completion of committed work.'}
                </p>
              </div>
              <div>
                <span className="font-semibold text-[#1a1d23]">Needs escalation?</span>
                <p className="mt-0.5">
                  {(isPastDeadline && completionPct < 50) || blockedTasks.length > 2
            ? 'Yes — iteration failure risk is high. Escalate to stakeholders.'
            : 'No immediate escalation required.'}
                </p>
              </div>
            </div>
            <p className="text-[9px] text-[#9ca3af] mt-3 italic">
              Derived from current iteration data. Use as guidance for decision-making.
            </p>
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedTaskIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-700/80 animate-in fade-in-50 slide-in-from-bottom-4 duration-150">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-teal-500 text-white text-xs font-bold flex items-center justify-center">
              {selectedTaskIds.size}
            </span>
            <span className="text-xs font-semibold">work item{selectedTaskIds.size > 1 ? 's' : ''} selected</span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          <button
            type="button"
            onClick={() => setShowMovePickerForTasks(sprintTasks.filter(t => selectedTaskIds.has(t.id)))}
            className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Move to Iteration...</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTaskIds(new Set())}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 transition-colors cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmMoveData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in-50 duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                  <ArrowRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Move Work Items</h3>
                  <p className="text-xs text-slate-500">Confirm cross-iteration transfer</p>
                </div>
              </div>
              <button
                onClick={() => setConfirmMoveData(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                Are you sure you want to move{' '}
                <strong className="text-slate-900 font-semibold">{confirmMoveData.tasks.length} work item{confirmMoveData.tasks.length > 1 ? 's' : ''}</strong>{' '}
                from <span className="font-semibold text-slate-800">{sprint.name}</span> to{' '}
                <span className="font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                  Iteration {confirmMoveData.targetSprint.iterationNumber || confirmMoveData.targetSprint.name} ({confirmMoveData.targetPi?.name || 'PI'})
                </span>?
              </div>

              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {confirmMoveData.tasks.map(t => (
                  <div key={t.id} className="p-2.5 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="font-medium text-slate-900 truncate">{t.title}</p>
                      <p className="text-[10px] text-slate-500">{t.component || 'General'} &middot; Priority: {t.priority}</p>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-slate-500">
                All work item details (title, description, priority, assignee, attachments, status) will be preserved.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmMoveData(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmMove}
                className="px-4 py-2 text-xs font-bold bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Confirm Move ({confirmMoveData.tasks.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Target Iteration Picker Modal */}
      {showMovePickerForTasks && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in-50 duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Select Target Iteration</h3>
                <p className="text-xs text-slate-500">Moving {showMovePickerForTasks.length} work item(s)</p>
              </div>
              <button
                onClick={() => setShowMovePickerForTasks(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3 max-h-80 overflow-y-auto space-y-4 pr-1">
              {iterationsGroupedByPi.map(({ pi, sprints: piSprints }) => {
                const isPiCompleted = pi.status === 'COMPLETED';
                return (
                  <div key={pi.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-1">
                      <span>{pi.name} {pi.title ? `– ${pi.title}` : ''}</span>
                      {isPiCompleted && (
                        <span className="text-[10px] text-slate-400 font-normal">Completed (Locked)</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {piSprints.map(s => {
                        const isCurrent = s.id === sprint?.id;
                        const isCompleted = s.status === 'COMPLETED' || s.iterationStatus === 'Completed' || isPiCompleted;
                        return (
                          <button
                            key={s.id}
                            disabled={isCurrent || isCompleted}
                            onClick={() => {
                              setConfirmMoveData({
                                tasks: showMovePickerForTasks,
                                targetSprint: s,
                                targetPi: pi,
                              });
                              setShowMovePickerForTasks(null);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                              isCurrent
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : isCompleted
                                ? 'bg-slate-50 text-slate-400 cursor-not-allowed opacity-60'
                                : 'bg-white hover:bg-teal-50 hover:border-teal-300 border border-slate-200 text-slate-800 cursor-pointer shadow-2xs'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <span className="font-semibold">{s.iterationNumber || s.name}</span>
                              {s.title && <span className="ml-1.5 text-slate-600">{s.title}</span>}
                            </div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium capitalize bg-slate-100 text-slate-600">
                              {isCurrent ? 'Current' : isCompleted ? 'Completed' : s.status?.toLowerCase() || 'planned'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowMovePickerForTasks(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Retrospective Modal */}
      {showRetroModal && (<SprintRetrospectiveModal sprint={sprint} isOpen={true} onClose={() => setShowRetroModal(false)}/>)}
    </div>);
};
