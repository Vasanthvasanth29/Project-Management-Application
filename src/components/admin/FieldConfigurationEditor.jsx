import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Check, Eye, Pencil, Plus, Search, Trash2, X, Type as TypeIcon, } from 'lucide-react';
import { toast } from 'sonner';
import { CUSTOM_FIELD_TYPES, CUSTOM_FIELD_TYPE_LABEL, WORK_ITEM_TYPE_LABEL, customFieldTypeSupportsDefault, customFieldTypeUsesOptions, isCustomValueEmpty, } from '../../utils/customFields';
import { defaultStandardFieldsForType, standardFieldLabel, standardFieldsForType, } from '../../utils/fieldConfiguration';
import { applyExistingFieldSelection, buildExistingFieldCandidates, customFieldAppliesTo, filterExistingCandidates, isAlreadyAdded, validateCustomFieldName, } from '../../utils/existingFields';
import { useAppStore } from '../../store/appStore';
import { ConfirmDialog } from '../common/ConfirmDialog';
/** Work item types the field-configuration UI exposes as tabs. */
export const CONFIGURABLE_WORK_TYPES = [
    'EPIC',
    'STORY',
    'TASK',
    'BUG_FIX',
    'SUB-TASK',
];
const newTempId = () => `cf-draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
/** Standard-field keys for a type from the draft, falling back to defaults. */
const standardKeysOf = (draft, type) => draft.standardFields[type] && draft.standardFields[type].length > 0
    ? draft.standardFields[type]
    : defaultStandardFieldsForType(type);
const fieldOrder = (f) => f.order ?? Number.MAX_SAFE_INTEGER;
/** Custom fields visible on a type tab: applicable to the type (empty = all). */
const customFieldsForType = (draft, type) => draft.customFields
    .filter((f) => customFieldAppliesTo(f, type))
    .sort((a, b) => fieldOrder(a) - fieldOrder(b));
const fieldDisplayName = (f) => f.label && f.label.trim() !== '' ? f.label : f.name;
export const FieldConfigurationEditor = ({ value, onChange, workTypes = CONFIGURABLE_WORK_TYPES, external = {}, }) => {
    const [activeType, setActiveType] = useState(workTypes[0] ?? 'TASK');
    const [previewOpen, setPreviewOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showAddExisting, setShowAddExisting] = useState(false);
    const [query, setQuery] = useState('');
    const [pendingDelete, setPendingDelete] = useState(null);
    // Usage counter for the delete confirmation (stored values are never touched
    // by a delete — this only warns the admin how many work items show data).
    const tasks = useAppStore((s) => s.tasks);
    const stdKeys = standardKeysOf(value, activeType);
    const typeCustomFields = customFieldsForType(value, activeType);
    const typeDefs = standardFieldsForType(activeType);
    const q = query.trim().toLowerCase();
    // Search sweeps the active type's standard fields and the WHOLE project's
    // custom field list (with its applicability shown), so any existing field is
    // findable without knowing which tab it lives on.
    const visibleTypeDefs = q
        ? typeDefs.filter((d) => d.label.toLowerCase().includes(q))
        : typeDefs;
    const visibleCustomFields = (q
        ? [...value.customFields].sort((a, b) => fieldOrder(a) - fieldOrder(b))
        : typeCustomFields).filter((f) => {
        if (!q)
            return true;
        return (fieldDisplayName(f).toLowerCase().includes(q) ||
            (CUSTOM_FIELD_TYPE_LABEL[f.type] || f.type).toLowerCase().includes(q));
    });
    const candidates = useMemo(() => buildExistingFieldCandidates(value, workTypes, external),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value, workTypes, JSON.stringify(external)]);
    const setStandardKeys = (type, keys) => {
        onChange({ ...value, standardFields: { ...value.standardFields, [type]: keys } });
    };
    const toggleStandard = (key, on) => {
        const next = on ? [...stdKeys, key] : stdKeys.filter((k) => k !== key);
        setStandardKeys(activeType, next);
    };
    const moveStandard = (index, dir) => {
        const next = [...stdKeys];
        const target = index + dir;
        if (target < 0 || target >= next.length)
            return;
        [next[index], next[target]] = [next[target], next[index]];
        setStandardKeys(activeType, next);
    };
    const upsertCustomField = (field) => {
        const exists = value.customFields.some((f) => f.id === field.id);
        const customFields = exists
            ? value.customFields.map((f) => (f.id === field.id ? field : f))
            : [...value.customFields, field];
        onChange({ ...value, customFields });
    };
    /** Reorder within the active type tab by swapping the two order slots. */
    const moveCustomField = (field, dir) => {
        const visible = customFieldsForType(value, activeType);
        const index = visible.findIndex((f) => f.id === field.id);
        const target = index + dir;
        if (index < 0 || target < 0 || target >= visible.length)
            return;
        // Materialize missing orders so the swap always has concrete slots.
        const orders = visible.map((f, i) => f.order ?? 10000 + i);
        const nextVisible = [...visible];
        [nextVisible[index], nextVisible[target]] = [nextVisible[target], nextVisible[index]];
        const orderById = new Map(nextVisible.map((f, i) => [f.id, orders[i]]));
        onChange({
            ...value,
            customFields: value.customFields.map((f) => orderById.has(f.id) ? { ...f, order: orderById.get(f.id) } : f),
        });
    };
    /** Enable/disable a custom field for the whole project (values untouched). */
    const toggleCustomEnabled = (field) => {
        const next = !field.enabled;
        upsertCustomField({ ...field, enabled: next });
        toast.success(`"${fieldDisplayName(field)}" ${next ? 'enabled' : 'disabled'}.`);
    };
    const usageCount = (field) => tasks.filter((t) => {
        const v = t.customFieldValues?.[field.id];
        return v !== undefined && !isCustomValueEmpty(field, v);
    }).length;
    const removeCustomFieldFromType = (field) => {
        const applicable = field.applicableIssueTypes ?? [];
        // Explicitly applicable → drop just this type; "all types" (empty) →
        // pin to every configurable type except the one being removed.
        let nextApplicable;
        if (applicable.length === 0) {
            nextApplicable = CONFIGURABLE_WORK_TYPES.filter((t) => t !== activeType);
        }
        else {
            nextApplicable = applicable.filter((t) => t !== activeType);
        }
        if (nextApplicable.length === 0) {
            // Field no longer applies anywhere → delete it (confirmed below).
            requestDeleteField(field);
            return;
        }
        upsertCustomField({ ...field, applicableIssueTypes: nextApplicable });
        toast.success(`"${fieldDisplayName(field)}" removed from ${WORK_ITEM_TYPE_LABEL[activeType]}.`);
    };
    /** Deletion always goes through confirmation + a work-item usage check. */
    const requestDeleteField = (field) => {
        if (field.id.startsWith('cf-draft-')) {
            // Unsaved draft — no stored values can exist yet.
            onChange({ ...value, customFields: value.customFields.filter((f) => f.id !== field.id) });
            toast.success(`"${fieldDisplayName(field)}" removed.`);
            return;
        }
        setPendingDelete(field);
    };
    const confirmDeleteField = () => {
        const field = pendingDelete;
        if (!field)
            return;
        const used = usageCount(field);
        onChange({ ...value, customFields: value.customFields.filter((f) => f.id !== field.id) });
        setPendingDelete(null);
        toast.success(used > 0
            ? `"${fieldDisplayName(field)}" removed. Stored values on ${used} work item(s) are kept but no longer displayed.`
            : `"${fieldDisplayName(field)}" deleted.`);
    };
    return (<div className="space-y-4">
      {/* Toolbar: type tabs + search + preview */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-[#f1f5f9] p-0.5 rounded-lg flex-wrap">
          {workTypes.map((t) => (<button key={t} type="button" onClick={() => setActiveType(t)} className={`px-3 py-1.5 rounded-lg fe-control transition-colors ${activeType === t
                ? 'bg-white text-[#0f766e] border border-[#99f6e4] shadow-fe-xs'
                : 'text-[#343A40] hover:text-[#343A40]'}`}>
              {WORK_ITEM_TYPE_LABEL[t]}
            </button>))}
        </div>

        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"/>
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search fields…" aria-label="Search fields" className="input py-1.5 pl-8 pr-7 text-xs w-full"/>
          {query && (<button type="button" onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" title="Clear search">
              <X className="w-3.5 h-3.5"/>
            </button>)}
        </div>

        <button type="button" onClick={() => setPreviewOpen((v) => !v)} className={`ml-auto px-3 py-1.5 rounded-lg fe-control transition-colors inline-flex items-center gap-1.5 ${previewOpen ? 'bg-white text-[#0052cc] border border-[#bfdbfe] shadow-fe-xs' : 'text-[#343A40]'}`}>
          <Eye className="w-3.5 h-3.5"/> Preview
        </button>
      </div>

      {previewOpen && <FieldLayoutPreview type={activeType} standardKeys={stdKeys} customFields={typeCustomFields}/>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* System (standard) fields */}
        <div className="bg-white rounded-2xl border border-[#e2e5ea] overflow-hidden shadow-fe-xs">
          <div className="px-4 py-2.5 bg-[#f8fafc] border-b border-[#e2e5ea] flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <h4 className="fe-heading uppercase tracking-wider">Standard Fields</h4>
              <span className="badge badge-gray text-[9px]">System</span>
            </span>
            <span className="fe-meta">{stdKeys.length} shown</span>
          </div>
          <div className="p-3 space-y-1">
            {visibleTypeDefs.length === 0 && (<p className="fe-meta py-2">No standard fields match “{query}”.</p>)}
            {visibleTypeDefs.map((def) => {
            const on = stdKeys.includes(def.key);
            const pos = stdKeys.indexOf(def.key);
            return (<div key={def.key} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50">
                  <input type="checkbox" checked={on} onChange={(e) => toggleStandard(def.key, e.target.checked)} className="w-3.5 h-3.5 accent-[#0d9488]" aria-label={`Show ${def.label}`}/>
                  <span className="flex-1 text-[11.2px] text-[#343A40] font-medium truncate">
                    {def.label}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <button type="button" disabled={!on || pos === 0} onClick={() => moveStandard(pos, -1)} className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30" title="Move up">
                      <ArrowUp className="w-3 h-3"/>
                    </button>
                    <button type="button" disabled={!on || pos === stdKeys.length - 1} onClick={() => moveStandard(pos, 1)} className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30" title="Move down">
                      <ArrowDown className="w-3 h-3"/>
                    </button>
                  </span>
                </div>);
        })}
          </div>
        </div>

        {/* Custom fields */}
        <div className="bg-white rounded-2xl border border-[#e2e5ea] overflow-hidden shadow-fe-xs">
          <div className="px-4 py-2.5 bg-[#f8fafc] border-b border-[#e2e5ea] flex items-center justify-between gap-2 flex-wrap">
            <span className="flex items-center gap-2">
              <h4 className="fe-heading uppercase tracking-wider">Custom Fields</h4>
              <span className="badge badge-teal text-[9px]">Custom</span>
            </span>
            <span className="flex items-center gap-1.5">
              <button type="button" onClick={() => setShowAddExisting(true)} className="btn-secondary btn-xs inline-flex items-center gap-1" title="Add a field that already exists in this application">
                <Plus className="w-3 h-3"/> Add Existing Field
              </button>
              <button type="button" onClick={() => {
            setEditing(null);
            setShowAddForm(true);
        }} className="btn-primary btn-xs inline-flex items-center gap-1">
                <Plus className="w-3 h-3"/> Add Custom Field
              </button>
            </span>
          </div>
          <div className="p-3 space-y-1">
            {visibleCustomFields.length === 0 && (<p className="fe-meta py-2">
                {q
                ? `No custom fields match “${query}”.`
                : `No custom fields for ${WORK_ITEM_TYPE_LABEL[activeType]} yet.`}
              </p>)}
            {visibleCustomFields.map((field) => {
            const appliesHere = customFieldAppliesTo(field, activeType);
            const pos = typeCustomFields.findIndex((f) => f.id === field.id);
            return (<div key={field.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 ${field.enabled ? '' : 'opacity-60'}`}>
                  <input type="checkbox" checked={field.enabled} onChange={() => toggleCustomEnabled(field)} className="w-3.5 h-3.5 accent-[#0d9488]" aria-label={`Enable ${fieldDisplayName(field)}`} title={field.enabled ? 'Enabled — click to disable' : 'Disabled — click to enable'}/>
                  <span className="flex-1 min-w-0">
                    <span className="text-[11.2px] text-[#343A40] font-medium truncate">
                      {fieldDisplayName(field)}
                      {field.required && <span className="text-red-500 ml-0.5">*</span>}
                      {!field.enabled && (<span className="badge badge-gray text-[9px] ml-1.5">Disabled</span>)}
                    </span>
                    <span className="fe-meta ml-1.5">
                      {CUSTOM_FIELD_TYPE_LABEL[field.type] || field.type}
                      {!appliesHere && (<>
                          {' · '}
                          Applies to{' '}
                          {(field.applicableIssueTypes ?? [])
                        .map((t) => WORK_ITEM_TYPE_LABEL[t])
                        .join(', ') || 'all types'}
                        </>)}
                    </span>
                  </span>
                  <span className="flex items-center gap-0.5">
                    <button type="button" disabled={pos <= 0} onClick={() => moveCustomField(field, -1)} className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30" title="Move up">
                      <ArrowUp className="w-3 h-3"/>
                    </button>
                    <button type="button" disabled={pos === -1 || pos === typeCustomFields.length - 1} onClick={() => moveCustomField(field, 1)} className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30" title="Move down">
                      <ArrowDown className="w-3 h-3"/>
                    </button>
                    <button type="button" onClick={() => {
                    setEditing(field);
                    setShowAddForm(true);
                }} className="p-1 rounded text-slate-400 hover:text-[#0d9488]" title="Edit field">
                      <Pencil className="w-3 h-3"/>
                    </button>
                    <button type="button" onClick={() => removeCustomFieldFromType(field)} className="p-1 rounded text-slate-400 hover:text-red-500" title="Remove from this type">
                      <X className="w-3 h-3"/>
                    </button>
                    <button type="button" onClick={() => requestDeleteField(field)} className="p-1 rounded text-slate-400 hover:text-red-600" title="Delete field">
                      <Trash2 className="w-3 h-3"/>
                    </button>
                  </span>
                </div>);
        })}
          </div>
        </div>
      </div>

      {showAddForm && (<CustomFieldDraftModal field={editing} defaultType={activeType} draft={value} onCancel={() => {
                setShowAddForm(false);
                setEditing(null);
            }} onSave={(field) => {
                upsertCustomField(field);
                setShowAddForm(false);
                setEditing(null);
            }}/>)}

      {showAddExisting && (<AddExistingFieldModal draft={value} workTypes={workTypes} activeType={activeType} external={external} onCancel={() => setShowAddExisting(false)} onApply={(next) => {
                onChange(next);
                setShowAddExisting(false);
            }}/>)}

      <ConfirmDialog isOpen={pendingDelete !== null} onClose={() => setPendingDelete(null)} onConfirm={confirmDeleteField} title={`Delete field "${pendingDelete ? fieldDisplayName(pendingDelete) : ''}"?`} message={pendingDelete
            ? (() => {
                const used = usageCount(pendingDelete);
                return used > 0
                    ? `${used} work item(s) currently store a value for this field. The definition is removed from this project's forms and Details pages, but the stored values are kept on those work items (never deleted) and reappear if the field is added back.`
                    : 'The field definition is removed from this project\'s forms and Details pages. No work item stores a value for it.';
            })()
            : ''} confirmLabel="Delete" cancelLabel="Cancel" danger/>
    </div>);
};
/**
 * Searchable "Add Existing Field" picker: lists every eligible field in the
 * application's registry (system fields + custom definitions) with name, type,
 * applicable work item types and already-added state. Selections widen
 * applicability — they never create a duplicate definition.
 */
