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
        </div>) : (<div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {rows.map((row) => {
                const { pi, sprints } = row;
                const isOpen = expanded.has(pi.id);
                return (<div key={pi.id} ref={(el) => el ? cardRefs.current.set(pi.id, el) : cardRefs.current.delete(pi.id)} data-pi-card={pi.id} className={`card p-4 space-y-2.5 transition-shadow ${highlightId === pi.id ? 'ring-2 ring-[#0d9488] shadow-lg' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#0d9488] text-white text-[11px] font-bold">
                      <ListTree className="w-3 h-3"/> {pi.name}
                    </span>
                    <SprintStatusBadge status={row.status}/>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {canCreate && row.status !== 'COMPLETED' && (<button type="button" onClick={() => openCreateIteration(pi)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold text-[#0f766e] bg-white hover:bg-[#ccfbf1] border border-[#99f6e4] transition-colors cursor-pointer" data-testid="pi-create-iteration">
                        <Plus className="w-3 h-3"/> Create Iteration
                      </button>)}
                    <button type="button" onClick={() => onOpenIterations(pi.id)} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0052cc] hover:underline disabled:text-slate-300 disabled:no-underline cursor-pointer disabled:cursor-not-allowed" data-testid="open-pi-iterations">
                      Open iterations <ExternalLink className="w-3 h-3"/>
                    </button>
                  </div>
                </div>
                {pi.title && <div className="text-sm font-semibold text-[#172b4d] break-words" data-testid="pi-title">{pi.title}</div>}

                <div className="flex items-center gap-1.5 text-xs text-slate-600 tabular-nums">
                  <CalendarRange className="w-3.5 h-3.5 text-slate-400"/>
                  {formatDay(row.startDate)} – {formatDay(row.endDate)}
                </div>
                {(pi.description || pi.goal) && (<p className="flex items-start gap-1.5 text-xs text-[#42526e]">
                    <Target className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0"/>
                    <span className="break-words">{pi.description || pi.goal}</span>
                  </p>)}
                {row.status === 'COMPLETED' && (<p className="text-[11px] text-slate-400">Completed PI — iterations can be viewed but not added.</p>)}

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    {sprints.length} iteration{sprints.length === 1 ? '' : 's'}
                    {row.numberRange && ` · ${row.numberRange}`}
                  </span>
                  <span className="tabular-nums">
                    {row.taskTotal > 0 ? `${row.taskDone}/${row.taskTotal} assigned items done` : 'No assigned work items'}
                  </span>
                </div>
                {row.taskTotal > 0 && <ProgressBar value={row.pct} height="sm"/>}

                {sprints.length > 0 && (<div className="border-t border-slate-100 pt-2">
                    <button type="button" onClick={() => toggle(pi.id)} aria-expanded={isOpen} className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer">
                      {isOpen ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>}
                      {isOpen ? 'Hide iterations' : 'Show iterations'}
                    </button>
                    {isOpen && (<ul className="mt-1.5 divide-y divide-slate-100">
                        {sprints.map((s) => (<li key={s.id} className="flex items-center justify-between gap-2 py-1.5 text-xs">
                            <span className="font-semibold text-[#172b4d]">{s.label}</span>
                            <span className="text-slate-500 tabular-nums flex-1 text-right mr-2">
                              {formatDay(s.startDate)} – {formatDay(s.endDate)}
                            </span>
                            <SprintStatusBadge status={s.status}/>
                          </li>))}
                      </ul>)}
                  </div>)}
              </div>);
            })}
        </div>)}

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
