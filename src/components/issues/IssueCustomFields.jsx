import React, { useState } from 'react';
import { Check, Pencil, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { isCustomValueEmpty, getIssueCustomFields, customFieldValueForDraft, validateCustomFieldValues, effectiveCustomFieldValue, fieldLabel, } from '../../utils/customFields';
import { canManageCustomFields } from '../../utils/roleUtils';
import { IssueField } from './IssueField';
import { CustomFieldValueInput } from './CustomFieldValueInput';
import { CustomFieldFormModal } from './CustomFieldFormModal';
/**
 * Role gate for custom-field VALUES on the Details card:
 *  - Admin + Project Manager: always.
 *  - Otherwise the issue's assignee or reporter/creator (the same rights the
 *    issue's other inline value edits follow).
 * Field DEFINITIONS are never managed here — only from Project Settings →
 * Work Item Fields.
 */
const useCustomFieldAccess = (task) => {
    const { currentUser } = useAuthStore();
    const canManage = canManageCustomFields(currentUser?.role);
    const canEditValues = canManage ||
        (!!currentUser && (currentUser.id === task.assigneeId || currentUser.id === task.createdById));
    return { canManage, canEditValues };
};
/**
 * "Add Field" action for the Details card header (Admin / Project Manager only).
 * Converted from the original TypeScript and kept exported, but NOT currently
 * rendered anywhere: field definitions are managed from Project Settings →
 * Work Item Fields. Mount it in the Details header to re-enable inline adding.
 */
export const CustomFieldHeaderAction = ({ task }) => {
    const { canManage } = useCustomFieldAccess(task);
    const [open, setOpen] = useState(false);
    if (!canManage)
        return null;
    return (<>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1 rounded-lg border border-[#99f6e4] bg-white px-2.5 py-1 text-[11px] font-bold text-[#0d9488] hover:bg-[#f0fdfa] transition-colors" title="Add a custom field to this issue">
        <Plus className="w-3 h-3"/> Add Field
      </button>
      <CustomFieldFormModal isOpen={open} onClose={() => setOpen(false)} projectId={task.projectId} taskId={task.id}/>
    </>);
};
/**
 * Custom-field rows for the Details card: plain IssueField nodes (text /
 * chips / link / user cells) merged into the existing Details grid, with the
 * supported inline value editor (hover pencil → save/cancel) preserved.
 * Only ENABLED fields render — disabling a field hides it without deleting any
 * stored values, and there is deliberately no Add/Edit/Delete-definition menu
 * here: definitions live exclusively on the Work Item Fields page.
 */
export function useCustomFieldRows(task) {
    const { users, customFieldDefinitions, setTaskCustomFieldValue } = useAppStore();
    const { canEditValues } = useCustomFieldAccess(task);
    const stored = task.customFieldValues ?? {};
    // Enabled fields for this project + type only; disabled ones are hidden and
    // their stored values left untouched in storage.
    const rows = getIssueCustomFields(customFieldDefinitions, task).filter((f) => f.enabled);
    const [editId, setEditId] = useState(null);
    const [value, setValue] = useState('');
    const [error, setError] = useState('');
    const displayValue = (field, raw) => {
        if (raw === undefined)
            return undefined;
        // An explicit false is a real answer for checkboxes ("No"), not emptiness.
        if (field.type === 'checkbox')
            return raw === true ? 'Yes' : 'No';
        if (isCustomValueEmpty(field, raw))
            return undefined;
        switch (field.type) {
            case 'multi_select':
                return (<span className="flex flex-wrap gap-1.5">
            {raw.map((v) => (<span key={v} className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#f1f5f9] border border-[#e2e8f0] fe-control">
                {v}
              </span>))}
          </span>);
            case 'url':
                return (<a href={String(raw)} target="_blank" rel="noreferrer" className="text-[#0052cc] underline decoration-1 underline-offset-2 hover:text-[#0747a6] break-all font-medium">
            {String(raw)}
          </a>);
            case 'user':
                return users.find((u) => u.id === raw)?.name ?? String(raw);
            default:
                return String(raw);
        }
    };
    const startEdit = (field) => {
        setError('');
        setValue(customFieldValueForDraft({
            ...field,
            defaultValue: effectiveCustomFieldValue(field, stored),
        }));
        setEditId(field.id);
    };
    const saveEdit = (field) => {
        const validationErrors = validateCustomFieldValues([field], { [field.id]: value });
        if (validationErrors.length > 0) {
            setError(validationErrors[0]);
            return;
        }
        setTaskCustomFieldValue(task.id, field.id, value);
        setEditId(null);
        setError('');
        toast.success(`${fieldLabel(field)} updated`);
    };
    const renderRow = (field) => {
        const label = fieldLabel(field);
        if (editId === field.id) {
            return (<IssueField key={field.id} label={label} editing>
          <span className="flex flex-col items-start gap-1.5 w-full">
            <CustomFieldValueInput field={field} value={value} onChange={(v) => {
                    setValue(v);
                    setError('');
                }} users={users} autoFocus/>
            {error && <span className="text-[11px] font-semibold text-red-500">{error}</span>}
            <span className="flex gap-1.5">
              <button type="button" onClick={() => saveEdit(field)} className="inline-flex items-center gap-1 rounded-lg bg-[#0d9488] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#0f766e]">
                <Check className="w-3 h-3"/> Save
              </button>
              <button type="button" onClick={() => {
                    setEditId(null);
                    setError('');
                }} className="inline-flex items-center gap-1 rounded-lg border border-[#e2e5ea] bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-50">
                <X className="w-3 h-3"/> Cancel
              </button>
            </span>
          </span>
        </IssueField>);
        }
        const content = displayValue(field, effectiveCustomFieldValue(field, stored));
        const editable = canEditValues;
        return (<IssueField key={field.id} label={label}>
        <span className="group/cf flex items-start gap-1 min-w-0">
          <span className="min-w-0 break-words flex-1">
            {content ?? (<span className="text-[8.5px] text-[color:var(--work-item-text)] font-normal">
                &#8212;
              </span>)}
          </span>
          {editable && (<button type="button" onClick={() => startEdit(field)} className="p-0.5 rounded text-slate-300 opacity-0 group-hover/cf:opacity-100 focus:opacity-100 hover:text-[#0d9488] hover:bg-slate-100 transition-opacity" title={`Edit ${label}`}>
              <Pencil className="w-3 h-3"/>
            </button>)}
        </span>
      </IssueField>);
    };
    return {
        rows: rows.map(renderRow),
        modals: null,
    };
}
