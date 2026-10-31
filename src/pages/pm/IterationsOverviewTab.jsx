import React, { useState, useMemo, useEffect, useRef, useContext, useLayoutEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Flag, Filter, Search, MoreHorizontal, ChevronDown, ChevronRight, ChevronsUp, Users, ExternalLink, Plus, X, Layers, Calendar, Check, FileText, Hash, Edit3, Trash2, Eye, CalendarRange, CalendarDays, Archive, ListTree, Play, CheckCircle, FolderInput, ChevronUp, ListTodo } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { SprintStatusBadge } from '../../components/common/Badges';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ProgressBar } from '../../components/common/ProgressBar';
import { WorkItemIcon } from '../../components/common/WorkItemIcon';
import { toUrlId } from '../../utils/idUtils';
import { getIssueKeyPrefix } from '../../utils/projectIdentity';
import { issuePath, appHref } from '../../utils/issueUrl';
import { canManageSprint, canStartSprint, canCompleteSprint, canEditSprint, canArchiveSprint, canDeleteSprint, isCancelledWorkItem, displayTaskStatus, getStatusLabel } from '../../utils/roleUtils';
import { buildSprintIdentifiers, formatSprintIdentifier, formatSprintFullTitle, formatSprintPiTitle, formatSprintDateRange } from '../../utils/sprintIdentifier';
import { sortProjectPis, groupSprintsByPi, canCreateIterationInPi, piStatusOf, formatIsoDay, piNumberForSprint } from '../../utils/programIncrement';
import { fmtIterationRange } from '../../components/common/IterationHeader';
import { usePiPlan, splitPiPlanSections } from '../../data/piSprintStructure';
import { getEpicColor, sortProjectSprints, buildProjectTeamMembers, buildSprintIssuesMap, resolveIssueTaskId, } from '../../utils/sprintIssues';
import { SprintCompletionModal } from './SprintCompletionModal';
import { CreateIterationModal } from './CreateIterationModal';
import { IterationHeaderActionsContext, useIterationPaths } from './IterationModuleLayout';
import { useWorkQueueData, toIterationIssue } from '../../hooks/useWorkQueueData';
import { MoveTaskModal } from '../shared/tasks/MoveTaskModal';
/**
 * Sentinel selection id for the Work Queue card in the left panel. The page
 * keeps ONE selection source (selectedSprintId): an iteration id selects that
 * iteration's summary + work items; this sentinel selects the Work Queue's —
 * so the two surfaces can never compete or desync. It can never collide with
 * a real sprint id.
 */
