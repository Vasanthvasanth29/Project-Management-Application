import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Filter,
  SlidersHorizontal,
  Plus,
  MoreHorizontal,
  ChevronDown,
  X,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import {
  formatIsoDay,
  piStatusOf,
  canCreateIterationInPi,
} from '../../utils/programIncrement';
import { isCancelledWorkItem } from '../../utils/roleUtils';
import { CreateIterationModal } from './CreateIterationModal';
import { toast } from 'sonner';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatDisplayDate(iso) {
  if (!iso) return '';
  const parts = String(iso).split('T')[0].split('-');
  if (parts.length < 3) return iso;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parts[2].padStart(2, '0');
  if (monthIdx < 0 || monthIdx > 11) return iso;
  return `${MONTH_NAMES[monthIdx]} ${day}, ${year}`;
}

const MOCK_PI_METADATA = {
  'pi-004': { title: 'E-Commerce Enhancements', startDate: '2026-10-27', endDate: '2026-12-21' },
  'pi-010': { title: 'Next Phase Rollout', startDate: '2026-12-22', endDate: '2027-02-15' },
  'pi-003': { title: 'Platform Stabilization', startDate: '2026-08-01', endDate: '2026-10-18' },
  'pi-002': { title: 'Core Platform', startDate: '2026-05-01', endDate: '2026-07-31' },
  'pi-001': { title: 'Foundation', startDate: '2026-01-01', endDate: '2026-04-30' },
};

const MOCK_SPRINT_DATA = {
  // --- PI 4 (Active PI) Iterations ---
  '4.1': {
    name: 'UI/UX Improvements',
    startDate: '2026-10-27',
    endDate: '2026-11-09',
    status: 'Completed',
    workItems: 12,
    completed: 12,
    progress: 100,
  },
  '4.2': {
    name: 'Product Catalog',
    startDate: '2026-11-10',
    endDate: '2026-11-23',
    status: 'Completed',
    workItems: 12,
    completed: 12,
    progress: 100,
  },
  '4.3': {
    name: 'Order & Checkout',
    startDate: '2026-11-24',
    endDate: '2026-12-07',
    status: 'In Progress',
    workItems: 12,
    completed: 6,
    progress: 50,
  },
  '4.4': {
    name: 'Payment Integration',
    startDate: '2026-12-08',
    endDate: '2026-12-21',
    status: 'Planned',
    workItems: 8,
    completed: 0,
    progress: 0,
  },
  '4.5': {
    name: 'Search Relevance & Filters',
    startDate: '2026-12-22',
    endDate: '2027-01-04',
    status: 'Planned',
    workItems: 6,
    completed: 0,
    progress: 0,
  },
  '4.6': {
    name: 'Performance & Caching Optimization',
    startDate: '2027-01-05',
    endDate: '2027-01-18',
    status: 'Planned',
    workItems: 6,
    completed: 0,
    progress: 0,
  },
  '4.7': {
    name: 'Hardening & Bug Bash',
    startDate: '2027-01-19',
    endDate: '2027-02-01',
    status: 'Planned',
    workItems: 5,
    completed: 0,
    progress: 0,
  },

  // --- PI 5 (Planned PI) Iterations ---
  '5.1': {
    name: 'Wishlist & Save For Later',
    startDate: '2027-02-02',
    endDate: '2027-02-15',
    status: 'Planned',
    workItems: 9,
    completed: 0,
    progress: 0,
  },
  '5.2': {
    name: 'Reviews & Ratings Engine',
    startDate: '2027-02-16',
    endDate: '2027-03-01',
    status: 'Planned',
    workItems: 7,
    completed: 0,
    progress: 0,
  },
  '5.3': {
    name: 'Promotions & Coupon Discounts',
    startDate: '2027-03-02',
    endDate: '2027-03-15',
    status: 'Planned',
    workItems: 8,
    completed: 0,
    progress: 0,
  },
  '5.4': {
    name: 'Multi-Currency & Regional Pricing',
    startDate: '2027-03-16',
    endDate: '2027-03-29',
    status: 'Planned',
    workItems: 6,
    completed: 0,
    progress: 0,
  },

  // --- PI 3 (Completed PI) Iterations ---
  '3.1': {
    name: 'Payment Gateway & Notifications',
    startDate: '2026-08-01',
    endDate: '2026-08-14',
    status: 'Completed',
    workItems: 14,
    completed: 14,
    progress: 100,
  },

  // --- PI 2 (Completed PI) Iterations ---
  '2.1': {
    name: 'Shopping Cart & Catalog Flow',
    startDate: '2026-05-01',
    endDate: '2026-05-14',
    status: 'Completed',
    workItems: 16,
    completed: 16,
    progress: 100,
  },

  // --- PI 1 (Completed PI) Iterations ---
  '1.1': {
    name: 'Core Platform & Auth Foundation',
    startDate: '2026-01-01',
    endDate: '2026-01-14',
    status: 'Completed',
    workItems: 10,
    completed: 10,
    progress: 100,

  },
};

