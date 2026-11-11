import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LayoutDashboard, LayoutGrid, X, MessageSquare, Trash2, Ban, RotateCcw, Calendar, ListTree, Filter, ChevronDown, ChevronRight, ChevronsRight, Check, Search, Pin, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { RichTextEditor } from '../../components/common/RichTextEditor';
import { IterationHeader } from '../../components/common/IterationHeader';
import { ProgressBar } from '../../components/common/ProgressBar';
import { SprintStatusBadge } from '../../components/common/Badges';
import { getPriorityDotColor, isCancelledWorkItem } from '../../utils/roleUtils';
import { getIssueKeyPrefix } from '../../utils/projectIdentity';
import { piNumberForSprint } from '../../utils/programIncrement';
import { matchId } from '../../utils/idUtils';
import { sortProjectSprints, buildProjectTeamMembers, buildSprintIssuesMap, } from '../../utils/sprintIssues';
import { useIterationPaths } from './IterationModuleLayout';
import { BOARD_COLUMNS, columnLabel, columnOfStatus, statusForColumn, canTransition, isValidDropTarget, needsComment, } from './sprintBoardTransitions';
const COLUMN_DOTS = {
  TODO: 'bg-[#6b778c]',
  IN_PROGRESS: 'bg-[#0052cc]',
  DONE: 'bg-[#00875a]',
};
const issueStatusClass = (status) => {
  switch (status) {
    case 'DONE':
      return 'bg-[#e3fcef] text-[#00875a]';
    case 'IN_PROGRESS':
      return 'bg-[#deebff] text-[#0052cc]';
    case 'IN_REVIEW':
      return 'bg-[#eae6ff] text-[#5e4db2]';
    case 'TESTING':
      return 'bg-[#fff7d6] text-[#974f0c]';
    case 'BUG_FIX':
      return 'bg-[#ffeceb] text-[#bf2600]';
    case 'RETEST':
      return 'bg-[#fff0e6] text-[#a54800]';
    case 'BLOCKED':
      return 'bg-[#ffeceb] text-[#bf2600]';
    default:
      return 'bg-[#f1f2f4] text-[#42526e]';
  }
};
const issueStatusLabel = (status) => {
  switch (status) {
    case 'TODO':
      return 'To Do';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'IN_REVIEW':
      return 'In Review';
    case 'BUG_FIX':
      return 'Bug Fix';
    case 'RETEST':
      return 'Retest';
    default:
      return status.charAt(0) + status.slice(1).toLowerCase();
  }
};
const typeLabel = (type) => type === 'SUB-TASK' ? 'Sub-task' : type === 'BUG_FIX' ? 'Bug' : type === 'EPIC' ? 'Epic' : type === 'BUG' ? 'Bug' : type === 'TASK' ? 'Task' : type === 'STORY' ? 'Story' : type;
const TYPE_BADGE = {
  INITIATIVE: { label: 'IN', className: 'bg-fuchsia-100 text-fuchsia-800' },
  FEATURE: { label: 'FT', className: 'bg-indigo-100 text-indigo-800' },
  EPIC: { label: 'EP', className: 'bg-purple-100 text-purple-800' },
  STORY: { label: 'ST', className: 'bg-emerald-100 text-emerald-800' },
  TASK: { label: 'TA', className: 'bg-blue-100 text-blue-800' },
  'SUB-TASK': { label: 'SB', className: 'bg-sky-100 text-sky-800' },
  BUG: { label: 'BG', className: 'bg-red-100 text-red-800' },
  BUG_FIX: { label: 'BG', className: 'bg-red-100 text-red-800' },
  IMPROVEMENT: { label: 'IM', className: 'bg-amber-100 text-amber-800' },
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(d.getDate()).padStart(2, '0')}/${months[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`;
};

const formatDay = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
};

const fmtDateTime = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const isBlankHtml = (html) => {
  const withoutImages = html.replace(/<img\b[^>]*>/gi, '');
  return withoutImages
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim().length === 0;
};

const buildCommentContent = (html, image) => {
  const body = html && !isBlankHtml(html) ? html.trim() : '';
  const imagePart = image ? `<img src="${image}" alt="Pasted screenshot" />` : '';
  if (body && imagePart) return `${body}<br/>${imagePart}`;
  return body || imagePart;
};

const makePasteAttachment = (image) => {
  const comma = image.indexOf(',');
  const bytes = comma >= 0 ? Math.max(1, Math.round((image.length - comma - 1) * 0.75)) : image.length;
  return {
    fileId: `paste-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fileName: 'pasted-screenshot.png',
    fileSize: bytes,
    fileType: 'image/png',
    attachedAt: new Date().toISOString(),
  };
};

const buildColumnOrder = (issuesList) => ({
  TODO: issuesList.filter((i) => columnOfStatus(i.status) === 'TODO').map((i) => i.id),
  IN_PROGRESS: issuesList.filter((i) => columnOfStatus(i.status) === 'IN_PROGRESS').map((i) => i.id),
  DONE: issuesList.filter((i) => columnOfStatus(i.status) === 'DONE').map((i) => i.id),
});

const DEFAULT_PINNED_IDS = ['u-pm-01', 'u-m-01', 'u-m-02', 'u-m-03', 'u-m-04', 'u-m-05'];
const DEFAULT_ISSUE_COUNTS = {
  'u-pm-01': 28,
  'u-m-01': 24,
  'u-m-02': 20,
  'u-m-03': 18,
  'u-m-04': 16,
  'u-m-05': 14,
};

const readPinnedIds = (storageKey) => {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_PINNED_IDS;
};

const writePinnedIds = (storageKey, ids) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(ids));
  } catch {
    // ignore storage errors
  }
};

const toMemberOption = (id, name, { initial, color, avatarUrl } = {}) => ({
  id,
  name,
  displayName: name.split(' ')[0],
  initial: initial || name[0],
  color: color || '#3b82f6',
  avatarUrl,
});

const filterMembersByQuery = (members, query) => {
  const q = query.trim().toLowerCase();
  if (!q) return members;
  return members.filter(
    (m) =>
      (m.displayName || '').toLowerCase().includes(q) ||
      (m.name || '').toLowerCase().includes(q)
  );
};

