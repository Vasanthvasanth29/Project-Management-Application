import React, { useState, useRef, useEffect } from 'react';
import { Plus, ArrowRight, Save, RotateCcw, ChevronDown, Check, Play, Pause, RefreshCw } from 'lucide-react';
const PREVIEW_SPEEDS = [0.5, 1, 1.5];
/**
 * Workflow editor header. Add Stage, Add Transition, Update Workflow (with its
 * status dropdown) and Discard Changes keep their original callbacks.
 * `preview` (optional) drives the local visual preview controls; it never
 * saves or executes anything.
 */
export const WorkflowToolbar = ({ workflowName, status, hasUnsavedChanges, onAddStage, onAddTransition, onUpdateWorkflow, onDiscardChanges, preview, }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);
    const getStatusBadge = () => {
        switch (status) {
            case 'ACTIVE':
                return (<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-[#ccfbf1] text-[#0f766e] border border-[#99f6e4]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0d9488] animate-pulse"/>
            Active workflow
          </span>);
            case 'INACTIVE':
                return (<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]"/>
            Inactive workflow
          </span>);
            case 'DRAFT':
            default:
                return (<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-[#fffbeb] text-[#b45309] border border-[#fde68a]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]"/>
            Draft workflow
          </span>);
        }
    };
    const iconButton = 'inline-flex h-7 w-7 items-center justify-center rounded-md text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f766e] disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]';
    const pillButton = 'inline-flex h-8 items-center gap-1.5 px-3 rounded-full bg-white hover:bg-[#f8fafc] border border-[#e2e8f0] text-xs font-semibold text-[#0f172a] shadow-2xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]';
    return (<div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-[#eef0f3] bg-white px-3.5 py-2.5">
      {/* Title & status */}
      <div className="flex min-w-0 items-center gap-2 flex-wrap">
        <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${preview?.playing ? 'bg-[#10b981]' : 'bg-[#cbd5e1]'}`} aria-hidden="true"/>
        <h2 className="min-w-0 truncate text-[13px] font-semibold text-[#334155] font-display">
          Workflow <span className="text-[#cbd5e1]">·</span> <span className="text-[#0f172a]">{workflowName || 'Project Workflow Designer'}</span>
        </h2>
        {getStatusBadge()}
        {hasUnsavedChanges && (<span className="text-[10.5px] font-semibold text-[#b45309] bg-[#fffbeb] border border-[#fde68a] px-2 py-0.5 rounded-full">
            • Unsaved changes
          </span>)}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {preview && (<div className="flex items-center gap-0.5" role="group" aria-label="Workflow preview">
            <button type="button" className={iconButton} onClick={preview.onPlayPause} disabled={!!preview.disabledReason} aria-label={preview.playing ? 'Pause preview' : 'Play preview'} title={preview.disabledReason || (preview.playing ? 'Pause preview' : 'Preview the configured path (visual only; nothing is executed or saved)')}>
              {preview.playing ? <Pause className="h-3.5 w-3.5"/> : <Play className="h-3.5 w-3.5"/>}
            </button>
            <button type="button" className={iconButton} onClick={preview.onReplay} disabled={!!preview.disabledReason} aria-label="Replay preview" title="Replay preview from START">
              <RefreshCw className="h-3.5 w-3.5"/>
            </button>
            {preview.hasReworkPath && (<>
                <label className="sr-only" htmlFor="workflow-preview-path">Preview path</label>
                <select id="workflow-preview-path" value={preview.pathMode} onChange={(e) => preview.onPathMode(e.target.value)} className="h-7 rounded-md border-0 bg-[#f1f5f9] pl-2 pr-6 text-[10.5px] font-semibold text-[#334155] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]" title="Which configured path the preview follows">
                  <option value="main">Main path</option>
                  <option value="rework">Rework path</option>
                </select>
              </>)}
            <div className="ml-0.5 inline-flex h-7 items-center rounded-md bg-[#f1f5f9] p-0.5" role="group" aria-label="Preview speed">
              {PREVIEW_SPEEDS.map((s) => (<button key={s} type="button" onClick={() => preview.onSpeed(s)} aria-pressed={preview.speed === s} className={`h-full rounded px-1.5 text-[10.5px] font-semibold tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488] ${preview.speed === s ? 'bg-white text-[#0f766e] shadow-2xs' : 'text-[#64748b] hover:text-[#0f172a]'}`}>
                  {s}×
                </button>))}
            </div>
            <span className="mx-1 hidden h-5 w-px bg-[#e2e8f0] sm:block" aria-hidden="true"/>
          </div>)}

        <button type="button" onClick={onAddStage} className={pillButton} title="Add a new stage to this workflow">
          <Plus className="w-3.5 h-3.5 text-[#0d9488]"/>
          <span>Add Stage</span>
        </button>

        <button type="button" onClick={onAddTransition} className={pillButton} title="Connect two stages with a transition arrow">
          <ArrowRight className="w-3.5 h-3.5 text-[#0891b2]"/>
          <span>Add Transition</span>
        </button>

        {/* Update Workflow Button with Dropdown */}
        <div className="relative inline-flex items-center shadow-2xs rounded-full" ref={dropdownRef}>
          <button type="button" onClick={() => onUpdateWorkflow()} className="inline-flex h-8 items-center gap-1.5 pl-3.5 pr-2.5 rounded-l-full bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488] focus-visible:ring-offset-1">
            <Save className="w-3.5 h-3.5"/>
            <span>Update Workflow</span>
          </button>
          <button type="button" onClick={() => setShowDropdown(!showDropdown)} className="h-8 px-2 rounded-r-full bg-[#0d9488] hover:bg-[#0f766e] border-l border-white/25 text-white text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488] focus-visible:ring-offset-1" title="Update options">
            <ChevronDown className="w-3.5 h-3.5"/>
          </button>

          {showDropdown && (<div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-2xl border border-[#e2e8f0] shadow-modal z-50 p-2 animate-scale-in text-xs">
              <button type="button" className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#f8fafc] flex items-center justify-between text-[#0f172a]" onClick={() => {
                onUpdateWorkflow('ACTIVE');
                setShowDropdown(false);
            }}>
                <div>
                  <div className="font-semibold text-[#0f766e]">Publish as Active</div>
                  <div className="text-[10px] text-[#64748b]">Set workflow active for all tasks</div>
                </div>
                {status === 'ACTIVE' && <Check className="w-4 h-4 text-[#0f766e]"/>}
              </button>

              <button type="button" className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#f8fafc] flex items-center justify-between text-[#0f172a]" onClick={() => {
                onUpdateWorkflow('DRAFT');
                setShowDropdown(false);
            }}>
                <div>
                  <div className="font-semibold text-[#b45309]">Save as Draft</div>
                  <div className="text-[10px] text-[#64748b]">Work in progress</div>
                </div>
                {status === 'DRAFT' && <Check className="w-4 h-4 text-[#b45309]"/>}
              </button>

              <button type="button" className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#f8fafc] flex items-center justify-between text-[#0f172a]" onClick={() => {
                onUpdateWorkflow('INACTIVE');
                setShowDropdown(false);
            }}>
                <div>
                  <div className="font-semibold text-[#475569]">Set Inactive</div>
                  <div className="text-[10px] text-[#64748b]">Archive workflow</div>
                </div>
                {status === 'INACTIVE' && <Check className="w-4 h-4 text-[#475569]"/>}
              </button>
            </div>)}
        </div>

        {hasUnsavedChanges && (<button type="button" onClick={onDiscardChanges} className="inline-flex h-8 items-center gap-1.5 px-3 rounded-full hover:bg-[#fff1f2] text-xs font-semibold text-[#be123c] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#be123c]" title="Discard unsaved changes and reset canvas">
            <RotateCcw className="w-3.5 h-3.5"/>
            <span>Discard Changes</span>
          </button>)}
      </div>
    </div>);
};