const STATUS_PRIORITY = {
  ACTIVE: 0,
  PLANNED: 1,
  COMPLETED: 2,
};

export function calculateNextIterationNumber(targetPi, allSprints) {
  let piNumber = targetPi?.number;
  if (!Number.isInteger(piNumber) && targetPi?.name) {
    const match = targetPi.name.match(/\d+/);
    if (match) piNumber = parseInt(match[0], 10);
  }
  if (!Number.isInteger(piNumber)) {
    piNumber = 1;
  }

  const targetSprints = allSprints.filter((s) => s.piId === targetPi.id && !s.isArchived);

  let maxSeq = 0;
  for (const s of targetSprints) {
    const raw = String(s.iterationNumber || s.name || '');
    const dotMatch = raw.match(/\.(\d+)/);
    if (dotMatch) {
      const num = parseInt(dotMatch[1], 10);
      if (Number.isFinite(num) && num > maxSeq) {
        maxSeq = num;
      }
    } else {
      const allNums = raw.match(/\d+/g);
      if (allNums && allNums.length >= 2) {
        const num = parseInt(allNums[allNums.length - 1], 10);
        if (Number.isFinite(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  }

  let nextSeq = maxSeq + 1;
  let candidate = `${piNumber}.${nextSeq}`;

  while (targetSprints.some((s) => (s.iterationNumber || '').trim() === candidate)) {
    nextSeq += 1;
    candidate = `${piNumber}.${nextSeq}`;
  }

  return candidate;
}

export const PIIterationsPage = () => {
  const { piId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { pis, sprints, projects, tasks, updateSprint } = useAppStore();

  const [selectedPiId, setSelectedPiId] = useState(piId || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [moreFilterOption, setMoreFilterOption] = useState('ALL');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showMoreFiltersDropdown, setShowMoreFiltersDropdown] = useState(false);
  const [openActionSprintId, setOpenActionSprintId] = useState(null);

  const [createIterationPiId, setCreateIterationPiId] = useState(null);

  const statusDropdownRef = useRef(null);
  const moreFiltersRef = useRef(null);

  // Sync route param with selection
  useEffect(() => {
    if (piId && piId !== selectedPiId) {
      setSelectedPiId(piId);
    }
  }, [piId]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setShowStatusDropdown(false);
      }
      if (moreFiltersRef.current && !moreFiltersRef.current.contains(e.target)) {
        setShowMoreFiltersDropdown(false);
      }
      if (!e.target.closest('[data-actions-menu]')) {
        setOpenActionSprintId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Determine current project based on URL or first project
  const project = useMemo(() => {
    if (selectedPiId) {
      const match = pis.find((p) => p.id === selectedPiId);
      if (match) {
        const proj = projects.find((pr) => pr.id === match.projectId);
        if (proj) return proj;
      }
    }
    return projects[0];
  }, [projects, pis, selectedPiId]);

  // Dynamic Priority-Based PI Ordering:
  // 1. Active PI - Always first
  // 2. Planned PI - After Active
  // 3. Completed PI - After Planned
  const projectPis = useMemo(() => {
    if (!project) return [];
    const pisForProject = pis.filter((p) => p.projectId === project.id);
    return [...pisForProject].sort((a, b) => {
      const statusA = piStatusOf(a, sprints);
      const statusB = piStatusOf(b, sprints);
      const priorityA = STATUS_PRIORITY[statusA] ?? 99;
      const priorityB = STATUS_PRIORITY[statusB] ?? 99;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Secondary ordering within same status group:
      if (statusA === 'PLANNED') {
        return (a.number || 0) - (b.number || 0); // e.g. PI 5 before PI 6
      }
      return (b.number || 0) - (a.number || 0); // Highest number first
    });
  }, [pis, project, sprints]);

  // Find the selected PI (defaulting to the first in priority order, i.e., Active PI)
  const currentPi = useMemo(() => {
    if (selectedPiId) {
      const found = projectPis.find((p) => p.id === selectedPiId);
      if (found) return found;
    }
    return projectPis[0] || null;
  }, [projectPis, selectedPiId]);

  // Keep selected PI in sync
  useEffect(() => {
    if (projectPis.length > 0) {
      const exists = projectPis.some((p) => p.id === selectedPiId);
      if (!selectedPiId || !exists) {
        setSelectedPiId(projectPis[0].id);
      }
    }
  }, [projectPis, selectedPiId]);

  // Helper to retrieve display information for each sprint/iteration
  const getSprintDisplayInfo = (sprint) => {
    const iterNum = sprint.iterationNumber || sprint.name;
    const mock = MOCK_SPRINT_DATA[iterNum] || {};

    const sprintTasks = tasks.filter((t) => t.sprintId === sprint.id && !isCancelledWorkItem(t));
    const workItemsCount = sprintTasks.length > 0 ? sprintTasks.length : (sprint.workItems ?? mock.workItems ?? 0);
    const doneTasksCount = sprintTasks.length > 0
      ? sprintTasks.filter((t) => t.status === 'DONE').length
      : (sprint.completed ?? mock.completed ?? 0);

    // Determine status according to requirement:
    // Completed iterations: 100% progress
    // Planned iterations: 0% progress
    // In Progress iterations: dynamically calculated from live tasks
    const rawStatus = sprint.iterationStatus || sprint.status || mock.status || 'Planned';
    let status = 'Planned';
    if (rawStatus === 'COMPLETED' || rawStatus === 'Completed') {
      status = 'Completed';
    } else if (rawStatus === 'ACTIVE' || rawStatus === 'In Progress' || rawStatus === 'IN_PROGRESS') {
      status = 'In Progress';
    } else {
      status = 'Planned';
    }

    let progressPct = 0;
    let effectiveCompleted = doneTasksCount;
    if (status === 'Completed') {
      progressPct = 100;
      effectiveCompleted = workItemsCount;
    } else if (status === 'Planned') {
      progressPct = 0;
      effectiveCompleted = 0;
    } else if (status === 'In Progress') {
      if (workItemsCount > 0) {
        progressPct = Math.round((doneTasksCount / workItemsCount) * 100);
      } else {
        progressPct = 0;
      }
    }

    const name =
      sprint.title ||
      (sprint.name && sprint.name !== sprint.iterationNumber && !sprint.name.startsWith('ECOMM')
        ? sprint.name
        : mock.name || sprint.name || 'Iteration');

    const start = sprint.startDate || mock.startDate;
    const end = sprint.endDate || mock.endDate;

    return {
      number: iterNum,
      name,
      startDate: formatDisplayDate(start),
      endDate: formatDisplayDate(end),
      status,
      workItems: workItemsCount,
      completed: effectiveCompleted,
      progressPct,
    };
  };

  // Iterations for the selected PI
  const selectedPiIterations = useMemo(() => {
    if (!currentPi) return [];
    const direct = sprints.filter((s) => s.piId === currentPi.id && !s.isArchived);
    // Sort ascending by iteration sequence
    return [...direct].sort((a, b) => {
      const seqA = parseFloat(a.iterationNumber || '0') || 0;
      const seqB = parseFloat(b.iterationNumber || '0') || 0;
      return seqA - seqB;
    });
  }, [sprints, currentPi]);

  // Filter iterations based on search, status, and more filters
  const filteredIterations = useMemo(() => {
    return selectedPiIterations.filter((sprint) => {
      const info = getSprintDisplayInfo(sprint);

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          info.number.toLowerCase().includes(q) ||
          info.name.toLowerCase().includes(q) ||
          (sprint.goal || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        const normalized = info.status.toUpperCase().replace(/\s+/g, '_');
        if (normalized !== statusFilter) return false;
      }

      // More filter (work items count)
      if (moreFilterOption === 'WITH_ITEMS') {
        if (info.workItems === 0) return false;
      } else if (moreFilterOption === 'WITHOUT_ITEMS') {
        if (info.workItems > 0) return false;
      }

      return true;
    });
  }, [selectedPiIterations, searchQuery, statusFilter, moreFilterOption, tasks]);

  const handleSelectPi = (pi) => {
    setSelectedPiId(pi.id);
    navigate(`/pi-iterations/${encodeURIComponent(pi.id)}`, { replace: true });
  };

  const getPiDisplayName = (pi) => {
    if (!pi) return '';
    const mock = MOCK_PI_METADATA[pi.id];
    const title = pi.title || mock?.title;
    return title ? `${pi.name} – ${title}` : pi.name;
  };

  const getPiDateRange = (pi) => {
    if (!pi) return '';
    const mock = MOCK_PI_METADATA[pi.id];
    const start = pi.startDate || mock?.startDate;
    const end = pi.endDate || mock?.endDate;
    if (start && end) {
      return `${formatDisplayDate(start)} - ${formatDisplayDate(end)}`;
    }
    return '';
  };

  const getPiIterationCount = (pi) => {
    const count = sprints.filter((s) => s.piId === pi.id && !s.isArchived).length;
    return `${count} iterations`;
  };

  const navigateToSprint = (sprint) => {
    const role = currentUser?.role || 'ADMIN';
    const rolePrefix = role === 'ADMIN' ? 'admin' : role === 'TEAM_LEADER' ? 'tl' : role === 'MEMBER' ? 'member' : 'pm';
    const proj = project || projects[0];
    const key = proj?.key || 'ECOMM4.0';
    const nameSlug = (proj?.name || 'E-Commerce Platform').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const iterNum = sprint.iterationNumber || sprint.name;
    const targetPiId = currentPi?.id || sprint.piId;

    const search = new URLSearchParams();
    if (iterNum) search.set('iteration', iterNum);
    if (sprint.id) search.set('sprintId', sprint.id);
    if (targetPiId) search.set('pi', targetPiId);

    navigate(`/${rolePrefix}/${encodeURIComponent(key)}/${nameSlug}/iterations?${search.toString()}`);
  };

  return (
    <div className="space-y-4" data-testid="pi-iterations-view">
      {/* Breadcrumb Path & Back Button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (project) {
              navigate(`/pm/projects/${project.id}?tab=product-increments`);
            } else {
              navigate(-1);
            }
          }}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
          title="Back to Program Increments"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 truncate" aria-label="Breadcrumb">
          <Link to="/admin/projects" className="hover:text-slate-800 transition-colors">
            Projects
          </Link>
          <span className="text-slate-300 font-normal">&gt;</span>
          <Link
            to={project ? `/pm/projects/${project.id}` : '#'}
            className="hover:text-slate-800 transition-colors truncate max-w-[180px]"
          >
            {project?.name || 'E-Commerce Platform'}
          </Link>
          <span className="text-slate-300 font-normal">&gt;</span>
          <Link
            to={project ? `/pm/projects/${project.id}?tab=product-increments` : '#'}
            className="hover:text-slate-800 transition-colors"
          >
            PI
          </Link>
          <span className="text-slate-300 font-normal">&gt;</span>
          <span className="text-slate-900 font-bold">Iterations</span>
        </nav>
      </div>

      {/* Main Split 2-Column Content */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ======================================================== */}
        {/* LEFT COLUMN: Program Increments List                     */}
        {/* ======================================================== */}
        <div className="w-full lg:w-[245px] lg:flex-shrink-0 space-y-4">
          {/* Header: Title Only */}
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Program Increments</h2>
          </div>

          {/* Stacked PI Cards Ordered by Priority: Active → Planned → Completed */}
          <div className="space-y-2 w-full">
            {projectPis.map((pi) => {
              const isSelected = pi.id === selectedPiId;
              const displayName = getPiDisplayName(pi);
              const dateRange = getPiDateRange(pi);
              const iterCount = getPiIterationCount(pi);
              const status = piStatusOf(pi, sprints);
              const cardBorderClass = isSelected
                ? 'border-2 border-teal-500 shadow-sm ring-1 ring-teal-500/20'
                : 'border border-slate-200 hover:border-slate-300 hover:shadow-xs';

              return (
                <div
                  key={pi.id}
                  onClick={() => handleSelectPi(pi)}
                  className={`rounded-xl px-2.5 py-2 transition-all cursor-pointer bg-white w-full ${cardBorderClass}`}
                >
                  <h3 className="text-xs font-bold text-slate-900 truncate tracking-tight">{displayName}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-normal tracking-tight">
                    {dateRange || '\u00A0'}
                  </p>

                  <div className="flex items-center justify-between gap-2 mt-1.5">
                    {/* Status Badge with Color Indicators */}
                    {status === 'ACTIVE' && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ecfdf5] text-[#059669]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                        Active
                      </span>
                    )}
                    {status === 'PLANNED' && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#eff6ff] text-[#2563eb]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                        Planned
                      </span>
                    )}
                    {status === 'COMPLETED' && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#f1f5f9] text-[#475569]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#64748b]" />
                        Completed
                      </span>
                    )}

                    {/* Iteration Count */}
                    <span className="text-[11px] text-slate-500 font-normal whitespace-nowrap">{iterCount}</span>
                  </div>
                </div>
              );
            })}

            {projectPis.length === 0 && (
              <div className="p-6 text-center rounded-xl bg-white border border-slate-200 text-xs text-slate-500">
                No Program Increments found for this project.
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: Iterations ({PI Name})                     */}
        {/* ======================================================== */}
        <div className="w-full lg:flex-1 min-w-0 space-y-4">
          {/* Header: Title with PI Name + Create Iteration Button */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Iterations ({getPiDisplayName(currentPi)})
            </h1>
            <button
              type="button"
              onClick={() => {
                if (currentPi && !canCreateIterationInPi(currentPi, sprints)) {
                  toast.error(`${currentPi.name} is completed — iterations cannot be added to a completed PI.`);
                  return;
                }
                setCreateIterationPiId(currentPi?.id || null);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0d9488] hover:bg-[#0f766e] text-white shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Iteration</span>
            </button>
          </div>

          {/* Filter Controls Bar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search iterations..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Dropdown Filter */}
            <div className="relative" ref={statusDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setShowStatusDropdown((v) => !v);
                  setShowMoreFiltersDropdown(false);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer shadow-2xs ${statusFilter !== 'ALL'
                  ? 'border-teal-500 bg-teal-50 text-teal-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  Status {statusFilter !== 'ALL' ? `(${statusFilter.replace('_', ' ')})` : ''}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
              </button>

              {showStatusDropdown && (
                <div className="absolute left-0 mt-1.5 w-40 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 animate-in fade-in-50 duration-100">
                  {[
                    { id: 'ALL', label: 'All Statuses' },
                    { id: 'IN_PROGRESS', label: 'In Progress' },
                    { id: 'COMPLETED', label: 'Completed' },
                    { id: 'PLANNED', label: 'Planned' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        setStatusFilter(st.id);
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full px-3 py-1.5 text-xs text-left flex items-center justify-between hover:bg-slate-50 cursor-pointer ${statusFilter === st.id ? 'text-teal-700 font-semibold bg-teal-50/50' : 'text-slate-700'
                        }`}
                    >
                      <span>{st.label}</span>
                      {statusFilter === st.id && <Check className="w-3 h-3 text-teal-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* More Filters Dropdown */}
            <div className="relative" ref={moreFiltersRef}>
              <button
                type="button"
                onClick={() => {
                  setShowMoreFiltersDropdown((v) => !v);
                  setShowStatusDropdown(false);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer shadow-2xs ${moreFilterOption !== 'ALL'
                  ? 'border-teal-500 bg-teal-50 text-teal-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>More Filters</span>
                <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
              </button>

              {showMoreFiltersDropdown && (
                <div className="absolute left-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 animate-in fade-in-50 duration-100">
                  {[
                    { id: 'ALL', label: 'All Iterations' },
                    { id: 'WITH_ITEMS', label: 'Has Work Items' },
                    { id: 'WITHOUT_ITEMS', label: 'No Work Items' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setMoreFilterOption(opt.id);
                        setShowMoreFiltersDropdown(false);
                      }}
                      className={`w-full px-3 py-1.5 text-xs text-left flex items-center justify-between hover:bg-slate-50 cursor-pointer ${moreFilterOption === opt.id ? 'text-teal-700 font-semibold bg-teal-50/50' : 'text-slate-700'
                        }`}
                    >
                      <span>{opt.label}</span>
                      {moreFilterOption === opt.id && <Check className="w-3 h-3 text-teal-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Iterations Table Card - Continuous single list without pagination */}
          <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-white text-slate-500 font-medium">
                    <th className="py-1.5 px-4 w-14 font-medium text-slate-500 align-middle leading-snug">#</th>
                    <th className="py-1.5 px-4 min-w-[150px] font-medium text-slate-500 align-middle leading-snug">Name</th>
                    <th className="py-1.5 px-4 w-28 font-medium text-slate-500 align-middle leading-snug">Start Date</th>
                    <th className="py-1.5 px-4 w-28 font-medium text-slate-500 align-middle leading-snug">End Date</th>
                    <th className="py-1.5 px-4 w-24 font-medium text-slate-500 align-middle leading-snug">Status</th>
                    <th className="py-1.5 px-4 w-24 text-center font-medium text-slate-500 align-middle leading-snug">Work Items</th>
                    <th className="py-1.5 px-4 w-32 font-medium text-slate-500 align-middle leading-snug">Progress</th>
                    <th className="py-1.5 px-4 w-16 text-center font-medium text-slate-500 align-middle leading-snug">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredIterations.map((sprint) => {
                    const info = getSprintDisplayInfo(sprint);
                    const isMenuOpen = openActionSprintId === sprint.id;

                    return (
                      <tr
                        key={sprint.id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        {/* Iteration Number as Blue Link */}
                        <td className="py-3.5 px-4 font-semibold text-[#2563eb]">
                          <button
                            type="button"
                            onClick={() => navigateToSprint(sprint)}
                            className="hover:underline cursor-pointer"
                          >
                            {info.number}
                          </button>
                        </td>

                        {/* Iteration Name */}
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          <span
                            onClick={() => navigateToSprint(sprint)}
                            className="hover:text-teal-600 cursor-pointer transition-colors"
                          >
                            {info.name}
                          </span>
                        </td>

                        {/* Start Date */}
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">{info.startDate}</td>

                        {/* End Date */}
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">{info.endDate}</td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4">
                          {info.status === 'Completed' && (
                            <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-medium bg-[#ecfdf5] text-[#059669]">
                              Completed
                            </span>
                          )}
                          {info.status === 'In Progress' && (
                            <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-medium bg-[#eff6ff] text-[#2563eb]">
                              In Progress
                            </span>
                          )}
                          {info.status === 'Planned' && (
                            <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-medium bg-[#f1f5f9] text-[#475569]">
                              Planned
                            </span>
                          )}
                        </td>

                        {/* Work Items Count */}
                        <td className="py-3.5 px-4 text-center text-slate-600 tabular-nums">
                          {info.workItems}
                        </td>

                        {/* Progress Percentage + Bar */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-600 text-[11px] font-normal w-8 tabular-nums">
                              {info.progressPct}%
                            </span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${info.progressPct === 100 ? 'bg-[#10b981]' : 'bg-[#0d9488]'
                                  }`}
                                style={{ width: `${info.progressPct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Actions Dropdown Button */}
                        <td className="py-3.5 px-4 text-center relative" data-actions-menu="">
                          <button
                            type="button"
                            onClick={() => setOpenActionSprintId((prev) => (prev === sprint.id ? null : sprint.id))}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Actions"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {isMenuOpen && (
                            <div className="absolute right-4 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 text-left animate-in fade-in-50 duration-100">
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionSprintId(null);
                                  navigateToSprint(sprint);
                                }}
                                className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                <span>View Details</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredIterations.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                        No iterations found matching your filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Create Iteration */}
      {project && (
        <CreateIterationModal
          projectId={project.id}
          isOpen={!!createIterationPiId}
          initialPiId={createIterationPiId || undefined}
          lockPi
          onClose={() => setCreateIterationPiId(null)}
          onCreated={(createdList) => {
            const newPiId = createdList[0]?.piId;
            if (newPiId) setSelectedPiId(newPiId);
          }}
        />
      )}
    </div>
  );
};