const useOutsideClick = (ref, active, onClose) => {
  useEffect(() => {
    if (!active) return;
    const onMouseDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [ref, active, onClose]);
};

const MemberAvatar = ({ src, alt, initial, color, sizeClass = 'w-5 h-5 text-[9px]' }) => (
  <span
    className={`${sizeClass} rounded-full overflow-hidden flex items-center justify-center font-bold text-white flex-shrink-0`}
    style={{ backgroundColor: color }}
  >
    {src ? <img src={src} alt={alt} className="w-full h-full object-cover" /> : initial}
  </span>
);

export const ActiveSprintPage = ({ project, sprintId, sprint }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { basePath } = useIterationPaths();
  const { sprints, pis, tasks, users, teams, updateTask, addComment, assignTask, issueStatusOverrides, issueResolutions, issueComments, setIssueStatusOverride, setIssueResolutionOverride, addIssueComment, setIssueAssigneeOverride, } = useAppStore();
  const { currentUser } = useAuthStore();
  const requestedSprintParam = sprint?.id || sprintId || searchParams.get('sprintId') || searchParams.get('sprint') || searchParams.get('iteration');
  const projectSprints = useMemo(() => sortProjectSprints(sprints, project.id), [sprints, project.id]);
  const [selectedSprintId, setSelectedSprintId] = useState(() => {
    if (sprint?.id) return sprint.id;
    if (requestedSprintParam) {
      const found = projectSprints.find((s) => matchId(s.id, requestedSprintParam) || s.iterationNumber === requestedSprintParam || s.name === requestedSprintParam);
      if (found) return found.id;
    }
    const active = projectSprints.find((s) => s.status === 'ACTIVE');
    return active?.id || projectSprints[0]?.id;
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedPiFilter, setSelectedPiFilter] = useState(null);
  const [piFilterOpen, setPiFilterOpen] = useState(false);
  const piMenuRef = useRef(null);
  const closePiFilter = useCallback(() => setPiFilterOpen(false), []);
  useOutsideClick(piMenuRef, piFilterOpen, closePiFilter);

  useEffect(() => {
    if (sprint?.id) {
      setSelectedSprintId(sprint.id);
    } else if (requestedSprintParam) {
      const found = projectSprints.find((s) => matchId(s.id, requestedSprintParam) || s.iterationNumber === requestedSprintParam || s.name === requestedSprintParam);
      if (found) setSelectedSprintId(found.id);
    }
  }, [sprint?.id, requestedSprintParam, projectSprints]);

  const activeSprint = useMemo(() => {
    if (selectedSprintId) {
      const found = projectSprints.find((s) => s.id === selectedSprintId);
      if (found) return found;
    }
    if (sprint)
      return sprint;
    if (requestedSprintParam) {
      const found = projectSprints.find((s) => matchId(s.id, requestedSprintParam) || s.iterationNumber === requestedSprintParam || s.name === requestedSprintParam);
      if (found)
        return found;
    }
    return projectSprints.find((s) => s.status === 'ACTIVE') || projectSprints[0];
  }, [selectedSprintId, sprint, requestedSprintParam, projectSprints]);

  const availableIterations = useMemo(() => {
    return projectSprints.filter((s) => s.status !== 'ARCHIVED');
  }, [projectSprints]);

  const projectPis = useMemo(() => {
    const map = new Map();
    availableIterations.forEach((s) => {
      const num = piNumberForSprint(s, pis);
      if (num !== undefined && !map.has(num)) {
        const foundPi = pis.find((p) => p.id === s.piId || p.number === num);
        map.set(num, {
          number: num,
          label: foundPi?.name || `PI ${num}`,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.number - b.number);
  }, [availableIterations, pis]);

  const filteredIterations = useMemo(() => {
    if (selectedPiFilter === null) return availableIterations;
    return availableIterations.filter((s) => piNumberForSprint(s, pis) === selectedPiFilter);
  }, [availableIterations, selectedPiFilter, pis]);

  const activePiNumber = useMemo(() => (activeSprint ? piNumberForSprint(activeSprint, pis) : undefined), [activeSprint, pis]);
  const projectTeamMembers = useMemo(() => buildProjectTeamMembers(project, teams, users), [project, teams, users]);
  const projectKey = getIssueKeyPrefix(project) || 'PRJ';
  const issuesBySprint = useMemo(() => buildSprintIssuesMap({
    tasks,
    users,
    project,
    projectId: project.id,
    projectKey,
    projectTeamMembers,
    projectSprints,
  }), [tasks, users, project, project.id, projectKey, projectTeamMembers, projectSprints]);
  const issues = useMemo(() => (activeSprint ? issuesBySprint[activeSprint.id] || [] : []), [issuesBySprint, activeSprint]);
  const storeTaskById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const pinnedStorageKey = `kanban_pinned_members_${currentUser?.id || 'guest'}_${project?.id || 'default'}`;
  const [pinnedMemberIds, setPinnedMemberIds] = useState(() => readPinnedIds(pinnedStorageKey));

  useEffect(() => {
    setPinnedMemberIds(readPinnedIds(pinnedStorageKey));
    setSelectedMemberId(null);
  }, [pinnedStorageKey]);

  const [activeFilter, setActiveFilter] = useState('my');
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [selectedAddIds, setSelectedAddIds] = useState([]);
  const addMenuRef = useRef(null);
  const closeAdd = useCallback(() => setAddOpen(false), []);
  useOutsideClick(addMenuRef, addOpen, closeAdd);

  const [draggedChipId, setDraggedChipId] = useState(null);
  const [dragOverChipId, setDragOverChipId] = useState(null);
  const suppressChipClickRef = useRef(false);

  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverStatus, setDragOverStatus] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [doneZone, setDoneZone] = useState(null);
  const [pendingTransition, setPendingTransition] = useState(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentImage, setCommentImage] = useState(null);
  const [pendingAssigneeId, setPendingAssigneeId] = useState(undefined);
  const [detailItemId, setDetailItemId] = useState(null);
  const [columnOrder, setColumnOrder] = useState(() => buildColumnOrder(issues));

  useEffect(() => {
    setColumnOrder(buildColumnOrder(issues));
  }, [activeSprint?.id]);
  const [hoverCardId, setHoverCardId] = useState(null);

  const statusOf = (issue) => {
    const storeTask = storeTaskById.get(issue.id);
    if (storeTask)
      return storeTask.status;
    return issueStatusOverrides[issue.id] ?? issue.status;
  };

  const isCancelled = (issueId) => {
    const storeTask = storeTaskById.get(issueId);
    if (storeTask)
      return isCancelledWorkItem(storeTask);
    const status = issueStatusOverrides[issueId];
    return status === 'CANCELLED' || issueResolutions[issueId] === 'CANCELLED';
  };

  const issueById = (issueId) => issues.find((i) => i.id === issueId);
  const overrideMeta = (issueId) => {
    const issue = issueById(issueId);
    const updated = issue ? new Date(issue.updatedDate).getTime() : NaN;
    return {
      previousStatus: issue ? statusOf(issue) : undefined,
      sourceEnteredAt: Number.isNaN(updated) ? undefined : new Date(updated).toISOString(),
      userId: currentUser?.id,
    };
  };

  const availableProjectMembers = useMemo(() => {
    const map = new Map();
    const userById = new Map(users.map((u) => [u.id, u]));

    projectTeamMembers.forEach((u) => {
      map.set(u.id, toMemberOption(u.id, u.name, { color: u.avatarColor || '#2563eb', avatarUrl: u.avatarUrl }));
    });

    issues.forEach((i) => {
      if (i.assigneeName && i.assigneeName !== 'Unassigned') {
        const foundUser = users.find((u) => u.name === i.assigneeName || u.name.split(' ')[0] === i.assigneeName);
        const id = foundUser?.id || i.assigneeName;
        if (!map.has(id)) {
          map.set(id, toMemberOption(id, i.assigneeName, {
            initial: i.assigneeInitial,
            color: i.assigneeAvatarColor || foundUser?.avatarColor,
            avatarUrl: i.avatarUrl || foundUser?.avatarUrl,
          }));
        }
      }
    });

    tasks.forEach((t) => {
      if (t.projectId === project.id && t.assigneeId && !map.has(t.assigneeId)) {
        const u = userById.get(t.assigneeId);
        if (u) map.set(u.id, toMemberOption(u.id, u.name, { color: u.avatarColor, avatarUrl: u.avatarUrl }));
      }
    });

    users.forEach((u) => {
      if (u.status !== 'INACTIVE' && !map.has(u.id)) {
        map.set(u.id, toMemberOption(u.id, u.name, { color: u.avatarColor, avatarUrl: u.avatarUrl }));
      }
    });

    return Array.from(map.values());
  }, [projectTeamMembers, issues, users, tasks, project.id]);

  const memberById = useMemo(
    () => new Map(availableProjectMembers.map((m) => [m.id, m])),
    [availableProjectMembers]
  );

  const matchesMember = useCallback(
    (issue, member) => {
      if (!issue || !member) return false;
      const storeTask = storeTaskById.get(issue.id);
      if (storeTask?.assigneeId && storeTask.assigneeId === member.id) {
        return true;
      }
      const aName = (issue.assigneeName || '').trim().toLowerCase();
      const mName = (member.name || '').trim().toLowerCase();
      const mDisplay = (member.displayName || '').trim().toLowerCase();

      if (aName === mName || aName === mDisplay) return true;
      if (mDisplay && (aName.startsWith(mDisplay + ' ') || aName === mDisplay)) return true;
      if (mName && aName.includes(mName)) return true;
      return false;
    },
    [storeTaskById]
  );

  const memberIssueCounts = useMemo(() => {
    const counts = {};
    availableProjectMembers.forEach((m) => {
      const directCount = tasks.filter(
        (t) =>
          t.projectId === project.id &&
          (t.assigneeId === m.id ||
            t.assigneeName === m.name ||
            t.assigneeName === m.displayName)
      ).length;

      let sprintCount = 0;
      Object.values(issuesBySprint).forEach((sprintList) => {
        sprintList.forEach((issue) => {
          if (matchesMember(issue, m)) sprintCount++;
        });
      });

      counts[m.id] = Math.max(directCount, sprintCount, DEFAULT_ISSUE_COUNTS[m.id] || 0);
    });
    return counts;
  }, [availableProjectMembers, tasks, project.id, issuesBySprint, matchesMember]);

  const pinnedMembers = useMemo(
    () => pinnedMemberIds.map((id) => memberById.get(id)).filter(Boolean),
    [pinnedMemberIds, memberById]
  );

  const unpinnedMembers = useMemo(() => {
    const pinnedSet = new Set(pinnedMemberIds);
    return filterMembersByQuery(
      availableProjectMembers.filter((m) => !pinnedSet.has(m.id)),
      addSearchQuery
    );
  }, [availableProjectMembers, pinnedMemberIds, addSearchQuery]);

  const filteredIssues = useMemo(() => {
    let list = issues;

    if (activeFilter === 'my') {
      const me = (currentUser?.name || '').trim().toLowerCase();
      const meFirst = me.split(' ')[0];
      list = list.filter((i) => {
        const aName = (i.assigneeName || '').trim().toLowerCase();
        if (!aName || aName === 'unassigned') return false;
        return aName === me || aName === meFirst || (meFirst && aName.startsWith(meFirst + ' '));
      });
    }

    if (selectedMemberId) {
      const selectedMember = memberById.get(selectedMemberId);
      if (selectedMember) {
        list = list.filter((issue) => matchesMember(issue, selectedMember));
      }
    }

    if (activeFilter === 'recent') {
      list = [...list].sort((a, b) => (b.updatedDate || '').localeCompare(a.updatedDate || ''));
    }

    return list;
  }, [issues, activeFilter, currentUser, selectedMemberId, memberById, matchesMember]);

  const updatePinnedMemberIds = useCallback((updater) => {
    setPinnedMemberIds((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      writePinnedIds(pinnedStorageKey, next);
      return next;
    });
  }, [pinnedStorageKey]);

  const togglePin = (memberId) => {
    updatePinnedMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
    setSelectedMemberId((prev) => (prev === memberId ? null : prev));
  };

  const reorderPinnedMembers = (sourceId, targetId) => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    updatePinnedMemberIds((prev) => {
      const fromIdx = prev.indexOf(sourceId);
      const toIdx = prev.indexOf(targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  };

  const toggleAddCandidate = (memberId) => {
    setSelectedAddIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleAddSelectedMembers = () => {
    if (selectedAddIds.length === 0) return;
    updatePinnedMemberIds((prev) => {
      const existing = new Set(prev);
      const additions = selectedAddIds.filter((id) => !existing.has(id));
      return additions.length > 0 ? [...prev, ...additions] : prev;
    });
    setSelectedAddIds([]);
    setAddSearchQuery('');
    setAddOpen(false);
  };

  const handleToggleMemberFilter = (memberId) => {
    setSelectedMemberId((prev) => (prev === memberId ? null : memberId));
  };
  const columnItems = useMemo(() => {
    const visibleIds = new Set(filteredIssues.map((i) => i.id));
    const byId = new Map(filteredIssues.map((i) => [i.id, i]));
    const out = { TODO: [], IN_PROGRESS: [], DONE: [] };
    const placed = new Set();
    for (const col of BOARD_COLUMNS) {
      for (const id of columnOrder[col]) {
        if (placed.has(id) || !visibleIds.has(id))
          continue;
        const it = byId.get(id);
        if (!it)
          continue;
        if (columnOfStatus(statusOf(it)) === col) {
          out[col].push(it);
          placed.add(id);
        }
      }
    }
    for (const it of filteredIssues) {
      if (placed.has(it.id))
        continue;
      out[columnOfStatus(statusOf(it))].push(it);
      placed.add(it.id);
    }
    // Terminal states: group cancelled items before completed ones in DONE column.
    if (out.DONE.some((i) => isCancelled(i.id))) {
      out.DONE = [
        ...out.DONE.filter((i) => isCancelled(i.id)),
        ...out.DONE.filter((i) => !isCancelled(i.id)),
      ];
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredIssues, columnOrder, issueStatusOverrides, issueResolutions, storeTaskById]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (showCommentModal) {
        resetPending();
      } else if (detailItemId) {
        setDetailItemId(null);
      } else if (addOpen) {
        setAddOpen(false);
      } else if (piFilterOpen) {
        setPiFilterOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showCommentModal, detailItemId, addOpen, piFilterOpen]);

  const resetPending = () => {
    setPendingTransition(null);
    setShowCommentModal(false);
    setCommentText('');
    setCommentImage(null);
    setPendingAssigneeId(undefined);
  };

  const clearDragState = () => {
    setDraggedItem(null);
    setDragOverStatus(null);
    setDragOverIndex(null);
    setDoneZone(null);
    setHoverCardId(null);
  };

  // Applies confirmed transition to store task or issue override with optional comment.
  const applyTransition = (issueId, to, text, image) => {
    const storeTask = storeTaskById.get(issueId);
    const newStatus = statusForColumn(to);
    const content = buildCommentContent(text, image);
    if (storeTask) {
      const updates = {
        status: newStatus,
        completedAt: to === 'DONE' ? new Date().toISOString() : undefined,
      };
      if (to === 'DONE') {
        updates.resolution = storeTask.resolution === 'CANCELLED' ? 'CANCELLED' : 'DONE';
        updates.resolvedAt = storeTask.resolvedAt || new Date().toISOString();
      } else {
        updates.resolution = undefined;
        updates.resolvedAt = undefined;
      }
      const res = updateTask(issueId, updates, currentUser?.id || 'u-pm-01');
      if (!res.ok) {
        toast.error(res.reason || 'That move is not allowed.');
        return;
      }
      if (content) {
        addComment(issueId, currentUser?.id || 'u-pm-01', content, image ? [makePasteAttachment(image)] : []);
      }
    } else {
      setIssueStatusOverride(issueId, newStatus, overrideMeta(issueId));
      if (content) {
        addIssueComment(issueId, currentUser?.id || 'u-pm-01', content, image ? [makePasteAttachment(image)] : []);
      }
    }
  };

  // Cancel or restore a completed work item in the DONE column.
  const toggleCancelled = (issueId) => {
    const storeTask = storeTaskById.get(issueId);
    const cancelled = isCancelled(issueId);
    if (storeTask) {
      const updates = cancelled
        ? {
            status: 'DONE',
            resolution: 'DONE',
            resolvedAt: storeTask.resolvedAt || new Date().toISOString(),
            completedAt: storeTask.completedAt || new Date().toISOString(),
          }
        : {
            status: 'CANCELLED',
            resolution: undefined,
            resolvedAt: undefined,
            completedAt: undefined,
          };
      const res = updateTask(issueId, updates, currentUser?.id || 'u-pm-01');
      if (!res.ok) toast.error(res.reason || 'That move is not allowed.');
    } else if (cancelled) {
      setIssueStatusOverride(issueId, 'DONE', { ...overrideMeta(issueId), resolution: 'DONE' });
    } else {
      setIssueStatusOverride(issueId, 'CANCELLED', overrideMeta(issueId));
    }
  };

  const reorderInColumn = (id, col, index) => {
    setColumnOrder((prev) => {
      const rest = prev[col].filter((x) => x !== id);
      const at = Math.max(0, Math.min(index, rest.length));
      const next = [...rest];
      next.splice(at, 0, id);
      return { ...prev, [col]: next };
    });
  };

  const handleDragStart = (issue, e) => {
    e.dataTransfer.setData('text/plain', issue.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItem({ id: issue.id, column: columnOfStatus(statusOf(issue)) });
  };

  const handleDragEnd = () => {
    clearDragState();
  };

  const markDragOver = (col, valid) => {
    setDragOverStatus((prev) => prev && prev.column === col && prev.valid === valid ? prev : { column: col, valid });
  };

  const handleColumnDragOver = (col, e) => {
    if (!draggedItem) return;
    const valid = isValidDropTarget(draggedItem.column, col);
    if (!e.target.closest('[data-done-zone]')) setDoneZone(null);
    markDragOver(col, valid);
    setDragOverIndex({ column: col, index: columnItems[col].length });
    if (valid) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleCardDragOver = (issue, col, index, e) => {
    e.stopPropagation();
    setDoneZone(null);
    if (!draggedItem) return;
    const valid = isValidDropTarget(draggedItem.column, col);
    markDragOver(col, valid);
    setDragOverIndex({ column: col, index });
    setHoverCardId(issue.id);
    if (valid) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleColumnDragLeave = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDragOverStatus(null);
    setDragOverIndex(null);
    setDoneZone(null);
  };

  const handleDrop = (col, e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedItem?.id;
    const insertIndex = dragOverIndex && dragOverIndex.column === col ? dragOverIndex.index : columnItems[col].length;
    clearDragState();
    if (!id) return;
    const issue = issues.find((i) => i.id === id);
    if (!issue) return;
    const from = columnOfStatus(statusOf(issue));
    if (from === col) {
      reorderInColumn(id, col, insertIndex);
      return;
    }
    if (!canTransition(from, col)) return;
    if (needsComment(from, col)) {
      setPendingTransition({ itemId: id, from, to: col });
      setShowCommentModal(true);
    } else {
      applyTransition(id, col, '', null);
    }
  };

  const handleDoneZoneDragOver = (zone, e) => {
    if (!draggedItem) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDoneZone(zone);
  };

  const handleDoneZoneDrop = (zone, e) => {
    e.stopPropagation();
    const id = e.dataTransfer.getData('text/plain') || draggedItem?.id;
    const issue = id ? issues.find((i) => i.id === id) : undefined;
    const from = issue ? columnOfStatus(statusOf(issue)) : null;

    if (zone === 'DONE') {
      if (issue && from === 'DONE') {
        e.preventDefault();
        clearDragState();
        if (isCancelled(issue.id)) toggleCancelled(issue.id);
        return;
      }
      setDoneZone(null);
      handleDrop('DONE', e);
      return;
    }

    e.preventDefault();
    clearDragState();
    if (!issue || from === null) return;
    if (from === 'DONE') {
      if (!isCancelled(issue.id)) toggleCancelled(issue.id);
      return;
    }
    if (!canTransition(from, 'DONE')) return;

    const storeTask = storeTaskById.get(issue.id);
    if (storeTask) {
      updateTask(issue.id, {
        status: 'CANCELLED',
        completedAt: undefined,
        resolution: undefined,
        resolvedAt: undefined,
      }, currentUser?.id || 'u-pm-01');
    } else {
      setIssueStatusOverride(issue.id, 'CANCELLED', overrideMeta(issue.id));
    }
  };

  const openIssueDetailsPage = (issue) => {
    navigate(`/member/tasks/${issue.key}`);
  };

  const handleCommentContinue = () => {
    if (!pendingTransition) return;
    const issue = issues.find((i) => i.id === pendingTransition.itemId);
    applyTransition(pendingTransition.itemId, pendingTransition.to, commentText, commentImage);
    if (issue && pendingAssigneeId !== undefined) {
      const storeTask = storeTaskById.get(issue.id);
      const currentId = storeTask
        ? storeTask.assigneeId
        : projectTeamMembers.find((u) => u.name === issue.assigneeName)?.id;
      if (pendingAssigneeId !== (currentId ?? '')) {
        if (storeTaskById.has(issue.id))
          assignTask(issue.id, pendingAssigneeId, currentUser?.id || '');
        else
          setIssueAssigneeOverride(issue.id, pendingAssigneeId);
      }
    }
    resetPending();
  };

  const moveToFromDetail = (issueId, from, to) => {
    if (!canTransition(from, to)) return;
    if (needsComment(from, to)) {
      setDetailItemId(null);
      setPendingTransition({ itemId: issueId, from, to });
      setShowCommentModal(true);
      return;
    }
    applyTransition(issueId, to, '', null);
  };

  const captureImagePaste = useCallback((clipboardData) => {
    const items = clipboardData?.items;
    if (!items) return false;
    for (const item of Array.from(items)) {
      if (!item.type.startsWith('image/')) continue;
      const file = item.getAsFile();
      if (!file) continue;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') setCommentImage(reader.result);
      };
      reader.readAsDataURL(file);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (!showCommentModal) return;
    const onPaste = (e) => {
      if (e.defaultPrevented) return;
      captureImagePaste(e.clipboardData);
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [showCommentModal, captureImagePaste]);

  if (!activeSprint) {
    return (<div className="flex-1 min-w-0 pt-1 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#f1f2f4] border border-[#dfe1e6] flex items-center justify-center mb-4">
          <LayoutDashboard className="w-6 h-6 text-[#747775]" />
        </div>
        <h2 className="text-base font-bold text-[#1f1f1f]">No live iteration</h2>
        <p className="text-sm text-[#6b778c] mt-1 max-w-[400px]">
          {project.name} does not have a live iteration right now. Open Iterations to view upcoming and
          completed iterations.
        </p>
        <button onClick={() => navigate(basePath)} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold bg-[#0052cc] hover:bg-[#0747a6] text-white shadow-xs transition-colors cursor-pointer">
          Go to Iterations
        </button>
      </div>
    </div>);
  }

  const endMs = new Date(activeSprint.endDate).getTime();
  const daysLeft = Number.isNaN(endMs) ? 0 : Math.max(0, Math.ceil((endMs - Date.now()) / 86400000));
  const detailIssue = detailItemId ? issues.find((i) => i.id === detailItemId) : undefined;
  const detailStoreTask = detailIssue ? storeTaskById.get(detailIssue.id) : undefined;
  const detailStatus = detailIssue ? statusOf(detailIssue) : 'TODO';
  const detailColumn = columnOfStatus(detailStatus);
  const detailCancelled = detailIssue ? isCancelled(detailIssue.id) : false;
  const detailComments = detailIssue
    ? [
      ...(detailStoreTask?.comments || []),
      ...(issueComments[detailIssue.id] || []),
    ].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    : [];
  const pendingIssue = pendingTransition ? issues.find((i) => i.id === pendingTransition.itemId) : undefined;
  const pendingIssueStoreTask = pendingIssue ? storeTaskById.get(pendingIssue.id) : undefined;
  const pendingIssueAssigneeId = pendingIssueStoreTask
    ? pendingIssueStoreTask.assigneeId
    : pendingIssue
      ? projectTeamMembers.find((u) => u.name === pendingIssue.assigneeName)?.id
      : undefined;

  const renderSidebarCard = (s) => {
    const sIssues = issuesBySprint[s.id] || [];
    const total = sIssues.length;
    const completed = sIssues.filter((i) => i.status === 'DONE' && !isCancelledWorkItem(i)).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const isSelected = s.id === activeSprint?.id;
    const isActiveStatus = s.status === 'ACTIVE';
    const cardTitle = s.iterationNumber || s.name;
    const accentColor = isActiveStatus ? 'bg-[#0d9488]' : s.status === 'COMPLETED' ? 'bg-[#059669]' : 'bg-[#94a3b8]';
    const statusLabel = isActiveStatus ? 'Active' : s.status === 'COMPLETED' ? 'Completed' : 'Planned';

    if (isSidebarCollapsed) {
      const tooltipText = `${cardTitle} (${statusLabel})\n${formatDay(s.startDate)} – ${formatDay(s.endDate)}\n${completed} / ${total} work item${total === 1 ? '' : 's'} (${pct}%)`;
      const dotColor = isActiveStatus ? 'bg-[#0d9488]' : s.status === 'COMPLETED' ? 'bg-[#059669]' : 'bg-[#94a3b8]';

      return (
        <div
          key={s.id}
          role="button"
          tabIndex={0}
          aria-current={isSelected}
          aria-label={`${cardTitle} (${statusLabel})`}
          title={tooltipText}
          onClick={() => setSelectedSprintId(s.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setSelectedSprintId(s.id);
            }
          }}
          className={`group relative rounded-lg border px-1.5 py-2 pl-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-0.5 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/40 ${
            isSelected
              ? 'border-[#0d9488] bg-[#f7faff] ring-1 ring-[#0d9488]/30 shadow-xs'
              : isActiveStatus
                ? 'border-[#99f6e4] bg-[#f0fdfa] hover:border-[#0d9488]'
                : 'border-[#dfe1e6] bg-white hover:border-[#b3d4ff] hover:bg-[#fafbff]'
          }`}
        >
          <span aria-hidden="true" className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg ${accentColor}`} />
          <div className="flex items-center justify-center gap-1 w-full min-w-0">
            <span
              aria-hidden="true"
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor} ${
                isActiveStatus ? 'ring-2 ring-[#0d9488]/25' : ''
              }`}
            />
            <span
              className={`text-xs font-bold tracking-tight truncate ${
                isActiveStatus ? 'text-[#0f766e]' : 'text-[#172b4d]'
              }`}
            >
              {cardTitle}
            </span>
          </div>
          <span
            className={`text-[9px] leading-tight font-semibold truncate max-w-full ${
              isActiveStatus
                ? 'text-[#0d9488]'
                : s.status === 'COMPLETED'
                  ? 'text-[#059669]'
                  : 'text-[#6b778c]'
            }`}
          >
            {statusLabel}
          </span>
        </div>
      );
    }

    return (
      <div
        key={s.id}
        role="button"
        tabIndex={0}
        aria-current={isSelected}
        onClick={() => setSelectedSprintId(s.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setSelectedSprintId(s.id);
          }
        }}
        className={`group relative rounded-lg border px-2 py-1.5 pl-2.5 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-[#0d9488]/40 ${
          isSelected
            ? 'border-[#0d9488] bg-[#f7faff] ring-1 ring-[#0d9488]/30 shadow-xs'
            : 'border-[#dfe1e6] bg-white hover:border-[#b3d4ff] hover:bg-[#fafbff]'
        }`}
      >
        <span aria-hidden="true" className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg ${accentColor}`} />
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-[#172b4d] tracking-tight" title={cardTitle}>
              {cardTitle}
            </span>
            <SprintStatusBadge status={s.status} />
          </div>
          <span className="p-0.5 -m-0.5 text-[#6b778c] flex-shrink-0">
            {isSelected ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </span>
        </div>

        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] leading-tight text-[#6b778c]">
          <Calendar className="w-3 h-3 text-[#9aa0a6] flex-shrink-0" />
          <span className="whitespace-nowrap">
            {formatDay(s.startDate)} - {formatDay(s.endDate)}
          </span>
        </div>

        <div className="mt-0.5 flex items-center justify-between gap-2 text-[10px] leading-tight">
          <span className="inline-flex items-center gap-1 text-[#42526e] font-medium min-w-0">
            <ListTree className="w-3 h-3 text-[#9aa0a6] flex-shrink-0" />
            <span className="tabular-nums">
              {total} work item{total === 1 ? '' : 's'}
            </span>
          </span>
        </div>

        <div className="mt-0.5 flex items-center gap-2">
          <ProgressBar value={pct} height="sm" animated={false} className="flex-1 min-w-0" />
          <span className="text-[10px] leading-tight font-semibold text-[#6b778c] tabular-nums whitespace-nowrap flex-shrink-0">
            {completed} / {total} · {pct}%
          </span>
        </div>
      </div>
    );
  };

  return (<div className="flex-1 min-w-0 pt-1 flex gap-3 items-start w-full">
    {/* Left-side Iterations panel */}
    <aside
      aria-label="Iterations sidebar"
      className={`flex-shrink-0 flex flex-col min-w-0 overflow-x-clip transition-[width] duration-[250ms] ease-in-out ${
        isSidebarCollapsed ? 'w-[76px]' : 'w-[240px] lg:w-[250px]'
      }`}
    >
      {isSidebarCollapsed ? (
        <div className="flex items-center justify-center pb-1.5 mb-1">
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(false)}
            className="inline-flex items-center justify-center w-full h-7 rounded-md border border-[#dfe1e6] bg-white text-[#42526e] hover:bg-[#f4f5f7] hover:text-[#172b4d] transition-colors cursor-pointer"
            title="Expand iterations sidebar"
            aria-label="Expand iterations sidebar"
            aria-expanded={false}
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between pb-1.5 mb-1 px-0.5 relative">
          <h2 className="text-sm font-bold text-[#172b4d] truncate">Iterations</h2>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="relative" ref={piMenuRef}>
              <button
                type="button"
                onClick={() => setPiFilterOpen((prev) => !prev)}
                className={`inline-flex items-center justify-center h-6 px-1.5 rounded border text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedPiFilter !== null
                    ? 'border-[#b3d4ff] bg-[#deebff] text-[#0052cc]'
                    : 'border-[#dfe1e6] bg-white text-[#42526e] hover:bg-[#f4f5f7] hover:text-[#172b4d]'
                }`}
                title="Filter by Program Increment"
                aria-haspopup="listbox"
                aria-expanded={piFilterOpen}
              >
                <Filter className="w-3 h-3 flex-shrink-0" />
                {selectedPiFilter !== null && <span className="ml-1">PI {selectedPiFilter}</span>}
              </button>

              {piFilterOpen && (
                <div
                  className="absolute right-0 top-full mt-1 min-w-[9rem] bg-white rounded-lg border border-[#dfe1e6] shadow-lg py-1 z-50 animate-scale-in"
                  role="listbox"
                >
                  <div className="px-3 py-1 text-[9px] font-black tracking-wider text-[#6b778c] border-b border-[#ebecf0] uppercase">
                    Program Increment
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPiFilter(null);
                      setPiFilterOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between gap-2 hover:bg-[#f4f5f7] transition-colors cursor-pointer ${
                      selectedPiFilter === null ? 'font-bold text-[#0052cc]' : 'text-[#42526e]'
                    }`}
                  >
                    <span>All PIs</span>
                    {selectedPiFilter === null && <Check className="w-3.5 h-3.5 text-[#0052cc]" />}
                  </button>
                  {projectPis.map((p) => {
                    const isSelected = selectedPiFilter === p.number;
                    const count = availableIterations.filter((s) => piNumberForSprint(s, pis) === p.number).length;
                    return (
                      <button
                        key={p.number}
                        type="button"
                        onClick={() => {
                          setSelectedPiFilter(p.number);
                          setPiFilterOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between gap-2 hover:bg-[#f4f5f7] transition-colors cursor-pointer ${
                          isSelected ? 'font-bold text-[#0052cc]' : 'text-[#42526e]'
                        }`}
                      >
                        <span>{p.label}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[#9aa0a6] tabular-nums">{count}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#0052cc]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setPiFilterOpen(false);
                setIsSidebarCollapsed(true);
              }}
              className="inline-flex items-center justify-center h-6 px-2 rounded border border-[#dfe1e6] bg-white text-xs font-semibold text-[#42526e] hover:bg-[#f4f5f7] hover:text-[#172b4d] transition-colors cursor-pointer whitespace-nowrap"
              title="Collapse iterations sidebar"
              aria-label="Collapse iterations sidebar"
              aria-expanded={true}
            >
              <span>Collapse</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {filteredIterations.map(renderSidebarCard)}
      </div>
    </aside>

    {/* Right-side Kanban View layout */}
    <div className="flex-1 min-w-0 flex flex-col">
      <IterationHeader projectName={project.name} piNumber={activePiNumber} sprintName={activeSprint.iterationNumber || activeSprint.name} startDate={activeSprint.startDate} endDate={activeSprint.endDate} status={activeSprint.status} issuesCount={issues.length} daysLeft={daysLeft} rightAction={<button onClick={() => navigate(`${basePath}/iteration-board`)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold bg-[#0052cc] hover:bg-[#0747a6] text-white shadow-xs transition-colors cursor-pointer flex-shrink-0">
        <LayoutGrid className="w-3.5 h-3.5" />
        Iteration Board
      </button>} />

    {/* ROW 1 — Work Item Filters */}
    <div className="flex-shrink-0 pb-2 flex items-center justify-between gap-2 flex-wrap">
      <div
        role="group"
        aria-label="Work item filters"
        className="inline-flex items-center gap-0.5 bg-white border border-[#dfe1e6] rounded-lg p-0.5 shadow-2xs"
      >
        {[
          { id: 'my', label: 'Only My Work Items' },
          { id: 'all', label: 'All Work Items' },
          { id: 'recent', label: 'Recently Updated' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-filter={tab.id}
            aria-pressed={activeFilter === tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer select-none ${
              activeFilter === tab.id
                ? 'bg-[#deebff] text-[#0747a6]'
                : 'text-[#42526e] hover:bg-[#f1f2f4]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredIssues.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-[#6b778c]">
          <span data-empty-filter className="font-semibold text-[#6b778c]">
            No work items match the current filter
          </span>
        </div>
      )}
    </div>

    {/* Quick Filters */}
    <div className="flex-shrink-0 pb-3 flex items-center gap-1.5 flex-wrap min-h-[32px]">
        <span className="text-xs font-bold text-[#42526e] mr-1 select-none whitespace-nowrap">
          Quick Filters:
        </span>

        {pinnedMembers.map((member, idx) => {
          const isSelected = selectedMemberId === member.id;
          const isDragging = draggedChipId === member.id;
          const isDropTarget = dragOverChipId === member.id && draggedChipId && draggedChipId !== member.id;
          return (
            <div
              key={member.id}
              role="button"
              tabIndex={0}
              draggable
              aria-pressed={isSelected}
              title={`${member.name} · Priority #${idx + 1} (drag to reorder)`}
              onClick={() => {
                if (suppressChipClickRef.current) return;
                handleToggleMemberFilter(member.id);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleToggleMemberFilter(member.id);
                }
              }}
              onDragStart={(e) => {
                e.stopPropagation();
                suppressChipClickRef.current = true;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('application/x-quick-filter-member', member.id);
                setDraggedChipId(member.id);
              }}
              onDragOver={(e) => {
                if (!draggedChipId) return;
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverChipId !== member.id) setDragOverChipId(member.id);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget) && dragOverChipId === member.id) {
                  setDragOverChipId(null);
                }
              }}
              onDrop={(e) => {
                if (!draggedChipId) return;
                e.preventDefault();
                e.stopPropagation();
                const sourceId = e.dataTransfer.getData('application/x-quick-filter-member') || draggedChipId;
                reorderPinnedMembers(sourceId, member.id);
                setDraggedChipId(null);
                setDragOverChipId(null);
                setTimeout(() => { suppressChipClickRef.current = false; }, 0);
              }}
              onDragEnd={() => {
                setDraggedChipId(null);
                setDragOverChipId(null);
                setTimeout(() => { suppressChipClickRef.current = false; }, 0);
              }}
              className={`group inline-flex items-center gap-1.5 pl-1 pr-1.5 py-1 rounded-full border text-xs font-semibold transition-all cursor-pointer select-none ${
                isDragging
                  ? 'opacity-45 border-[#4c9aff] bg-[#f0f7ff] cursor-grabbing'
                  : isDropTarget
                    ? 'border-[#0052cc] bg-[#e6f0ff] ring-2 ring-[#4c9aff]/40'
                    : isSelected
                      ? 'bg-[#deebff] border-[#0052cc] text-[#0052cc] shadow-xs'
                      : 'bg-white border-[#dfe1e6] text-[#42526e] hover:border-[#4c9aff] hover:bg-[#f8f9fa]'
              }`}
            >
              <MemberAvatar
                src={member.avatarUrl}
                alt={member.displayName}
                initial={member.initial}
                color={member.color}
                sizeClass="w-4 h-4 text-[8px]"
              />
              <span>{member.displayName}</span>
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  togglePin(member.id);
                }}
                title={`Unpin ${member.displayName}`}
                aria-label={`Unpin ${member.displayName}`}
                className={`w-4 h-4 rounded-full inline-flex items-center justify-center transition-colors cursor-pointer ${
                  isSelected
                    ? 'text-[#0052cc]/80 hover:text-[#bf2600] hover:bg-[#ffebe6]'
                    : 'text-[#8993a4] opacity-75 group-hover:opacity-100 hover:text-[#bf2600] hover:bg-[#ffebe6]'
                }`}
              >
                <Pin className="w-2.5 h-2.5 rotate-45 fill-current" />
              </button>
            </div>
          );
        })}

        <div className="relative" ref={addMenuRef}>
          <button
            type="button"
            onClick={() => {
              setAddOpen((prev) => {
                const next = !prev;
                if (next) {
                  setAddSearchQuery('');
                  setSelectedAddIds([]);
                }
                return next;
              });
            }}
            aria-expanded={addOpen}
            aria-haspopup="dialog"
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed text-xs font-semibold transition-colors cursor-pointer select-none whitespace-nowrap ${
              addOpen
                ? 'border-[#0052cc] bg-[#deebff] text-[#0052cc]'
                : 'border-[#c1c7d0] bg-white text-[#42526e] hover:border-[#0052cc] hover:text-[#0052cc] hover:bg-[#f0f7ff]'
            }`}
            title="Add employees to Quick Filters"
          >
            <Plus className="w-3 h-3" />
            <span>Add</span>
          </button>

          {addOpen && (
            <div
              role="dialog"
              aria-label="Add employees to Quick Filters"
              className="absolute left-0 top-full mt-1.5 w-72 max-w-[calc(100vw-2rem)] bg-white rounded-xl border border-[#dfe1e6] shadow-xl p-3 z-50 animate-scale-in"
            >
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#ebecf0]">
                <span className="text-[11px] font-bold text-[#172b4d] uppercase tracking-wider">
                  Add Employees
                </span>
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="p-0.5 rounded text-[#6b778c] hover:text-[#172b4d] hover:bg-[#f4f5f7] transition-colors cursor-pointer"
                  aria-label="Close add employees"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-[#6b778c] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={addSearchQuery}
                  onChange={(e) => setAddSearchQuery(e.target.value)}
                  placeholder="Search employees..."
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white rounded-lg border border-[#dfe1e6] text-[#172b4d] placeholder-[#8590a2] focus:outline-none focus:border-[#4c9aff] focus:ring-1 focus:ring-[#4c9aff] transition-colors"
                  autoFocus
                />
              </div>

              <div className="max-h-52 overflow-y-auto space-y-0.5 pr-0.5">
                {unpinnedMembers.length === 0 ? (
                  <div className="py-5 text-center text-xs text-[#8590a2]">
                    {addSearchQuery.trim() ? 'No matching employees found' : 'All employees are already pinned'}
                  </div>
                ) : (
                  unpinnedMembers.map((m) => {
                    const checked = selectedAddIds.includes(m.id);
                    const count = memberIssueCounts[m.id] ?? 0;
                    return (
                      <label
                        key={m.id}
                        className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                          checked ? 'bg-[#f0f7ff]' : 'hover:bg-[#f4f5f7]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAddCandidate(m.id)}
                          className="w-3.5 h-3.5 rounded border-[#c1c7d0] text-[#0052cc] focus:ring-[#4c9aff] cursor-pointer flex-shrink-0"
                        />
                        <MemberAvatar
                          src={m.avatarUrl}
                          alt={m.name}
                          initial={m.initial}
                          color={m.color}
                        />
                        <span className="text-xs font-semibold text-[#172b4d] truncate flex-1 min-w-0">
                          {m.name}
                        </span>
                        <span className="text-[10px] text-[#6b778c] tabular-nums flex-shrink-0">
                          {count}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>

              <div className="border-t border-[#ebecf0] pt-2.5 mt-2.5 flex items-center justify-between gap-2">
                <span className="text-[11px] text-[#6b778c]">
                  {selectedAddIds.length > 0 ? `${selectedAddIds.length} selected` : 'Select to pin'}
                </span>
                <button
                  type="button"
                  disabled={selectedAddIds.length === 0}
                  onClick={handleAddSelectedMembers}
                  className="px-3 py-1 bg-[#0052cc] hover:bg-[#0747a6] disabled:bg-[#ebecf0] disabled:text-[#a5adba] disabled:cursor-not-allowed text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  Add Selected
                </button>
              </div>
            </div>
          )}
        </div>
    </div>

    <div data-board className="flex flex-col min-h-[calc(100vh_-_16rem)] overflow-x-auto pb-4">
      <div className="flex-1 min-h-0 grid grid-cols-3 gap-2 min-w-[600px] lg:min-w-0 items-stretch">
        {BOARD_COLUMNS.map((col) => {
          const items = columnItems[col];
          const over = dragOverStatus && dragOverStatus.column === col ? dragOverStatus : null;
          const isDone = col === 'DONE';
          // Show Cancelled / Done drop targets when a card is dragged over DONE.
          const showDoneTargets = isDone && !!draggedItem && !!over && over.valid;
          const hideDoneCards = showDoneTargets && !!draggedItem && draggedItem.column !== 'DONE';
          const bodyCls = isDone
            ? over && !over.valid
              ? 'bg-[#f7f8f9] border-[#dfe1e6] cursor-not-allowed'
              : 'bg-[#f7f8f9] border-[#dfe1e6]'
            : over
              ? over.valid
                ? 'bg-[#e3fcef] border-[#36b37e] border-dashed'
                : 'bg-[#f1f2f4] border-[#dfe1e6] border-dashed cursor-not-allowed'
              : 'bg-[#f7f8f9] border-[#dfe1e6]';
          const renderCard = (issue, idx) => {
            const cancelled = isCancelled(issue.id);
            const isAnchor = !!draggedItem &&
              !!dragOverIndex &&
              dragOverIndex.column === col &&
              dragOverIndex.index === idx;
            return (<article key={issue.id} data-issue-key={issue.key} data-assignee={issue.assigneeName} draggable role="button" tabIndex={0} aria-label={`${issue.key}: ${issue.title}`} onClick={() => openIssueDetailsPage(issue)} onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openIssueDetailsPage(issue);
              }
            }} onDragStart={(e) => handleDragStart(issue, e)} onDragEnd={handleDragEnd} onDragOver={(e) => handleCardDragOver(issue, col, idx, e)} onMouseEnter={() => setHoverCardId(issue.id)} onMouseLeave={() => setHoverCardId((v) => (v === issue.id ? null : v))} className={`bg-white border rounded-md px-2.5 py-2 shadow-sm flex-shrink-0 cursor-grab active:cursor-grabbing select-none transition-colors ${draggedItem && draggedItem.id === issue.id
              ? 'opacity-40 border-[#4c9aff]'
              : isAnchor
                ? 'border-[#4c9aff] shadow-md'
                : hoverCardId === issue.id
                  ? 'border-[#4c9aff]'
                  : 'border-[#dfe1e6] hover:border-[#4c9aff]'}`}>
              {/* Header: issue key and assignee avatar */}
              <div className="flex items-center justify-between gap-1.5 mb-1 min-w-0">
                <span onClick={(e) => { e.stopPropagation(); openIssueDetailsPage(issue); }} className="text-[11px] font-bold text-[#0052cc] truncate min-w-0 cursor-pointer">
                  {issue.key}
                </span>
                <span className="flex items-center gap-1.5 flex-shrink-0">
                  {cancelled && (<span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#f1f2f4] text-[#6b778c] border border-[#dfe1e6]">
                    Cancelled
                  </span>)}
                  <span title={`${issue.assigneeName} — quick view`} onClick={(e) => { e.stopPropagation(); setDetailItemId(issue.id); }} className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center text-[9px] font-bold text-white cursor-pointer" style={{ backgroundColor: issue.assigneeAvatarColor }}>
                    {issue.avatarUrl ? (<img src={issue.avatarUrl} alt={issue.assigneeName} className="w-full h-full object-cover" />) : (issue.assigneeInitial)}
                  </span>
                </span>
              </div>
              <div className="text-xs font-semibold text-[#1f1f1f] leading-snug line-clamp-2 mb-1" title={issue.title}>
                {issue.title}
              </div>
              {/* Epic label */}
              <div className="mb-1 min-w-0">
                <span className={`inline-block max-w-full truncate text-[9px] font-bold px-1.5 py-0.5 rounded border ${issue.epicColor}`} title={issue.epicName}>
                  {issue.epicName}
                </span>
              </div>
              {/* Priority, type, and story points */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getPriorityDotColor(issue.priority)}`} title={`Priority: ${issue.priority.charAt(0) + issue.priority.slice(1).toLowerCase()}`} />
                {TYPE_BADGE[issue.type] && (<span className={`text-[9px] font-bold px-1 rounded flex-shrink-0 ${TYPE_BADGE[issue.type].className}`} title={typeLabel(issue.type)}>
                  {TYPE_BADGE[issue.type].label}
                </span>)}
                <span className="text-[10px] font-bold text-[#42526e] bg-[#f1f2f4] rounded px-1 py-0.5 flex-shrink-0">
                  {issue.storyPoints ?? 0}
                </span>
              </div>
            </article>);
          };
          return (<section key={col} className="min-w-0 flex flex-col">
            <div data-column={col} aria-label={`${columnLabel[col]} column`} onDragOver={(e) => handleColumnDragOver(col, e)} onDrop={(e) => handleDrop(col, e)} onDragLeave={handleColumnDragLeave} className={`flex-1 min-h-0 flex flex-col rounded-xl border-2 overflow-hidden transition-colors ${bodyCls}`}>
              <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-[#e4e6eb] flex-shrink-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${COLUMN_DOTS[col]}`} />
                  <span className="text-[11px] font-black tracking-wider text-[#42526e]">
                    {columnLabel[col]}
                  </span>
                </div>
                <span data-column-count={items.length} className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-[#f1f2f4] text-[#42526e]">
                  {items.length}
                </span>
              </div>
              {over && (!isDone || !over.valid) && (
                <div className="flex items-center justify-between px-2.5 pt-1.5 flex-shrink-0">
                  <span className={`text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded ${over.valid ? 'bg-[#36b37e] text-white' : 'bg-[#6b778c] text-white'}`}>
                    {over.valid ? 'Drop Here' : 'Not Allowed'}
                  </span>
                </div>
              )}
              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin flex flex-col gap-2 px-2.5 py-2">
                {/* Drag-only drop targets: Cancelled / Done */}
                {showDoneTargets && (<div className="flex-1 min-h-0 flex flex-col gap-2">
                  {['CANCELLED', 'DONE'].map((zone) => (<div key={zone} data-done-zone={zone} onDragOver={(e) => handleDoneZoneDragOver(zone, e)} onDrop={(e) => handleDoneZoneDrop(zone, e)} className={`flex-1 min-h-[72px] flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-3 py-3 text-center transition-colors ${doneZone === zone
                    ? zone === 'CANCELLED'
                      ? 'border-[#6b778c] bg-[#f1f2f4]'
                      : 'border-[#36b37e] bg-[#e3fcef]'
                    : zone === 'CANCELLED'
                      ? 'border-[#dfe1e6] bg-[#f7f8f9]'
                      : 'border-[#abf5d1] bg-[#e3fcef]/50'}`}>
                    <div className={`text-[10px] font-bold tracking-wider ${zone === 'CANCELLED' ? 'text-[#6b778c]' : 'text-[#00875a]'}`}>
                      {zone === 'CANCELLED' ? 'Cancelled' : 'Done'}
                    </div>
                    <div className="text-[9px] font-bold tracking-wider text-[#8590a2] mt-0.5">
                      Drop Here
                    </div>
                  </div>))}
                </div>)}
                {!hideDoneCards &&
                  (items.length === 0 ? (<div className="flex-1 flex items-center justify-center text-center px-4 py-8">
                    <p className="text-[11px] text-[#8590a2]">No work items</p>
                  </div>) : (<div className="flex flex-col gap-2 flex-shrink-0">
                    {items.map((issue, i) => renderCard(issue, i))}
                  </div>))}
              </div>
            </div>
          </section>);
        })}
      </div>
    </div>
    </div>

    {showCommentModal && pendingTransition && pendingIssue && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#091e42]/45" data-comment-modal onClick={resetPending}>
      <div role="dialog" aria-modal="true" aria-label="Transition dialog" className="w-full max-w-lg bg-white rounded-xl border border-[#dfe1e6] shadow-2xl p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="text-[10px] font-bold tracking-wider text-[#747775]">New status</div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold flex-wrap">
              <span className="px-1.5 py-0.5 rounded bg-[#f1f2f4] text-[#42526e]">
                {columnLabel[pendingTransition.from]}
              </span>
              <span className="text-[#6b778c]">→</span>
              <span className="px-1.5 py-0.5 rounded bg-[#deebff] text-[#0052cc]">
                {columnLabel[pendingTransition.to]}
              </span>
            </div>
          </div>
          <button aria-label="Close" onClick={resetPending} className="p-1 rounded-md text-[#6b778c] hover:bg-[#f1f2f4] hover:text-[#1f1f1f] cursor-pointer flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[11px] font-bold text-[#0052cc]">{pendingIssue.key}</span>
            <span className="text-xs text-[#6b778c] truncate" title={pendingIssue.title}>
              {pendingIssue.title}
            </span>
          </div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#747775] mb-1">
            Assignee
          </label>
          <select value={pendingAssigneeId ?? pendingIssueAssigneeId ?? ''} onChange={(e) => setPendingAssigneeId(e.target.value)} className="w-full rounded-lg border border-[#dfe1e6] bg-white px-2.5 py-2 text-xs font-semibold text-[#1f1f1f] focus:border-[#4c9aff] focus:outline-none focus:ring-2 focus:ring-[#4c9aff]/20 mb-2">
            <option value="">Unassigned</option>
            {projectTeamMembers.map((u) => (<option key={u.id} value={u.id}>{u.name}</option>))}
          </select>
          <div className="rounded-lg border border-[#dfe1e6] focus-within:border-[#4c9aff] focus-within:ring-2 focus-within:ring-[#4c9aff]/20 transition-colors overflow-hidden" onClick={(e) => {
            const target = e.target;
            if (target.closest('button'))
              return;
            const editable = e.currentTarget.querySelector('.ProseMirror');
            if (editable && document.activeElement !== editable)
              editable.focus();
          }}>
            <RichTextEditor content={commentText} onChange={setCommentText} placeholder="Add a comment for this transition (optional)..." minHeight="96px" autoFocus mentionableUsers={projectTeamMembers} editableAttributes={{ 'data-comment-input': '' }} onImagePaste={(dataUrl) => setCommentImage(dataUrl)} />
          </div>
          <p className="mt-1 text-[10px] text-[#747775]">
            Paste a screenshot with Ctrl+V — the comment itself is optional.
          </p>
        </div>
        {commentImage && (<div data-paste-preview className="mb-3 flex items-start gap-2 p-2 rounded-lg bg-[#f7f8f9] border border-[#e4e6eb]">
          <img src={commentImage} alt="Pasted screenshot" className="w-24 h-16 object-cover rounded border border-[#dfe1e6]" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-[#42526e]">Screenshot attached</p>
            <button data-paste-remove onClick={() => setCommentImage(null)} className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-[#bf2600] hover:text-[#991d00] cursor-pointer">
              <Trash2 className="w-3 h-3" />
              Remove
            </button>
          </div>
        </div>)}
        <div className="flex items-center justify-end gap-2">
          <button data-action="comment-cancel" onClick={resetPending} className="px-3 py-1.5 rounded-md text-xs font-bold text-[#42526e] hover:bg-[#f1f2f4] cursor-pointer">
            Cancel
          </button>
          <button data-action="comment-continue" onClick={handleCommentContinue} className="px-3 py-1.5 rounded-md text-xs font-bold bg-[#0052cc] hover:bg-[#0747a6] text-white cursor-pointer">
            Continue
          </button>
        </div>
      </div>
    </div>)}

    {detailIssue && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#091e42]/45" data-detail-modal onClick={() => setDetailItemId(null)}>
      <div role="dialog" aria-modal="true" aria-label={`Issue ${detailIssue.key}`} className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-xl border border-[#dfe1e6] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#e4e6eb]">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span data-detail-key className="text-xs font-bold text-[#0052cc]">
              {detailIssue.key}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${detailCancelled ? 'bg-[#f1f2f4] text-[#6b778c]' : issueStatusClass(detailStatus)}`}>
              {detailCancelled ? 'Cancelled' : issueStatusLabel(detailStatus)}
            </span>
          </div>
          <button aria-label="Close" onClick={() => setDetailItemId(null)} className="p-1 rounded-md text-[#6b778c] hover:bg-[#f1f2f4] hover:text-[#1f1f1f] cursor-pointer flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <h3 className="text-base font-bold text-[#1f1f1f] mb-3">{detailIssue.title}</h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
            <div className="bg-[#f7f8f9] border border-[#e4e6eb] rounded-lg px-2.5 py-2 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#747775]">Type</div>
              <div className="text-xs font-bold text-[#1f1f1f] truncate">
                {typeLabel(detailStoreTask?.type ?? detailIssue.type)}
              </div>
            </div>
            <div className="bg-[#f7f8f9] border border-[#e4e6eb] rounded-lg px-2.5 py-2 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#747775]">Priority</div>
              <div className="text-xs font-bold text-[#1f1f1f] truncate">{detailIssue.priority}</div>
            </div>
            <div className="bg-[#f7f8f9] border border-[#e4e6eb] rounded-lg px-2.5 py-2 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#747775]">Points</div>
              <div className="text-xs font-bold text-[#1f1f1f]">{detailIssue.storyPoints ?? 0}</div>
            </div>
            <div className="bg-[#f7f8f9] border border-[#e4e6eb] rounded-lg px-2.5 py-2 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#747775]">Epic</div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: detailIssue.epicColor }} />
                <span className="text-xs font-bold text-[#1f1f1f] truncate">{detailIssue.epicName}</span>
              </div>
            </div>
            <div className="bg-[#f7f8f9] border border-[#e4e6eb] rounded-lg px-2.5 py-2 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#747775]">PI</div>
              <div className="text-xs font-bold text-[#1f1f1f] truncate">
                {detailIssue.releaseTag ? detailIssue.releaseTag.split(' ').pop() : '—'}
              </div>
            </div>
            <div className="bg-[#f7f8f9] border border-[#e4e6eb] rounded-lg px-2.5 py-2 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#747775]">Updated</div>
              <div className="text-xs font-bold text-[#1f1f1f] truncate">{fmtDate(detailIssue.updatedDate)}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4 p-2.5 rounded-lg bg-[#f7f8f9] border border-[#e4e6eb]">
            <span className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ backgroundColor: detailIssue.assigneeAvatarColor }}>
              {detailIssue.avatarUrl ? (<img src={detailIssue.avatarUrl} alt={detailIssue.assigneeName} className="w-full h-full object-cover" />) : (detailIssue.assigneeInitial)}
            </span>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#747775]">Assignee</div>
              <div className="text-xs font-bold text-[#1f1f1f] truncate">{detailIssue.assigneeName}</div>
            </div>
          </div>

          {detailStoreTask?.description && (<div className="mb-4">
            <div className="text-[10px] font-bold tracking-wider text-[#747775] mb-1">
              Description
            </div>
            <p className="text-xs text-[#42526e] leading-relaxed">{detailStoreTask.description}</p>
          </div>)}

          <div className="mb-4">
            <div className="text-[10px] font-bold tracking-wider text-[#747775] mb-1.5">
              Move work item
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {BOARD_COLUMNS.filter((c) => canTransition(detailColumn, c)).map((c) => (<button key={c} data-move-to={c} onClick={() => moveToFromDetail(detailIssue.id, detailColumn, c)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-bold bg-white border border-[#dfe1e6] text-[#42526e] hover:border-[#4c9aff] hover:text-[#0747a6] cursor-pointer">
                {needsComment(detailColumn, c) && <MessageSquare className="w-3 h-3" />}
                Move to {c === 'DONE' ? 'Done' : c === 'TODO' ? 'To Do' : 'In Progress'}
              </button>))}
            </div>
            <p className="mt-1.5 text-[10px] text-[#747775]">
              Current column: {detailCancelled ? 'Cancelled' : columnLabel[detailColumn]} · invalid moves stay unavailable.
            </p>
          </div>

          {detailColumn === 'DONE' && (<div className="mb-4">
            <div className="text-[10px] font-bold tracking-wider text-[#747775] mb-1.5">
              Completion state
            </div>
            <button data-action={detailCancelled ? 'restore-done' : 'mark-cancelled'} onClick={() => toggleCancelled(detailIssue.id)} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-bold bg-white border cursor-pointer ${detailCancelled
              ? 'border-[#dfe1e6] text-[#42526e] hover:border-[#36b37e] hover:text-[#00875a]'
              : 'border-[#ffab91] text-[#bf2600] hover:bg-[#ffeceb]'}`}>
              {detailCancelled ? <RotateCcw className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
              {detailCancelled ? 'Restore to Done' : 'Mark as Cancelled'}
            </button>
            <p className="mt-1.5 text-[10px] text-[#747775]">
              Cancelled work stays in the Done column and can be restored.
            </p>
          </div>)}

          <div data-comment-count={detailComments.length}>
            <div className="text-[10px] font-bold tracking-wider text-[#747775] mb-1.5">
              Comments ({detailComments.length})
            </div>
            {detailComments.length === 0 ? (<p className="text-xs text-[#8590a2]">No comments yet.</p>) : (<div className="flex flex-col gap-2">
              {detailComments.map((c) => {
                const author = users.find((u) => u.id === c.userId);
                return (<div key={c.id} data-comment-item className="flex items-start gap-2 p-2 rounded-lg bg-[#f7f8f9] border border-[#e4e6eb]">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0" style={{ backgroundColor: author?.avatarColor || '#6b778c' }}>
                    {(author?.name || 'U')[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#1f1f1f] truncate">
                        {author?.name || 'Unknown user'}
                      </span>
                      <span className="text-[10px] text-[#747775] flex-shrink-0">
                        {fmtDateTime(c.createdAt)}
                      </span>
                    </div>
                    <div className="text-xs text-[#42526e] mt-0.5 break-words [&_img]:max-w-full [&_img]:rounded-md [&_img]:border [&_img]:border-[#dfe1e6]" dangerouslySetInnerHTML={{ __html: c.content }} />
                    {(c.attachments || []).map((att) => (<div key={att.fileId} className="mt-1 inline-flex items-center gap-1.5 text-[10px] font-bold text-[#42526e] bg-white border border-[#dfe1e6] rounded px-1.5 py-0.5">
                      {att.fileName}
                    </div>))}
                  </div>
                </div>);
              })}
            </div>)}
          </div>
        </div>
      </div>
    </div>)}
  </div>);
};
