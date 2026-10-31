import React from 'react';
import { Pencil } from 'lucide-react';
/**
 * Single label/value row used inside `IssueDetailsSection`.
 * Falls back to an em dash when no value is provided.
 * With `onEdit`, the value cell becomes a click-to-edit target (inline editor
 * only — never a page/modal form).
 */
export const IssueField = ({ label, children, stacked = false, editing = false, onEdit, }) => {
    const hasValue = children !== undefined && children !== null && children !== false;
    const inner = (<span className="flex items-start gap-1 min-w-0">
      <span className="min-w-0 flex-1 break-words">
        {hasValue ? children : <span className="text-[8.5px] text-[color:var(--work-item-text)] font-normal">&#8212;</span>}
      </span>
      {onEdit && (<Pencil className="w-3 h-3 mt-0.5 flex-shrink-0 text-slate-400 opacity-0 group-hover/if:opacity-100 focus:opacity-100 transition-opacity" aria-hidden="true"/>)}
    </span>);
    const cellClassName = `fe-value min-w-0 break-words flex-1 rounded-md -mx-1 px-1 py-0.5 transition-colors text-left ${onEdit ? 'cursor-pointer hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]/40 focus-visible:bg-slate-100' : ''}`;
    return (<div className={`flex gap-1.5 min-w-0 group/if ${stacked ? 'flex-col gap-0.5' : 'items-start'}`}>
<span className="w-36 sm:w-40 flex-shrink-0 whitespace-normal break-words leading-4 fe-label font-bold text-slate-800 ">
  {label}
</span>
     {editing ? (
  <span className="leading-5 min-w-0 flex-1 whitespace-normal break-words">
    {children}
  </span>
) : onEdit ? (
        // Edit affordance rendered as a real button so the row is reachable
        // and activatable with the keyboard (Tab + Enter/Space), not only by
        // mouse. `children` for an editable row must not contain buttons.
        <button type="button" onClick={onEdit} title={`Edit ${label}`} aria-label={`Edit ${label}`} className={cellClassName}>
          {inner}
        </button>) : (<span className={cellClassName}>{inner}</span>)}
    </div>);
};
/** Compact chip list for multi-value fields (labels, versions, components, CIs). */
export const IssueChips = ({ values, mono = false }) => {
    if (!values || values.length === 0)
        return <span className="text-[8.5px] text-[color:var(--work-item-text)] font-normal">&#8212;</span>;
    return (<span className="flex flex-wrap gap-1.5">
      {values.map((value) => (<span key={value} className={`inline-flex items-center px-2 py-0.5 rounded-md bg-[#f1f5f9] border border-[#e2e8f0] fe-value ${mono ? 'font-mono' : ''}`}>
          {value}
        </span>))}
    </span>);
};
