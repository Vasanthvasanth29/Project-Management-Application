import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, ArrowRight, Check, ListChecks, Plus, RotateCcw, Tag, Trash2, Type, } from 'lucide-react';
import { useAppStore } from '../../../store/appStore';
import { useAuthStore } from '../../../store/authStore';
import { STATUS_CATEGORY_OPTIONS, useAdminSettingsStore, } from '../../../store/adminSettingsStore';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { FieldError, IconBtn, ListRow, SettingsCard, Toggle } from './sectionUi';
const COLOR_INPUT = 'w-8 h-8 rounded-lg border border-slate-200 bg-white p-0.5 cursor-pointer flex-shrink-0';
const SMALL_INPUT = 'input text-xs py-1.5 px-2.5';
const slugify = (s) => s.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 20);
export const WorkItemsSection = () => {
    const navigate = useNavigate();
    const projects = useAppStore((s) => s.projects);
    const currentUser = useAuthStore((s) => s.currentUser);
    const appendAudit = useAdminSettingsStore((s) => s.appendAudit);
    const workItems = useAdminSettingsStore((s) => s.settings.workItems);
    const updateSection = useAdminSettingsStore((s) => s.updateSection);
    const resetSection = useAdminSettingsStore((s) => s.resetSection);
    const [confirm, setConfirm] = useState(null);
    const activeProjects = useMemo(() => projects.filter((p) => !p.isArchived), [projects]);
    const patchCatalog = (patch) => {
        const s = useAdminSettingsStore.getState();
        s.updateSection('workItems', { ...s.settings.workItems, ...patch });
    };
    const logCatalogAudit = (action, summary) => {
        appendAudit({
            adminId: currentUser?.id || 'admin',
            adminName: currentUser?.name || 'Administrator',
            section: 'workItems',
            category: 'SETTINGS',
            action,
            summary,
        });
    };
    /* ---------- statuses ---------- */
    const [newStatus, setNewStatus] = useState({ label: '', color: '#0d9488', category: 'BACKLOG' });
    const [statusError, setStatusError] = useState('');
    const patchStatus = (id, patch) => patchCatalog({ statuses: workItems.statuses.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
    const moveStatus = (index, dir) => {
        const next = [...workItems.statuses];
        const target = index + dir;
        if (target < 0 || target >= next.length)
            return;
        [next[index], next[target]] = [next[target], next[index]];
        patchCatalog({ statuses: next });
    };
    const addStatus = () => {
        const label = newStatus.label.trim();
        if (!label)
            return setStatusError('Status name is required.');
        if (workItems.statuses.some((s) => s.label.toLowerCase() === label.toLowerCase()))
            return setStatusError('A status with this name already exists.');
        const key = `CUSTOM_${slugify(label) || 'STATUS'}`;
        patchCatalog({
            statuses: [
                ...workItems.statuses,
                { id: `st-${Date.now()}`, key, label, color: newStatus.color, category: newStatus.category, enabled: true },
            ],
        });
        logCatalogAudit('Created status', `Added status "${label}"`);
        setNewStatus({ label: '', color: '#0d9488', category: 'BACKLOG' });
        setStatusError('');
        toast.success(`Status "${label}" added.`);
    };
    /* ---------- priorities ---------- */
    const [newPriority, setNewPriority] = useState({ label: '', color: '#0d9488' });
    const [priorityError, setPriorityError] = useState('');
    const patchPriority = (id, patch) => patchCatalog({ priorities: workItems.priorities.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
    const movePriority = (index, dir) => {
        const next = [...workItems.priorities];
        const target = index + dir;
        if (target < 0 || target >= next.length)
            return;
        [next[index], next[target]] = [next[target], next[index]];
        patchCatalog({ priorities: next });
    };
    const addPriority = () => {
        const label = newPriority.label.trim();
        if (!label)
            return setPriorityError('Priority name is required.');
        if (workItems.priorities.some((p) => p.label.toLowerCase() === label.toLowerCase()))
            return setPriorityError('A priority with this name already exists.');
        patchCatalog({
            priorities: [
                ...workItems.priorities,
                { id: `pr-${Date.now()}`, key: slugify(label) || 'CUSTOM', label, color: newPriority.color, enabled: true },
            ],
        });
        logCatalogAudit('Created priority', `Added priority "${label}"`);
        setNewPriority({ label: '', color: '#0d9488' });
        setPriorityError('');
        toast.success(`Priority "${label}" added.`);
    };
    /* ---------- labels ---------- */
    const [newLabel, setNewLabel] = useState({ name: '', color: '#0d9488' });
    const [labelError, setLabelError] = useState('');
    const addLabel = () => {
        const name = newLabel.name.trim();
        if (!name)
            return setLabelError('Label name is required.');
        if (workItems.labels.some((l) => l.name.toLowerCase() === name.toLowerCase()))
            return setLabelError('This label already exists.');
        patchCatalog({ labels: [...workItems.labels, { id: `lbl-${Date.now()}`, name, color: newLabel.color }] });
        logCatalogAudit('Created label', `Added label "${name}"`);
        setNewLabel({ name: '', color: '#0d9488' });
        setLabelError('');
        toast.success(`Label "${name}" added.`);
    };
    const removeLabel = (label) => setConfirm({
        title: `Remove label "${label.name}"?`,
        message: 'The label will be removed from the organization label catalog.',
        danger: true,
        onConfirm: () => {
            patchCatalog({ labels: workItems.labels.filter((l) => l.id !== label.id) });
            logCatalogAudit('Removed label', `Removed label "${label.name}"`);
            toast.success(`Label "${label.name}" removed.`);
        },
    });
    /* ---------- components ---------- */
    const [newComponent, setNewComponent] = useState({ name: '', description: '' });
    const [componentError, setComponentError] = useState('');
    const patchComponent = (id, patch) => patchCatalog({ components: workItems.components.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
    const addComponent = () => {
        const name = newComponent.name.trim();
        if (!name)
            return setComponentError('Component name is required.');
        if (workItems.components.some((c) => c.name.toLowerCase() === name.toLowerCase()))
            return setComponentError('This component already exists.');
        patchCatalog({
            components: [
                ...workItems.components,
                { id: `cmp-${Date.now()}`, name, description: newComponent.description.trim() },
            ],
        });
        logCatalogAudit('Created component', `Added component "${name}"`);
        setNewComponent({ name: '', description: '' });
        setComponentError('');
        toast.success(`Component "${name}" added.`);
    };
    const removeComponent = (component) => setConfirm({
        title: `Remove component "${component.name}"?`,
        message: 'The component will be removed from the organization component catalog.',
        danger: true,
        onConfirm: () => {
            patchCatalog({ components: workItems.components.filter((c) => c.id !== component.id) });
            logCatalogAudit('Removed component', `Removed component "${component.name}"`);
            toast.success(`Component "${component.name}" removed.`);
        },
    });
    /* ---------- shared actions ---------- */
    const askResetCatalog = (kind) => setConfirm({
        title: `Reset ${kind} to defaults?`,
        message: `Your customized ${kind} will be replaced with the FlowExec defaults. This cannot be undone.`,
        danger: true,
        onConfirm: () => {
            resetSection('workItems');
            logCatalogAudit('Reset work item catalog', `Restored default ${kind} catalog`);
            toast.success('Work item catalog reset to defaults.');
        },
    });
    return (<div className="space-y-5">
      {/* ============ CUSTOM FIELDS (per-project pointer) ============ */}
      <SettingsCard title="Custom Fields" description="Custom fields are configured per project from each project's Work Item Fields page, alongside the standard-field layout for Epic, Story, Task, Bug and Sub-task." icon={<Type className="w-4 h-4"/>}>
        <p className="text-xs text-slate-500 leading-relaxed mb-3">
          Custom field definitions are project-scoped (never organization-wide) so two projects can
          each have their own <em>Client name</em> or <em>Department</em> without clashing. Open a
          project's Work Item Fields page to add, edit, reorder or remove its custom fields and to
          choose which standard fields appear per work item type.
        </p>
        <div className="space-y-1.5">
          {activeProjects.length === 0 && (<p className="text-xs text-slate-400 py-2">No active projects yet.</p>)}
          {activeProjects.slice(0, 6).map((p) => (<ListRow key={p.id}>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-800 truncate">{p.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{p.key}</div>
              </div>
              <button type="button" className="btn-tonal btn-xs inline-flex items-center gap-1" onClick={() => navigate(`/admin/projects/${p.id}/fields`)}>
                Work Item Fields <ArrowRight className="w-3 h-3"/>
              </button>
            </ListRow>))}
          {activeProjects.length > 6 && (<p className="text-[10px] text-slate-400 pt-1">
              …and {activeProjects.length - 6} more — open any project's ⋮ menu → Work Item Fields.
            </p>)}
        </div>
      </SettingsCard>

      {/* ============ STATUSES ============ */}
      <SettingsCard title="Statuses" description="Workflow statuses shown across boards and lists. Reorder, recolor, rename, enable/disable or add statuses." icon={<ListChecks className="w-4 h-4"/>} action={<button type="button" className="btn-ghost btn-sm text-slate-500" onClick={() => askResetCatalog('statuses')}>
            <RotateCcw className="w-3.5 h-3.5"/> Reset
          </button>}>
        <div className="space-y-2">
          {workItems.statuses.map((status, index) => (<ListRow key={status.id} dimmed={!status.enabled}>
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <IconBtn title="Move up" disabled={index === 0} onClick={() => moveStatus(index, -1)}>
                  <ArrowUp className="w-3 h-3"/>
                </IconBtn>
                <IconBtn title="Move down" disabled={index === workItems.statuses.length - 1} onClick={() => moveStatus(index, 1)}>
                  <ArrowDown className="w-3 h-3"/>
                </IconBtn>
              </div>
              <input type="color" className={COLOR_INPUT} value={status.color} title="Status color" aria-label={`Color for ${status.label}`} onChange={(e) => patchStatus(status.id, { color: e.target.value })}/>
              <input className={`${SMALL_INPUT} flex-1 min-w-0`} value={status.label} aria-label="Status name" onChange={(e) => patchStatus(status.id, { label: e.target.value })}/>
              <span className="hidden sm:inline text-[10px] font-mono font-semibold text-slate-400 flex-shrink-0 w-28 truncate" title={status.key}>
                {status.key}
              </span>
              <select className={`${SMALL_INPUT} appearance-none cursor-pointer w-24 flex-shrink-0`} value={status.category} aria-label="Status category" onChange={(e) => patchStatus(status.id, { category: e.target.value })}>
                {STATUS_CATEGORY_OPTIONS.map((c) => (<option key={c} value={c}>
                    {c}
                  </option>))}
              </select>
              <Toggle checked={status.enabled} onChange={(next) => patchStatus(status.id, { enabled: next })}/>
            </ListRow>))}

          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-dashed border-slate-200 mt-3">
            <input type="color" className={COLOR_INPUT} value={newStatus.color} aria-label="New status color" onChange={(e) => setNewStatus({ ...newStatus, color: e.target.value })}/>
            <input className={`${SMALL_INPUT} w-40`} placeholder="New status name" value={newStatus.label} onChange={(e) => {
            setNewStatus({ ...newStatus, label: e.target.value });
            setStatusError('');
        }}/>
            <select className={`${SMALL_INPUT} appearance-none cursor-pointer w-24`} value={newStatus.category} aria-label="New status category" onChange={(e) => setNewStatus({ ...newStatus, category: e.target.value })}>
              {STATUS_CATEGORY_OPTIONS.map((c) => (<option key={c} value={c}>
                  {c}
                </option>))}
            </select>
            <button type="button" className="btn-tonal btn-xs" onClick={addStatus}>
              <Plus className="w-3 h-3"/> Add Status
            </button>
            <FieldError>{statusError}</FieldError>
          </div>
        </div>
      </SettingsCard>

      {/* ============ PRIORITIES ============ */}
      <SettingsCard title="Priorities" description="Priority levels for work items. Disable levels you do not want used, or reorder them." icon={<ArrowUp className="w-4 h-4"/>} action={<button type="button" className="btn-ghost btn-sm text-slate-500" onClick={() => askResetCatalog('priorities')}>
            <RotateCcw className="w-3.5 h-3.5"/> Reset
          </button>}>
        <div className="space-y-2">
          {workItems.priorities.map((priority, index) => (<ListRow key={priority.id} dimmed={!priority.enabled}>
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <IconBtn title="Move up" disabled={index === 0} onClick={() => movePriority(index, -1)}>
                  <ArrowUp className="w-3 h-3"/>
                </IconBtn>
                <IconBtn title="Move down" disabled={index === workItems.priorities.length - 1} onClick={() => movePriority(index, 1)}>
                  <ArrowDown className="w-3 h-3"/>
                </IconBtn>
              </div>
              <span className="w-3 h-3 rounded-full flex-shrink-0 border border-white shadow-sm" style={{ backgroundColor: priority.color }}/>
              <input type="color" className={COLOR_INPUT} value={priority.color} title="Priority color" aria-label={`Color for ${priority.label}`} onChange={(e) => patchPriority(priority.id, { color: e.target.value })}/>
              <input className={`${SMALL_INPUT} flex-1 min-w-0`} value={priority.label} aria-label="Priority name" onChange={(e) => patchPriority(priority.id, { label: e.target.value })}/>
              <span className="hidden sm:inline text-[10px] font-mono font-semibold text-slate-400 flex-shrink-0 w-20 truncate" title={priority.key}>
                {priority.key}
              </span>
              <Toggle checked={priority.enabled} onChange={(next) => patchPriority(priority.id, { enabled: next })}/>
            </ListRow>))}

          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-dashed border-slate-200 mt-3">
            <input type="color" className={COLOR_INPUT} value={newPriority.color} aria-label="New priority color" onChange={(e) => setNewPriority({ ...newPriority, color: e.target.value })}/>
            <input className={`${SMALL_INPUT} w-40`} placeholder="New priority name" value={newPriority.label} onChange={(e) => {
            setNewPriority({ ...newPriority, label: e.target.value });
            setPriorityError('');
        }}/>
            <button type="button" className="btn-tonal btn-xs" onClick={addPriority}>
              <Plus className="w-3 h-3"/> Add Priority
            </button>
            <FieldError>{priorityError}</FieldError>
          </div>
        </div>
      </SettingsCard>

      {/* ============ LABELS ============ */}
      <SettingsCard title="Labels" description="Short tags for categorising issues across every project. Rename, recolour or remove them." icon={<Tag className="w-4 h-4"/>} action={<button type="button" className="btn-ghost btn-sm text-slate-500" onClick={() => askResetCatalog('labels')}>
            <RotateCcw className="w-3.5 h-3.5"/> Reset
          </button>}>
        <div className="space-y-2">
          {workItems.labels.map((label) => (<ListRow key={label.id}>
              <span className="w-3 h-3 rounded-full flex-shrink-0 border border-white shadow-sm" style={{ backgroundColor: label.color }}/>
              <input type="color" className={COLOR_INPUT} value={label.color} title="Label color" aria-label={`Color for ${label.name}`} onChange={(e) => patchCatalog({
                labels: workItems.labels.map((l) => (l.id === label.id ? { ...l, color: e.target.value } : l)),
            })}/>
              <input className={`${SMALL_INPUT} flex-1 min-w-0 font-semibold`} value={label.name} aria-label="Label name" onChange={(e) => patchCatalog({
                labels: workItems.labels.map((l) => (l.id === label.id ? { ...l, name: e.target.value } : l)),
            })}/>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border" style={{ backgroundColor: `${label.color}14`, borderColor: `${label.color}55`, color: label.color }}>
                preview
              </span>
              <IconBtn title="Remove label" danger onClick={() => removeLabel(label)}>
                <Trash2 className="w-3.5 h-3.5"/>
              </IconBtn>
            </ListRow>))}
          {workItems.labels.length === 0 && <p className="text-xs text-slate-400">No labels yet.</p>}

          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-dashed border-slate-200 mt-3">
            <input type="color" className={COLOR_INPUT} value={newLabel.color} aria-label="New label color" onChange={(e) => setNewLabel({ ...newLabel, color: e.target.value })}/>
            <input className={`${SMALL_INPUT} w-44`} placeholder="e.g. tech-debt" value={newLabel.name} onChange={(e) => {
            setNewLabel({ ...newLabel, name: e.target.value });
            setLabelError('');
        }}/>
            <button type="button" className="btn-tonal btn-xs" onClick={addLabel}>
              <Plus className="w-3 h-3"/> Add Label
            </button>
            <FieldError>{labelError}</FieldError>
          </div>
        </div>
      </SettingsCard>

      {/* ============ COMPONENTS ============ */}
      <SettingsCard title="Components" description="Sub-sections of a product (e.g. Frontend, Database) used to group and filter issues." icon={<Check className="w-4 h-4"/>} action={<button type="button" className="btn-ghost btn-sm text-slate-500" onClick={() => askResetCatalog('components')}>
            <RotateCcw className="w-3.5 h-3.5"/> Reset
          </button>}>
        <div className="space-y-2">
          {workItems.components.map((component) => (<ListRow key={component.id}>
              <input className={`${SMALL_INPUT} w-full sm:w-44 font-semibold`} value={component.name} aria-label="Component name" onChange={(e) => patchComponent(component.id, { name: e.target.value })}/>
              <input className={`${SMALL_INPUT} flex-1 min-w-0`} value={component.description} placeholder="Short description…" aria-label="Component description" onChange={(e) => patchComponent(component.id, { description: e.target.value })}/>
              <IconBtn title="Remove component" danger onClick={() => removeComponent(component)}>
                <Trash2 className="w-3.5 h-3.5"/>
              </IconBtn>
            </ListRow>))}
          {workItems.components.length === 0 && <p className="text-xs text-slate-400">No components yet.</p>}

          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-dashed border-slate-200 mt-3">
            <input className={`${SMALL_INPUT} w-44`} placeholder="Component name" value={newComponent.name} onChange={(e) => {
            setNewComponent({ ...newComponent, name: e.target.value });
            setComponentError('');
        }}/>
            <input className={`${SMALL_INPUT} w-60`} placeholder="Description (optional)" value={newComponent.description} onChange={(e) => setNewComponent({ ...newComponent, description: e.target.value })}/>
            <button type="button" className="btn-tonal btn-xs" onClick={addComponent}>
              <Plus className="w-3 h-3"/> Add Component
            </button>
            <FieldError>{componentError}</FieldError>
          </div>
        </div>
      </SettingsCard>

      <p className="text-[11px] text-slate-400 px-1">
        Changes to the work item catalog apply immediately — there is no separate save step.
      </p>

      <ConfirmDialog isOpen={confirm !== null} onClose={() => setConfirm(null)} onConfirm={() => {
            confirm?.onConfirm();
            setConfirm(null);
        }} title={confirm?.title || ''} message={confirm?.message || ''} danger={confirm?.danger}/>
    </div>);
};
