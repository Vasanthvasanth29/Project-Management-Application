import React, { useEffect, useMemo } from 'react';
import { Link2 } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { TaskTypeBadge } from '../../pages/shared/tasks/TaskTypeBadge';
import { StatusBadge } from '../common/Badges';
import { IssueSection } from './IssueSection';
import { resolveIssueKey } from '../../utils/issueKeyResolver';
import { ISSUE_LINK_DOT_COLOR, ISSUE_LINK_LABEL, ISSUE_LINK_TYPE_OPTIONS, perspectiveLinkType, } from '../../utils/issueLinks';
/**
 * Jira-style "Related Work Items" (read-only): one stored relationship per
 * link, rendered from the current issue's point of view (`A blocks B` shows
 * "blocks" on A and "is blocked by" on B). Keys come from the shared
 * issue-key resolver, so the row always shows the issue's real, clickable
 * Jira-style key. The list offers no add/remove controls — links are only
 * navigable, never editable, from this page.
 */
export const IssueLinks = ({ task, onOpen, defaultOpen = true }) => {
    const { tasks, taskDependencies, projects, rehydrateIssueLinks } = useAppStore();
    // Links created in an earlier session are stored by issue key; re-bind them
    // to the Tasks that exist now (materialising board issues on demand).
    useEffect(() => {
        rehydrateIssueLinks();
    }, [rehydrateIssueLinks, taskDependencies, tasks]);
    const groups = useMemo(() => {
        const byLabel = new Map();
        taskDependencies.forEach((dep) => {
            let target;
            if (dep.taskId === task.id)
                target = tasks.find((t) => t.id === dep.dependsOnTaskId);
            else if (dep.dependsOnTaskId === task.id)
                target = tasks.find((t) => t.id === dep.taskId);
            if (!target)
                return;
            const type = perspectiveLinkType(dep.type, dep.taskId, task.id);
            const label = ISSUE_LINK_LABEL[type];
            const list = byLabel.get(label) || [];
            list.push({ dependencyId: dep.id, target, type });
            byLabel.set(label, list);
        });
        return ISSUE_LINK_TYPE_OPTIONS.filter((option) => byLabel.has(option.label)).map((option) => [option.label, byLabel.get(option.label) || []]);
    }, [tasks, taskDependencies, task.id]);
    const total = groups.reduce((sum, [, entries]) => sum + entries.length, 0);
    const keyOf = (target) => resolveIssueKey(projects.find((p) => p.id === target.projectId), target);
    return (<IssueSection title="Related Work Items" icon={<Link2 className="w-3.5 h-3.5 text-[#0d9488]"/>} meta={<span className="fe-meta font-semibold bg-white px-2 py-0.5 rounded-full border border-slate-200">
          {total}
        </span>} defaultOpen={defaultOpen}>
      {total === 0 ? (<p className="fe-meta py-2">No related work items yet.</p>) : (<div className="space-y-3">
          {groups.map(([label, entries]) => (<div key={label} className="space-y-1.5">
              <h4 className="fe-label font-semibold flex items-center gap-1.5 tracking-wide">
                <span className={`w-2 h-2 rounded-full ${ISSUE_LINK_DOT_COLOR[label] || 'bg-slate-400'}`}/>
                {label}
              </h4>
              <div className="divide-y rounded-lg border overflow-hidden border-slate-200 bg-slate-50/60">
                {entries.map(({ dependencyId, target }) => (<div key={dependencyId} className="px-3 py-2 bg-white/70 fe-control flex items-center justify-between gap-2">
                    <button type="button" onClick={() => onOpen(target.id)} className="flex items-center gap-2 min-w-0 text-left hover:underline hover:decoration-1 hover:underline-offset-2">
                      <TaskTypeBadge type={target.type} plain/>
                      <span className="font-mono font-medium text-[#0052cc] flex-shrink-0">
                        {keyOf(target)}
                      </span>
                      <span className="font-medium truncate">{target.title}</span>
                    </button>
                    <span className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-slate-300" aria-hidden="true">
                        =
                      </span>
                      <StatusBadge status={target.status} resolution={target.resolution}/>
                    </span>
                  </div>))}
              </div>
            </div>))}
        </div>)}
    </IssueSection>);
};
