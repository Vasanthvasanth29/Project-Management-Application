import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ListTree, Plus, X } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { nextPiNumber, sortProjectPis, validatePiForm } from '../../utils/programIncrement';
const newRequestId = () => `pireq-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
/**
 * Create Program Increment — PI number (required, unique in the project),
 * optional name and description, and start/end dates (required, end ≥ start).
 * Creates the PI only: iterations are added afterwards from the PI itself
 * (Create Iteration), with dates the user chooses.
 *
 * Always scoped to `projectId`, so a PI can never land in another project.
 * Frontend prototype: PIs are stored in this browser only (no backend API).
 */
export const CreatePIModal = ({ projectId, isOpen, onClose, onCreated }) => {
    const { pis, projects, createProgramIncrement } = useAppStore();
    const currentUser = useAuthStore((s) => s.currentUser);
    const project = projects.find((p) => p.id === projectId);
    const projectPis = useMemo(() => sortProjectPis(pis, projectId), [pis, projectId]);
    const nextNumber = nextPiNumber(projectPis);
    const [number, setNumber] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    // One id per opened form — a double click or a retry after an error can
    // never create a second PI (the store returns the first one instead).
    const requestIdRef = useRef(newRequestId());
    useEffect(() => {
        if (!isOpen)
            return;
        requestIdRef.current = newRequestId();
        setNumber(String(nextNumber));
        setTitle('');
        setDescription('');
        setStartDate('');
        setEndDate('');
        setErrors({});
        setSubmitting(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);
    const clearError = (...keys) => setErrors((e) => {
        const next = { ...e };
        keys.forEach((k) => delete next[k]);
        return next;
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        if (submitting)
            return;
        const errs = validatePiForm({ number, startDate, endDate, projectPis });
        setErrors(errs);
        if (Object.keys(errs).length > 0)
            return;
        setSubmitting(true);
        try {
            const pi = createProgramIncrement({
                requestId: requestIdRef.current,
                projectId,
                number: Number(number),
                title,
                description,
                startDate,
                endDate,
                createdById: currentUser?.id || 'u-pm-01',
            });
            toast.success(`${pi.name}${pi.title ? ` — ${pi.title}` : ''} created. Add its iterations from the PI card.`);
            onCreated?.(pi);
            onClose();
        }
        catch (err) {
            setSubmitting(false);
            toast.error(err instanceof Error ? err.message : 'Failed to create PI.');
        }
    };
    if (!isOpen)
        return null;
    const inputClass = (key) => `w-full px-3 py-2 rounded-lg border bg-white focus:outline-none focus:border-[#0d9488] ${errors[key] ? 'border-rose-400' : 'border-slate-300'}`;
    const fieldError = (key) => errors[key] ? <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors[key]}</p> : null;
    return (<div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div role="dialog" aria-modal="true" aria-labelledby="create-pi-title" className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in text-xs max-h-[92vh] overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <ListTree className="w-5 h-5 text-[#0d9488]"/>
            <div>
              <h3 id="create-pi-title" className="text-base font-bold text-[#172b4d]">Create Program Increment</h3>
              <p className="text-[11px] text-slate-500">{project?.name} · add iterations to it after it is created.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer" aria-label="Close">
            <X className="w-4 h-4"/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
          <div>
            <label className="block font-bold text-slate-700 mb-1" htmlFor="pi-number">
              PI Number <span className="text-rose-500">*</span>
            </label>
            <input id="pi-number" type="number" min={1} step={1} className={inputClass('number')} value={number} onChange={(e) => {
            setNumber(e.target.value);
            clearError('number');
        }}/>
            <p className="text-[11px] text-slate-400 mt-1">
              Shown as PI {number || '—'}; its iterations are numbered {number || '…'}.1, {number || '…'}.2 …
            </p>
            {fieldError('number')}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1" htmlFor="pi-name">PI Name</label>
            <input id="pi-name" type="text" className={inputClass('title')} value={title} placeholder="e.g. Checkout Revamp (optional)" onChange={(e) => setTitle(e.target.value)}/>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1" htmlFor="pi-description">Description</label>
            <textarea id="pi-description" rows={3} className={`${inputClass('description')} resize-y`} value={description} placeholder="What this PI should deliver (optional)" onChange={(e) => setDescription(e.target.value)}/>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1" htmlFor="pi-start">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input id="pi-start" type="date" className={inputClass('startDate')} value={startDate} onChange={(e) => {
            setStartDate(e.target.value);
            clearError('startDate', 'endDate');
        }}/>
              {fieldError('startDate')}
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1" htmlFor="pi-end">
                End Date <span className="text-rose-500">*</span>
              </label>
              <input id="pi-end" type="date" min={startDate || undefined} className={inputClass('endDate')} value={endDate} onChange={(e) => {
            setEndDate(e.target.value);
            clearError('endDate');
        }}/>
              {fieldError('endDate')}
            </div>
          </div>

          <p className="text-[11px] text-amber-700">
            Prototype: saved in this browser only — not stored on the server or shared with other users.
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary btn-sm px-4 py-2 justify-center disabled:opacity-60 disabled:cursor-not-allowed">
              <Plus className="w-3.5 h-3.5"/>
              {submitting ? 'Creating…' : 'Create PI'}
            </button>
          </div>
        </form>
      </div>
    </div>);
};
