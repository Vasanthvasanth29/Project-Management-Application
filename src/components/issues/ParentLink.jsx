import React from 'react';
import { resolveIssueKey } from '../../utils/issueKeyResolver';
import { useAppStore } from '../../store/appStore';
/**
 * Jira-style parent/epic reference row: `KEY Title`.
 *
 * Only the issue key is a hyperlink (opens `/browse/{key}`); the title is plain
 * text and the row is a simple inline flex line — no pill, card or icon.
 *
 * The key always comes from the single resolver `resolveIssueKey`, so it is the
 * parent's own real Jira key — never a key derived from an internal Task id.
 */
export const ParentLink = ({ parent, onOpen, showKey = true }) => {
    const projects = useAppStore((s) => s.projects);
    if (!parent) {
        return <span className="text-[#343A40] font-normal italic">None</span>;
    }
    const parentProject = projects.find((p) => p.id === parent.projectId);
    const key = resolveIssueKey(parentProject, parent);
    return (<span className="inline-flex items-center gap-1.5 min-w-0 max-w-full overflow-hidden">
      {showKey && (<button type="button" onClick={(e) => {
                // The key is a genuine hyperlink: navigate, and never let the
                // click bubble into this row's inline-edit affordance.
                e.stopPropagation();
                onOpen?.(parent.id);
            }} className="font-mono font-medium text-[#0052cc] underline decoration-1 underline-offset-2 hover:text-[#0747a6] cursor-pointer shrink-0" title={`Open ${key}`}>
          {key}
        </button>)}
      {/* One line only: never wraps; ellipsis only when the row cannot fit. */}
      <span className="min-w-0 truncate">{parent.title}</span>
    </span>);
};
