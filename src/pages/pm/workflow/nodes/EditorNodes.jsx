import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Play, Check, CheckCircle2, Sparkles } from 'lucide-react';
/**
 * Node renderers for the workflow editor canvas only (WorkflowBuilder).
 *
 * Same handles (positions, types and ids), same `data` fields and same
 * behaviour as StageNode / StartNode / DoneNode / AnyNode — those stay as they
 * are for the read-only workflow view on the Issue Details page. Only the look
 * differs. `data.preview` ('active' | 'visited') is a display-only overlay
 * added by the editor's local preview; it is never saved.
 */
const handleClass = '!w-2 !h-2 !bg-[#0d9488] !border-2 !border-white transition-transform group-hover:scale-125';
const humanizeType = (type) => {
    if (!type || type === 'CUSTOM')
        return 'Custom stage';
    const text = type.toLowerCase().replace(/_/g, ' ');
    return text.charAt(0).toUpperCase() + text.slice(1);
};
export const EditorStageNode = memo(({ data, selected }) => {
    const { stage, teamName, preview } = data;
    const isSelected = selected || data.isSelected;
    const active = preview === 'active';
    const state = active
        ? 'border-[#0d9488] bg-[#f0fdfa] ring-2 ring-[#0d9488]/25 shadow-md scale-[1.03]'
        : isSelected
            ? 'border-[#0d9488] ring-2 ring-[#0d9488]/30 shadow-md bg-white'
            : 'border-[#e2e8f0] bg-white hover:border-[#0d9488]/50 hover:shadow-md';
    return (<div className={`relative group min-w-[150px] max-w-[190px] rounded-xl border pl-4 pr-3 py-2 shadow-sm cursor-pointer transition-all duration-300 ${state}`}>
      <Handle type="target" position={Position.Top} className={handleClass}/>
      <Handle type="source" position={Position.Bottom} className={handleClass}/>
      <Handle type="target" position={Position.Left} id="left-target" className={handleClass}/>
      <Handle type="source" position={Position.Right} id="right-source" className={handleClass}/>

      <span className="absolute left-1.5 top-2 bottom-2 w-[3px] rounded-full" style={{ backgroundColor: stage?.color || '#2563eb' }} aria-hidden="true"/>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="truncate text-[12px] font-bold leading-tight text-[#0f172a] font-display tracking-tight" title={stage?.name}>
          {stage?.name || 'Stage'}
        </span>
        {preview === 'visited' && <Check className="h-3 w-3 flex-shrink-0 text-[#0d9488]" aria-label="Passed in preview"/>}
      </div>
      <div className="truncate text-[10px] leading-tight text-[#64748b] mt-0.5" title={teamName || humanizeType(stage?.type)}>
        {teamName || humanizeType(stage?.type)}
      </div>
    </div>);
});
EditorStageNode.displayName = 'EditorStageNode';
export const EditorStartNode = memo(({ data, selected }) => {
    const isSelected = selected || data.isSelected;
    const active = data.preview === 'active';
    return (<div className={`relative group flex items-center gap-2 rounded-full bg-[#0f172a] py-1.5 pl-1.5 pr-3.5 text-white shadow-md cursor-pointer transition-all duration-300 ${active ? 'ring-2 ring-[#0d9488] ring-offset-2 scale-105' : isSelected ? 'ring-2 ring-[#0d9488]/60 ring-offset-1' : 'hover:bg-[#1e293b]'}`}>
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0d9488]">
        <Play className="ml-0.5 h-3 w-3 fill-current"/>
      </span>
      <span className="text-[11px] font-bold uppercase tracking-wider font-display">{data.label || 'START'}</span>
      <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !bg-[#2dd4bf] !border-2 !border-white transition-transform group-hover:scale-125"/>
    </div>);
});
EditorStartNode.displayName = 'EditorStartNode';
export const EditorDoneNode = memo(({ data, selected }) => {
    const isSelected = selected || data.isSelected;
    const active = data.preview === 'active';
    return (<div className={`relative group flex min-w-[118px] items-center gap-2 rounded-xl bg-[#059669] px-3 py-2 text-white shadow-md cursor-pointer transition-all duration-300 ${active ? 'ring-[3px] ring-[#6ee7b7] ring-offset-2 scale-105' : isSelected ? 'ring-2 ring-[#10b981] ring-offset-1' : 'hover:bg-[#047857]'}`}>
      <Handle type="target" position={Position.Top} className="!w-2.5 !h-2.5 !bg-white !border-2 !border-[#059669] transition-transform group-hover:scale-125"/>
      <Handle type="target" position={Position.Left} id="left-target" className="!w-2.5 !h-2.5 !bg-white !border-2 !border-[#059669] transition-transform group-hover:scale-125"/>
      <CheckCircle2 className="h-4 w-4 text-emerald-100"/>
      <div className="leading-tight">
        <div className="text-[12px] font-bold tracking-wide font-display">{data.label || 'Done'}</div>
        <div className="text-[9.5px] text-emerald-100">Completed</div>
      </div>
    </div>);
});
EditorDoneNode.displayName = 'EditorDoneNode';
export const EditorAnyNode = memo(({ data, selected }) => {
    const isSelected = selected || data.isSelected;
    return (<div className={`relative group flex items-center gap-1.5 rounded-full border-2 border-dashed border-[#0891b2] bg-white px-3 py-1.5 text-[#0891b2] shadow-sm cursor-pointer transition-all duration-200 ${isSelected ? 'ring-2 ring-[#0891b2]/40 bg-[#ecfeff]' : 'hover:bg-[#f0fdfa]'}`}>
      <Sparkles className="h-3.5 w-3.5"/>
      <span className="text-[11px] font-bold uppercase tracking-wider font-display">{data.label || 'ANY'}</span>
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-[#0891b2] !border-2 !border-white transition-transform group-hover:scale-125"/>
      <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !bg-[#0891b2] !border-2 !border-white transition-transform group-hover:scale-125"/>
    </div>);
});
EditorAnyNode.displayName = 'EditorAnyNode';
