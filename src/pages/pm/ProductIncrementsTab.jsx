import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarRange, ChevronDown, ChevronRight, ExternalLink, Info, ListTree, Plus, Target } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { SprintStatusBadge } from '../../components/common/Badges';
import { ProgressBar } from '../../components/common/ProgressBar';
import { EmptyState } from '../../components/common/EmptyState';
import { toast } from 'sonner';
import { canManageSprint, isCancelledWorkItem } from '../../utils/roleUtils';
import { canCreateIterationInPi, compareIterationNumbers, formatIsoDay, piStatusOf, sortProjectPis } from '../../utils/programIncrement';
import { usePiPlan } from '../../data/piSprintStructure';
import { CreatePIModal } from './CreatePIModal';
import { CreateIterationModal } from './CreateIterationModal';
// Timezone-free "07 Jan 2030" from the ISO date parts.
const formatDay = formatIsoDay;
/**
 * Project → Product Increments: the project-level home for PIs. Lists the
 * project's PIs (dates, goal, status, generated iterations, progress) and is
 * the entry point for Create PI — the shared CreatePIModal, always scoped to
 * THIS project, so a PI can never be created under another one.
 *
 * Every value comes from real records: stored PI dates/goal (PIs created via
 * Create PI) or the min/max of its iterations' dates, the plan's derived PI
 * status, and DONE vs. total store work items assigned to its iterations.
 *
 * `onOpenIterations(piId)` opens the Iterations module filtered to that PI.
 */
