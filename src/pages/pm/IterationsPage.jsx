import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { matchProject } from '../../utils/idUtils';
import { useIterationPaths } from './IterationModuleLayout';
import { IterationsOverviewTab } from './IterationsOverviewTab';
/**
 * Iterations section — the iteration list is the DEFAULT (and only) content of
 * this view. There is no secondary "Iterations Overview | Iteration Board"
 * switcher anymore: the Iteration Board lives in the primary module navigation
 * (`.../iterations/iteration-board`). Legacy `?view=board` links are redirected
 * there so old bookmarks and the Live Iteration page's button keep working.
 *
 * `view="completed"` renders the separate Completed Iterations tab
 * (`.../iterations/completed`) — finished iterations only, grouped by PI.
 */
export const IterationsPage = ({ view }) => {
    const { projectId, projectKey, projectName } = useParams();
    const { projects } = useAppStore();
    const navigate = useNavigate();
    const { basePath } = useIterationPaths();
    const [searchParams] = useSearchParams();
    const project = useMemo(() => projects.find((p) => matchProject(p, { projectId, projectKey, projectName })), [projects, projectId, projectKey, projectName]);
    const wantsBoard = searchParams.get('view') === 'board';
    useEffect(() => {
        if (wantsBoard)
            navigate(`${basePath}/iteration-board`, { replace: true });
    }, [wantsBoard, basePath, navigate]);
    if (!project) {
        return (<div className="flex items-center justify-center h-64">
        <p className="text-sm text-[#747775]">Project not found.</p>
      </div>);
    }
    // Content flows directly in the AppShell page-level scroller (`main` —
    // AppShell.tsx). No intermediate `overflow-y-auto` / `min-h-0 flex` wrapper:
    // a nested vertical scroll container here made the Iterations section behave
    // like an independently scrollable panel (splitting the page scroll context
    // from the Work Queue below it). Only the left iteration list inside the
    // page has its own vertical scrolling.
    return (<div className="pt-0.5">
      <IterationsOverviewTab projectId={project.id} view={view}/>
    </div>);
};