const AddExistingFieldModal = ({ draft, workTypes, activeType, external, onCancel, onApply }) => {
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState({});
    const candidates = useMemo(() => buildExistingFieldCandidates(draft, workTypes, external),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft, workTypes, JSON.stringify(external)]);
    const visible = filterExistingCandidates(candidates, search);
    const addedCount = candidates.filter(isAlreadyAdded).length;
    const toggleCandidate = (candidate) => {
        if (isAlreadyAdded(candidate))
            return;
        setSelected((prev) => {
            const next = { ...prev };
            if (next[candidate.id]) {
                delete next[candidate.id];
                return next;
            }
            // Default the pick to the active type when it is still eligible,
            // otherwise the first eligible type — never a type the field is
            // already added to (those chips stay fixed as "Already Added").
            const fallback = candidate.eligibleTypes.includes(activeType)
                ? [activeType]
                : candidate.eligibleTypes.slice(0, 1);
            next[candidate.id] = fallback;
            return next;
        });
    };
    const toggleTypeFor = (candidateId, type) => {
        setSelected((prev) => {
            const current = prev[candidateId] ?? [];
            const next = current.includes(type)
                ? current.filter((t) => t !== type)
                : [...current, type];
            return { ...prev, [candidateId]: next };
        });
    };
    const picks = Object.entries(selected)
        .filter(([, types]) => types.length > 0)
        .map(([candidateId, types]) => ({ candidateId, types }));
    const handleApply = () => {
        if (picks.length === 0)
            return;
        onApply(applyExistingFieldSelection(draft, candidates, picks, workTypes));
        const fieldCount = picks.length;
        const typeCount = picks.reduce((n, p) => n + p.types.length, 0);
        toast.success(`Added ${fieldCount} existing field${fieldCount === 1 ? '' : 's'} · ${typeCount} type application${typeCount === 1 ? '' : 's'}.`);
    };
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <div>
            <h3 className="fe-control inline-flex items-center gap-2">
              <TypeIcon className="w-4 h-4 text-[#0d9488]"/>
              Add Existing Field
            </h3>
            <p className="fe-meta mt-0.5">
              Reuse a field already in this application — {addedCount} already added, none are
              duplicated.
            </p>
          </div>
          <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4"/>
          </button>
        </div>

        <div className="px-5 pt-4">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"/>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by field name or type…" aria-label="Search existing fields" className="input py-2 pl-8 w-full" autoFocus/>
          </div>
        </div>

        <div className="p-5 pt-3 space-y-1.5 max-h-[52vh] overflow-y-auto scrollbar-thin">
          {visible.length === 0 && (<p className="fe-meta py-4 text-center">No fields match “{search}”.</p>)}
          {visible.map((candidate) => {
            const already = isAlreadyAdded(candidate);
            const chosen = selected[candidate.id];
            const isSelected = chosen !== undefined;
            return (<div key={candidate.id} className={`px-3 py-2.5 rounded-xl border transition-colors ${already
                    ? 'border-[#e2e5ea] bg-[#f8fafd] opacity-70'
                    : isSelected
                        ? 'border-[#99f6e4] bg-[#f0fdfa]'
                        : 'border-[#e2e5ea] bg-white hover:border-slate-300'}`}>
                <div className="flex items-start gap-2.5">
                  <input type="checkbox" checked={isSelected} disabled={already} onChange={() => toggleCandidate(candidate)} className="w-3.5 h-3.5 mt-0.5 accent-[#0d9488] disabled:opacity-40" aria-label={`Select ${candidate.name}`}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#343A40] truncate">
                        {candidate.name}
                      </span>
                      <span className="badge badge-gray text-[9px]">{candidate.typeLabel}</span>
                      <span className="fe-meta">{candidate.source}</span>
                      {already ? (<span className="badge badge-teal text-[9px] inline-flex items-center gap-1">
                          <Check className="w-2.5 h-2.5"/> Already Added
                        </span>) : (candidate.enabledTypes.length > 0 && (<span className="badge badge-blue text-[9px]">
                            Added: {candidate.enabledTypes.map((t) => WORK_ITEM_TYPE_LABEL[t]).join(', ')}
                          </span>))}
                    </div>

                    {/* Applicable work item types — static for unselected rows,
                    interactive (minus already-added types) once selected. */}
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {workTypes
                    .filter((t) => candidate.supportedTypes.includes(t))
                    .map((t) => {
                    const isAddedType = candidate.enabledTypes.includes(t);
                    const isChosen = isSelected && chosen?.includes(t);
                    const clickable = isSelected && !isAddedType;
                    return (<button key={t} type="button" disabled={!clickable} onClick={() => clickable && toggleTypeFor(candidate.id, t)} title={isAddedType
                            ? `Already added for ${WORK_ITEM_TYPE_LABEL[t]}`
                            : `Show on ${WORK_ITEM_TYPE_LABEL[t]}`} className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold transition-colors ${isAddedType
                            ? 'border-[#99f6e4] bg-[#f0fdfa] text-[#0f766e]'
                            : isChosen
                                ? 'border-[#0d9488] bg-[#0d9488] text-white'
                                : 'border-slate-200 bg-white text-[#343A40] hover:border-slate-300'} ${clickable ? '' : 'cursor-default opacity-80'}`}>
                              {isAddedType && <Check className="w-2.5 h-2.5 inline mr-0.5"/>}
                              {WORK_ITEM_TYPE_LABEL[t]}
                            </button>);
                })}
                    </div>
                  </div>
                </div>
              </div>);
        })}
        </div>

        <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-t border-slate-100 bg-slate-50">
          <span className="fe-meta">
            {picks.length > 0
            ? `${picks.length} field${picks.length === 1 ? '' : 's'} · ${picks.reduce((n, p) => n + p.types.length, 0)} type addition${picks.reduce((n, p) => n + p.types.length, 0) === 1 ? '' : 's'} selected`
            : 'Select fields to add'}
          </span>
          <span className="flex items-center gap-2">
            <button type="button" onClick={onCancel} className="btn-secondary btn-sm">
              Cancel
            </button>
            <button type="button" onClick={handleApply} disabled={picks.length === 0} className="btn-primary btn-sm inline-flex items-center gap-1">
              <Check className="w-3.5 h-3.5"/> Add Fields
            </button>
          </span>
        </div>
      </div>
    </div>);
};
/** Read-only preview of the resulting field layout for one work item type. */
const FieldLayoutPreview = ({ type, standardKeys, customFields }) => (<div className="bg-white rounded-2xl border border-[#bfdbfe] overflow-hidden shadow-fe-xs mb-4">
    <div className="px-4 py-2.5 bg-[#eff6ff] border-b border-[#bfdbfe] flex items-center gap-2">
      <Eye className="w-3.5 h-3.5 text-[#0052cc]"/>
      <h4 className="fe-heading uppercase tracking-wider text-[#0747a6]">
        Preview — {WORK_ITEM_TYPE_LABEL[type]}
      </h4>
    </div>
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
      {[
        { label: 'Title', required: false, type: '' },
        { label: 'Type', required: false, type: '' },
        { label: 'Status', required: false, type: '' },
        ...standardKeys.map((k) => ({ label: standardFieldLabel(k), required: false, type: '' })),
        ...customFields.map((f) => ({
            label: fieldDisplayName(f),
            required: Boolean(f.required),
            type: CUSTOM_FIELD_TYPE_LABEL[f.type] || f.type,
        })),
    ].map((row, i) => (<div key={`${row.label}-${i}`} className="flex gap-2 items-baseline">
          <span className="w-40 flex-shrink-0 fe-label">
            {row.label}
            {row.required ? <span className="text-red-500 ml-0.5">*</span> : null}
          </span>
          <span className="fe-value text-[#343A40]">
            {row.type ? <span className="fe-meta">{row.type}</span> : '—'}
          </span>
        </div>))}
    </div>
  </div>);
/** Compact add/edit modal for a draft custom field (no store coupling, so it
 *  works both before a project exists and in the settings page). */
const CustomFieldDraftModal = ({ field, defaultType, draft, onCancel, onSave }) => {
    const [name, setName] = useState(field?.name ?? '');
    const [label, setLabel] = useState(field?.label ?? '');
    const [type, setType] = useState(field?.type ?? 'text');
    const [required, setRequired] = useState(field?.required ?? false);
    const [optionsText, setOptionsText] = useState((field?.options ?? []).join(', '));
    const [defaultText, setDefaultText] = useState(field?.defaultValue === undefined || Array.isArray(field.defaultValue)
        ? ''
        : String(field.defaultValue));
    const [defaultChecked, setDefaultChecked] = useState(field?.defaultValue === true);
    const [applicable, setApplicable] = useState(field?.applicableIssueTypes && field.applicableIssueTypes.length > 0
        ? field.applicableIssueTypes
        : [defaultType]);
    const [error, setError] = useState('');
    const usesOptions = customFieldTypeUsesOptions(type);
    const supportsDefault = customFieldTypeSupportsDefault(type);
    const toggleApplicable = (t, on) => {
        setApplicable((prev) => (on ? [...prev, t] : prev.filter((x) => x !== t)));
    };
    const handleSave = () => {
        const finalName = name.trim();
        // Registry + duplicate validation: reserved system names and existing
        // custom names are both rejected (case-insensitive, trimmed).
        const nameError = validateCustomFieldName(finalName, draft, field?.id);
        if (nameError) {
            setError(nameError);
            return;
        }
        if (usesOptions) {
            const opts = optionsText.split(',').map((o) => o.trim()).filter(Boolean);
            if (opts.length === 0) {
                setError('Add at least one option (comma-separated).');
                return;
            }
            const dup = opts.map((o) => o.toLowerCase()).find((o, i) => opts.map((x) => x.toLowerCase()).indexOf(o) !== i);
            if (dup) {
                setError(`Duplicate option "${opts.find((o) => o.toLowerCase() === dup)}" — options must be unique.`);
                return;
            }
        }
        if (applicable.length === 0) {
            setError('Select at least one work item type.');
            return;
        }
        let defaultValue;
        if (supportsDefault) {
            if (type === 'checkbox') {
                defaultValue = defaultChecked ? true : undefined;
            }
            else if (defaultText.trim() !== '') {
                defaultValue = defaultText.trim();
            }
        }
        const nextOrder = draft.customFields.reduce((max, f) => Math.max(max, f.order ?? -1), -1) + 1;
        const next = {
            id: field?.id ?? newTempId(),
            projectId: field?.projectId ?? '',
            name: finalName,
            label: label.trim() || undefined,
            type,
            required,
            enabled: field?.enabled ?? true,
            options: usesOptions
                ? optionsText.split(',').map((o) => o.trim()).filter(Boolean)
                : undefined,
            defaultValue,
            applicableIssueTypes: applicable,
            order: field?.order ?? nextOrder,
            createdAt: field?.createdAt ?? new Date().toISOString(),
        };
        onSave(next);
    };
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <h3 className="fe-control inline-flex items-center gap-2">
            <TypeIcon className="w-4 h-4 text-[#0d9488]"/>
            {field ? 'Edit Custom Field' : 'Add Custom Field'}
          </h3>
          <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4"/>
          </button>
        </div>
        <div className="p-5 space-y-3.5 max-h-[60vh] overflow-y-auto scrollbar-thin">
          <div>
            <label className="block fe-label uppercase tracking-wider mb-1.5">
              Field Name <span className="text-red-500">*</span>
            </label>
            <input type="text" value={name} onChange={(e) => {
            setName(e.target.value);
            setError('');
        }} placeholder="e.g. Customer Segment" className="input py-2" autoFocus/>
          </div>
          <div>
            <label className="block fe-label uppercase tracking-wider mb-1.5">Field Label</label>
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Optional display label (falls back to name)" className="input py-2"/>
          </div>
          <div>
            <label className="block fe-label uppercase tracking-wider mb-1.5">Field Type</label>
            <select value={type} onChange={(e) => {
            setType(e.target.value);
            setError('');
        }} className="input py-2">
              {CUSTOM_FIELD_TYPES.map((t) => (<option key={t} value={t}>
                  {CUSTOM_FIELD_TYPE_LABEL[t]}
                </option>))}
            </select>
          </div>
          {usesOptions && (<div>
              <label className="block fe-label uppercase tracking-wider mb-1.5">
                Options <span className="text-red-500">*</span>
              </label>
              <input type="text" value={optionsText} onChange={(e) => {
                setOptionsText(e.target.value);
                setError('');
            }} placeholder="Comma-separated, e.g. Low, Medium, High" className="input py-2"/>
            </div>)}
          {supportsDefault && (<div>
              <label className="block fe-label uppercase tracking-wider mb-1.5">Default Value</label>
              {type === 'checkbox' ? (<label className="inline-flex items-center gap-2 fe-control text-[#343A40] cursor-pointer">
                  <input type="checkbox" checked={defaultChecked} onChange={(e) => setDefaultChecked(e.target.checked)} className="w-3.5 h-3.5 accent-[#0d9488]"/>
                  Default to checked (Yes)
                </label>) : (<input type={type === 'date' ? 'date' : type === 'number' || type === 'decimal' ? 'number' : 'text'} value={defaultText} onChange={(e) => setDefaultText(e.target.value)} className="input py-2"/>)}
            </div>)}
          <div>
            <label className="block fe-label uppercase tracking-wider mb-1.5">
              Required <span className="font-normal normal-case text-[#343A40]">(optional)</span>
            </label>
            <label className="inline-flex items-center gap-2 fe-control text-[#343A40] cursor-pointer">
              <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="w-3.5 h-3.5 accent-[#0d9488]"/>
              Make this field required
            </label>
          </div>
          <div>
            <label className="block fe-label uppercase tracking-wider mb-1.5">
              Applies To <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CONFIGURABLE_WORK_TYPES.map((t) => (<label key={t} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border fe-control cursor-pointer ${applicable.includes(t)
                ? 'bg-[#f0fdfa] border-[#99f6e4] text-[#0f766e]'
                : 'bg-white border-slate-200 text-[#343A40]'}`}>
                  <input type="checkbox" checked={applicable.includes(t)} onChange={(e) => {
                toggleApplicable(t, e.target.checked);
                setError('');
            }} className="w-3 h-3 accent-[#0d9488]"/>
                  {WORK_ITEM_TYPE_LABEL[t]}
                </label>))}
            </div>
          </div>
          {error && <p className="fe-control font-semibold text-red-500">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-slate-100 bg-slate-50">
          <button type="button" onClick={onCancel} className="btn-secondary btn-sm">
            Cancel
          </button>
          <button type="button" onClick={handleSave} className="btn-primary btn-sm inline-flex items-center gap-1">
            <Check className="w-3.5 h-3.5"/> {field ? 'Save Field' : 'Add Field'}
          </button>
        </div>
      </div>
    </div>);
};
