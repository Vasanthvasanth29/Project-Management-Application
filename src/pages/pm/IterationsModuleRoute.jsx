import React, { useMemo } from 'react';
import { useParams, useLocation, Navigate } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { matchProject, matchId } from '../../utils/idUtils';
import { IterationModuleLayout } from './IterationModuleLayout';
import { IterationsPage } from './IterationsPage';
import { ActiveSprintPage } from './ActiveSprintPage';
import { IterationReportsPage } from './IterationReportsPage';
import { SprintManager } from './SprintManager';
// Route element for every `.../iterations/*` pattern: resolves the project, picks
// the sub-view from the URL tail (default | completed | kanban-view |
// iteration-board | reports | specific sprint) and wraps it in the module layout (breadcrumb header
// + primary nav). The legacy `live-iteration` and `active-sprint` tails redirect
// to `kanban-view` so bookmarks and links keep working.
export const IterationsModuleRoute = () => {
    const { projectId, projectKey, projectName } = useParams();
    const location = useLocation();
    const { projects, sprints } = useAppStore();
    const project = useMemo(() => projects.find((p) => matchProject(p, { projectId, projectKey, projectName })), [projects, projectId, projectKey, projectName]);
    const matchedSprint = useMemo(() => {
        if (!project)
            return undefined;
        const seg = location.pathname.replace(/\/+$/, '').split('/').pop() || '';
        if (!seg || ['reports', 'completed', 'kanban-view', 'live-iteration', 'active-sprint', 'iteration-board', 'iterations'].includes(seg)) {
            return undefined;
        }
        return sprints.find((s) => matchId(s.projectId, project.id) && (matchId(s.id, seg) || s.iterationNumber === seg || s.name === seg));
    }, [project, sprints, location.pathname]);
    const sub = useMemo(() => {
        const seg = location.pathname.replace(/\/+$/, '').split('/').pop() || '';
        if (seg === 'reports')
            return 'reports';
        if (seg === 'completed')
            return 'completed';
        if (seg === 'live-iteration' || seg === 'active-sprint')
            return 'redirect-kanban';
        if (seg === 'kanban-view')
            return 'kanban-view';
        if (seg === 'iteration-board')
            return 'iteration-board';
        return 'default';
    }, [location.pathname]);
    if (!project) {
        return (<div className="flex items-center justify-center h-64">
        <p className="text-sm text-[#747775]">Project not found.</p>
      </div>);
    }
    if (sub === 'redirect-kanban') {
        return <Navigate to={location.pathname.replace(/\/(live-iteration|active-sprint)$/, '/kanban-view') + location.search} replace />;
    }
    return (<IterationModuleLayout project={project}>
      {matchedSprint ? (<ActiveSprintPage project={project} sprint={matchedSprint}/>) : sub === 'kanban-view' ? (<ActiveSprintPage project={project}/>) : sub === 'reports' ? (<IterationReportsPage project={project}/>) : sub === 'iteration-board' ? (<IterationBoardView projectId={project.id}/>) : sub === 'completed' ? (<IterationsPage view="completed"/>) : (<IterationsPage />)}
    </IterationModuleLayout>);
};
// The Iteration Board content itself (same board the old `?view=board` switcher
// opened) — rendered without its own header so the primary nav stays the only
// navigation row.
const IterationBoardView = ({ projectId }) => (<div className="min-h-0 flex flex-col">
    <div className="flex-1 overflow-y-auto pt-1">
      <SprintManager projectId={projectId} initialSubView="board" embedded/>
    </div>
  </div>);
