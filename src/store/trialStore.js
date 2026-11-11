import { create } from 'zustand';

import { TRIAL_WORK_ITEMS } from '../data/trialData';































const DEFAULT_DEMO_WORKSPACE = {
  id: 'trial-proj-1',
  projectName: 'E-Commerce Platform',
  projectKey: 'ECOM',
  createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  expiresAt: new Date(Date.now() + 4 * 86400000).toISOString(),
  workItems: TRIAL_WORK_ITEMS
};

function deriveProjectKey(name) {
  const letters = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
  if (letters.length >= 3) return letters.slice(0, 4);
  return 'TRL';
}

function getInitials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || 'TR';
}

export const useTrialStore = create()((set, get) => ({
  currentUserId: null,
  projects: [DEFAULT_DEMO_WORKSPACE],
  workspace: DEFAULT_DEMO_WORKSPACE,
  activeProjectId: 'trial-proj-1',

  initForCurrentUser: (userId, userName = 'Trial User', userEmail = '', avatarColor = '#0d9488') => {
    if (!userId) return;

    // 1. If it's the demo account 'trial@demo.com', use pre-loaded sample data
    if (userEmail.toLowerCase().trim() === 'trial@demo.com') {
      set({
        currentUserId: userId,
        projects: [DEFAULT_DEMO_WORKSPACE],
        workspace: DEFAULT_DEMO_WORKSPACE,
        activeProjectId: DEFAULT_DEMO_WORKSPACE.id
      });
      return;
    }

    const multiStorageKey = `flowexec_trial_projects_${userId}`;
    const legacyStorageKey = `flowexec_trial_workspace_${userId}`;

    // Try loading multi-project store first
    const savedMulti = localStorage.getItem(multiStorageKey);
    if (savedMulti) {
      try {
        const parsed = JSON.parse(savedMulti);
        if (Array.isArray(parsed) && parsed.length > 0) {
          set({
            currentUserId: userId,
            projects: parsed,
            workspace: parsed[0],
            activeProjectId: parsed[0].id || parsed[0].projectKey
          });
          return;
        }
      } catch (e) {
        console.error('Failed to parse saved trial projects', e);
      }
    }

    // Try loading legacy single-workspace store
    const savedSingle = localStorage.getItem(legacyStorageKey);
    if (savedSingle) {
      try {
        const parsed = JSON.parse(savedSingle);
        if (parsed && Array.isArray(parsed.workItems)) {
          const projectWithId = {
            id: parsed.id || `trial-proj-${parsed.projectKey.toLowerCase()}`,
            ...parsed
          };
          const projectsList = [projectWithId];
          try {
            localStorage.setItem(multiStorageKey, JSON.stringify(projectsList));
          } catch {}
          set({
            currentUserId: userId,
            projects: projectsList,
            workspace: projectWithId,
            activeProjectId: projectWithId.id
          });
          return;
        }
      } catch (e) {
        console.error('Failed to parse saved legacy trial workspace', e);
      }
    }

    // 2. BRAND NEW CUSTOM TRIAL WORKSPACE (Fresh, clean slate)
    const projKey = deriveProjectKey(userName);
    const initials = getInitials(userName);
    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 86400000);

    const freshWorkItems = [
    {
      id: `t-${projKey.toLowerCase()}-1`,
      key: `${projKey}-101`,
      keyColor: 'blue',
      title: `Setup ${userName}'s Agile Board & Sprint 1`,
      status: 'In Progress',
      priority: 'High',
      assigneeName: userName,
      assigneeInitials: initials,
      assigneeColor: avatarColor,
      updated: 'Today'
    },
    {
      id: `t-${projKey.toLowerCase()}-2`,
      key: `${projKey}-102`,
      keyColor: 'purple',
      title: 'Define sprint backlog items & user stories',
      status: 'To Do',
      priority: 'Medium',
      assigneeName: userName,
      assigneeInitials: initials,
      assigneeColor: avatarColor,
      updated: 'Today'
    },
    {
      id: `t-${projKey.toLowerCase()}-3`,
      key: `${projKey}-103`,
      keyColor: 'amber',
      title: 'Review team velocity & burndown reports',
      status: 'To Do',
      priority: 'Low',
      assigneeName: userName,
      assigneeInitials: initials,
      assigneeColor: avatarColor,
      updated: 'Today'
    }];


    const newWorkspace = {
      id: `trial-proj-${projKey.toLowerCase()}`,
      projectName: `${userName}'s Project`,
      projectKey: projKey,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      workItems: freshWorkItems
    };

    const initialProjects = [newWorkspace];

    try {
      localStorage.setItem(multiStorageKey, JSON.stringify(initialProjects));
      localStorage.setItem(legacyStorageKey, JSON.stringify(newWorkspace));
    } catch {}

    set({
      currentUserId: userId,
      projects: initialProjects,
      workspace: newWorkspace,
      activeProjectId: newWorkspace.id
    });
  },

  createProject: (projectName, customKey) => {
    const { currentUserId, projects } = get();
    if (projects.length >= 1) {
      return { success: false, error: 'Maximum 1 project allowed for Free Trial pack. Upgrade to Pro for unlimited workspaces.' };
    }

    const cleanName = projectName.trim();
    if (!cleanName) return { success: false, error: 'Project name is required' };

    const key = (customKey?.trim() || deriveProjectKey(cleanName)).toUpperCase();
    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 86400000);

    const freshWorkItems = [
    {
      id: `t-${key.toLowerCase()}-1`,
      key: `${key}-101`,
      keyColor: 'blue',
      title: `Kickoff & Sprint Planning for ${cleanName}`,
      status: 'In Progress',
      priority: 'High',
      assigneeName: 'Me',
      assigneeInitials: 'ME',
      assigneeColor: '#0d9488',
      updated: 'Just now'
    },
    {
      id: `t-${key.toLowerCase()}-2`,
      key: `${key}-102`,
      keyColor: 'purple',
      title: 'Define core deliverables & backlog priorities',
      status: 'To Do',
      priority: 'Medium',
      assigneeName: 'Me',
      assigneeInitials: 'ME',
      assigneeColor: '#0d9488',
      updated: 'Just now'
    },
    {
      id: `t-${key.toLowerCase()}-3`,
      key: `${key}-103`,
      keyColor: 'amber',
      title: 'Run test execution & review burnup metrics',
      status: 'To Do',
      priority: 'Low',
      assigneeName: 'Me',
      assigneeInitials: 'ME',
      assigneeColor: '#0d9488',
      updated: 'Just now'
    }];


    const newProject = {
      id: `trial-proj-${Date.now()}`,
      projectName: cleanName,
      projectKey: key,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      workItems: freshWorkItems
    };

    const nextProjects = [...projects, newProject];

    if (currentUserId && currentUserId !== 'u-trial-01') {
      try {
        localStorage.setItem(`flowexec_trial_projects_${currentUserId}`, JSON.stringify(nextProjects));
        localStorage.setItem(`flowexec_trial_workspace_${currentUserId}`, JSON.stringify(newProject));
      } catch {}
    }

    set({
      projects: nextProjects,
      workspace: newProject,
      activeProjectId: newProject.id
    });

    return { success: true, project: newProject };
  },

  setActiveProject: (projectIdOrKey) => {
    const { projects } = get();
    const found = projects.find((p) => p.id === projectIdOrKey || p.projectKey === projectIdOrKey);
    if (found) {
      set({ workspace: found, activeProjectId: found.id || found.projectKey });
    }
  },

  updateTaskStatus: (taskId, newStatus) => {
    const { currentUserId, projects, workspace } = get();
    const updatedItems = workspace.workItems.map((item) =>
    item.id === taskId ? { ...item, status: newStatus, updated: 'Just now' } : item
    );
    const updatedWorkspace = { ...workspace, workItems: updatedItems };
    const updatedProjects = projects.map((p) =>
    p.id && p.id === workspace.id || p.projectKey === workspace.projectKey ? updatedWorkspace : p
    );

    if (currentUserId && currentUserId !== 'u-trial-01') {
      try {
        localStorage.setItem(`flowexec_trial_projects_${currentUserId}`, JSON.stringify(updatedProjects));
        localStorage.setItem(`flowexec_trial_workspace_${currentUserId}`, JSON.stringify(updatedWorkspace));
      } catch {}
    }

    set({ projects: updatedProjects, workspace: updatedWorkspace });
  },

  addTask: (title, priority, assigneeName) => {
    const { currentUserId, projects, workspace } = get();
    const nextNum = workspace.workItems.length + 101;
    const nextKey = `${workspace.projectKey}-${nextNum}`;
    const initials = assigneeName ? getInitials(assigneeName) : 'ME';

    const newItem = {
      id: `t-${Date.now().toString().slice(-4)}`,
      key: nextKey,
      keyColor: 'blue',
      title,
      status: 'To Do',
      priority,
      assigneeName: assigneeName || 'Me',
      assigneeInitials: initials,
      assigneeColor: '#0d9488',
      updated: 'Just now'
    };

    const updatedWorkspace = {
      ...workspace,
      workItems: [newItem, ...workspace.workItems]
    };
    const updatedProjects = projects.map((p) =>
    p.id && p.id === workspace.id || p.projectKey === workspace.projectKey ? updatedWorkspace : p
    );

    if (currentUserId && currentUserId !== 'u-trial-01') {
      try {
        localStorage.setItem(`flowexec_trial_projects_${currentUserId}`, JSON.stringify(updatedProjects));
        localStorage.setItem(`flowexec_trial_workspace_${currentUserId}`, JSON.stringify(updatedWorkspace));
      } catch {}
    }

    set({ projects: updatedProjects, workspace: updatedWorkspace });
  },

  deleteTask: (taskId) => {
    const { currentUserId, projects, workspace } = get();
    const updatedWorkspace = {
      ...workspace,
      workItems: workspace.workItems.filter((item) => item.id !== taskId)
    };
    const updatedProjects = projects.map((p) =>
    p.id && p.id === workspace.id || p.projectKey === workspace.projectKey ? updatedWorkspace : p
    );

    if (currentUserId && currentUserId !== 'u-trial-01') {
      try {
        localStorage.setItem(`flowexec_trial_projects_${currentUserId}`, JSON.stringify(updatedProjects));
        localStorage.setItem(`flowexec_trial_workspace_${currentUserId}`, JSON.stringify(updatedWorkspace));
      } catch {}
    }

    set({ projects: updatedProjects, workspace: updatedWorkspace });
  },

  getStats: () => {
    const { projects, workspace } = get();
    const now = Date.now();
    const expires = new Date(workspace.expiresAt).getTime();
    const daysLeft = Math.max(1, Math.ceil((expires - now) / (1000 * 60 * 60 * 24)));

    const startedDate = new Date(workspace.createdAt);
    const expiresDate = new Date(workspace.expiresAt);

    const startedOn = startedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const expiresOn = expiresDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const allWorkItems = projects.flatMap((p) => p.workItems);
    const totalTasks = allWorkItems.length;
    const completedTasks = allWorkItems.filter((i) => i.status === 'Done').length;
    const inProgressTasks = allWorkItems.filter((i) => i.status === 'In Progress').length;
    const todoTasks = allWorkItems.filter((i) => i.status === 'To Do').length;
    const blockedTasks = allWorkItems.filter((i) => i.status === 'Blocked').length;

    return {
      daysTotal: 7,
      daysLeft,
      startedOn,
      expiresOn,
      projectsAllowed: 2, // Maximum 2 projects for trial pack
      projectsUsed: projects.length,
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      blockedTasks
    };
  },

  getStatusBreakdown: () => {
    const { projects } = get();
    const allWorkItems = projects.flatMap((p) => p.workItems);
    const total = allWorkItems.length || 1;
    const completed = allWorkItems.filter((i) => i.status === 'Done').length;
    const inProgress = allWorkItems.filter((i) => i.status === 'In Progress').length;
    const todo = allWorkItems.filter((i) => i.status === 'To Do').length;
    const blocked = allWorkItems.filter((i) => i.status === 'Blocked').length;

    return [
    { name: 'Completed', count: completed, pct: Math.round(completed / total * 100), color: '#10b981' },
    { name: 'In Progress', count: inProgress, pct: Math.round(inProgress / total * 100), color: '#3b82f6' },
    { name: 'To Do', count: todo, pct: Math.round(todo / total * 100), color: '#94a3b8' },
    { name: 'Blocked', count: blocked, pct: Math.round(blocked / total * 100), color: '#ef4444' }];

  },

  getTrendData: () => {
    const { projects } = get();
    const allWorkItems = projects.flatMap((p) => p.workItems);
    const completed = allWorkItems.filter((i) => i.status === 'Done').length;
    const inProgress = allWorkItems.filter((i) => i.status === 'In Progress').length;
    const total = allWorkItems.length;

    const days = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Today'];
    return days.map((d, idx) => {
      if (idx === days.length - 1) {
        return { date: d, inProgress, completed, created: total };
      }
      return {
        date: d,
        inProgress: Math.min(inProgress, idx),
        completed: Math.min(completed, Math.floor(idx / 2)),
        created: Math.min(total, idx + 1)
      };
    });
  }
}));