const WORK_QUEUE_SELECTION_ID = '__work_queue__';
export const IterationsOverviewTab = ({ projectId, view = 'cadence' }) => {
    const isCompletedView = view === 'completed';
    const navigate = useNavigate();
    const location = useLocation();
    // Registers this page's action toolbar into module header row 2 (right of
    // the tab strip) — see IterationHeaderActionsContext.
    const setHeaderActions = useContext(IterationHeaderActionsContext);
    const { projects, sprints, pis, tasks, users, teams, issueComments, updateSprintStatus, updateSprint, deleteSprint, handleIncompleteTasks } = useAppStore();
    const { currentUser } = useAuthStore();
    // Iteration lifecycle permissions — resolved once from the authenticated user's existing
    // role so role checks are never duplicated across JSX locations.
    const sprintRole = currentUser?.role;
    const canManage = canManageSprint(sprintRole);
    const canArchive = canArchiveSprint(sprintRole);
    const canDelete = canDeleteSprint(sprintRole);
    const project = projects.find((p) => p.id === projectId);
    const projectKey = getIssueKeyPrefix(project) || 'PRJ';
    // Product Work Queue pool + readiness stats — the same shared source the
    // standalone Backlog tab uses, so the left-panel card count and the
    // right-panel table always describe the exact same records.
    const { workQueuePool, workQueueStats } = useWorkQueueData(projectId);
    // Find all sprints for this project. Display order mirrors the reference backlog:
    // the active iteration first, then upcoming iterations chronologically, then the
    // completed ones — so every iteration is reachable as its own expandable section.
    const projectSprints = useMemo(() => sortProjectSprints(sprints, projectId), [sprints, projectId]);
    // Project's Program Increments (parents) and the PI-grouped iteration list —
    // Project → PI → Iteration, so iterations are never one flat project list.
    const projectPis = useMemo(() => sortProjectPis(pis, projectId), [pis, projectId]);
    // The centralized PI → Sprint plan, split per-sprint into the Overview's
    // ACTIVE / PLANNED sections and the separate Completed Iterations tab —
    // the one source shared with the Move Work Item modal.
    const piPlan = usePiPlan(projectId);
    const planSections = useMemo(() => splitPiPlanSections(piPlan), [piPlan]);
    // Sections rendered by this view: the main page shows ACTIVE + PLANNED
    // inline (never as tabs); the Completed tab shows COMPLETED only.
    const overviewSections = useMemo(() => isCompletedView
        ? [{ key: 'completed', label: 'COMPLETED', pis: planSections.completed }]
        : [
            { key: 'active', label: 'ACTIVE', pis: planSections.active },
            { key: 'planned', label: 'PLANNED', pis: planSections.planned },
        ], [isCompletedView, planSections]);
    const hasVisibleSections = overviewSections.some((s) => s.pis.length > 0);
    // Determine active sprint or fallback
    const defaultSprint = useMemo(() => {
        return (projectSprints.find((s) => s.status === 'ACTIVE') ||
            projectSprints[0] ||
            {
                id: 'spr-current',
                projectId,
                piId: '',
                iterationNumber: '',
                name: `${projectKey} 3.1`,
                goal: 'Payment integration, order management, and notifications',
                status: 'ACTIVE',
                startDate: '2024-09-15',
                endDate: '2024-09-28',
                taskIds: [],
                createdById: 'u-pm-01',
                createdAt: '2024-09-04T00:00:00Z',
            });
    }, [projectSprints, projectId]);
    const [selectedSprintId, setSelectedSprintId] = useState(defaultSprint.id);
    // True when the left-panel Work Queue card (not an iteration) drives the
    // right panel. Never selectable on the Completed Iterations history view.
    const isWorkQueueSelected = !isCompletedView && selectedSprintId === WORK_QUEUE_SELECTION_ID;
    // The focused iteration drives the modals (edit / details / delete / archive) and the
    // header Create menu. Only re-validate it when the underlying sprint set changes —
    // selecting another sprint from its own row menu must never snap back to the active one.
    // The Work Queue sentinel selection is always valid and is never re-mapped.
    useEffect(() => {
        setSelectedSprintId((prev) => prev === WORK_QUEUE_SELECTION_ID || projectSprints.some((s) => s.id === prev)
            ? prev
            : defaultSprint.id);
    }, [projectSprints, defaultSprint]);
    const currentSprint = projectSprints.find((s) => s.id === selectedSprintId) || defaultSprint;
    const currentPiNumber = useMemo(() => (currentSprint ? piNumberForSprint(currentSprint, pis) : undefined), [currentSprint, pis]);
    const currentDaysLeft = useMemo(() => {
        if (!currentSprint || !currentSprint.endDate)
            return 0;
        const end = new Date(currentSprint.endDate);
        const now = new Date();
        if (isNaN(end.getTime()))
            return 0;
        const ms = end.getTime() - now.getTime();
        return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
    }, [currentSprint]);
    // One-based sprint identifiers: <Project Key><PI>.<Iteration Number>, e.g. ECOMM4.1
    const sprintIdentifiers = useMemo(() => buildSprintIdentifiers(projectSprints, projectKey), [projectSprints, projectKey]);
    const getSprintIdentifier = (sprint) => formatSprintIdentifier(sprint, projectKey, sprintIdentifiers);
    // Format any sprint as "ECOMM4.1 [15 SEP - 28 SEP]"
    const formatSprintTitle = (sprint) => formatSprintFullTitle(sprint, projectKey, sprintIdentifiers);
    const sprintDisplayTitle = formatSprintTitle(currentSprint);
    // Project team members for Quick Filters
    const projectTeamMembers = useMemo(() => buildProjectTeamMembers(project, teams, users), [project, teams, users]);
    // Per-iteration issue lists: the sprint's real work items first, topped up with
    // domain seed items so every expandable iteration section renders with realistic
    // volume. Shared with the Issue Search page so both views show identical records.
    const computedIssuesBySprint = useMemo(() => buildSprintIssuesMap({
        tasks,
        users,
        project,
        projectId,
        projectKey,
        projectTeamMembers,
        projectSprints,
    }), [tasks, projectId, projectSprints, project, projectKey, users, projectTeamMembers]);
    // Work Items created during this session, tracked per iteration so they show up in the
    // right expandable section alongside the computed ones.
    const [localIssuesBySprint, setLocalIssuesBySprint] = useState({});
    const getIssuesForSprint = (sprintId) => [
        ...(localIssuesBySprint[sprintId] || []),
        ...(computedIssuesBySprint[sprintId] || []),
    ];
    // Stable issue-key range for newly created work items inside a given iteration
    const nextIssueKeyBase = (sprintId) => {
        const idx = projectSprints.findIndex((s) => s.id === sprintId);
        return (idx >= 0 ? idx : 0) * 1000;
    };
    // State
    const [selectedIssueIds, setSelectedIssueIds] = useState([]);
    // Per-iteration expand/collapse — the active iteration starts expanded so the page
    // opens with a visible issue list, exactly like the reference backlog view.
const [expandedSprintIds, setExpandedSprintIds] = useState({});
const [isAllSprintsCollapsed, setIsAllSprintsCollapsed] = useState(false);
// Whenever the user returns to this page (the route changes back to Iterations),
// expand every iteration. This also works when the parent layout keeps this
// component mounted while navigating between pages.
useEffect(() => {
    const expanded = {};
    projectSprints.forEach((sprint) => {
        expanded[sprint.id] = true;
    });
    setExpandedSprintIds(expanded);
    setIsAllSprintsCollapsed(false);
}, [location.pathname, projectId]);
const isSprintOpen = (sprintId) =>
    expandedSprintIds[sprintId] !== undefined
        ? expandedSprintIds[sprintId]
        : sprintId === defaultSprint.id;

const toggleSprintOpen = (sprintId) => {
    setExpandedSprintIds((prev) => ({
        ...prev,
        [sprintId]: !(prev[sprintId] !== undefined
            ? prev[sprintId]
            : sprintId === defaultSprint.id),
    }));
};
    // The Work Queue card reuses the SAME expandedSprintIds accordion state
    // (keyed by the sentinel id) so its chevron, selection and the right-panel
    // table collapse stay in lockstep with the iteration cards' behaviour.
    const isWorkQueueOpen = () => expandedSprintIds[WORK_QUEUE_SELECTION_ID] !== undefined
        ? expandedSprintIds[WORK_QUEUE_SELECTION_ID]
        : isWorkQueueSelected;
    // Global "Collapse All" — writes an explicit collapsed flag for every sprint into
    // the SAME expandedSprintIds state the individual chevrons use, so all cards fold
    // at once while each chevron keeps toggling independently afterwards.
const collapseAllSprints = () => {
    if (!isAllSprintsCollapsed) {
        const collapsed = {};
        projectSprints.forEach((sprint) => {
            collapsed[sprint.id] = false;
        });
        setExpandedSprintIds(collapsed);
        setIsAllSprintsCollapsed(true);
    } else {
        const expanded = {};
        projectSprints.forEach((sprint) => {
            expanded[sprint.id] = true;
        });
        setExpandedSprintIds(expanded);
        setIsAllSprintsCollapsed(false);
    }
};
    // Per-sprint open menus (only one row menu / status switcher open at a time)
    const [moreMenuSprintId, setMoreMenuSprintId] = useState(null);
    const [statusDropdownSprintId, setStatusDropdownSprintId] = useState(null);
    // Iteration that will receive a newly created issue
    const [issueTargetSprintId, setIssueTargetSprintId] = useState(null);
    // Quick filters state
    const [activePersonFilters, setActivePersonFilters] = useState([]);
    const [onlyMyIssues, setOnlyMyIssues] = useState(false);
    const [recentlyUpdatedOnly, setRecentlyUpdatedOnly] = useState(false);
    const [showFewer, setShowFewer] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    // Modals & Popovers
    const [showLinkedPagesModal, setShowLinkedPagesModal] = useState(false);
    const [showCreateIssueModal, setShowCreateIssueModal] = useState(false);
    const [showCreateSprintModal, setShowCreateSprintModal] = useState(false);
    const [createDropdownOpen, setCreateDropdownOpen] = useState(false);
    const [assigneesPopoverSprintId, setAssigneesPopoverSprintId] = useState(null);
    const [boardDropdownOpen, setBoardDropdownOpen] = useState(false);
    const [showEditSprintModal, setShowEditSprintModal] = useState(false);
    const [showIterationDetailsModal, setShowIterationDetailsModal] = useState(false);
    const [showDeleteSprintConfirm, setShowDeleteSprintConfirm] = useState(false);
    // Start-while-active conflict: the target iteration to start and the already-active
    // iteration that must be completed first (one active iteration at a time).
    const [startConflict, setStartConflict] = useState(null);
    const [completingSprint, setCompletingSprint] = useState(null);
    // Edit Iteration Form State
    const [editSprintName, setEditSprintName] = useState('');
    const [editSprintGoal, setEditSprintGoal] = useState('');
    const [editSprintStartDate, setEditSprintStartDate] = useState('');
    const [editSprintEndDate, setEditSprintEndDate] = useState('');
    // Create Iteration modal state — iteration creation always runs through the
    // shared PI-aware modal (Project → PI → Iteration), optionally preselecting
    // the PI whose "+ Add Iteration" opened it. PIs themselves are created at
    // project level (Project → Product Increments), not on this page.
    const [createIterationPiId, setCreateIterationPiId] = useState(undefined);
    const { productIncrementsUrl } = useIterationPaths();
    // Linked Pages tailored to this project
    const [linkedPages, setLinkedPages] = useState([
        {
            id: 'lp-1',
            title: `${project?.name || 'Project'} — Iteration Architecture & Delivery Blueprint`,
            url: 'https://confluence.enterprise.internal/pages/sprint-blueprint',
            space: `${projectKey} Engineering`,
            updatedAt: '01/Sep/26 10:15 AM'
        },
        {
            id: 'lp-2',
            title: `${projectKey} SIT & Regression Verification Test Matrix`,
            url: 'https://confluence.enterprise.internal/pages/sit-verification',
            space: 'QA & Compliance',
            updatedAt: '03/Sep/26 2:30 PM'
        },
        {
            id: 'lp-3',
            title: `${project?.name || 'Project'} Core Domain Data Model Specification`,
            url: 'https://confluence.enterprise.internal/pages/data-model-spec',
            space: `${projectKey} Architecture`,
            updatedAt: '05/Sep/26 11:20 AM'
        },
        {
            id: 'lp-4',
            title: `${projectKey} Release Readiness & Production Checklist`,
            url: 'https://confluence.enterprise.internal/pages/release-readiness',
            space: 'Release Operations',
            updatedAt: '08/Sep/26 4:00 PM'
        }
    ]);
    const [newPageTitle, setNewPageTitle] = useState('');
    const [newPageUrl, setNewPageUrl] = useState('');
    // Create issue form
    const [newIssueSummary, setNewIssueSummary] = useState('');
    const [newIssueType, setNewIssueType] = useState('STORY');
    const [newIssuePoints, setNewIssuePoints] = useState(3);
    const [newIssueEpic, setNewIssueEpic] = useState('Core Platform');
    const [newIssueAssignee, setNewIssueAssignee] = useState(projectTeamMembers[0]?.name || 'Priya Sharma');
    // Apply the quick filters / search to any iteration's issue list
    const filterIssues = (list) => {
        return list.filter((issue) => {
            // Search query
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchesKey = issue.key.toLowerCase().includes(query);
                const matchesTitle = issue.title.toLowerCase().includes(query);
                const matchesEpic = issue.epicName.toLowerCase().includes(query);
                const matchesRelease = issue.releaseTag.toLowerCase().includes(query);
                const matchesAssignee = issue.assigneeName.toLowerCase().includes(query);
                if (!matchesKey && !matchesTitle && !matchesEpic && !matchesRelease && !matchesAssignee) {
                    return false;
                }
            }
            // Quick filter: Person
            if (activePersonFilters.length > 0) {
                if (!activePersonFilters.includes(issue.assigneeName)) {
                    return false;
                }
            }
            // Quick filter: Only My Work Items
            if (onlyMyIssues) {
                const myName = currentUser?.name?.toLowerCase() || '';
                if (!issue.assigneeName.toLowerCase().includes(myName.split(' ')[0])) {
                    return false;
                }
            }
            // Quick filter: Recently Updated
            if (recentlyUpdatedOnly) {
                if (issue.updatedDate < '2026-09-04') {
                    return false;
                }
            }
            return true;
        });
    };
    const hasActiveFilters = activePersonFilters.length > 0 || onlyMyIssues || recentlyUpdatedOnly || Boolean(searchQuery.trim());
    // Estimation counts (Todo, In Progress, Done points) for a single iteration
    const computeStats = (list) => {
        let todoCount = 0;
        let inProgCount = 0;
        let doneCount = 0;
        list.forEach((t) => {
            // Cancelled work is out of scope for estimation counts.
            if (isCancelledWorkItem(t)) {
                return;
            }
            if (t.status === 'DONE') {
                doneCount += t.storyPoints;
            }
            else if (t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW' || t.status === 'TESTING' || t.status === 'BUG_FIX') {
                inProgCount += t.storyPoints;
            }
            else {
                todoCount += t.storyPoints;
            }
        });
        return {
            todoPoints: todoCount,
            inProgPoints: inProgCount,
            donePoints: doneCount,
            totalIssues: list.length,
        };
    };
    // Flagged (🚩) work items inside one iteration
    const countFlaggedForSprint = (sprintId) => tasks.filter((t) => t.projectId === projectId && t.sprintId === sprintId && t.isFlagged).length;
    // Members shown on an iteration row: the sprint roster when set, otherwise the
    // project team — never fabricated names.
    const getSprintMembers = (sprint) => {
        const sprintIds = sprint.memberIds || [];
        if (sprintIds.length > 0) {
            const roster = users.filter((u) => sprintIds.includes(u.id));
            if (roster.length > 0)
                return roster;
        }
        return projectTeamMembers;
    };
    const togglePersonFilter = (name) => {
        setActivePersonFilters((prev) => prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]);
    };
    const clearAllFilters = () => {
        setActivePersonFilters([]);
        setOnlyMyIssues(false);
        setRecentlyUpdatedOnly(false);
        setSearchQuery('');
        setComponentFilter('');
        setStatusFilter('');
        setPiFilter('');
        toast.info('All filters cleared');
    };
    // Open the shared PI-aware Create Iteration modal, optionally preselecting
    // the PI whose group control was clicked (Project → PI → Add Iteration).
    const openCreateIteration = (piId) => {
        // Event-handler guard: completed PIs never accept new iterations.
        const pi = piId ? pis.find((p) => p.id === piId) : undefined;
        if (pi && !canCreateIterationInPi(pi, sprints)) {
            toast.error(`${pi.name} is completed — iterations cannot be added to a completed PI.`);
            return;
        }
        setCreateIterationPiId(piId);
        setShowCreateSprintModal(true);
    };
    // Open the Edit Iteration modal pre-filled with the target iteration's real data
    const openEditSprintModal = (sprint) => {
        if (!canEditSprint(sprintRole)) {
            toast.error('You do not have permission to edit iterations');
            return;
        }
        const target = sprint || currentSprint;
        setSelectedSprintId(target.id);
        setEditSprintName(getSprintIdentifier(target));
        setEditSprintGoal(target.goal || '');
        setEditSprintStartDate(target.startDate || '');
        setEditSprintEndDate(target.endDate || '');
        setShowEditSprintModal(true);
    };
    const handleEditSprintSubmit = (e) => {
        e.preventDefault();
        if (!canEditSprint(sprintRole)) {
            toast.error('You do not have permission to edit iterations');
            setShowEditSprintModal(false);
            return;
        }
        updateSprint(currentSprint.id, {
            name: editSprintName.trim() || getSprintIdentifier(currentSprint),
            goal: editSprintGoal.trim(),
            startDate: editSprintStartDate || currentSprint.startDate,
            endDate: editSprintEndDate || currentSprint.endDate,
        });
        toast.success(`${editSprintName.trim() || getSprintIdentifier(currentSprint)} updated`);
        setShowEditSprintModal(false);
    };
    const handleArchiveSprint = (sprint) => {
        if (!canArchiveSprint(sprintRole)) {
            toast.error('You do not have permission to archive iterations');
            return;
        }
        const target = sprint || currentSprint;
        updateSprint(target.id, { isArchived: true });
        setMoreMenuSprintId(null);
        toast.success(`${getSprintIdentifier(target)} archived`);
    };
    const handleDeleteSprintConfirmed = () => {
        if (!canDeleteSprint(sprintRole)) {
            toast.error('You do not have permission to delete iterations');
            setShowDeleteSprintConfirm(false);
            return;
        }
        const name = getSprintIdentifier(currentSprint);
        deleteSprint(currentSprint.id);
        setShowDeleteSprintConfirm(false);
        toast.success(`Iteration "${name}" deleted. Its tasks were returned to the work queue.`);
    };
    // Start an upcoming iteration (row-level "Start sprint" action on the reference view).
    // Only one iteration may be active: if the project already has an active sprint,
    // confirm completing it before the selected one starts.
    const actuallyStartSprint = (sprint) => {
        updateSprintStatus(sprint.id, 'ACTIVE');
        selectSprint(sprint.id);
        toast.success(`${formatSprintTitle(sprint).split(' [')[0]} started`);
    };
    const handleStartSprint = (sprint) => {
        if (!canStartSprint(sprintRole)) {
            toast.error('You do not have permission to start iterations');
            return;
        }
        setMoreMenuSprintId(null);
        setSelectedSprintId(sprint.id);
        const activeSprint = sprints.find((s) => s.projectId === sprint.projectId && s.status === 'ACTIVE' && s.id !== sprint.id);
        if (activeSprint) {
            setStartConflict({ target: sprint, active: activeSprint });
            return;
        }
        actuallyStartSprint(sprint);
    };
    const handleStartSprintConfirmed = () => {
        if (!startConflict)
            return;
        const { target, active } = startConflict;
        // Move the outgoing sprint's incomplete issues into the one being started,
        // complete it, then activate the target — single active iteration invariant.
        handleIncompleteTasks(active.id, 'MOVE_TO_NEXT_SPRINT');
        updateSprintStatus(active.id, 'COMPLETED');
        actuallyStartSprint(target);
        setStartConflict(null);
    };
    // Complete Iteration — opens the existing sprint completion flow (handles incomplete
    // issues via Move to Work Queue / Move to next sprint / Keep in completed sprint).
    const handleCompleteSprint = (sprint) => {
        if (!canCompleteSprint(sprintRole)) {
            toast.error('You do not have permission to complete iterations');
            return;
        }
        setMoreMenuSprintId(null);
        setSelectedSprintId(sprint.id);
        setCompletingSprint(sprint);
    };
    const handleCreateIssue = (e) => {
        e.preventDefault();
        if (!newIssueSummary.trim())
            return;
        const targetSprintId = issueTargetSprintId || currentSprint.id;
        // The Work Queue is a valid create target: its local issues are stored
        // under the same per-sprint map, keyed by the sentinel selection id.
        const isWorkQueueTarget = targetSprintId === WORK_QUEUE_SELECTION_ID;
        const targetSprint = projectSprints.find((s) => s.id === targetSprintId) || currentSprint;
        const localCount = (localIssuesBySprint[targetSprintId]?.length || 0) + (computedIssuesBySprint[targetSprintId]?.length || 0);
        const nextIdNum = nextIssueKeyBase(targetSprintId) + 900 + localCount + 1;
        const newKey = `${projectKey}-${nextIdNum}`;
        const newIssue = {
            id: `task-new-${targetSprintId}-${nextIdNum}`,
            key: newKey,
            title: newIssueSummary.trim(),
            type: newIssueType,
            priority: 'HIGH',
            status: 'TODO',
            releaseTag: `${projectKey} PI24`,
            epicName: newIssueEpic,
            epicColor: getEpicColor(newIssueEpic),
            assigneeName: newIssueAssignee,
            assigneeInitial: newIssueAssignee[0] || 'U',
            assigneeAvatarColor: '#0284c7',
            storyPoints: Number(newIssuePoints) || 3,
            updatedDate: new Date().toISOString().split('T')[0]
        };
        setLocalIssuesBySprint((prev) => ({
            ...prev,
            [targetSprintId]: [newIssue, ...(prev[targetSprintId] || [])],
        }));
        if (isWorkQueueTarget)
            selectWorkQueue();
        else
            selectSprint(targetSprintId);
        setIssueTargetSprintId(null);
        toast.success(isWorkQueueTarget
            ? `Created ${newKey} in the Work Queue`
            : `Created ${newKey} in ${formatSprintTitle(targetSprint).split(' [')[0]} iteration`);
        setNewIssueSummary('');
        setShowCreateIssueModal(false);
    };
    // Navigate to or open the full task page for a specific task. Seed issues are
    // materialised into real work items first — shared with the Issue Search page.
    // `sprintId: null` means the row lives in the Work Queue (no sprint anchor).
    const handleOpenTask = (issue, openInNewTab = false, sprintId) => {
        const targetTaskId = resolveIssueTaskId({
            issue,
            projectId,
            sprintId: sprintId === null ? null : sprintId || currentSprint.id,
            users,
            currentUser,
        });
        const targetUrl = issuePath(targetTaskId);
        if (openInNewTab) {
            window.open(appHref(targetUrl), '_blank', 'noopener,noreferrer');
        }
        else {
            navigate(targetUrl);
        }
    };
    // Row action menu (⋯): Open / Move Work Item. The menu itself never
    // navigates — only its explicit items act, each stopping propagation so the
    // row's own click → Details navigation is never triggered.
    const ROW_ACTION_MENU_W = 176;
    const [rowActionMenu, setRowActionMenu] = useState(null);
    const [movingTask, setMovingTask] = useState(null);
    // Move Work Item opens over this page. Remember the user's scroll position,
    // then nudge the page down just enough that the moved item's sprint header
    // (e.g. the active iteration card) sits above the modal instead of behind
    // it. The adjustment is computed from the sprint card's rect and the
    // modal's measured rect — never a fixed offset — so it adapts to content
    // and viewport size. The page is never unmounted or recreated; only the
    // window scroll position changes (the modal is fixed-positioned, so it
    // does not move). Restored on close/cancel/success.
    const moveModalScrollYRef = useRef(null);
    useEffect(() => {
        if (!movingTask) {
            if (moveModalScrollYRef.current !== null) {
                const prev = moveModalScrollYRef.current;
                moveModalScrollYRef.current = null;
                window.scrollTo({ top: prev, left: 0, behavior: 'auto' });
            }
            return;
        }
        // Only iterations that live in a sprint card can be repositioned.
        const sprintId = movingTask.sprintId;
        if (!sprintId)
            return;
        // Measure after render (useEffect runs post-commit).
        const card = document.querySelector(`[data-sprint-card="${sprintId}"]`);
        const modal = document.querySelector('[data-move-task-modal]');
        if (!card || !modal)
            return;
        const cardTop = card.getBoundingClientRect().top;
        const desiredTop = modal.getBoundingClientRect().top - 12; // small gap above the modal
        if (cardTop <= desiredTop)
            return; // header already visible above the modal — no scroll
        const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const target = Math.min(window.scrollY + (cardTop - desiredTop), maxScroll);
        if (target > window.scrollY) {
            moveModalScrollYRef.current = window.scrollY;
            window.scrollTo({ top: target, left: 0, behavior: 'auto' });
        }
    }, [movingTask]);
    useEffect(() => {
        if (!rowActionMenu)
            return;
        const closeOnPointer = (e) => {
            const target = e.target;
            if (target && target.closest('[data-row-menu]'))
                return;
            setRowActionMenu(null);
        };
        const closeOnKeyDown = (e) => {
            if (e.key === 'Escape')
                setRowActionMenu(null);
        };
        const closeOnScroll = () => setRowActionMenu(null);
        document.addEventListener('mousedown', closeOnPointer);
        document.addEventListener('keydown', closeOnKeyDown);
        window.addEventListener('scroll', closeOnScroll, true);
        return () => {
            document.removeEventListener('mousedown', closeOnPointer);
            document.removeEventListener('keydown', closeOnKeyDown);
            window.removeEventListener('scroll', closeOnScroll, true);
        };
    }, [rowActionMenu]);
    const toggleRowActionMenu = (e, issue, sprintId) => {
        e.stopPropagation();
        e.preventDefault();
        // Close any competing popovers on this page.
        setMoreMenuSprintId(null);
        setStatusDropdownSprintId(null);
        setAssigneesPopoverSprintId(null);
        setBoardDropdownOpen(false);
        setCreateDropdownOpen(false);
        closeWorkItemMenus();
        if (rowActionMenu && rowActionMenu.issue.id === issue.id) {
            setRowActionMenu(null);
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.max(8, Math.min(rect.left, window.innerWidth - ROW_ACTION_MENU_W - 8));
        const y = Math.max(8, Math.min(rect.bottom + 4, window.innerHeight - 96));
        setRowActionMenu({ issue, sprintId, x, y });
    };
    const rowActionOpen = () => {
        if (!rowActionMenu)
            return;
        const { issue, sprintId } = rowActionMenu;
        setRowActionMenu(null);
        handleOpenTask(issue, false, sprintId);
    };
    const rowActionMove = () => {
        if (!rowActionMenu)
            return;
        const { issue, sprintId } = rowActionMenu;
        setRowActionMenu(null);
        const targetTaskId = resolveIssueTaskId({
            issue,
            projectId,
            sprintId: sprintId === null ? null : sprintId || currentSprint.id,
            users,
            currentUser,
        });
        const targetTask = useAppStore.getState().tasks.find((t) => t.id === targetTaskId);
        if (targetTask)
            setMovingTask(targetTask);
    };
    const handleAddLinkedPage = (e) => {
        e.preventDefault();
        if (!newPageTitle.trim())
            return;
        const newPage = {
            id: `lp-${Date.now()}`,
            title: newPageTitle.trim(),
            url: newPageUrl.trim() || `https://confluence.enterprise.internal/pages/${encodeURIComponent(newPageTitle)}`,
            space: `${projectKey} Operations`,
            updatedAt: 'Just now'
        };
        setLinkedPages((prev) => [newPage, ...prev]);
        setNewPageTitle('');
        setNewPageUrl('');
        toast.success('Linked page added to iteration');
    };
    // =====================================================================
    // Two-panel Iterations layout
    // =====================================================================
    // LEFT panel — iteration list: text search, Program Increment filter and the
    // status tabs (All / Active / Upcoming / Completed), all driven by the
    // project's real iteration records (archived iterations stay hidden, exactly
    // as in the PI plan the page used before).
    const iterationSource = useMemo(() => projectSprints.filter((s) => !s.isArchived), [projectSprints]);
    const [iterationQuery, setIterationQuery] = useState('');
    const [statusTab, setStatusTab] = useState(isCompletedView ? 'COMPLETED' : 'ALL');
    // `?pi=<id>` (Project → Product Increments → "Open iterations") opens the
    // list pre-filtered to that PI; unknown or foreign ids fall back to All.
    const [searchParams, setSearchParams] = useSearchParams();
    const requestedPiId = searchParams.get('pi');
    const isProjectPi = (id) => !!id && projectPis.some((p) => p.id === id);
    const [piGroupFilter, setPiGroupFilter] = useState(() => isProjectPi(requestedPiId) ? requestedPiId : 'ALL');
    const [iterFilterOpen, setIterFilterOpen] = useState(false);
    // The PI filter and `?pi=` stay in sync, so refresh, direct links and
    // Back/Forward always show the same PI. Picking a filter rewrites the URL
    // in place (replace) instead of stacking history entries.
    const selectPiFilter = (key) => {
        setPiGroupFilter(key);
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (isProjectPi(key))
                next.set('pi', key);
            else
                next.delete('pi');
            return next;
        }, { replace: true });
    };
    useEffect(() => {
        // URL changed underneath us (Back/Forward, a new link) → follow it.
        setPiGroupFilter((prev) => {
            const wanted = isProjectPi(requestedPiId) ? requestedPiId : 'ALL';
            if (prev === wanted)
                return prev;
            // A derived (non-record) group selected without ?pi stays as is.
            return !requestedPiId && !isProjectPi(prev) ? prev : wanted;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [requestedPiId]);
    // The PI the page is scoped to (a real PI record), and its own iterations.
    const piFilterPi = piGroupFilter !== 'ALL' ? projectPis.find((p) => p.id === piGroupFilter) : undefined;
    const piFilterIterations = useMemo(() => (piFilterPi
        ? iterationSource.filter((s) => s.piId === piFilterPi.id).sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''))
        : []), [piFilterPi, iterationSource]);
    const showPiEmpty = !!piFilterPi && piFilterIterations.length === 0;
    // Never show another PI's iteration while scoped to a PI: move the
    // selection to this PI's first iteration (the Work Queue card stays allowed).
    useEffect(() => {
        if (!piFilterPi || isCompletedView || piFilterIterations.length === 0)
            return;
        setSelectedSprintId((prev) => prev === WORK_QUEUE_SELECTION_ID || piFilterIterations.some((s) => s.id === prev)
            ? prev
            : piFilterIterations[0].id);
    }, [piFilterPi, piFilterIterations, isCompletedView]);
    // RIGHT panel — work-item toolbar: Assignee / Component / Status / PI /
    // More Filters (the existing quick filters keep their behaviour) over the
    // filtered rows.
    const [assigneeFilterOpen, setAssigneeFilterOpen] = useState(false);
    const [componentFilter, setComponentFilter] = useState('');
    const [componentFilterOpen, setComponentFilterOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [statusFilterOpen, setStatusFilterOpen] = useState(false);
    const [piFilter, setPiFilter] = useState('');
    const [piFilterOpen, setPiFilterOpen] = useState(false);
    const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
    const closeWorkItemMenus = () => {
        setAssigneeFilterOpen(false);
        setComponentFilterOpen(false);
        setStatusFilterOpen(false);
        setPiFilterOpen(false);
        setMoreFiltersOpen(false);
        setIterFilterOpen(false);
    };
    // The Completed history view lives on its own route (`.../iterations/completed`),
    // so the left-panel tab follows the view prop whenever the route switches.
    useEffect(() => {
        setStatusTab(isCompletedView ? 'COMPLETED' : 'ALL');
    }, [isCompletedView]);
    // Iteration-list scope: status tab + PI filter + text search over the real
    // iteration fields (identifier, stored number/name and goal).
    const iterationPiGroups = useMemo(() => groupSprintsByPi(iterationSource, pis, projectId), [iterationSource, pis, projectId]);
    const sprintPiKeyById = useMemo(() => {
        const map = new Map();
        iterationPiGroups.forEach((group) => group.sprints.forEach((s) => map.set(s.id, group.key)));
        return map;
    }, [iterationPiGroups]);
    const statusCounts = useMemo(() => ({
        ALL: iterationSource.length,
        ACTIVE: iterationSource.filter((s) => s.status === 'ACTIVE').length,
        UPCOMING: iterationSource.filter((s) => s.status === 'PLANNED').length,
        COMPLETED: iterationSource.filter((s) => s.status === 'COMPLETED').length,
    }), [iterationSource]);
    const matchesIterationFilters = (sprint) => {
        if (statusTab === 'ACTIVE' && sprint.status !== 'ACTIVE')
            return false;
        if (statusTab === 'UPCOMING' && sprint.status !== 'PLANNED')
            return false;
        if (statusTab === 'COMPLETED' && sprint.status !== 'COMPLETED')
            return false;
        if (piGroupFilter !== 'ALL' && sprintPiKeyById.get(sprint.id) !== piGroupFilter)
            return false;
        const query = iterationQuery.trim().toLowerCase();
        if (query) {
            const haystack = [getSprintIdentifier(sprint), sprint.name, sprint.iterationNumber, sprint.goal]
                .join(' ')
                .toLowerCase();
            if (!haystack.includes(query))
                return false;
        }
        return true;
    };
    const visibleIterations = iterationSource.filter(matchesIterationFilters);
    // Summary of the PI selected in the iteration filter — every value comes
    // from real records: stored PI dates/goal (PIs created via Create PI) or the
    // min/max of its iterations' dates, the plan's derived PI status, and
    // DONE vs. total store work items actually assigned (task.sprintId) to its
    // iterations. Deliberately NOT getIssuesForSprint: that list is topped up
    // with domain sample items (buildSprintIssuesMap), which are not real data.
    const selectedPiSummary = useMemo(() => {
        if (piGroupFilter === 'ALL')
            return null;
        const group = iterationPiGroups.find((g) => g.key === piGroupFilter);
        if (!group)
            return null;
        const pi = pis.find((p) => p.id === group.piId);
        const planEntry = piPlan.find((p) => p.id === (group.piId || group.key));
        const sprintIds = new Set(group.sprints.map((s) => s.id));
        const piTasks = tasks.filter((t) => sprintIds.has(t.sprintId) && !isCancelledWorkItem(t));
        const done = piTasks.filter((t) => t.status === 'DONE').length;
        return {
            label: pi?.title ? `${group.label} — ${pi.title}` : group.label,
            goal: pi?.description || pi?.goal,
            pi,
            startDate: pi?.startDate || planEntry?.startDate,
            endDate: pi?.endDate || planEntry?.endDate,
            status: pi ? piStatusOf(pi, sprints) : group.sprints.length ? planEntry?.status : undefined,
            iterationCount: group.sprints.length,
            taskTotal: piTasks.length,
            taskDone: done,
            pct: piTasks.length ? Math.round((done / piTasks.length) * 100) : 0,
        };
    }, [piGroupFilter, iterationPiGroups, pis, piPlan, tasks, sprints]);
    // Completed history stays grouped under its original PI (existing behaviour).
    const visiblePiGroups = useMemo(() => (isCompletedView ? groupSprintsByPi(visibleIterations, pis, projectId) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleIterations, pis, projectId, isCompletedView]);
    const visibleIdsKey = visibleIterations.map((s) => s.id).join(',');
    // Selected iteration — its work items, the toolbar filter options derived from
    // them (component / status / PI come from real data, never invented) and its
    // estimation stats. With the Work Queue card selected, the SAME pipeline runs
    // over the queue's pool rows instead, so the toolbar, filters, links, row
    // actions and status interactions are identical in both modes.
    const workQueueIssues = useMemo(() => [...(localIssuesBySprint[WORK_QUEUE_SELECTION_ID] || []), ...workQueuePool.map(toIterationIssue)], [localIssuesBySprint, workQueuePool]);
    const currentIssues = isWorkQueueSelected ? workQueueIssues : getIssuesForSprint(currentSprint.id);
    const storeTaskById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);
    const workItemFilterOptions = useMemo(() => {
        const components = new Set();
        const releaseTags = new Set();
        const statusValues = new Set();
        const statusLabels = new Map();
        currentIssues.forEach((issue) => {
            if (issue.epicName)
                components.add(issue.epicName);
            if (issue.releaseTag)
                releaseTags.add(issue.releaseTag);
            const value = displayTaskStatus(issue);
            statusValues.add(value);
            if (!statusLabels.has(value)) {
                statusLabels.set(value, isCancelledWorkItem(issue) ? 'Cancelled' : getStatusLabel(value));
            }
        });
        return {
            components: [...components].sort(),
            statuses: [...statusValues].map((value) => ({ value, label: statusLabels.get(value) || value })),
            releaseTags: [...releaseTags].sort(),
        };
    }, [currentIssues]);
    // Existing quick filters / search first, then the toolbar's own selects.
    const filteredIssues = filterIssues(currentIssues).filter((issue) => {
        if (componentFilter && issue.epicName !== componentFilter)
            return false;
        if (statusFilter && displayTaskStatus(issue) !== statusFilter)
            return false;
        if (piFilter && issue.releaseTag !== piFilter)
            return false;
        return true;
    });
    // A tab / filter change can hide the selected iteration — fall back to the
    // first iteration still visible so the right panel always has a subject.
    // The Work Queue selection is independent of the iteration filters, so it is
    // never re-mapped away.
    useEffect(() => {
        if (selectedSprintId === WORK_QUEUE_SELECTION_ID)
            return;
        if (!visibleIdsKey)
            return;
        if (visibleIdsKey.split(',').includes(selectedSprintId))
            return;
        setSelectedSprintId(visibleIdsKey.split(',')[0]);
    }, [visibleIdsKey, selectedSprintId]);
    // Comment counts and dates come from the real work-item record once the issue
    // is materialised, otherwise from the shared issue-comment store.
    const commentCountFor = (issue) => {
        const task = storeTaskById.get(issue.id);
        if (task)
            return task.comments.length;
        return issueComments[issue.id]?.length || 0;
    };
    const formatDay = (iso) => {
        if (!iso)
            return '—';
        const d = new Date(iso);
        if (Number.isNaN(d.getTime()))
            return '—';
        return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    };
    // Solid left-edge accent for table rows, keyed to work-item type (reference design).
    const typeAccent = {
        STORY: 'border-l-[#059669]',
        TASK: 'border-l-[#2563eb]',
        BUG: 'border-l-[#dc2626]',
        'BUG-FIX': 'border-l-[#dc2626]',
        'BUG_FIX': 'border-l-[#dc2626]',
        EPIC: 'border-l-[#7c3aed]',
        FEATURE: 'border-l-[#0d9488]',
        INITIATIVE: 'border-l-[#d97706]',
        'SUB-TASK': 'border-l-[#0891b2]',
        SUBTASK: 'border-l-[#0891b2]',
        IMPROVEMENT: 'border-l-[#db2777]',
    };
    const typeLabelShort = {
        STORY: 'Story',
        TASK: 'Task',
        BUG: 'Bug',
        'BUG-FIX': 'Bug Fix',
        EPIC: 'Epic',
        FEATURE: 'Feature',
        INITIATIVE: 'Initiative',
        'SUB-TASK': 'Sub-task',
        SUBTASK: 'Sub-task',
        IMPROVEMENT: 'Improvement',
    };
    // ------------------------------------------------------------------
    // Selected iteration — the summary hosts the status switcher, member
    // popover and iteration actions menu, all previously on the card head.
    // ------------------------------------------------------------------
    const statusMenuOpen = statusDropdownSprintId === currentSprint.id;
    const rowMenuOpen = moreMenuSprintId === currentSprint.id;
    const assigneesOpen = assigneesPopoverSprintId === currentSprint.id;
    const closeAllRowUi = () => {
        setMoreMenuSprintId(null);
        setStatusDropdownSprintId(null);
        setAssigneesPopoverSprintId(null);
    };
    const showStart = canManage && currentSprint.status === 'PLANNED';
    const showComplete = canManage && currentSprint.status === 'ACTIVE';
    const showEdit = canManage && currentSprint.status !== 'COMPLETED';
    const showArchive = canArchive &&
        currentSprint.status !== 'ACTIVE' &&
        (sprintRole === 'ADMIN' || currentSprint.status === 'COMPLETED');
    const showDelete = canDelete && currentSprint.status !== 'ACTIVE';
    const currentShortTitle = formatSprintPiTitle(currentSprint, projectKey, sprintIdentifiers).split(' [')[0];
    const currentStats = computeStats(currentIssues);
    const currentCommentCount = currentIssues.reduce((sum, issue) => sum + commentCountFor(issue), 0);
    const currentMembers = getSprintMembers(currentSprint);
    const currentFlagged = countFlaggedForSprint(currentSprint.id);
    const currentOpen = isWorkQueueSelected ? isWorkQueueOpen() : isSprintOpen(currentSprint.id);
    // ------------------------------------------------------------------
    // Selection + expansion: one iteration's work items are open at a time, so
    // the selected card, its chevron and "Collapse All" always describe the
    // same state (body selects, chevron toggles once selected).
    // ------------------------------------------------------------------
    const openOnlySprint = (sprintId) => {
        const next = {};
        projectSprints.forEach((s) => {
            next[s.id] = s.id === sprintId;
        });
        setExpandedSprintIds(next);
    };
    const selectSprint = (sprintId) => {
        setSelectedSprintId(sprintId);
        openOnlySprint(sprintId);
        // Keep the selected-iteration summary in view when the user picks a card
        // from a scrolled list — the summary is the first block of the right
        // column, so scrolling the page to its top guarantees it sits above the
        // work-item table without any nested-scroll clipping.
        requestAnimationFrame(() => {
            const summary = document.querySelector('[data-iteration-summary]');
            const main = document.querySelector('main');
            if (!summary)
                return;
            const rect = summary.getBoundingClientRect();
            const mainRect = main?.getBoundingClientRect();
            const visibleTop = mainRect ? mainRect.top : 0;
            if (rect.top < visibleTop + 8 || rect.top > window.innerHeight * 0.65) {
                summary.scrollIntoView({ block: 'start', behavior: 'smooth' });
            }
        });
    };
    const handleCardChevron = (sprintId) => {
        if (sprintId !== selectedSprintId)
            selectSprint(sprintId);
        else
            toggleSprintOpen(sprintId);
    };
    // Work Queue selection mirrors the iteration cards: selecting it folds every
    // iteration accordion and opens the queue; its chevron toggles the queue's
    // own work-item table once it is the selected subject.
    const selectWorkQueue = () => {
        setSelectedSprintId(WORK_QUEUE_SELECTION_ID);
        const next = {};
        projectSprints.forEach((s) => {
            next[s.id] = false;
        });
        next[WORK_QUEUE_SELECTION_ID] = true;
        setExpandedSprintIds(next);
        // Same scroll-into-view as selectSprint — the summary is the first block
        // of the right column, so it always sits above the work-item table.
        requestAnimationFrame(() => {
            const summary = document.querySelector('[data-iteration-summary]');
            const main = document.querySelector('main');
            if (!summary)
                return;
            const rect = summary.getBoundingClientRect();
            const mainRect = main?.getBoundingClientRect();
            const visibleTop = mainRect ? mainRect.top : 0;
            if (rect.top < visibleTop + 8 || rect.top > window.innerHeight * 0.65) {
                summary.scrollIntoView({ block: 'start', behavior: 'smooth' });
            }
        });
    };
    const handleWorkQueueCardClick = () => {
        if (!isWorkQueueSelected)
            selectWorkQueue();
    };
    const handleWorkQueueChevron = () => {
        if (!isWorkQueueSelected)
            selectWorkQueue();
        else
            toggleSprintOpen(WORK_QUEUE_SELECTION_ID);
    };
    const showWorkQueueItems = () => {
        setExpandedSprintIds((prev) => ({ ...prev, [WORK_QUEUE_SELECTION_ID]: true }));
    };
    const [dndSource, setDndSource] = useState(null);
    const [dndTarget, setDndTarget] = useState(null);
    // Destination rules mirror the Move Work Item modal's destination list
    // (ACTIVE + PLANNED iterations): never the item's own sprint, never a
    // finished or archived iteration.
    const sprintDropValidity = (target, sourceSprintId) => {
        if (target.isArchived)
            return 'Archived iterations cannot receive work items';
        if (target.id === sourceSprintId)
            return 'Work item is already in this iteration';
        if (target.status === 'COMPLETED')
            return 'Completed iterations cannot receive work items';
        return true;
    };
    // A PI is NOT an iteration: dropping on a PI places the item inside that
    // PI's iteration — the ACTIVE one, else the earliest PLANNED one — so the
    // existing sprint → piId → PI hierarchy stays the only PI association.
    const resolvePiDropSprint = (piId) => {
        const inPi = projectSprints.filter((s) => s.piId === piId && !s.isArchived);
        const active = inPi.find((s) => s.status === 'ACTIVE');
        if (active)
            return active;
        return inPi
            .filter((s) => s.status === 'PLANNED')
            .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''))[0];
    };
    const piDropValidity = (piId, sourceSprintId) => {
        if (!piId)
            return 'This group has no Program Increment';
        const target = resolvePiDropSprint(piId);
        if (!target)
            return 'This PI has no active or planned iteration to receive work';
        if (target.id === sourceSprintId)
            return 'Work item is already in this PI';
        return true;
    };
    const workQueueDropValidity = (sourceSprintId) => sourceSprintId === null ? 'Work item is already in the Work Queue' : true;
    const setDndHover = (kind, id, validity) => {
        const valid = validity === true;
        const reason = valid ? undefined : validity;
        setDndTarget((prev) => prev && prev.kind === kind && prev.id === id && prev.valid === valid && prev.reason === reason
            ? prev
            : { kind, id, valid, reason });
    };
    const handleDndDragOver = (e, kind, id, validity) => {
        if (!dndSource)
            return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = validity === true ? 'move' : 'none';
        setDndHover(kind, id, validity);
    };
    const handleDndDragLeave = (e, kind, id) => {
        if (e.currentTarget.contains(e.relatedTarget))
            return;
        setDndTarget((prev) => (prev && prev.kind === kind && prev.id === id ? null : prev));
    };
    // ------------------------------------------------------------------
    // Drag auto-scroll for the iteration list.
    //
    // The left column's cards (every iteration card + the Work Queue card)
    // live in ONE vertically scrolling container — `data-iteration-list`
    // below (`max-h-[600px] overflow-y-auto`), itself nested inside the
    // page-level scroll (IterationsModuleRoute) and IterationModuleLayout's
    // overflow-hidden wrapper. Chrome auto-scrolls only the WINDOW during a
    // native drag, never an inner overflow container, so aiming at a card
    // outside the visible area used to stall.
    //
    // While a drag is active we watch dragover on window in the CAPTURE
    // phase: capture on window fires before React's root-level synthetic
    // handlers, so no target's stopPropagation() can starve it, and no
    // overflow:hidden / pointer-event setting on ancestors matters (we
    // write scrollTop directly on the real scroll container — never the
    // window, and never a second scrollbar). A rAF loop scrolls the list
    // whenever the last pointer position sits inside an edge band, at a
    // speed proportional to how close to the edge the pointer is; it goes
    // idle the moment the pointer is away from the edges or outside the
    // list horizontally, and stops for good when the drag ends — dropped
    // or cancelled, dragend always fires on the source row.
    // ------------------------------------------------------------------
    const dndListRef = useRef(null);
    // Icon-only glass button pinned to the iteration list panel's bottom-right
    // corner; shown once the list itself (not the page) has scrolled past the
    // threshold, and resets only that container back to the top.
    const [listShowTop, setListShowTop] = useState(false);
    const dndListActiveRef = useRef(false);
    const dndPointerRef = useRef(null);
    const dndScrollRafRef = useRef(null);
    const lastDropAtRef = useRef(0);
    const stopDndListScroll = () => {
        dndListActiveRef.current = false;
        dndPointerRef.current = null;
    };
    // A drop must never leak into a click on the card under the pointer:
    // within this window after a drop attempt, card activation (select /
    // expand / PI menu) is suppressed.
    const dropJustHappened = () => Date.now() - lastDropAtRef.current < 300;
    // One scroll frame: direction AND speed come from the pointer's
    // distance to the nearest horizontal edge of the real list container.
    const dndScrollTick = () => {
        dndScrollRafRef.current = null;
        if (!dndListActiveRef.current)
            return;
        const list = dndListRef.current;
        const pointer = dndPointerRef.current;
        if (list && pointer) {
            const rect = list.getBoundingClientRect();
            const EDGE = 72;
            const MAX_SPEED = 14;
            const overList = pointer.x >= rect.left - 6 && pointer.x <= rect.right + 6;
            let speed = 0;
            if (overList && pointer.y >= rect.top && pointer.y < rect.top + EDGE) {
                speed = -Math.max(1, Math.round(MAX_SPEED * (1 - (pointer.y - rect.top) / EDGE)));
            }
            else if (overList && pointer.y > rect.bottom - EDGE && pointer.y <= rect.bottom) {
                speed = Math.max(1, Math.round(MAX_SPEED * (1 - (rect.bottom - pointer.y) / EDGE)));
            }
            if (speed !== 0)
                list.scrollTop += speed;
        }
        dndScrollRafRef.current = requestAnimationFrame(dndScrollTick);
    };
    // Permanent capture listener (early-out for every non-drag event). It
    // only records the pointer and keeps the rAF loop alive — drop
    // decisions stay with the per-target dragover/drop handlers below.
    //
    // Gesture-end stamps live on window in the BUBBLE phase. They run after
    // every React handler for the same event (React roots at the container,
    // window is the last stop), so they capture the true END of drop
    // processing — the row-level dragend stamp above can miss a successful
    // drop because the drop may unmount the source row first, leaving the
    // dragend event with no path to the document.
    useEffect(() => {
        const onDragOver = (e) => {
            if (!dndListActiveRef.current)
                return;
            dndPointerRef.current = { x: e.clientX, y: e.clientY };
            if (dndScrollRafRef.current === null) {
                dndScrollRafRef.current = requestAnimationFrame(dndScrollTick);
            }
        };
        const onGestureEnd = () => {
            lastDropAtRef.current = Date.now();
            stopDndListScroll();
            // The move's re-render may still be queued (React schedules its own
            // work out-of-band). Refresh the stamp once after the current task
            // so the suppression window also covers a click that only arrives
            // once the UI has visibly updated.
            setTimeout(() => {
                lastDropAtRef.current = Date.now();
            }, 0);
        };
        window.addEventListener('dragover', onDragOver, true);
        window.addEventListener('drop', onGestureEnd);
        window.addEventListener('dragend', onGestureEnd);
        return () => {
            window.removeEventListener('dragover', onDragOver, true);
            window.removeEventListener('drop', onGestureEnd);
            window.removeEventListener('dragend', onGestureEnd);
            dndListActiveRef.current = false;
            dndPointerRef.current = null;
            if (dndScrollRafRef.current !== null) {
                cancelAnimationFrame(dndScrollRafRef.current);
                dndScrollRafRef.current = null;
            }
        };
    }, []);
    const handleDndDragStart = (e, issue, sourceSprintId) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', issue.key || issue.title);
        e.dataTransfer.setData('application/x-flowexec-work-item', issue.id);
        dndListActiveRef.current = true;
        dndPointerRef.current = { x: e.clientX, y: e.clientY };
        setDndTarget(null);
        setDndSource({ issue, sourceSprintId });
    };
    const handleDndDragEnd = () => {
        // dragend is the LAST event of the gesture (drop then dragend, or a
        // cancel). Stamp here so the click-suppression window runs from the
        // END of the interaction — a trailing click from the drag burst
        // always lands after dragend, even when drop processing (moveTask +
        // re-render) took a few hundred milliseconds.
        lastDropAtRef.current = Date.now();
        stopDndListScroll();
        setDndSource(null);
        setDndTarget(null);
    };
    // The single move path — resolveIssueTaskId + moveTask, exactly what the
    // row menu's "Move Work Item" action resolves before the modal applies the
    // change. All UI re-render follows from the store (counts, progress, both
    // work-item tables, the Work Queue pool) — no page refresh needed.
    const performDndMove = (src, targetSprintId) => {
        const store = useAppStore.getState();
        const taskId = resolveIssueTaskId({
            issue: src.issue,
            projectId,
            sprintId: src.sourceSprintId,
            users,
            currentUser,
        });
        const res = store.moveTask(taskId, { sprintId: targetSprintId }, currentUser?.id);
        if (!res.ok) {
            toast.error(res.reason || `Couldn't move ${src.issue.key || src.issue.title}`);
            return;
        }
        // Rows created during this session live only in localIssuesBySprint —
        // drop the source copy so the materialised store record is the single
        // canonical row and no duplicate stays behind in source or Work Queue.
        const localKey = src.sourceSprintId ?? WORK_QUEUE_SELECTION_ID;
        if (localIssuesBySprint[localKey]?.some((r) => r.id === src.issue.id)) {
            setLocalIssuesBySprint((prev) => ({
                ...prev,
                [localKey]: (prev[localKey] || []).filter((r) => r.id !== src.issue.id),
            }));
        }
        toast.success(`Moved "${src.issue.title}" successfully!`);
    };
    const finishDndDrop = (validity, targetSprintId) => {
        const src = dndSource;
        lastDropAtRef.current = Date.now();
        stopDndListScroll();
        setDndTarget(null);
        setDndSource(null);
        if (!src)
            return false;
        if (validity !== true) {
            toast.error(validity);
            return false;
        }
        performDndMove(src, targetSprintId);
        return true;
    };
    const handleSprintDrop = (e, sprint) => {
        e.preventDefault();
        e.stopPropagation();
        const src = dndSource;
        finishDndDrop(sprintDropValidity(sprint, src?.sourceSprintId ?? null), sprint.id);
    };
    const handleWorkQueueDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const src = dndSource;
        finishDndDrop(workQueueDropValidity(src?.sourceSprintId ?? null), undefined);
    };
    const handlePiDrop = (e, piId) => {
        e.preventDefault();
        e.stopPropagation();
        const src = dndSource;
        const validity = piDropValidity(piId, src?.sourceSprintId ?? null);
        if (validity !== true || !piId) {
            finishDndDrop(validity, undefined);
            return;
        }
        const target = resolvePiDropSprint(piId);
        finishDndDrop(validity, target?.id);
    };
    // Drop-target chrome: a subtle solid outline + tint (never the card's own
    // ring/border utilities, so selected-state styles keep working untouched).
    const dndRingClass = (kind, id) => {
        if (!dndSource || !dndTarget || dndTarget.kind !== kind || dndTarget.id !== id)
            return '';
        return dndTarget.valid
            ? ' outline-2 outline-[#0d9488] outline-offset-[-2px] bg-[#ecfdf5]'
            : ' outline-2 outline-dashed outline-[#e5484d] outline-offset-[-2px] bg-[#fff1f0]';
    };
    // Shared drag handlers for the three target flavours.
    const sprintDropProps = (sprint) => ({
        onDragOver: (e) => handleDndDragOver(e, 'sprint', sprint.id, sprintDropValidity(sprint, dndSource?.sourceSprintId ?? null)),
        onDragLeave: (e) => handleDndDragLeave(e, 'sprint', sprint.id),
        onDrop: (e) => handleSprintDrop(e, sprint),
    });
    const workQueueDropProps = {
        onDragOver: (e) => handleDndDragOver(e, 'work-queue', 'work-queue', workQueueDropValidity(dndSource?.sourceSprintId ?? null)),
        onDragLeave: (e) => handleDndDragLeave(e, 'work-queue', 'work-queue'),
        onDrop: (e) => handleWorkQueueDrop(e),
    };
    const piDropProps = (groupKey, piId) => ({
        onDragOver: (e) => handleDndDragOver(e, 'pi', groupKey, piDropValidity(piId, dndSource?.sourceSprintId ?? null)),
        onDragLeave: (e) => handleDndDragLeave(e, 'pi', groupKey),
        onDrop: (e) => handlePiDrop(e, piId),
    });
    // Shared chrome for the toolbar's compact filter controls.
    const filterBtnClass = (active) => `inline-flex items-center gap-1.5 h-7 px-2 rounded-md border text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${active
        ? 'border-[#b3d4ff] bg-[#deebff] text-[#0052cc]'
        : 'border-[#dfe1e6] bg-white text-[#42526e] hover:bg-[#f4f5f7] hover:text-[#172b4d]'}`;
    const filterMenuClass = 'absolute left-0 top-full mt-1 min-w-[13rem] max-h-64 overflow-y-auto bg-white rounded-lg border border-[#dfe1e6] shadow-lg py-1.5 z-50 animate-scale-in';
    const menuItemClass = (active) => `w-full text-left px-3 py-1.5 text-xs flex items-center justify-between gap-2 hover:bg-[#f4f5f7] transition-colors cursor-pointer ${active ? 'font-bold text-[#0052cc]' : 'text-[#42526e]'}`;
    // ------------------------------------------------------------------
    // Left-panel iteration card: number, status, dates, work-item counts,
    // completion progress and a clear selected-state indicator. The SELECTED
    // card additionally carries the secondary details moved out of the old
    // large summary panel: goal, comments, linked pages, point pills and the
    // completion percentage — other cards keep the original compact recipe.
    // ------------------------------------------------------------------
    const renderIterationCard = (sprint) => {
        const issues = getIssuesForSprint(sprint.id);
        const total = issues.length;
        const completed = issues.filter((i) => i.status === 'DONE' && !isCancelledWorkItem(i)).length;
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
        const isSelected = sprint.id === selectedSprintId;
        const isOpen = isSelected && isSprintOpen(sprint.id);
        const cardTitle = sprint.iterationNumber || getSprintIdentifier(sprint);
        const canStart = canManage && sprint.status === 'PLANNED';
        const accentColor = sprint.status === 'ACTIVE' ? 'bg-[#0d9488]' : sprint.status === 'COMPLETED' ? 'bg-[#059669]' : 'bg-[#94a3b8]';
        return (<div key={sprint.id} data-sprint-card={sprint.id} role="button" tabIndex={0} aria-current={isSelected} onClick={() => {
                if (dropJustHappened())
                    return;
                selectSprint(sprint.id);
            }} onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectSprint(sprint.id);
                }
            }} {...sprintDropProps(sprint)} className={`group relative rounded-lg border px-1.5 py-1 pl-2 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-[#4c9aff]/40 ${isSelected
                ? 'border-[#0052cc] bg-[#f7faff] ring-1 ring-[#0052cc]/30 shadow-xs'
                : 'border-[#dfe1e6] bg-white hover:border-[#b3d4ff] hover:bg-[#fafbff]'}${dndRingClass('sprint', sprint.id)}`}>
        {/* Thin colored left-edge accent keyed to iteration status */}
        <span aria-hidden="true" className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg ${accentColor}`}/>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#172b4d] tracking-tight" title={cardTitle}>
              {cardTitle}
            </span>
            <SprintStatusBadge status={sprint.status}/>
          </div>
          <button type="button" onClick={(e) => {
                e.stopPropagation();
                if (dropJustHappened())
                    return;
                handleCardChevron(sprint.id);
            }} className="p-0.5 -m-0.5 rounded text-[#6b778c] hover:bg-[#ebecf0] hover:text-[#172b4d] transition-colors cursor-pointer flex-shrink-0" title={isOpen ? 'Collapse iteration work items' : 'View iteration work items'} aria-label={isOpen ? `Collapse ${cardTitle}` : `View ${cardTitle} work items`} aria-expanded={isOpen}>
            {isOpen ? <ChevronDown className="w-3.5 h-3.5"/> : <ChevronRight className="w-3.5 h-3.5"/>}
          </button>
        </div>

        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] leading-tight text-[#6b778c]">
          <Calendar className="w-3 h-3 text-[#9aa0a6] flex-shrink-0"/>
          <span className="whitespace-nowrap">
            {formatDay(sprint.startDate)} → {formatDay(sprint.endDate)}
          </span>
        </div>

        <div className="mt-0.5 flex items-center justify-between gap-2 text-[10px] leading-tight">
          <span className="inline-flex items-center gap-1 text-[#42526e] font-medium min-w-0">
            <ListTree className="w-3 h-3 text-[#9aa0a6] flex-shrink-0"/>
            <span className="tabular-nums">
              {total} work item{total === 1 ? '' : 's'}
            </span>
          </span>
        </div>

        <div className="mt-0.5 flex items-center gap-2">
          <ProgressBar value={pct} height="sm" animated={false} className="flex-1 min-w-0"/>
          <span className="text-[10px] leading-tight font-semibold text-[#6b778c] tabular-nums whitespace-nowrap flex-shrink-0">
            {completed} / {total} · {pct}%
          </span>
        </div>

        {canStart && (<div className="mt-0.5 flex items-center justify-end">
            <button type="button" onClick={(e) => {
                    e.stopPropagation();
                    handleStartSprint(sprint);
                }} className="text-[10px] leading-tight font-semibold text-[#0052cc] hover:underline px-1.5 py-0.5 rounded hover:bg-[#deebff] transition-colors cursor-pointer" title="Start this iteration">
              Start iteration
            </button>
          </div>)}
      </div>);
    };
    // ------------------------------------------------------------------
    // Left-panel Work Queue card — a separate item directly BELOW the
    // iteration cards (never inside an iteration), sharing their exact
    // card recipe so the two read as one list. Selecting it swaps the
    // right panel to the Work Queue summary + work-item table.
    // ------------------------------------------------------------------
    const renderWorkQueueCard = () => {
        const total = workQueueIssues.length;
        const isSelected = isWorkQueueSelected;
        const isOpen = isSelected && isWorkQueueOpen();
        return (<div data-work-queue-card="" role="button" tabIndex={0} aria-current={isSelected} onClick={() => {
                if (dropJustHappened())
                    return;
                handleWorkQueueCardClick();
            }} onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleWorkQueueCardClick();
                }
            }} {...workQueueDropProps} className={`group relative rounded-lg border px-1.5 py-1 pl-2 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-[#4c9aff]/40 ${isSelected
                ? 'border-[#0052cc] bg-[#f7faff] ring-1 ring-[#0052cc]/30 shadow-xs'
                : 'border-[#dfe1e6] bg-white hover:border-[#b3d4ff] hover:bg-[#fafbff]'}${dndRingClass('work-queue', 'work-queue')}`}>
        {/* Thin purple left-edge accent — distinct from every iteration status accent */}
        <span aria-hidden="true" className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg bg-[#7c3aed]"/>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[#f3e8ff] text-[#7c3aed] flex-shrink-0" aria-hidden="true">
              <ListTodo className="w-3 h-3"/>
            </span>
            <span className="text-xs font-bold text-[#172b4d] tracking-tight">Work Queue</span>
            {isSelected && (<span className="text-[10px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase bg-[#7c3aed] text-white shadow-2xs">
                Selected
              </span>)}
          </div>
          <button type="button" onClick={(e) => {
                e.stopPropagation();
                if (dropJustHappened())
                    return;
                handleWorkQueueChevron();
            }} className="p-0.5 -m-0.5 rounded text-[#6b778c] hover:bg-[#ebecf0] hover:text-[#172b4d] transition-colors cursor-pointer flex-shrink-0" title={isOpen ? 'Collapse work queue' : 'View work queue items'} aria-label={isOpen ? 'Collapse work queue' : 'View work queue items'} aria-expanded={isOpen}>
            {isOpen ? <ChevronDown className="w-3.5 h-3.5"/> : <ChevronRight className="w-3.5 h-3.5"/>}
          </button>
        </div>

        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] leading-tight text-[#6b778c]">
          <ListTree className="w-3 h-3 text-[#9aa0a6] flex-shrink-0"/>
          <span className="tabular-nums">
            {total} work item{total === 1 ? '' : 's'}
          </span>
        </div>

        <div className="mt-0.5 text-[10px] leading-snug text-[#9aa0a6]">
          Unassigned work awaiting grooming and iteration planning
        </div>

        <div className="mt-0.5 flex items-center justify-between gap-2 leading-tight text-[10px] font-semibold text-[#6b778c]">
          <span className="tabular-nums whitespace-nowrap">
            {workQueueStats.totalPoints} pts · {workQueueStats.highPoints} high · {workQueueStats.groomedPoints} ready
          </span>
          <span className="tabular-nums whitespace-nowrap flex-shrink-0" title="Grooming readiness">
            {workQueueStats.readinessPct}% groomed
          </span>
        </div>
      </div>);
    };
    // Page action toolbar — [Collapse All] [Create ▾], registered into module
    // header row 2 (right of the tab strip) via IterationHeaderActionsContext.
    // Completed Iterations now has a single entry point — its navigation TAB
    // (same destination the removed button navigated to). Board and Create PI
    // buttons were removed from the header entirely; everything that remains
    // keeps its original components and handlers — no duplicate buttons.
    const headerActionsNode = (<div className="flex items-center gap-2 flex-shrink-0 relative flex-wrap">
          <button type="button" onClick={collapseAllSprints} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-white hover:bg-[#f4f5f7] text-[#172b4d] transition-colors border border-[#dfe1e6] shadow-xs cursor-pointer whitespace-nowrap" title="Collapse all iterations" aria-label="Collapse all iterations">
            <ChevronsUp className="w-3.5 h-3.5 text-[#6b778c]"/>
            <span>Collapse All</span>
          </button>

              {/* Split / Dropdown Create Action */}
              <div className="relative inline-flex items-stretch rounded-md shadow-xs">
                <button onClick={() => setCreateDropdownOpen(!createDropdownOpen)} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-l-md text-xs font-bold bg-[#0d9488] hover:bg-[#0f766e] text-white transition-colors cursor-pointer whitespace-nowrap" title="Create Iteration or Issue">
                  <Plus className="w-3.5 h-3.5"/>
                  <span>Create</span>
                </button>
                <button onClick={() => setCreateDropdownOpen(!createDropdownOpen)} className="inline-flex items-center px-1 py-1 rounded-r-md text-xs font-bold bg-[#0d9488] hover:bg-[#0f766e] text-white/90 border-l border-white/20 transition-colors cursor-pointer" title="Choose what to create">
                  <ChevronDown className="w-3 h-3"/>
                </button>

                {createDropdownOpen && (<div className="absolute right-0 top-9 w-64 bg-white rounded-xl shadow-2xl border border-[#dfe1e6] py-1.5 z-50 animate-scale-in text-xs">
                    <div className="px-3 py-1 text-[10px] font-bold text-[#6b778c] tracking-wider border-b border-[#ebecf0]">
                      Create in {projectKey} Cadence
                    </div>

                    <button onClick={() => {
                setCreateDropdownOpen(false);
                openCreateIteration(piFilterPi && canCreateIterationInPi(piFilterPi, sprints) ? piFilterPi.id : undefined);
            }} className="w-full text-left px-3 py-2.5 hover:bg-[#deebff]/40 flex items-start gap-2.5 transition-colors group cursor-pointer">
                      <div className="p-1.5 rounded-md bg-blue-50 text-[#0052cc] group-hover:bg-[#0052cc] group-hover:text-white transition-colors mt-0.5">
                        <CalendarRange className="w-4 h-4"/>
                      </div>
                      <div>
                        <div className="font-bold text-[#172b4d] group-hover:text-[#0052cc] flex items-center gap-1.5">
                          <span>Create Iteration</span>
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold">Iteration</span>
                        </div>
                        <div className="text-[11px] text-[#6b778c] line-clamp-1">
                          Generate an iteration under a PI with dates & goal
                        </div>
                      </div>
                    </button>


                    <button onClick={() => {
                setCreateDropdownOpen(false);
                setIssueTargetSprintId(null);
                setShowCreateIssueModal(true);
            }} className="w-full text-left px-3 py-2.5 hover:bg-[#deebff]/40 flex items-start gap-2.5 transition-colors group cursor-pointer border-t border-slate-100">
                      <div className="p-1.5 rounded-md bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors mt-0.5">
                        <Plus className="w-4 h-4"/>
                      </div>
                      <div>
                        <div className="font-bold text-[#172b4d] group-hover:text-[#0052cc] flex items-center gap-1.5">
                          <span>Create Work Item</span>
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">Work Item</span>
                        </div>
                        <div className="text-[11px] text-[#6b778c] line-clamp-1">
                          Add Story, Task, or Bug to {getSprintIdentifier(currentSprint)}
                        </div>
                      </div>
                    </button>
                  </div>)}
              </div>
    </div>);
    // Re-register the node on every render so open dropdowns, permission-gated
    // visibility and live labels stay in sync with the header slot;
    // the cleanup clears the slot when this page unmounts.
    useLayoutEffect(() => {
        setHeaderActions?.(headerActionsNode);
        return () => setHeaderActions?.(null);
    });
    return (<div className="space-y-2 animate-fade-in font-sans text-[#172b4d]">
      {/* Workspace — starts directly below the compact module header (row 1
            breadcrumb, row 2 tabs + page action buttons). */}
      {/* Two-column workspace — LEFT: iteration list (search, PI filter, status
            tabs). RIGHT: selected-iteration summary + work-item toolbar and
            table. Both panels read the same real iteration/work-item
            data the page already used. */}
      {!piFilterPi && (projectSprints.length === 0 || !hasVisibleSections) ? (<div className="bg-white rounded-lg border border-[#dfe1e6] shadow-xs p-8 text-center">
          <p className="text-sm font-semibold text-[#172b4d]">
            {isCompletedView
                ? 'No completed iterations yet'
                : planSections.completed.length > 0
                    ? 'No active or planned iterations'
                    : 'No iterations yet'}
          </p>
          <p className="text-xs text-[#6b778c] mt-1">
            {isCompletedView
                ? 'Finished iterations will appear here, grouped under their PI, once they are completed.'
                : projectPis.length === 0
                    ? `${project?.name} has no PI yet. Iterations are generated inside a PI — create one from the project's Product Increments section.`
                    : planSections.completed.length > 0
                        ? `All iterations of ${project?.name} are completed — open Completed Iterations to browse the history.`
                        : `Create the first iteration of ${projectPis[0]?.name} for ${project?.name} to start planning.`}
          </p>
          {!isCompletedView &&
                (projectPis.length === 0 ? (<button onClick={() => navigate(productIncrementsUrl)} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0d9488] text-white hover:bg-[#0f766e] text-xs font-bold cursor-pointer">
                <ListTree className="w-3.5 h-3.5"/> Go to Product Increments
              </button>) : (<button onClick={() => openCreateIteration(projectPis.find((p) => canCreateIterationInPi(p, sprints))?.id)} className="mt-4 px-4 py-2 rounded-lg bg-[#0d9488] text-white hover:bg-[#0f766e] text-xs font-bold cursor-pointer">
                + Create Iteration
              </button>))}
        </div>) : (<div className="grid grid-cols-1 lg:grid-cols-[228px_minmax(0,1fr)] gap-2.5 items-start">
          {/* ============================ LEFT COLUMN — iteration list ============================ */}
          <aside className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6b778c]"/>
                <input type="text" value={iterationQuery} onChange={(e) => setIterationQuery(e.target.value)} placeholder="Search iterations..." aria-label="Search iterations" className="w-full pl-8 pr-7 py-1 text-xs bg-white border border-[#dfe1e6] rounded-md focus:border-[#4c9aff] focus:ring-1 focus:ring-[#4c9aff] outline-none transition-all placeholder:text-[#9aa0a6]"/>
                {iterationQuery && (<button type="button" onClick={() => setIterationQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9aa0a6] hover:text-[#42526e] cursor-pointer" aria-label="Clear iteration search">
                    <X className="w-3 h-3"/>
                  </button>)}
              </div>

              {/* PI filter — the iteration filter control. While a PI is
                selected it doubles as that PI's drop target (drag a work
                item onto it to file the item under this Program Increment —
                via its active/planned iteration, never by treating the PI
                itself as an iteration). */}
              <div className="relative flex-shrink-0">
                <button type="button" onClick={() => {
                if (dropJustHappened())
                    return;
                setIterFilterOpen(!iterFilterOpen);
            }} className={`${filterBtnClass(piGroupFilter !== 'ALL')}${dndRingClass('pi', piGroupFilter)}`} aria-haspopup="listbox" aria-expanded={iterFilterOpen} data-pi-drop-control="" title={piGroupFilter !== 'ALL'
                ? 'Filter iterations by Program Increment — also a drop target for work items'
                : 'Filter iterations by Program Increment — select a PI to make it a drop target'} {...piDropProps(piGroupFilter, iterationPiGroups.find((g) => g.key === piGroupFilter)?.piId)}>
                  <Filter className="w-3.5 h-3.5"/>
                  {piGroupFilter !== 'ALL' && (<span className="max-w-[86px] truncate">
                      {iterationPiGroups.find((g) => g.key === piGroupFilter)?.label || 'PI'}
                    </span>)}
                  <ChevronDown className="w-3 h-3 text-[#6b778c]"/>
                </button>

                {iterFilterOpen && (<div className={filterMenuClass} role="listbox">
                    <div className="px-3 py-1 text-[9px] font-black tracking-wider text-[#6b778c] border-b border-[#ebecf0]">
                      Program Increment
                    </div>
                    <button type="button" onClick={() => {
                    selectPiFilter('ALL');
                    setIterFilterOpen(false);
                }} className={menuItemClass(piGroupFilter === 'ALL')}>
                      <span>All PIs</span>
                      <span className="text-[10px] text-[#9aa0a6] tabular-nums">{iterationSource.length}</span>
                    </button>
                    {iterationPiGroups.map((group) => (<button key={group.key} type="button" onClick={() => {
                        selectPiFilter(group.key);
                        setIterFilterOpen(false);
                    }} className={menuItemClass(piGroupFilter === group.key)}>
                        <span className="truncate">{group.label}</span>
                        <span className="text-[10px] text-[#9aa0a6] tabular-nums">{group.sprints.length}</span>
                      </button>))}
                    {iterationPiGroups.length === 0 && (<div className="px-3 py-2 text-[11px] text-[#9aa0a6]">No Program Increments yet</div>)}
                  </div>)}
              </div>
            </div>

            {selectedPiSummary && (<div className="rounded-lg border border-[#ccfbf1] bg-[#f0fdfa] px-3 py-2 space-y-1.5" data-pi-summary="">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#134e4a] truncate">{selectedPiSummary.label}</span>
                  {selectedPiSummary.status && <SprintStatusBadge status={selectedPiSummary.status}/>}
                </div>
                {canManage && selectedPiSummary.pi && selectedPiSummary.status !== 'COMPLETED' && (<button type="button" onClick={() => openCreateIteration(selectedPiSummary.pi.id)} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold text-[#0f766e] bg-white hover:bg-[#ccfbf1] border border-[#99f6e4] transition-colors cursor-pointer" data-testid="summary-create-iteration">
                    <Plus className="w-3 h-3"/> Create Iteration
                  </button>)}
                {selectedPiSummary.startDate && selectedPiSummary.endDate && (<div className="text-[11px] text-[#0f766e] tabular-nums">
                    {formatSprintDateRange(selectedPiSummary)} {selectedPiSummary.startDate.slice(0, 4)}
                    {selectedPiSummary.endDate.slice(0, 4) !== selectedPiSummary.startDate.slice(0, 4) && `–${selectedPiSummary.endDate.slice(0, 4)}`}
                  </div>)}
                {selectedPiSummary.goal && (<p className="text-[11px] text-[#42526e] line-clamp-2" title={selectedPiSummary.goal}>
                    {selectedPiSummary.goal}
                  </p>)}
                <div className="flex items-center justify-between text-[10px] text-[#6b778c]">
                  <span>
                    {selectedPiSummary.iterationCount} iteration{selectedPiSummary.iterationCount === 1 ? '' : 's'}
                  </span>
                  <span className="tabular-nums">
                    {selectedPiSummary.taskTotal > 0
                    ? `${selectedPiSummary.taskDone}/${selectedPiSummary.taskTotal} assigned items done`
                    : 'No assigned work items'}
                  </span>
                </div>
                {selectedPiSummary.taskTotal > 0 && <ProgressBar value={selectedPiSummary.pct} height="sm"/>}
              </div>)}

            {/* Status tabs — All / Active / Upcoming / Completed */}
            <div className="flex items-center gap-1 bg-[#f4f5f7] rounded-lg p-1">
              {[
                { key: 'ALL', label: 'All' },
                { key: 'ACTIVE', label: 'Active' },
                { key: 'UPCOMING', label: 'Upcoming' },
                { key: 'COMPLETED', label: 'Completed' },
            ].map((tab) => {
                const active = statusTab === tab.key;
                return (<button key={tab.key} type="button" onClick={() => setStatusTab(tab.key)} aria-pressed={active} className={`flex-1 min-w-0 h-6 px-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-1 overflow-hidden ${active
                        ? 'bg-white text-[#172b4d] shadow-xs ring-1 ring-[#dfe1e6]'
                        : 'text-[#6b778c] hover:text-[#172b4d]'}`} title={`${tab.label} iterations (${statusCounts[tab.key]})`}>
                    <span className="truncate min-w-0">{tab.label}</span>
                    <span className="tabular-nums text-[10px] font-semibold text-[#9aa0a6] flex-shrink-0">
                      {statusCounts[tab.key]}
                    </span>
                  </button>);
            })}
            </div>

            {/* Iteration cards — the ONE scrollable container of the left
                list (iteration cards + Work Queue card): the drop
                auto-scroll target (dndListRef above), never the window. The
                relative wrapper pins the list-local scroll-to-top button to
                the panel's bottom-right corner without covering the cards
                (the list reserves pb-9 for it). */}
            <div className="relative">
            <div ref={dndListRef} data-iteration-list="" onScroll={(e) => setListShowTop(e.currentTarget.scrollTop > 180)} className="flex flex-col gap-1.5 max-h-[600px] overflow-y-auto pr-0.5 pb-9 scrollbar-thin">
              {showPiEmpty ? (<div className="rounded-lg border border-dashed border-[#99f6e4] bg-white px-4 py-6 text-center" data-testid="pi-empty-list">
                  <p className="text-xs font-semibold text-[#134e4a]">{piFilterPi.name} has no iterations yet</p>
                  <p className="text-[11px] text-[#6b778c] mt-0.5">Iterations you create for this PI will be listed here.</p>
                </div>) : visibleIterations.length === 0 ? (<div className="rounded-lg border border-dashed border-[#dfe1e6] bg-white px-4 py-6 text-center">
                  <p className="text-xs font-semibold text-[#5f6368]">No iterations match your filters</p>
                  <p className="text-[11px] text-[#9aa0a6] mt-0.5">Try another status, PI or search term.</p>
                  <button type="button" onClick={() => {
                    setIterationQuery('');
                    selectPiFilter('ALL');
                    setStatusTab(isCompletedView ? 'COMPLETED' : 'ALL');
                }} className="mt-2 text-[11px] font-bold text-[#0052cc] hover:underline cursor-pointer">
                    Clear iteration filters
                  </button>
                </div>) : isCompletedView ? (visiblePiGroups.map((group) => (<div key={group.key} className="flex flex-col gap-2">
                    {/* PI group header — also a drop target: dropping files the
                    item under this PI via its active/planned iteration. */}
                    <div className="flex items-center gap-2 px-1 rounded-md transition-colors" data-pi-group-header={group.key} {...piDropProps(group.key, group.piId)}>
                      <span className={`text-[10px] font-black px-2 py-1 rounded tracking-widest uppercase bg-[#f4f5f7] text-[#42526e] border border-[#ebecf0]${dndRingClass('pi', group.key)}`}>
                        {group.label}
                      </span>
                      <span className="text-[11px] text-[#6b778c]">{group.sprints.length} iterations</span>
                    </div>
                    {group.sprints.map((sprint) => renderIterationCard(sprint))}
                  </div>))) : (visibleIterations.map((sprint) => renderIterationCard(sprint)))}

              {/* Work Queue — a dedicated card directly below the iteration
                cards, inside the SAME scrolling list so it aligns and scrolls
                with them. Hidden on the Completed Iterations history view. */}
              {!isCompletedView && renderWorkQueueCard()}
            </div>
            {listShowTop && (<button type="button" onClick={() => dndListRef.current?.scrollTo({ top: 0, behavior: 'smooth' })} className="absolute bottom-2 right-2 z-10 inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/70 backdrop-blur-sm border border-[#dfe1e6] shadow-xs text-[#42526e] hover:bg-white hover:text-[#172b4d] transition-all cursor-pointer" title="Scroll iteration list to top" aria-label="Scroll iteration list to top">
                <ChevronUp className="w-3.5 h-3.5"/>
              </button>)}
            </div>

            <div className="flex items-center justify-between gap-2 px-1 text-[11px] text-[#6b778c]">
              <span className="tabular-nums">
                {visibleIterations.length} of {iterationSource.length} iterations
              </span>
              {(iterationQuery || piGroupFilter !== 'ALL' || statusTab !== (isCompletedView ? 'COMPLETED' : 'ALL')) && (<button type="button" onClick={() => {
                    setIterationQuery('');
                    selectPiFilter('ALL');
                    setStatusTab(isCompletedView ? 'COMPLETED' : 'ALL');
                }} className="font-bold text-[#0052cc] hover:underline cursor-pointer">
                  Reset
                </button>)}
            </div>
          </aside>

          {/* ============================ RIGHT COLUMN — selected iteration or Work Queue ============================ */}
          {showPiEmpty && (<section className="min-w-0 bg-white rounded-lg border border-[#dfe1e6] shadow-xs p-8 text-center" data-testid="pi-empty-panel">
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#0d9488] text-white text-[11px] font-bold">
                  <ListTree className="w-3 h-3"/> {piFilterPi.name}
                </span>
                <SprintStatusBadge status={piStatusOf(piFilterPi, sprints)}/>
              </div>
              {piFilterPi.title && <p className="text-sm font-semibold text-[#172b4d]">{piFilterPi.title}</p>}
              <p className="text-xs text-[#6b778c] mt-1 tabular-nums">
                {piFilterPi.startDate && piFilterPi.endDate ? `${formatIsoDay(piFilterPi.startDate)} – ${formatIsoDay(piFilterPi.endDate)}` : 'No PI date range set'}
              </p>
              <p className="text-sm font-semibold text-[#172b4d] mt-4">No iterations in {piFilterPi.name} yet</p>
              <p className="text-xs text-[#6b778c] mt-1">
                {canCreateIterationInPi(piFilterPi, sprints)
                ? 'Create the first iterations of this PI — choose any dates inside its range.'
                : 'This PI is completed, so no new iterations can be added.'}
              </p>
              {canManage && canCreateIterationInPi(piFilterPi, sprints) && (<button type="button" onClick={() => openCreateIteration(piFilterPi.id)} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0d9488] text-white hover:bg-[#0f766e] text-xs font-bold cursor-pointer" data-testid="pi-empty-create-iteration">
                  <Plus className="w-3.5 h-3.5"/> Create Iteration
                </button>)}
            </section>)}
          <section className={showPiEmpty ? "hidden" : "min-w-0 flex flex-col gap-2"}>
            {/* Unified summary + filter card — ONE card holds the first row
                (the Work Queue summary when the Work Queue is selected,
                otherwise the compact iteration summary: iteration number,
                status switcher, flagged count, Search work items and the ⋯
                menu) and the second row (the work-item filter toolbar). The
                work-items table lives in a separate card directly below.
                The card must NOT be overflow-hidden so the ⋯ menu, status
                dropdown and filter selects can open past its edge. */}
            <div className="bg-white rounded-lg border border-[#dfe1e6] shadow-xs">
              {isWorkQueueSelected ? (<div className={`px-3 py-2 flex flex-wrap items-start justify-between gap-2 ${currentOpen ? 'border-b border-[#ebecf0]' : ''}`} data-iteration-summary>
                  <div className="min-w-0 flex flex-col gap-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-2xl font-bold text-[#172b4d] tracking-tight">Work Queue</h2>
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-md tracking-wider uppercase bg-[#7c3aed] text-white shadow-2xs">
                        Backlog
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-[#6b778c] font-medium">
                        <ListTodo className="w-3.5 h-3.5 text-[#9aa0a6]"/>
                        <span className="font-bold text-[#42526e] tabular-nums">{workQueueIssues.length}</span>
                        work items
                      </span>
                    </div>

                    <p className="text-xs text-[#42526e] line-clamp-2 max-w-2xl">
                      Unassigned work items awaiting grooming and iteration planning — move them into a live or
                      upcoming iteration when they are ready.
                    </p>

                    <div className="flex items-center gap-3 flex-wrap text-[11px] text-[#6b778c]">
                      <span className="tabular-nums">
                        <span className="font-bold text-[#42526e]">{workQueueStats.totalPoints}</span> total points
                      </span>
                      <span className="tabular-nums">
                        <span className="font-bold text-[#42526e]">{workQueueStats.highPoints}</span> high-priority points
                      </span>
                      <span className="tabular-nums">
                        <span className="font-bold text-[#42526e]">{workQueueStats.groomedCount}</span> groomed
                      </span>
                      <span className="inline-flex items-center gap-1 tabular-nums" title="Share of queue items estimated and ready for an iteration">
                        <CheckCircle className="w-3 h-3 text-[#36b37e]"/>
                        {workQueueStats.readinessPct}% ready for iteration
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <div className="flex items-center gap-2 min-w-[160px] max-w-[220px]">
                      <ProgressBar value={workQueueStats.readinessPct} height="sm" animated={false} className="flex-1 min-w-0"/>
                      <span className="text-[10px] font-bold text-[#42526e] tabular-nums w-8 text-right">
                        {workQueueStats.readinessPct}%
                      </span>
                    </div>

                    {workQueueIssues.length > 0 && (<div className="flex items-center gap-1">
                        <span className="inline-flex items-center justify-center min-w-[18px] px-1.5 py-0 rounded-full text-[10px] leading-none font-bold bg-[#42526e] text-white" title={`To Do Points: ${computeStats(workQueueIssues).todoPoints}`}>
                          {computeStats(workQueueIssues).todoPoints}
                        </span>
                        <span className="inline-flex items-center justify-center min-w-[18px] px-1.5 py-0 rounded-full text-[10px] leading-none font-bold bg-[#0052cc] text-white" title={`In Progress Points: ${computeStats(workQueueIssues).inProgPoints}`}>
                          {computeStats(workQueueIssues).inProgPoints}
                        </span>
                        <span className="inline-flex items-center justify-center min-w-[18px] px-1.5 py-0 rounded-full text-[10px] leading-none font-bold bg-[#00875a] text-white" title={`Done Points: ${computeStats(workQueueIssues).donePoints}`}>
                          {computeStats(workQueueIssues).donePoints}
                        </span>
                      </div>)}

                    <button type="button" onClick={() => {
                    setIssueTargetSprintId(WORK_QUEUE_SELECTION_ID);
                    setShowCreateIssueModal(true);
                }} className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-bold bg-[#0052cc] hover:bg-[#0747a6] text-white transition-colors shadow-xs cursor-pointer whitespace-nowrap" title="Create a work item in the Work Queue">
                      <Plus className="w-3.5 h-3.5"/>
                      <span>Create work item</span>
                    </button>
                  </div>
                </div>) : (<div className={`px-3 py-1 min-h-[38px] flex items-center gap-x-2 gap-y-1 flex-wrap ${currentOpen ? 'border-b border-[#ebecf0]' : ''}`} data-iteration-summary data-iteration-compact-header>
                <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                    {currentPiNumber !== undefined && (<span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#f0fdfa] border border-[#99f6e4] text-[10px] font-bold text-[#0f766e] flex-shrink-0">
                        PI {currentPiNumber}
                      </span>)}
                    <h2 className="text-xl font-bold text-[#172b4d] tracking-tight whitespace-nowrap" title={getSprintIdentifier(currentSprint)}>
                      {currentSprint.iterationNumber || getSprintIdentifier(currentSprint)}
                      {currentSprint.startDate && currentSprint.endDate && (<span className="ml-1.5 text-[13px] font-semibold text-[#42526e]">
                          [{fmtIterationRange(currentSprint.startDate, currentSprint.endDate)}]
                        </span>)}
                    </h2>

                    {/* Status switcher (same permission-gated flow as before) */}
                    {(currentSprint.status === 'ACTIVE' || currentSprint.status === 'COMPLETED' || currentSprint.status === 'PLANNED') && (<div className="relative">
                        {canManage ? (<button type="button" onClick={() => {
                            closeAllRowUi();
                            setStatusDropdownSprintId(statusMenuOpen ? null : currentSprint.id);
                        }} className={`text-[10px] font-black px-2 py-1 rounded-md tracking-wider uppercase shadow-2xs flex items-center gap-1 transition-all cursor-pointer ${currentSprint.status === 'ACTIVE'
                            ? 'bg-[#00875a] hover:bg-[#006644] text-white'
                            : 'bg-slate-600 hover:bg-slate-700 text-white'}`} title="Click to toggle iteration status" aria-haspopup="menu" aria-expanded={statusMenuOpen}>
                            <span>{currentSprint.status}</span>
                            <ChevronDown className="w-3 h-3 text-white/80"/>
                          </button>) : (<span className={`text-[10px] font-black px-2 py-1 rounded-md tracking-wider uppercase shadow-2xs flex items-center gap-1 ${currentSprint.status === 'ACTIVE' ? 'bg-[#00875a] text-white' : 'bg-slate-600 text-white'}`} title={`Iteration status: ${currentSprint.status}`}>
                            <span>{currentSprint.status}</span>
                          </span>)}

                        {canManage && statusMenuOpen && (<div className="absolute left-0 top-7 w-44 bg-white rounded-xl shadow-xl border border-[#dfe1e6] py-1 z-50 animate-scale-in">
                            <div className="px-3 py-1 text-[9px] font-bold text-[#6b778c] tracking-wider border-b border-[#ebecf0]">
                              Set Iteration Status
                            </div>
                            {['ACTIVE', 'COMPLETED', 'PLANNED'].map((st) => (<button key={st} type="button" onClick={() => {
                                setStatusDropdownSprintId(null);
                                if (st === 'COMPLETED') {
                                    handleCompleteSprint(currentSprint);
                                }
                                else if (st === 'ACTIVE') {
                                    handleStartSprint(currentSprint);
                                }
                                else {
                                    updateSprintStatus(currentSprint.id, st);
                                    toast.success(`${currentShortTitle} status set to ${st}`);
                                }
                            }} className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${currentSprint.status === st ? 'font-bold text-[#0052cc] bg-[#deebff]/40' : 'text-slate-700'}`}>
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${st === 'ACTIVE' ? 'bg-[#00875a]' : st === 'COMPLETED' ? 'bg-slate-500' : 'bg-blue-500'}`}/>
                                  <span>{st}</span>
                                </div>
                                {currentSprint.status === st && <Check className="w-3.5 h-3.5 text-[#0052cc]"/>}
                              </button>))}
                          </div>)}
                      </div>)}

                    <span className="inline-flex items-center gap-1 tabular-nums whitespace-nowrap text-[11px] text-[#6b778c] font-medium" title={`${currentFlagged} flagged work item(s)`}>
                      <Flag className="w-3 h-3 fill-[#0052cc] text-[#0052cc]"/>
                      {currentFlagged} flagged
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#6b778c] whitespace-nowrap">
                      <CalendarDays className="w-3.5 h-3.5"/>
                      {currentDaysLeft} day{currentDaysLeft === 1 ? '' : 's'} left
                    </span>
                    <button type="button" onClick={() => navigate(`/pm/issues/search?sprint=${toUrlId(currentSprint.id)}`)} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0052cc] hover:underline cursor-pointer whitespace-nowrap" title="Search work items in this iteration">
                      <ListTree className="w-3 h-3"/>
                      Search work items
                    </button>
                </div>

                {/* Right side of the summary row — work-item count, Create
                    action, and the ⋯ overflow menu (Start/Complete/Edit/
                    View Work Items/View all assignees/Iteration Details/
                    Linked Pages/Archive/Delete). The assignees popover is
                    anchored to this container and opens from the "View all
                    assignees" menu item. */}
                <div className="ml-auto flex-shrink-0">
                  <div className="flex items-center gap-2">
                    {currentOpen && (<>
                        <span className="text-[11px] text-[#6b778c] tabular-nums whitespace-nowrap">
                          {filteredIssues.length} of {currentIssues.length} work items
                        </span>
                        <button type="button" onClick={() => {
                        setIssueTargetSprintId(isWorkQueueSelected ? WORK_QUEUE_SELECTION_ID : currentSprint.id);
                        if (!isWorkQueueSelected)
                            setSelectedSprintId(currentSprint.id);
                        setShowCreateIssueModal(true);
                    }} className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-bold bg-[#0052cc] hover:bg-[#0747a6] text-white transition-colors shadow-xs cursor-pointer whitespace-nowrap">
                          <Plus className="w-3.5 h-3.5"/>
                          <span>Create</span>
                        </button>
                      </>)}
                    <div className="relative">
                      <button type="button" onClick={() => {
                    const next = !rowMenuOpen;
                    closeAllRowUi();
                    if (next)
                        setMoreMenuSprintId(currentSprint.id);
                }} className="p-1.5 rounded-md text-[#6b778c] hover:bg-[#ebecf0] hover:text-[#172b4d] transition-colors cursor-pointer" title="Iteration Actions" aria-haspopup="menu" aria-expanded={rowMenuOpen}>
                        <MoreHorizontal className="w-4 h-4"/>
                      </button>

                      {/* Existing assignees popover — opened from the ⋯ menu's
                    "View all assignees" item (no separate header button). */}
                      {assigneesOpen && (<div className="absolute right-0 top-9 w-64 bg-white rounded-xl shadow-2xl border border-[#dfe1e6] p-3 z-50 animate-scale-in text-left">
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#ebecf0]">
                            <span className="font-bold text-xs text-[#172b4d]">
                              {currentShortTitle} Members ({currentMembers.length})
                            </span>
                            <button type="button" onClick={() => setAssigneesPopoverSprintId(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer" aria-label="Close members">
                              <X className="w-3.5 h-3.5"/>
                            </button>
                          </div>
                          <div className="max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin text-xs">
                            {currentMembers.map((m) => (<div key={m.id} className="flex items-center gap-2 py-0.5">
                                <span className="w-5 h-5 rounded-full text-white font-bold text-[9px] flex items-center justify-center" style={{ backgroundColor: m.avatarColor }}>
                                  {m.name[0]}
                                </span>
                                <span className="text-slate-800">{m.name}</span>
                              </div>))}
                          </div>
                        </div>)}

                      {rowMenuOpen && (<div className="absolute right-0 top-9 w-52 bg-white rounded-xl shadow-xl border border-[#dfe1e6] py-1 z-50 animate-scale-in text-xs">
                          <div className="px-3 py-1 text-[9px] font-bold text-[#6b778c] tracking-wider border-b border-[#ebecf0]">
                            Iteration Actions
                          </div>

                          {showStart && (<button type="button" onClick={() => {
                            setMoreMenuSprintId(null);
                            handleStartSprint(currentSprint);
                        }} className="w-full text-left px-3 py-2 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 font-semibold">
                              <Play className="w-3.5 h-3.5 text-emerald-600"/>
                              <span>Start Iteration</span>
                            </button>)}

                          {showComplete && (<button type="button" onClick={() => handleCompleteSprint(currentSprint)} className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-semibold">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600"/>
                              <span>Complete Iteration</span>
                            </button>)}

                          {showEdit && (<button type="button" onClick={() => {
                            setMoreMenuSprintId(null);
                            openEditSprintModal(currentSprint);
                        }} className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-semibold">
                              <Edit3 className="w-3.5 h-3.5 text-slate-500"/>
                              <span>Edit Iteration</span>
                            </button>)}

                          {(showStart || showComplete || showEdit) && <div className="my-1 border-t border-[#ebecf0]"/>}

                          <button type="button" onClick={() => {
                        setMoreMenuSprintId(null);
                        openOnlySprint(currentSprint.id);
                    }} className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-semibold">
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500"/>
                            <span>View Work Items</span>
                          </button>

                          <button type="button" onClick={() => {
                        setMoreMenuSprintId(null);
                        setAssigneesPopoverSprintId(currentSprint.id);
                    }} className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-semibold">
                            <Users className="w-3.5 h-3.5 text-slate-500"/>
                            <span>View all assignees</span>
                          </button>

                          <button type="button" onClick={() => {
                        setMoreMenuSprintId(null);
                        setShowIterationDetailsModal(true);
                    }} className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-semibold">
                            <Eye className="w-3.5 h-3.5 text-slate-500"/>
                            <span>Iteration Details</span>
                          </button>

                          <button type="button" onClick={() => {
                        setMoreMenuSprintId(null);
                        setShowLinkedPagesModal(true);
                    }} className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-semibold">
                            <FileText className="w-3.5 h-3.5 text-slate-500"/>
                            <span>Linked Pages ({linkedPages.length})</span>
                          </button>

                          {showArchive && (<button type="button" onClick={() => handleArchiveSprint(currentSprint)} className="w-full text-left px-3 py-2 text-amber-700 hover:bg-amber-50 flex items-center gap-2 font-semibold">
                              <Archive className="w-3.5 h-3.5 text-amber-600"/>
                              <span>Archive Iteration</span>
                            </button>)}

                          {showDelete && (<button type="button" onClick={() => {
                            setMoreMenuSprintId(null);
                            setShowDeleteSprintConfirm(true);
                        }} className="w-full text-left px-3 py-2 text-red-700 hover:bg-red-50 flex items-center gap-2 font-semibold">
                              <Trash2 className="w-3.5 h-3.5 text-red-600"/>
                              <span>Delete Iteration</span>
                            </button>)}
                        </div>)}
                    </div>
                  </div>
                </div>
              </div>)}

              {/* Filter row — row 2 of the unified summary card (hidden while collapsed) */}
              {currentOpen && (<div className="px-3 py-1 flex items-center gap-1.5 flex-wrap">
                  <div className="relative flex-1 min-w-[130px] max-w-[208px]">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6b778c]"/>
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search work items..." aria-label="Search work items" className="w-full pl-8 pr-7 py-1 text-xs bg-white border border-[#dfe1e6] rounded-md focus:border-[#4c9aff] focus:ring-1 focus:ring-[#4c9aff] outline-none transition-all placeholder:text-[#9aa0a6]"/>
                    {searchQuery && (<button type="button" onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9aa0a6] hover:text-[#42526e] cursor-pointer" aria-label="Clear work item search">
                        <X className="w-3 h-3"/>
                      </button>)}
                  </div>

                  {/* Assignee (existing person quick filters) */}
                  <div className="relative">
                    <button type="button" onClick={() => setAssigneeFilterOpen(!assigneeFilterOpen)} className={filterBtnClass(activePersonFilters.length > 0)} aria-haspopup="listbox" aria-expanded={assigneeFilterOpen}>
                      <Users className="w-3.5 h-3.5"/>
                      <span>Assignee{activePersonFilters.length > 0 ? ` (${activePersonFilters.length})` : ''}</span>
                      <ChevronDown className="w-3 h-3 text-[#6b778c]"/>
                    </button>
                    {assigneeFilterOpen && (<div className={filterMenuClass} role="listbox">
                        <div className="px-3 py-1 text-[9px] font-black tracking-wider text-[#6b778c] border-b border-[#ebecf0]">
                          Assignee
                        </div>
                        <button type="button" onClick={() => {
                        setActivePersonFilters([]);
                        setAssigneeFilterOpen(false);
                    }} className={menuItemClass(activePersonFilters.length === 0)}>
                          <span>Anyone</span>
                          {activePersonFilters.length === 0 && <Check className="w-3.5 h-3.5 text-[#0052cc]"/>}
                        </button>
                        {projectTeamMembers.map((member) => {
                        const active = activePersonFilters.includes(member.name);
                        return (<button key={member.id} type="button" onClick={() => togglePersonFilter(member.name)} className={menuItemClass(active)}>
                              <span className="truncate">{member.name}</span>
                              {active && <Check className="w-3.5 h-3.5 text-[#0052cc] flex-shrink-0"/>}
                            </button>);
                    })}
                      </div>)}
                  </div>

                  {/* Component (epic) */}
                  <div className="relative">
                    <button type="button" onClick={() => setComponentFilterOpen(!componentFilterOpen)} className={filterBtnClass(Boolean(componentFilter))} aria-haspopup="listbox" aria-expanded={componentFilterOpen}>
                      <Layers className="w-3.5 h-3.5"/>
                      <span className="max-w-[110px] truncate">{componentFilter || 'Component'}</span>
                      <ChevronDown className="w-3 h-3 text-[#6b778c]"/>
                    </button>
                    {componentFilterOpen && (<div className={filterMenuClass} role="listbox">
                        <div className="px-3 py-1 text-[9px] font-black tracking-wider text-[#6b778c] border-b border-[#ebecf0]">
                          Component
                        </div>
                        <button type="button" onClick={() => {
                        setComponentFilter('');
                        setComponentFilterOpen(false);
                    }} className={menuItemClass(!componentFilter)}>
                          <span>All components</span>
                          {!componentFilter && <Check className="w-3.5 h-3.5 text-[#0052cc]"/>}
                        </button>
                        {workItemFilterOptions.components.map((option) => (<button key={option} type="button" onClick={() => {
                            setComponentFilter(option);
                            setComponentFilterOpen(false);
                        }} className={menuItemClass(componentFilter === option)}>
                            <span className="truncate">{option}</span>
                            {componentFilter === option && <Check className="w-3.5 h-3.5 text-[#0052cc] flex-shrink-0"/>}
                          </button>))}
                        {workItemFilterOptions.components.length === 0 && (<div className="px-3 py-2 text-[11px] text-[#9aa0a6]">No components in this iteration</div>)}
                      </div>)}
                  </div>

                  {/* Status */}
                  <div className="relative">
                    <button type="button" onClick={() => setStatusFilterOpen(!statusFilterOpen)} className={filterBtnClass(Boolean(statusFilter))} aria-haspopup="listbox" aria-expanded={statusFilterOpen}>
                      <Check className="w-3.5 h-3.5"/>
                      <span className="max-w-[110px] truncate">
                        {statusFilter
                    ? workItemFilterOptions.statuses.find((s) => s.value === statusFilter)?.label || statusFilter
                    : 'Status'}
                      </span>
                      <ChevronDown className="w-3 h-3 text-[#6b778c]"/>
                    </button>
                    {statusFilterOpen && (<div className={filterMenuClass} role="listbox">
                        <div className="px-3 py-1 text-[9px] font-black tracking-wider text-[#6b778c] border-b border-[#ebecf0]">
                          Status
                        </div>
                        <button type="button" onClick={() => {
                        setStatusFilter('');
                        setStatusFilterOpen(false);
                    }} className={menuItemClass(!statusFilter)}>
                          <span>All statuses</span>
                          {!statusFilter && <Check className="w-3.5 h-3.5 text-[#0052cc]"/>}
                        </button>
                        {workItemFilterOptions.statuses.map((option) => (<button key={option.value} type="button" onClick={() => {
                            setStatusFilter(option.value);
                            setStatusFilterOpen(false);
                        }} className={menuItemClass(statusFilter === option.value)}>
                            <span className="truncate">{option.label}</span>
                            {statusFilter === option.value && <Check className="w-3.5 h-3.5 text-[#0052cc] flex-shrink-0"/>}
                          </button>))}
                      </div>)}
                  </div>

                  {/* PI / release */}
                  <div className="relative">
                    <button type="button" onClick={() => setPiFilterOpen(!piFilterOpen)} className={filterBtnClass(Boolean(piFilter))} aria-haspopup="listbox" aria-expanded={piFilterOpen}>
                      <Hash className="w-3.5 h-3.5"/>
                      <span className="max-w-[110px] truncate">{piFilter || 'PI'}</span>
                      <ChevronDown className="w-3 h-3 text-[#6b778c]"/>
                    </button>
                    {piFilterOpen && (<div className={filterMenuClass} role="listbox">
                        <div className="px-3 py-1 text-[9px] font-black tracking-wider text-[#6b778c] border-b border-[#ebecf0]">
                          Program Increment
                        </div>
                        <button type="button" onClick={() => {
                        setPiFilter('');
                        setPiFilterOpen(false);
                    }} className={menuItemClass(!piFilter)}>
                          <span>All PIs</span>
                          {!piFilter && <Check className="w-3.5 h-3.5 text-[#0052cc]"/>}
                        </button>
                        {workItemFilterOptions.releaseTags.map((option) => (<button key={option} type="button" onClick={() => {
                            setPiFilter(option);
                            setPiFilterOpen(false);
                        }} className={menuItemClass(piFilter === option)}>
                            <span className="truncate">{option}</span>
                            {piFilter === option && <Check className="w-3.5 h-3.5 text-[#0052cc] flex-shrink-0"/>}
                          </button>))}
                        {workItemFilterOptions.releaseTags.length === 0 && (<div className="px-3 py-2 text-[11px] text-[#9aa0a6]">No PI tags in this iteration</div>)}
                      </div>)}
                  </div>

                  {/* More filters */}
                  <div className="relative">
                    <button type="button" onClick={() => setMoreFiltersOpen(!moreFiltersOpen)} className={filterBtnClass(onlyMyIssues || recentlyUpdatedOnly)} aria-haspopup="menu" aria-expanded={moreFiltersOpen}>
                      <Filter className="w-3.5 h-3.5"/>
                      <span>More Filters</span>
                      {(onlyMyIssues || recentlyUpdatedOnly) && (<span className="w-1.5 h-1.5 rounded-full bg-[#0052cc]" aria-hidden/>)}
                      <ChevronDown className="w-3 h-3 text-[#6b778c]"/>
                    </button>
                    {moreFiltersOpen && (<div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg border border-[#dfe1e6] shadow-lg py-1.5 z-50 animate-scale-in">
                        <div className="px-3 py-1 text-[9px] font-black tracking-wider text-[#6b778c] border-b border-[#ebecf0]">
                          Quick Filters
                        </div>
                        <button type="button" onClick={() => setOnlyMyIssues(!onlyMyIssues)} className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between gap-2 hover:bg-[#f4f5f7] transition-colors cursor-pointer ${onlyMyIssues ? 'font-bold text-[#0052cc]' : 'text-[#42526e]'}`}>
                          <span>Only My Work Items</span>
                          {onlyMyIssues && <Check className="w-3.5 h-3.5 text-[#0052cc]"/>}
                        </button>
                        <button type="button" onClick={() => setRecentlyUpdatedOnly(!recentlyUpdatedOnly)} className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between gap-2 hover:bg-[#f4f5f7] transition-colors cursor-pointer ${recentlyUpdatedOnly ? 'font-bold text-[#0052cc]' : 'text-[#42526e]'}`}>
                          <span>Recently Updated</span>
                          {recentlyUpdatedOnly && <Check className="w-3.5 h-3.5 text-[#0052cc]"/>}
                        </button>
                        <div className="my-1 border-t border-[#ebecf0]"/>
                        <button type="button" onClick={() => {
                        clearAllFilters();
                        setMoreFiltersOpen(false);
                    }} className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5 font-bold transition-colors cursor-pointer">
                          <X className="w-3 h-3"/>
                          Clear filters
                        </button>
                      </div>)}
                  </div>

                  {isWorkQueueSelected && (<div className="ml-auto flex items-center gap-2">
                      <span className="text-[11px] text-[#6b778c] tabular-nums whitespace-nowrap">
                        {filteredIssues.length} of {currentIssues.length} work items
                      </span>
                      <button type="button" onClick={() => {
                        setIssueTargetSprintId(isWorkQueueSelected ? WORK_QUEUE_SELECTION_ID : currentSprint.id);
                        if (!isWorkQueueSelected)
                            setSelectedSprintId(currentSprint.id);
                        setShowCreateIssueModal(true);
                    }} className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-bold bg-[#0052cc] hover:bg-[#0747a6] text-white transition-colors shadow-xs cursor-pointer whitespace-nowrap">
                        <Plus className="w-3.5 h-3.5"/>
                        <span>Create</span>
                      </button>
                    </div>)}
                </div>)}

            </div>

            {/* Work items table — a separate card directly below the unified
                summary + filter card (8px gap). It holds only the table; the
                filter toolbar is row 2 of the unified card
                above. The SAME table serves the selected iteration and the
                Work Queue — only its row source (currentIssues) differs, so
                layout, filters, links and row actions stay
                identical. */}
            {currentOpen ? (<div className="bg-white rounded-lg border border-[#dfe1e6] shadow-xs">

                {/* Table — compact fixed layout that fits the right column at
                    desktop widths (1440–1650px) without horizontal scrolling.
                    Summary shrinks and truncates; secondary columns use tight
                    but readable widths. */}
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed text-xs">
                    <colgroup>
                      <col className="w-[28px]"/>
                      <col className="w-[40px]"/>
                      <col className="w-[112px]"/>
                      <col />
                      <col className="w-[86px]"/>
                      <col className="w-[76px]"/>
                      <col className="w-[78px]"/>
                      <col className="w-[86px]"/>
                      <col className="w-[30px]"/>
                    </colgroup>
                    <thead>
                      <tr className="bg-[#fafbfc] border-b border-[#dfe1e6] text-[10px] tracking-wider text-[#6b778c]">
                        <th className="px-3 py-1.5 text-left font-bold">
                          <input type="checkbox" aria-label="Select all work items" checked={filteredIssues.length > 0 && filteredIssues.every((issue) => selectedIssueIds.includes(issue.id))} onChange={(e) => {
                    const visibleIds = filteredIssues.map((issue) => issue.id);
                    setSelectedIssueIds((prev) => e.target.checked
                        ? Array.from(new Set([...prev, ...visibleIds]))
                        : prev.filter((id) => !visibleIds.includes(id)));
                }} className="rounded border-[#dfe1e6] text-[#0052cc] focus:ring-[#0052cc] cursor-pointer"/>
                        </th>
                        <th className="px-2 py-1.5 text-left font-bold" title="Type">
                          <span className="sr-only">Type</span>
                        </th>
                        <th className="px-2 py-1.5 text-left font-bold">Key</th>
                        <th className="px-2 py-1.5 text-left font-bold">Summary</th>
                        <th className="px-1.5 py-1.5 text-left font-bold">Status</th>
                        <th className="px-1.5 py-1.5 text-left font-bold">PI</th>
                        <th className="px-1.5 py-1.5 text-left font-bold">Component</th>
                        <th className="px-1.5 py-1.5 text-left font-bold" title="Assignee">
                          Assignee
                        </th>
                        <th className="px-1 py-1.5 text-right font-bold">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIssues.length === 0 ? (<tr>
                          <td colSpan={9} className="px-4 py-8 text-center">
                            <Search className="w-7 h-7 mx-auto text-[#c5c8ce] mb-2"/>
                            <p className="text-xs font-semibold text-[#5f6368]">No work items match your filters</p>
                            <p className="text-[11px] text-[#9aa0a6] mt-0.5">
                              Try changing the search or clearing a filter.
                            </p>
                          </td>
                        </tr>) : (filteredIssues.map((issue) => {
                    const isDone = issue.status === 'DONE';
                    const isSelected = selectedIssueIds.includes(issue.id);
                    return (<tr key={issue.id} data-work-item-row={issue.id} draggable onDragStart={(e) => handleDndDragStart(e, issue, isWorkQueueSelected ? null : currentSprint.id)} onDragEnd={handleDndDragEnd} onClick={(e) => handleOpenTask(issue, e.ctrlKey || e.metaKey, isWorkQueueSelected ? null : currentSprint.id)} className={`border-b border-[#f1f2f4] transition-colors cursor-grab active:cursor-grabbing ${dndSource?.issue.id === issue.id ? 'opacity-40' : ''} ${isSelected ? 'bg-[#deebff]/40' : 'bg-white hover:bg-[#f7f9fc]'}`}>
                              <td className={`px-2 py-1 align-middle border-l-[3px] ${typeAccent[String(issue.type).toUpperCase().replace(/_/g, '-')] || 'border-l-[#94a3b8]'}`} onClick={(e) => e.stopPropagation()}>
                                <input type="checkbox" checked={isSelected} onChange={(e) => {
                            setSelectedIssueIds((prev) => prev.includes(issue.id)
                                ? prev.filter((id) => id !== issue.id)
                                : [...prev, issue.id]);
                        }} aria-label={`Select ${issue.key || issue.title}`} className="rounded border-[#dfe1e6] text-[#0052cc] focus:ring-[#0052cc] cursor-pointer"/>
                              </td>

                              <td className="px-1 py-1 align-middle" title={issue.type}>
                                <WorkItemIcon typeLabel={issue.type}/>
                              </td>

                              <td className="px-1.5 py-1 align-middle" onClick={(e) => e.stopPropagation()}>
                                <button type="button" onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTask(issue, e.ctrlKey || e.metaKey, isWorkQueueSelected ? null : currentSprint.id);
                        }} className={`font-semibold tracking-tight text-[#0052cc] hover:underline cursor-pointer text-left truncate max-w-full ${isDone ? 'line-through' : ''}`} title={`Priority: ${issue.priority}`}>
                                  {issue.key}
                                </button>
                              </td>

                              <td className="px-2 py-1 align-middle overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                <button type="button" onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTask(issue, e.ctrlKey || e.metaKey, isWorkQueueSelected ? null : currentSprint.id);
                        }} className={`w-full text-left truncate font-semibold text-[#172b4d] hover:text-[#0052cc] transition-colors cursor-pointer leading-tight ${isDone ? 'text-[#42526e] line-through' : ''}`} title={`Click to open work item: ${issue.title}`}>
                                  {issue.title}
                                </button>
                                <div className="text-[10px] text-[#6b778c] truncate leading-tight mt-0.5">
                                  {typeLabelShort[String(issue.type).toUpperCase().replace(/_/g, '-')] || issue.type}
                                  {issue.storyPoints ? ` · ${issue.storyPoints} pt` : ''}
                                </div>
                              </td>

                              <td className="px-1.5 py-1 align-middle">
                                {(() => {
                            const isCancelledRow = issue.status === 'CANCELLED' ||
                                (issue.status === 'DONE' && issue.resolution === 'CANCELLED');
                            const tone = isCancelledRow
                                ? 'bg-[#f1f5f9] text-[#475569] border-[#e2e8f0]'
                                : issue.status === 'DONE'
                                    ? 'bg-[#d1fae5] text-[#047857] border-[#a7f3d0]'
                                    : issue.status === 'IN_PROGRESS' || issue.status === 'IN_REVIEW'
                                        ? 'bg-[#ccfbf1] text-[#0f766e] border-[#99f6e4]'
                                        : issue.status === 'BLOCKED'
                                            ? 'bg-[#fee2e2] text-[#b91c1c] border-[#fecaca]'
                                            : 'bg-[#f1f5f9] text-[#475569] border-[#e2e8f0]';
                            const label = isCancelledRow
                                ? 'Cancelled'
                                : issue.status === 'DONE'
                                    ? 'Done'
                                    : issue.status === 'IN_PROGRESS'
                                        ? 'In Progress'
                                        : issue.status === 'IN_REVIEW'
                                            ? 'In Review'
                                            : issue.status === 'BLOCKED'
                                                ? 'Blocked'
                                                : issue.status === 'TODO'
                                                    ? 'To Do'
                                                    : issue.status;
                            return (<span className={`inline-flex items-center whitespace-nowrap px-1.5 py-0.5 rounded text-[10px] font-bold border ${tone}`}>
                                      {label}
                                    </span>);
                        })()}
                              </td>

                              <td className="px-1 py-1 align-middle">
                                {issue.releaseTag && (<span className="block px-1 py-0.5 rounded text-[9px] font-semibold bg-[#ebecf0] text-[#42526e] border border-[#dfe1e6] truncate whitespace-nowrap leading-tight" title={issue.releaseTag}>
                                    {issue.releaseTag}
                                  </span>)}
                              </td>

                              <td className="px-1.5 py-1 align-middle">
                                {issue.epicName && (<span className={`block px-1.5 py-0.5 rounded text-[10px] font-bold truncate border ${issue.epicColor || 'bg-[#f4f5f7] text-[#42526e] border-[#dfe1e6]'}`} title={issue.epicName}>
                                    {issue.epicName}
                                  </span>)}
                              </td>

                              <td className="px-1.5 py-1 align-middle" title={`Assignee: ${issue.assigneeName}`}>
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {issue.avatarUrl ? (<img src={issue.avatarUrl} alt={issue.assigneeName} className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200 flex-shrink-0"/>) : (<div className="w-5 h-5 rounded-full text-white text-[9px] font-bold flex items-center justify-center ring-1 ring-slate-200 flex-shrink-0" style={{ backgroundColor: issue.assigneeAvatarColor }}>
                                      {issue.assigneeInitial}
                                    </div>)}
                                  <span className="text-[11px] text-[#42526e] truncate">
                                    {(issue.assigneeName || '').split(' ')[0]}
                                  </span>
                                </div>
                              </td>

                              <td className="px-1 py-1 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                                <span className="relative inline-flex" data-row-menu="">
                                  <button type="button" onClick={(e) => toggleRowActionMenu(e, issue, isWorkQueueSelected ? null : currentSprint.id)} className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer" title="Row actions" aria-label={`Actions for ${issue.key || issue.title}`} aria-haspopup="menu" aria-expanded={!!rowActionMenu && rowActionMenu.issue.id === issue.id}>
                                    <MoreHorizontal className="w-4 h-4"/>
                                  </button>
                                  {rowActionMenu && rowActionMenu.issue.id === issue.id && (<div data-row-menu="" role="menu" className="fixed z-50 w-44 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 animate-scale-in" style={{ left: rowActionMenu.x, top: rowActionMenu.y }} onClick={(e) => e.stopPropagation()}>
                                      <button type="button" role="menuitem" onClick={rowActionOpen} className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                        <ExternalLink className="w-3.5 h-3.5 text-slate-400"/>
                                        Open
                                      </button>
                                      <button type="button" role="menuitem" onClick={rowActionMove} className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                        <FolderInput className="w-3.5 h-3.5 text-slate-400"/>
                                        Move Work Item
                                      </button>
                                    </div>)}
                                </span>
                              </td>
                            </tr>);
                }))}
                    </tbody>
                  </table>
                </div>

                {/* Selection summary (rounded bottom so its tint conforms to the card corners) */}
                {selectedIssueIds.length > 0 && (<div className="px-3 py-1.5 border-t border-[#ebecf0] bg-[#fafbfc] rounded-b-lg flex items-center">
                    <span className="tabular-nums whitespace-nowrap text-[11px] text-[#0052cc] font-semibold">
                      {selectedIssueIds.length} selected
                    </span>
                  </div>)}
              </div>) : (<button type="button" onClick={() => (isWorkQueueSelected ? showWorkQueueItems() : openOnlySprint(currentSprint.id))} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-[#dfe1e6] bg-white shadow-xs text-xs font-bold text-[#0052cc] hover:bg-[#f7faff] hover:border-[#b3d4ff] transition-colors cursor-pointer">
                <ChevronDown className="w-4 h-4"/>
                <span>Show work items ({currentIssues.length})</span>
              </button>)}
          </section>
        </div>)}


      {/* Click-away backdrop closing any open row menu / popover / filter select */}
      {(moreMenuSprintId ||
            statusDropdownSprintId ||
            assigneesPopoverSprintId ||
            boardDropdownOpen ||
            createDropdownOpen ||
            assigneeFilterOpen ||
            componentFilterOpen ||
            statusFilterOpen ||
            piFilterOpen ||
            moreFiltersOpen ||
            iterFilterOpen) && (<div className="fixed inset-0 z-40" onClick={() => {
                setMoreMenuSprintId(null);
                setStatusDropdownSprintId(null);
                setAssigneesPopoverSprintId(null);
                setBoardDropdownOpen(false);
                setCreateDropdownOpen(false);
                closeWorkItemMenus();
            }}/>)}

      {/* The Work Queue is no longer a standalone section below the Iterations
            area — it is the left-panel Work Queue card directly below the last
            iteration card; selecting it renders its summary and work items in
            the right panel through the same table. */}

      {/* Modal: Move Work Item (two-step: form → confirmation) */}
      <MoveTaskModal isOpen={!!movingTask} task={movingTask} onClose={() => setMovingTask(null)}/>

      {/* Modal: View Linked Pages */}
      {showLinkedPagesModal && (<div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#0052cc]"/>
                <h3 className="text-base font-bold text-[#172b4d]">Linked Documentation Pages</h3>
              </div>
              <button onClick={() => setShowLinkedPagesModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="w-4 h-4"/>
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Documentation, runbooks, and PRD specifications linked to <strong>{project?.name} ({sprintDisplayTitle.split(' ')[0]})</strong>.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {linkedPages.map((page) => (<div key={page.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-[#0052cc] transition-all flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <a href={page.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#0052cc] hover:underline flex items-center gap-1.5">
                      <span>{page.title}</span>
                      <ExternalLink className="w-3 h-3 text-[#0052cc]"/>
                    </a>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Space: {page.space} • Updated {page.updatedAt}
                    </div>
                  </div>
                </div>))}
            </div>

            {/* Add new link form */}
            <form onSubmit={handleAddLinkedPage} className="pt-2 border-t border-slate-200 space-y-2">
              <div className="text-xs font-bold text-slate-800">Add Linked Document</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input type="text" value={newPageTitle} onChange={(e) => setNewPageTitle(e.target.value)} placeholder="e.g. Architecture Signoff Runbook" className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0052cc]" required/>
                <input type="url" value={newPageUrl} onChange={(e) => setNewPageUrl(e.target.value)} placeholder="https://confluence.internal/..." className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0052cc]"/>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowLinkedPagesModal(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100">
                  Close
                </button>
                <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0052cc] text-white hover:bg-[#0747a6]">
                  + Link Document
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* Modal: Create Iteration (shared, PI-aware — Project → PI → Iteration) */}
      <CreateIterationModal projectId={projectId} isOpen={showCreateSprintModal} initialPiId={createIterationPiId} onClose={() => setShowCreateSprintModal(false)} onCreated={(createdList) => {
            // The form creates one or more iterations; focus the first one.
            const created = createdList[0];
            if (!created)
                return;
            if (piGroupFilter !== 'ALL' && piGroupFilter !== created.piId)
                selectPiFilter(created.piId);
            setSelectedSprintId(created.id);
            // Accordion: fold every iteration the page already knew about, then
            // open the newly created one so it is the visible work-item panel.
            setExpandedSprintIds((prev) => {
                const next = {};
                Object.keys(prev).forEach((id) => {
                    next[id] = false;
                });
                next[defaultSprint.id] = false;
                next[created.id] = true;
                return next;
            });
        }}/>

      {/* Modal: Edit Iteration (reuses updateSprint store action) */}
      {showEditSprintModal && (<div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#0052cc]"/>
                <div>
                  <h3 className="text-base font-bold text-[#172b4d]">Edit Iteration</h3>
                  <p className="text-[11px] text-slate-500">Update {getSprintIdentifier(currentSprint)} for {project?.name}</p>
                </div>
              </div>
              <button onClick={() => setShowEditSprintModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4"/>
              </button>
            </div>

            <form onSubmit={handleEditSprintSubmit} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Iteration Name</label>
                <input type="text" value={editSprintName} onChange={(e) => setEditSprintName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0052cc]" required/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Date</label>
                  <input type="date" value={editSprintStartDate} onChange={(e) => setEditSprintStartDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0052cc]" required/>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Date</label>
                  <input type="date" value={editSprintEndDate} onChange={(e) => setEditSprintEndDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0052cc]" required/>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Iteration Goal / Deliverables</label>
                <textarea value={editSprintGoal} onChange={(e) => setEditSprintGoal(e.target.value)} placeholder="What is the objective or commitment of this iteration cadence?" className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0052cc]" rows={2}/>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowEditSprintModal(false)} className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-[#0052cc] text-white hover:bg-[#0747a6] font-bold cursor-pointer">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* Modal: Iteration Details (compact, read-only, reuses real iteration/user data) */}
      {showIterationDetailsModal && (<div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#0052cc]"/>
                <h3 className="text-base font-bold text-[#172b4d]">Iteration Details</h3>
              </div>
              <button onClick={() => setShowIterationDetailsModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4"/>
              </button>
            </div>

            <div className="space-y-0.5">
              {(() => {
                const teamLeader = users.find((u) => u.id === currentSprint.teamLeaderId);
                const createdBy = users.find((u) => u.id === currentSprint.createdById);
                const memberNames = (currentSprint.memberIds || [])
                    .map((id) => users.find((u) => u.id === id)?.name)
                    .filter((n) => Boolean(n));
                const fields = [
                    { label: 'Name', value: getSprintIdentifier(currentSprint) || null },
                    { label: 'Status', value: currentSprint.status || null },
                    { label: 'Start Date', value: currentSprint.startDate || null },
                    { label: 'End Date', value: currentSprint.endDate || null },
                    { label: 'Goal', value: currentSprint.goal || null },
                    { label: 'Team Leader', value: teamLeader?.name || null },
                    { label: 'Team Members', value: memberNames.length > 0 ? memberNames.join(', ') : null },
                    { label: 'Created By', value: createdBy?.name || null },
                    {
                        label: 'Created Date',
                        value: currentSprint.createdAt
                            ? new Date(currentSprint.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                            : null,
                    },
                ];
                return fields.map((f) => (<div key={f.label} className="flex items-start justify-between gap-3 py-1.5 border-b border-[#ebecf0] last:border-0">
                    <span className="text-slate-500 font-medium flex-shrink-0">{f.label}</span>
                    {f.value ? (<span className="text-slate-800 font-semibold text-right break-words">{f.value}</span>) : (<span className="text-slate-400 italic text-right">Not set</span>)}
                  </div>));
            })()}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button onClick={() => setShowIterationDetailsModal(false)} className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer">
                Close
              </button>
              <button onClick={() => {
                setShowIterationDetailsModal(false);
                openEditSprintModal();
            }} className="px-4 py-2 rounded-lg bg-[#0052cc] text-white hover:bg-[#0747a6] font-bold cursor-pointer">
                Edit
              </button>
            </div>
          </div>
        </div>)}

      {/* Confirm: Delete Iteration (reuses shared ConfirmDialog + existing deleteSprint action) */}
      <ConfirmDialog isOpen={showDeleteSprintConfirm} onClose={() => setShowDeleteSprintConfirm(false)} onConfirm={handleDeleteSprintConfirmed} title="Delete Iteration" message={`Are you sure you want to delete "${getSprintIdentifier(currentSprint)}"? Its tasks will be moved back to the project work queue. This action cannot be undone.`} confirmLabel="Delete Iteration" danger/>

      {/* Confirm: starting a sprint while another is active (only ONE active iteration) */}
      <ConfirmDialog isOpen={!!startConflict} onClose={() => setStartConflict(null)} onConfirm={handleStartSprintConfirmed} title="Start Iteration" message={startConflict
            ? `Another iteration is already active. Complete it before starting this one? "${getSprintIdentifier(startConflict.active)}" will be completed and "${getSprintIdentifier(startConflict.target)}" will start.`
            : ''} confirmLabel="Complete & Start"/>

      {/* Modal: Iteration Completion (existing flow — shows completed/incomplete counts and
            lets incomplete issues move to backlog / a future sprint) */}
      {completingSprint && (<SprintCompletionModal sprint={completingSprint} isOpen={true} onClose={() => setCompletingSprint(null)} onComplete={() => {
                setExpandedSprintIds((prev) => {
                    const next = {};
                    Object.keys(prev).forEach((id) => {
                        next[id] = false;
                    });
                    next[defaultSprint.id] = false;
                    next[completingSprint.id] = true;
                    return next;
                });
            }}/>)}

      {/* Modal: Create Issue */}
      {showCreateIssueModal && (<div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#0052cc]"/>
                <h3 className="text-base font-bold text-[#172b4d]">
                  Create Work Item in{' '}
                  {issueTargetSprintId === WORK_QUEUE_SELECTION_ID
                ? 'the Work Queue'
                : `${projectKey} Iteration`}
                </h3>
              </div>
              <button onClick={() => setShowCreateIssueModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="w-4 h-4"/>
              </button>
            </div>

            <form onSubmit={handleCreateIssue} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Issue Summary</label>
                <input type="text" value={newIssueSummary} onChange={(e) => setNewIssueSummary(e.target.value)} placeholder={`e.g. Implement ${project?.name} core feature workflow`} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0052cc]" required/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Issue Type</label>
                  <select value={newIssueType} onChange={(e) => setNewIssueType(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0052cc]">
                    <option value="STORY">Story</option>
                    <option value="TASK">Task</option>
                    <option value="BUG">Bug</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Story Points</label>
                  <input type="number" min="1" max="13" value={newIssuePoints} onChange={(e) => setNewIssuePoints(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0052cc]"/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Epic / Component</label>
                  <input type="text" value={newIssueEpic} onChange={(e) => setNewIssueEpic(e.target.value)} placeholder="e.g. Core Platform" className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0052cc]"/>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assignee</label>
                  <select value={newIssueAssignee} onChange={(e) => setNewIssueAssignee(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0052cc]">
                    {projectTeamMembers.map((user) => (<option key={user.id} value={user.name}>{user.name}</option>))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowCreateIssueModal(false)} className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-[#0052cc] text-white hover:bg-[#0747a6] font-bold">
                  Create Work Item
                </button>
              </div>
            </form>
          </div>
        </div>)}

    </div>);
};
