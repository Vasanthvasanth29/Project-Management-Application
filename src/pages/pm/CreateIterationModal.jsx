import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, CalendarRange, ListTree, Plus, X } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { useAdminSettingsStore } from '../../store/adminSettingsStore';
import { SprintStatusBadge } from '../../components/common/Badges';
import { MAX_ITERATION_BATCH, allocateIterationNumbers, canCreateIterationInPi, formatIsoDay, isBatchValid, isIsoDate, isoDayLength, piStatusOf, sortProjectPis, validateIterationBatch, } from '../../utils/programIncrement';
const newRequestId = () => `itreq-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
let entryKeySeq = 0;
const blankEntry = () => ({ key: `e${++entryKeySeq}`, iterationNumber: '', name: '', startDate: '', endDate: '', goal: '', status: 'PLANNED' });
/**
 * Create Iteration — the one iteration form every entry point opens
 * (Product Increments card, Iterations page, Iteration Board, Work Queue).
 *
 * The user enters HOW MANY iterations to create; the form renders exactly that
 * many entries, each with its own auto-generated number (continuing from the
 * PI's highest: PI 4 with 4.1–4.7 → 4.8, 4.9, 4.10 …), optional name, start and
 * end date, required goal and initial status. Changing the count adds or
 * removes entries at the end and keeps every remaining entry's input.
 *
 * Dates are chosen by the user — no default duration. Each entry must be inside
 * the PI's range and must not overlap (inclusive) any saved iteration of the
 * PI or any other entry. The batch is saved all-or-nothing by the store, which
 * re-checks every rule. Completed PIs never accept new iterations.
 */
export const CreateIterationModal = ({ projectId, isOpen, initialPiId, lockPi = false, onClose, onCreated, }) => {
    const { pis, sprints, createIterationsBatch } = useAppStore();
    const currentUser = useAuthStore((s) => s.currentUser);
    const autoNumber = useAdminSettingsStore((s) => s.settings.iterations.rules.autoNumber);
    const projectPis = useMemo(() => sortProjectPis(pis, projectId), [pis, projectId]);
    const [piId, setPiId] = useState('');
    const [countInput, setCountInput] = useState('1');
    const [entries, setEntries] = useState(() => [blankEntry()]);
    const [showErrors, setShowErrors] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [piError, setPiError] = useState('');
    const requestIdRef = useRef(newRequestId());
    const selectedPi = projectPis.find((p) => p.id === piId);
    useEffect(() => {
        if (!isOpen)
            return;
        const pi = projectPis.find((p) => p.id === initialPiId);
        const eligible = pi && canCreateIterationInPi(pi, sprints);
        requestIdRef.current = newRequestId();
        setPiId(eligible ? pi.id : '');
        setCountInput('1');
        setEntries([blankEntry()]);
        setShowErrors(false);
        setSubmitting(false);
        setPiError(pi && !eligible ? `${pi.name} is completed — new iterations can only be added to active or planned PIs.` : '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, initialPiId]);
    // Numbers continue from the PI's highest existing sequence. With
    // auto-numbering they are always derived (never stale or duplicated);
    // otherwise the user's edits are kept and new entries get the next free one.
    const allocated = useMemo(() => (selectedPi ? allocateIterationNumbers(selectedPi, sprints, entries.length) : []), [selectedPi, sprints, entries.length]);
    const numbered = entries.map((e, i) => ({ ...e, iterationNumber: autoNumber ? allocated[i] || '' : e.iterationNumber || allocated[i] || '' }));
    const validation = useMemo(() => validateIterationBatch({ pi: selectedPi, sprints, entries: numbered }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedPi, sprints, JSON.stringify(numbered)]);
    const countValue = Number(countInput);
    const countError = !/^\d+$/.test(countInput) || countValue < 1 || countValue > MAX_ITERATION_BATCH
        ? `Enter a whole number from 1 to ${MAX_ITERATION_BATCH}.`
        : '';
    const handleCountChange = (raw) => {
        setCountInput(raw);
        const n = Number(raw);
        if (!/^\d+$/.test(raw) || n < 1 || n > MAX_ITERATION_BATCH)
            return;
        // Grow or shrink at the end; entries that remain keep their values.
        setEntries((prev) => (n > prev.length ? [...prev, ...Array.from({ length: n - prev.length }, blankEntry)] : prev.slice(0, n)));
    };
    const updateEntry = (key, patch) => setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, ...patch } : e)));
    const handlePiChange = (value) => {
        setPiId(value);
        setPiError('');
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (submitting)
            return;
        // Event-handler guard (the UI already hides / disables completed PIs).
        if (selectedPi && !canCreateIterationInPi(selectedPi, sprints)) {
            toast.error(`${selectedPi.name} is completed — iterations cannot be added.`);
            return;
        }
        setShowErrors(true);
        if (countError || !isBatchValid(validation)) {
            toast.error('Please fix the highlighted fields — nothing was saved.');
            return;
        }
        setSubmitting(true);
        try {
            const created = createIterationsBatch({
                requestId: requestIdRef.current,
                projectId,
                piId,
                entries: numbered.map(({ key, ...rest }) => rest),
                createdById: currentUser?.id || 'u-pm-01',
            });
            const numbers = created.map((s) => s.iterationNumber);
            toast.success(`${created.length} iteration${created.length === 1 ? '' : 's'} created under ${selectedPi.name}: ${numbers.join(', ')}`);
            onCreated?.(created);
            onClose();
        }
        catch (err) {
            setSubmitting(false);
            toast.error(err instanceof Error ? err.message : 'Failed to create iterations — nothing was saved.');
        }
    };
    if (!isOpen)
        return null;
    const eligiblePis = projectPis.filter((p) => canCreateIterationInPi(p, sprints));
    const piRange = selectedPi && isIsoDate(selectedPi.startDate) && isIsoDate(selectedPi.endDate)
        ? { min: selectedPi.startDate, max: selectedPi.endDate }
        : {};
    const errorsFor = (i) => (showErrors ? validation.entryErrors[i] || {} : {});
    const inputClass = (bad) => `w-full px-3 py-2 rounded-lg border bg-white focus:outline-none focus:border-[#0d9488] ${bad ? 'border-rose-400' : 'border-slate-300'}`;
    const msg = (text) => (text ? <p className="text-[11px] text-rose-600 mt-1 font-semibold">{text}</p> : null);
    return (<div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div role="dialog" aria-modal="true" aria-labelledby="create-iteration-title" className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in text-xs max-h-[92vh] overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-[#0d9488]"/>
            <div>
              <h3 id="create-iteration-title" className="text-base font-bold text-[#172b4d]">Create Iteration</h3>
              <p className="text-[11px] text-slate-500">Choose any dates inside the PI — iterations of a PI may not overlap; gaps are fine.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer" aria-label="Close">
            <X className="w-4 h-4"/>
          </button>
        </div>

        {projectPis.length === 0 ? (<div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
            No PI exists for this project yet. Create a PI first from the project's Product
            Increments section — every iteration must belong to one.
          </div>) : eligiblePis.length === 0 ? (<div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
            Every PI of this project is completed. Create a new PI from the project's Product
            Increments section to plan more iterations.
          </div>) : (<form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            {/* 1. Selected PI */}
            {lockPi && selectedPi ? (<div className="px-3 py-2.5 rounded-xl bg-[#f0fdfa] border border-[#ccfbf1] space-y-1" data-testid="iteration-parent-pi">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 font-bold text-[#134e4a]">
                    <ListTree className="w-3.5 h-3.5 text-[#0d9488]"/>
                    {selectedPi.name}{selectedPi.title ? ` — ${selectedPi.title}` : ''}
                  </span>
                  <SprintStatusBadge status={piStatusOf(selectedPi, sprints)}/>
                </div>
                <div className="text-[11px] text-[#0f766e] tabular-nums">
                  {piRange.min ? `${formatIsoDay(piRange.min)} – ${formatIsoDay(piRange.max)}` : 'No PI date range set'}
                </div>
              </div>) : (<div>
                <label className="block font-bold text-slate-700 mb-1" htmlFor="it-pi">
                  Parent PI <span className="text-rose-500">*</span>
                </label>
                <select id="it-pi" className={inputClass(!!piError || (showErrors && !!validation.formError))} value={piId} onChange={(e) => handlePiChange(e.target.value)}>
                  <option value="">Select a PI…</option>
                  {projectPis.map((pi) => {
                    const open = canCreateIterationInPi(pi, sprints);
                    return (<option key={pi.id} value={pi.id} disabled={!open}>
                        {pi.name}{pi.title ? ` — ${pi.title}` : ''}{open ? '' : ' (completed)'}
                      </option>);
                })}
                </select>
                {selectedPi && (<p className="text-[11px] text-slate-400 mt-1">
                    {selectedPi.name} · {piStatusOf(selectedPi, sprints).toLowerCase()}
                    {piRange.min ? ` · ${formatIsoDay(piRange.min)} – ${formatIsoDay(piRange.max)}` : ''}
                  </p>)}
              </div>)}
            {msg(piError || (showErrors ? validation.formError : ''))}

            {/* 2. How many iterations */}
            <div>
              <label className="block font-bold text-slate-700 mb-1" htmlFor="it-count">
                Number of iterations <span className="text-rose-500">*</span>
              </label>
              <input id="it-count" type="number" min={1} max={MAX_ITERATION_BATCH} step={1} className={`${inputClass(!!countError)} w-28`} value={countInput} onChange={(e) => handleCountChange(e.target.value)}/>
              {countError ? msg(countError) : (<p className="text-[11px] text-slate-400 mt-1">
                  {selectedPi && allocated.length
                    ? `Creates ${allocated.join(', ')}.`
                    : 'Select a PI to number the iterations.'}
                </p>)}
            </div>

            {/* 3. One entry per iteration */}
            <div className="space-y-3" data-testid="iteration-entries">
              {numbered.map((entry, i) => {
                const errs = errorsFor(i);
                const days = isIsoDate(entry.startDate) && isIsoDate(entry.endDate) && entry.endDate >= entry.startDate
                    ? isoDayLength(entry.startDate, entry.endDate)
                    : null;
                return (<fieldset key={entry.key} className="rounded-xl border border-slate-200 p-3 space-y-2.5" data-testid="iteration-entry">
                    <legend className="px-1.5 -ml-1.5 flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#0d9488] text-white text-[11px] font-bold" data-testid="entry-number">
                        {entry.iterationNumber || '—'}
                      </span>
                      {days && <span className="text-[11px] text-slate-500" data-testid="entry-days">{days} day{days === 1 ? '' : 's'}</span>}
                    </legend>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1" htmlFor={`it-number-${i}`}>
                          Iteration Number <span className="text-rose-500">*</span>
                        </label>
                        <input id={`it-number-${i}`} type="text" readOnly={autoNumber} className={`${inputClass(!!errs.iterationNumber)} ${autoNumber ? 'bg-slate-50 text-slate-600' : ''}`} value={entry.iterationNumber} onChange={(e) => updateEntry(entry.key, { iterationNumber: e.target.value })}/>
                        {msg(errs.iterationNumber)}
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1" htmlFor={`it-name-${i}`}>Iteration Name</label>
                        <input id={`it-name-${i}`} type="text" className={inputClass(false)} value={entry.name} placeholder={entry.iterationNumber || 'Optional'} onChange={(e) => updateEntry(entry.key, { name: e.target.value })}/>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1" htmlFor={`it-start-${i}`}>
                          Start Date <span className="text-rose-500">*</span>
                        </label>
                        <input id={`it-start-${i}`} type="date" min={piRange.min} max={piRange.max} className={inputClass(!!errs.startDate || !!errs.dates)} value={entry.startDate} onChange={(e) => updateEntry(entry.key, { startDate: e.target.value })}/>
                        {msg(errs.startDate)}
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1" htmlFor={`it-end-${i}`}>
                          End Date <span className="text-rose-500">*</span>
                        </label>
                        <input id={`it-end-${i}`} type="date" min={entry.startDate || piRange.min} max={piRange.max} className={inputClass(!!errs.endDate || !!errs.dates)} value={entry.endDate} onChange={(e) => updateEntry(entry.key, { endDate: e.target.value })}/>
                        {msg(errs.endDate)}
                      </div>
                    </div>
                    {errs.dates && (<div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-700 font-semibold" data-testid="iteration-date-conflict">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"/>
                        <span>{errs.dates}</span>
                      </div>)}

                    <div>
                      <label className="block font-bold text-slate-700 mb-1" htmlFor={`it-goal-${i}`}>
                        Goal <span className="text-rose-500">*</span>
                      </label>
                      <textarea id={`it-goal-${i}`} rows={2} className={`${inputClass(!!errs.goal)} resize-none`} value={entry.goal} placeholder="What is this iteration committing to deliver?" onChange={(e) => updateEntry(entry.key, { goal: e.target.value })}/>
                      {msg(errs.goal)}
                    </div>

                    <div>
                      <span className="block font-bold text-slate-700 mb-1">Initial Status</span>
                      <div className="flex items-center gap-4 flex-wrap">
                        {[['PLANNED', 'Planned (Upcoming)'], ['ACTIVE', 'Active (Current)']].map(([value, label]) => (<label key={value} className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                            <input type="radio" name={`it-status-${entry.key}`} value={value} checked={entry.status === value} onChange={() => updateEntry(entry.key, { status: value })} className="text-[#0d9488] focus:ring-[#0d9488]"/>
                            <span>{label}</span>
                          </label>))}
                      </div>
                    </div>
                  </fieldset>);
            })}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary btn-sm px-4 py-2 justify-center disabled:opacity-60 disabled:cursor-not-allowed" data-testid="create-iteration-submit">
                <Plus className="w-3.5 h-3.5"/>
                {submitting ? 'Creating…' : entries.length > 1 ? `Create ${entries.length} Iterations` : 'Create Iteration'}
              </button>
            </div>
          </form>)}
      </div>
    </div>);
};