export const ProductIncrementsTab = ({ projectId, onOpenIterations }) => {
    const { pis, sprints: allSprints, tasks } = useAppStore();
    const currentUser = useAuthStore((s) => s.currentUser);
    const canCreate = canManageSprint(currentUser?.role);
    const projectPis = useMemo(() => sortProjectPis(pis, projectId), [pis, projectId]);
    const piPlan = usePiPlan(projectId);
    const [showCreate, setShowCreate] = useState(false);
    // PI whose Create Iteration form is open (null = closed).
    const [iterationPiId, setIterationPiId] = useState(null);
    const openCreateIteration = (pi) => {
        // Event-handler guard — the button is only rendered for open PIs.
        if (!canCreateIterationInPi(pi, allSprints)) {
            toast.error(`${pi.name} is completed — iterations cannot be added to a completed PI.`);
            return;
        }
        setIterationPiId(pi.id);
    };
    const [expanded, setExpanded] = useState(() => new Set());
    const [highlightId, setHighlightId] = useState(null);
    const cardRefs = useRef(new Map());
    const rows = useMemo(() => projectPis.map((pi) => {
        const plan = piPlan.find((p) => p.id === pi.id);
        // Chronological, labelled by iteration number ("6.1") — the plan's
        // displayName is "<number or name> [DD MON - DD MON]".
        const sprints = [...(plan?.sprints || [])]
            .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''))
            .map((s) => ({ ...s, label: s.displayName.split(' [')[0] }));
        const sprintIds = new Set(sprints.map((s) => s.id));
        const piTasks = tasks.filter((t) => sprintIds.has(t.sprintId) && !isCancelledWorkItem(t));
        const done = piTasks.filter((t) => t.status === 'DONE').length;
        // "6.1 – 6.10": lowest → highest iteration NUMBER (numeric, not string order).
        const byNumber = sprints.map((s) => s.label).filter((l) => /^\d+\.\d+$/.test(l)).sort(compareIterationNumbers);
        const numberRange = byNumber.length > 1 ? `${byNumber[0]} – ${byNumber[byNumber.length - 1]}` : byNumber[0] || '';
        return {
            pi,
            sprints,
            numberRange,
            status: piStatusOf(pi, allSprints),
            startDate: pi.startDate || plan?.startDate,
            endDate: pi.endDate || plan?.endDate,
            taskTotal: piTasks.length,
            taskDone: done,
            pct: piTasks.length ? Math.round((done / piTasks.length) * 100) : 0,
        };
    }), [projectPis, piPlan, tasks, allSprints]);
    // Bring a freshly created PI into view.
    useEffect(() => {
        if (!highlightId)
            return;
        cardRefs.current.get(highlightId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const t = setTimeout(() => setHighlightId(null), 4000);
        return () => clearTimeout(t);
    }, [highlightId, rows]);
    const toggle = (id) => setExpanded((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });

    useEffect(() => {
  const cards = document.querySelectorAll('[data-pi-card]');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('pi-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
    }
  );

  cards.forEach((card) => observer.observe(card));

  return () => observer.disconnect();
}, [rows]);
    return (<div className="space-y-3" data-product-increments="">
      <div className="card p-4 flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#f0fdfa] border border-[#ccfbf1] flex items-center justify-center flex-shrink-0">
            <ListTree className="w-4 h-4 text-[#0d9488]"/>
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-[#172b4d]">Product Increments</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Plan this project's PIs, then add iterations to each active or planned PI with the dates you choose. Iterations are numbered from their PI (PI 6 → 6.1, 6.2 …).
            </p>
            <p className="text-[11px] text-amber-700 mt-1 inline-flex items-center gap-1">
              <Info className="w-3 h-3"/> Prototype: PIs are saved in this browser only, not on the server.
            </p>
          </div>
        </div>
        {canCreate && (<button type="button" onClick={() => setShowCreate(true)} className="btn-primary btn-sm" data-testid="project-create-pi">
            <Plus className="w-3.5 h-3.5"/> Create PI
          </button>)}
      </div>

      {rows.length === 0 ? (<div className="card">
          <EmptyState icon={ListTree} title="No Product Increments yet" description={canCreate
                ? 'Create the first PI for this project. Iterations always belong to a PI, so they can be planned once a PI exists.'
                : 'This project has no PI yet. A Project Manager or Team Leader creates PIs here; iterations are generated inside them.'} action={canCreate ? { label: 'Create PI', onClick: () => setShowCreate(true) } : undefined}/>
        </div>) : (
<div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
  <table className="w-full min-w-[900px] table-fixed border-collapse text-left">
    <thead className="bg-slate-50">
      <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-600">
        <th className="w-[20%] px-4 py-3">Name</th>
        <th className="w-[14%] px-4 py-3">Status</th>
        <th className="w-[24%] px-4 py-3">Date Range</th>
        <th className="w-[16%] px-4 py-3">Iterations</th>
        <th className="w-[18%] px-4 py-3">Progress</th>
        <th className="w-[8%] px-4 py-3">Actions</th>
      </tr>
    </thead>

    <tbody className="divide-y divide-slate-100">
      {rows.map((row) => {
        const { pi, sprints } = row;

        return (
          <tr
            key={pi.id}
            ref={(el) =>
              el
                ? cardRefs.current.set(pi.id, el)
                : cardRefs.current.delete(pi.id)
            }
            data-pi-card={pi.id}
            className={`transition-colors hover:bg-[#f0fdfa] ${
              highlightId === pi.id ? 'bg-teal-50 ring-1 ring-inset ring-[#0d9488]' : ''
            }`}
          >
            {/* Name */}
            <td className="px-4 py-4 align-middle">
              <div className="flex items-center gap-2 min-w-0">
                <ListTree className="h-4 w-4 flex-shrink-0 text-[#0d9488]" />
                <div className="min-w-0">
                  <div className="font-semibold text-[#172b4d] break-words">
                    {pi.name}
                  </div>

                  {pi.title && (
                    <div
                      className="mt-1 text-xs text-slate-500 break-words"
                      data-testid="pi-title"
                    >
                      {pi.title}
                    </div>
                  )}
                </div>
              </div>
            </td>

            {/* Status */}
            <td className="px-4 py-4 align-middle">
              <SprintStatusBadge status={row.status} />
              
              {row.status === 'COMPLETED' && (
                <div className="mt-1 text-xs text-slate-400">
                  Completed PI — iterations can be viewed but not added.
                </div>
              )}
            </td>

            {/* Date Range */}
            <td className="px-4 py-4 align-middle">
              <div className="flex items-center gap-2 text-sm text-slate-600 tabular-nums">
                <CalendarRange className="h-4 w-4 flex-shrink-0 text-slate-400" />
                <span className="whitespace-nowrap">
                  {formatDay(row.startDate)} – {formatDay(row.endDate)}
                </span>
              </div>

            </td>

            {/* Iterations */}
            <td className="px-4 py-4 align-middle">
              <div className="text-sm text-slate-600">
                {sprints.length} iteration{sprints.length === 1 ? '' : 's'}
                {row.numberRange && ` · ${row.numberRange}`}
              </div>
            </td>

            {/* Progress */}
            <td className="px-4 py-4 align-middle">
              <div className="space-y-2">
                {row.taskTotal > 0 ? (
                  <>
                    <ProgressBar value={row.pct} height="sm" />
                    <div className="text-xs text-slate-500 tabular-nums">
                      {row.taskDone}/{row.taskTotal} assigned items done
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-slate-500">
                    No assigned work items
                  </span>
                )}
              </div>
            </td>

            {/* Actions */}
            <td className="px-4 py-4 align-middle">
             <div className="flex flex-col items-start justify-center gap-2">
                {canCreate && row.status !== 'COMPLETED' && (
                  <button
                    type="button"
                    onClick={() => openCreateIteration(pi)}
                    className="text-xs font-semibold text-[#0f766e] hover:underline"
                    data-testid="pi-create-iteration"
                  >
                    + Create
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onOpenIterations(pi.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0052cc] hover:underline"
                  data-testid="open-pi-iterations"
                >
                  Open
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
</div>
)}

      <CreatePIModal projectId={projectId} isOpen={showCreate} onClose={() => setShowCreate(false)} onCreated={(pi) => {
            setHighlightId(pi.id);
        }}/>
      <CreateIterationModal projectId={projectId} isOpen={!!iterationPiId} initialPiId={iterationPiId || undefined} lockPi onClose={() => setIterationPiId(null)} onCreated={(createdList) => {
            const piId = createdList[0]?.piId;
            if (!piId)
                return;
            setExpanded((prev) => new Set(prev).add(piId));
            setHighlightId(piId);
        }}/>
    </div>);
};
