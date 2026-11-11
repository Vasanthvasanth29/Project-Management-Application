import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { matchProject } from '../../utils/idUtils';
import { useIterationPaths } from './IterationModuleLayout';
import { IterationsOverviewTab } from './IterationsOverviewTab';

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

  return (<div className="pt-0.5">
    <IterationsOverviewTab projectId={project.id} view={view} />
  </div>);
};
