import React from 'react';
import { Layers, CornerDownRight, Compass, Blocks, TrendingUp } from 'lucide-react';
import { StoryIcon } from './StoryIcon';
import { StoryTaskIcon } from './StoryTaskIcon';
import { BugIssueIcon } from './BugIssueIcon';
/**
 * FlowExec work-item type marker — a 32×32 rounded tile with a solid
 * type-coloured background and a white glyph, matching the reference
 * Iterations table. Explicit type→icon map (never a generic document or
 * sparkle fallback for known types):
 *   INITIATIVE  amber   Compass
 *   FEATURE     teal    Blocks
 *   EPIC        purple  Layers
 *   STORY       green   StoryIcon (folded page)
 *   TASK        blue    StoryTaskIcon (checklist)
 *   SUB-TASK    cyan    CornerDownRight
 *   BUG/BUG-FIX red     BugIssueIcon
 *   IMPROVEMENT pink    TrendingUp
 * Unknown types fall back to the TASK checklist. Symmetric -my-1.5 keeps
 * row height unchanged.
 */
const TYPE_STYLES = {
    INITIATIVE: {
        tile: 'bg-[#d97706]',
        node: <Compass className="w-[17px] h-[17px] text-white" strokeWidth={2.2}/>,
    },
    FEATURE: {
        tile: 'bg-[#0d9488]',
        node: <Blocks className="w-[17px] h-[17px] text-white" strokeWidth={2.2}/>,
    },
    EPIC: {
        tile: 'bg-[#7c3aed]',
        node: <Layers className="w-[17px] h-[17px] text-white" strokeWidth={2.2}/>,
    },
    STORY: {
        tile: 'bg-[#059669]',
        node: <StoryIcon className="w-[18px] h-[18px]" variant="onColor"/>,
    },
    TASK: {
        tile: 'bg-[#2563eb]',
        node: <StoryTaskIcon className="w-[18px] h-[18px]" variant="onColor"/>,
    },
    'SUB-TASK': {
        tile: 'bg-[#0891b2]',
        node: <CornerDownRight className="w-[17px] h-[17px] text-white" strokeWidth={2.2}/>,
    },
    BUG: {
        tile: 'bg-[#dc2626]',
        node: <BugIssueIcon className="w-[18px] h-[18px]" variant="onColor"/>,
    },
    'BUG-FIX': {
        tile: 'bg-[#dc2626]',
        node: <BugIssueIcon className="w-[18px] h-[18px]" variant="onColor"/>,
    },
    IMPROVEMENT: {
        tile: 'bg-[#db2777]',
        node: <TrendingUp className="w-[17px] h-[17px] text-white" strokeWidth={2.2}/>,
    },
};
export const WorkItemIcon = ({ typeLabel, className = '' }) => {
    const normalized = String(typeLabel ?? '').toUpperCase().replace(/_/g, '-');
    const style = TYPE_STYLES[normalized] || TYPE_STYLES.TASK;
    return (<span title={typeLabel} className={`inline-flex flex-shrink-0 items-center justify-center w-8 h-8 rounded-lg ${style.tile} -my-1.5 ${className}`}>
      {style.node}
    </span>);
};
