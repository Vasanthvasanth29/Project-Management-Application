import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Folder, Plus, Crown, ArrowRight, CheckCircle2,
  Calendar, Layers, Lock, AlertCircle, Search, Filter,
  Users, Sparkles, Activity, Clock, ChevronRight, BarChart2,
  X, FolderPlus, Check } from
'lucide-react';
import { UpgradeModal } from '../../components/trial/UpgradeModal';
import { useTrialStore } from '../../store/trialStore';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { matchProject, getProjectUrl } from '../../utils/idUtils';
import { toast } from 'sonner';

export const TrialProjectsPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { projects: storeProjects, createProject: createStoreProject } = useAppStore();
  const {
    projects: trialProjects,
    initForCurrentUser,
    getStats,
    getStatusBreakdown,
    createProject,
    setActiveProject
  } = useTrialStore();

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectKey, setNewProjectKey] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (currentUser?.id) {
      initForCurrentUser(currentUser.id, currentUser.name, currentUser.email, currentUser.avatarColor);
    }
  }, [currentUser?.id, currentUser?.name, currentUser?.email, currentUser?.avatarColor, initForCurrentUser]);

  const stats = getStats();
  const statusBreakdown = getStatusBreakdown();
  const completionRate = stats.totalTasks > 0 ? Math.round(stats.completedTasks / stats.totalTasks * 100) : 0;

  const handleNameChange = (name) => {
    setNewProjectName(name);
    if (!newProjectKey || newProjectKey.length <= 4) {
      const derived = name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase();
      if (derived) setNewProjectKey(derived);
    }
  };

  const handleCreateProjectSubmit = (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    const key = (newProjectKey.trim() || newProjectName.slice(0, 4)).toUpperCase();
    const result = createProject(newProjectName.trim(), key);

    if (!result.success) {
      toast.error(result.error || 'Failed to create project');
      return;
    }

    // Also register in appStore so navigation and workspace routes resolve seamlessly
    try {
      createStoreProject({
        name: newProjectName.trim(),
        key,
        description: `Trial project workspace for ${currentUser?.name || 'User'}`,
        category: 'Software Development',
        type: 'SCRUM',
        organizationId: 'org-001',
        startDate: new Date().toISOString().split('T')[0],
        targetDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        projectManagerId: currentUser?.id || 'u-pm-01',
        teamIds: ['team-dev'],
        currentStageId: 'stage-dev',
        workflowId: 'wf-001',
        createdByAdminId: currentUser?.id || 'u-admin-01'
      });
    } catch (err) {
      console.warn('Project already synced or store notice:', err);
    }

    toast.success(`🎉 Project "${newProjectName.trim()}" created successfully!`);
    setNewProjectName('');
    setNewProjectKey('');
    setCreateModalOpen(false);
  };

  const filteredProjects = trialProjects.filter((p) =>
  p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
  p.projectKey.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (/*#__PURE__*/
    React.createElement("div", { className: "space-y-6 max-w-[1400px] mx-auto pb-8" }, /*#__PURE__*/

    React.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200" }, /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2.5" }, /*#__PURE__*/
    React.createElement("h1", { className: "text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display" }, "Projects"

    ), /*#__PURE__*/
    React.createElement("span", { className: "px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-[10px] font-extrabold uppercase tracking-wide" },
    trialProjects.length, " / 1 Active"
    )
    ), /*#__PURE__*/
    React.createElement("p", { className: "text-xs text-slate-500 mt-1" }, "Manage your agile workspaces and track delivery velocity."

    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex items-center gap-2.5" }, /*#__PURE__*/
    React.createElement("button", {
      onClick: () => setUpgradeOpen(true),
      className: "px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100/80 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs" }, /*#__PURE__*/

    React.createElement(Crown, { className: "w-3.5 h-3.5 text-amber-600 fill-amber-500/30" }), /*#__PURE__*/
    React.createElement("span", null, "Unlock Unlimited")
    ), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => {
        if (trialProjects.length >= 1) {
          setUpgradeOpen(true);
        } else {
          setCreateModalOpen(true);
        }
      },
      className: "px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer" }, /*#__PURE__*/

    React.createElement(Plus, { className: "w-4 h-4" }), /*#__PURE__*/
    React.createElement("span", null, "New Project")
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4" }, /*#__PURE__*/
    React.createElement("div", { className: "bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between text-slate-400 mb-1" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] font-bold uppercase tracking-wider text-slate-500" }, "Active Projects"), /*#__PURE__*/
    React.createElement(Folder, { className: "w-4 h-4 text-teal-600" })
    ), /*#__PURE__*/
    React.createElement("div", { className: "text-2xl font-black text-slate-900" },
    trialProjects.length, " ", /*#__PURE__*/React.createElement("span", { className: "text-xs font-bold text-slate-400 font-normal" }, "/ 1 allowed")
    ), /*#__PURE__*/
    React.createElement("div", { className: "text-[11px] text-teal-700 font-semibold mt-1" },
    trialProjects.length === 0 ? '1 slot remaining for trial' : 'Max 1 trial project active (Upgrade to unlock unlimited)'
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between text-slate-400 mb-1" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] font-bold uppercase tracking-wider text-slate-500" }, "Total Work Items"), /*#__PURE__*/
    React.createElement(Activity, { className: "w-4 h-4 text-blue-600" })
    ), /*#__PURE__*/
    React.createElement("div", { className: "text-2xl font-black text-slate-900" }, stats.totalTasks), /*#__PURE__*/
    React.createElement("div", { className: "text-[11px] text-blue-600 font-semibold mt-1" },
    stats.completedTasks, " Completed • ", stats.inProgressTasks, " In Progress"
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between text-slate-400 mb-1" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] font-bold uppercase tracking-wider text-slate-500" }, "Delivery Velocity"), /*#__PURE__*/
    React.createElement(BarChart2, { className: "w-4 h-4 text-emerald-600" })
    ), /*#__PURE__*/
    React.createElement("div", { className: "text-2xl font-black text-emerald-600" }, completionRate, "%"), /*#__PURE__*/
    React.createElement("div", { className: "text-[11px] text-slate-500 font-medium mt-1" }, "All agile boards on track")
    ), /*#__PURE__*/

    React.createElement("div", { className: "bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between text-slate-400 mb-1" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] font-bold uppercase tracking-wider text-slate-500" }, "Trial Expiration"), /*#__PURE__*/
    React.createElement(Clock, { className: "w-4 h-4 text-amber-500" })
    ), /*#__PURE__*/
    React.createElement("div", { className: "text-2xl font-black text-amber-600" }, stats.daysLeft, " Days"), /*#__PURE__*/
    React.createElement("div", { className: "text-[11px] text-slate-500 font-medium mt-1" }, "Valid until ", stats.expiresOn)
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "flex items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200/80 p-2.5 shadow-2xs" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2 px-2" }, /*#__PURE__*/
    React.createElement("span", { className: "text-xs font-bold text-slate-700" }, "Your Workspaces"), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600" },
    trialProjects.length, " / 1 Project"
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "relative w-full sm:w-64" }, /*#__PURE__*/
    React.createElement(Search, { className: "w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" }), /*#__PURE__*/
    React.createElement("input", {
      type: "text",
      placeholder: "Search projects...",
      value: searchQuery,
      onChange: (e) => setSearchQuery(e.target.value),
      className: "w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-all" }
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" },
    filteredProjects.map((proj) => {
      const targetStoreProj = storeProjects.find((p) => matchProject(p, { projectKey: proj.projectKey })) || storeProjects[0];
      const projectWorkspaceUrl = getProjectUrl(targetStoreProj, currentUser?.role || 'MEMBER');

      const projTasks = proj.workItems || [];
      const projTotal = projTasks.length;
      const projDone = projTasks.filter((t) => t.status === 'Done').length;
      const projInProgress = projTasks.filter((t) => t.status === 'In Progress').length;
      const projTodo = projTasks.filter((t) => t.status === 'To Do').length;
      const projBlocked = projTasks.filter((t) => t.status === 'Blocked').length;
      const projRate = projTotal > 0 ? Math.round(projDone / projTotal * 100) : 0;

      return (/*#__PURE__*/
        React.createElement("div", {
          key: proj.id || proj.projectKey,
          onClick: () => {
            setActiveProject(proj.id || proj.projectKey);
            navigate(projectWorkspaceUrl);
          },
          className: "bg-white rounded-2xl border border-slate-200/90 hover:border-teal-400 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 cursor-pointer group" }, /*#__PURE__*/

        React.createElement("div", null, /*#__PURE__*/
        React.createElement("div", { className: "flex items-start justify-between gap-3 mb-3" }, /*#__PURE__*/
        React.createElement("div", { className: "flex items-center gap-3" }, /*#__PURE__*/
        React.createElement("div", { className: "w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200/80 flex items-center justify-center font-black text-sm shadow-2xs group-hover:scale-105 transition-transform" },
        proj.projectKey
        ), /*#__PURE__*/
        React.createElement("div", null, /*#__PURE__*/
        React.createElement("h3", { className: "text-base font-black text-slate-900 tracking-tight group-hover:text-teal-700 transition-colors" },
        proj.projectName
        ), /*#__PURE__*/
        React.createElement("div", { className: "flex items-center gap-1.5 mt-0.5" }, /*#__PURE__*/
        React.createElement("span", { className: "text-[10px] font-semibold text-slate-400" }, "Key: ", proj.projectKey), /*#__PURE__*/
        React.createElement("span", { className: "text-slate-300" }, "•"), /*#__PURE__*/
        React.createElement("span", { className: "text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200/60" }, "Scrum Board")
        )
        )
        ), /*#__PURE__*/
        React.createElement("span", { className: "px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold flex items-center gap-1" }, /*#__PURE__*/
        React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" }), "Active"

        )
        ), /*#__PURE__*/

        React.createElement("p", { className: "text-xs text-slate-600 line-clamp-2 leading-relaxed" }, "Personalized agile trial workspace for ",
        currentUser?.name, ". Track user stories, Kanban swimlanes, and velocity metrics."
        ), /*#__PURE__*/


        React.createElement("div", { className: "flex flex-wrap gap-1.5 mt-3" }, /*#__PURE__*/
        React.createElement("span", { className: "px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium" }, "Scrum"), /*#__PURE__*/
        React.createElement("span", { className: "px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium" }, "Sprint 1"), /*#__PURE__*/
        React.createElement("span", { className: "px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold" }, "Trial Active")
        )
        ), /*#__PURE__*/

        React.createElement("div", { className: "space-y-3 pt-3 border-t border-slate-100 text-xs" }, /*#__PURE__*/

        React.createElement("div", null, /*#__PURE__*/
        React.createElement("div", { className: "flex justify-between text-[11px] font-bold text-slate-600 mb-1.5" }, /*#__PURE__*/
        React.createElement("span", { className: "flex items-center gap-1" }, /*#__PURE__*/
        React.createElement(CheckCircle2, { className: "w-3.5 h-3.5 text-teal-600" }), "Overall Progress"

        ), /*#__PURE__*/
        React.createElement("span", { className: "text-teal-700 font-extrabold" },
        projRate, "% (", projDone, "/", projTotal, " Done)"
        )
        ), /*#__PURE__*/

        React.createElement("div", { className: "w-full h-2 bg-slate-100 rounded-full overflow-hidden flex" }, /*#__PURE__*/
        React.createElement("div", {
          className: "bg-emerald-500 h-full",
          style: { width: `${projTotal > 0 ? projDone / projTotal * 100 : 0}%` },
          title: `Done: ${projDone}` }
        ), /*#__PURE__*/
        React.createElement("div", {
          className: "bg-blue-500 h-full",
          style: { width: `${projTotal > 0 ? projInProgress / projTotal * 100 : 0}%` },
          title: `In Progress: ${projInProgress}` }
        ), /*#__PURE__*/
        React.createElement("div", {
          className: "bg-slate-300 h-full",
          style: { width: `${projTotal > 0 ? projTodo / projTotal * 100 : 0}%` },
          title: `To Do: ${projTodo}` }
        ), /*#__PURE__*/
        React.createElement("div", {
          className: "bg-rose-500 h-full",
          style: { width: `${projTotal > 0 ? projBlocked / projTotal * 100 : 0}%` },
          title: `Blocked: ${projBlocked}` }
        )
        )
        ), /*#__PURE__*/


        React.createElement("div", { className: "flex items-center justify-between text-slate-500 text-[11px] pt-1 font-medium" }, /*#__PURE__*/
        React.createElement("div", { className: "flex items-center gap-1.5" }, /*#__PURE__*/
        React.createElement("div", { className: "w-5 h-5 rounded-full bg-teal-600 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white" },
        currentUser?.name?.slice(0, 1).toUpperCase() || 'U'
        ), /*#__PURE__*/
        React.createElement("span", { className: "text-slate-600 text-[10px] font-semibold" }, currentUser?.name)
        ), /*#__PURE__*/
        React.createElement("span", { className: "text-slate-500" }, "Ends ", stats.expiresOn)
        ), /*#__PURE__*/


        React.createElement("div", { className: "grid grid-cols-2 gap-2 pt-1" }, /*#__PURE__*/
        React.createElement("button", {
          type: "button",
          onClick: (e) => {
            e.stopPropagation();
            setActiveProject(proj.id || proj.projectKey);
            navigate('/iterations/kanban-view');
          },
          className: "py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer" }, /*#__PURE__*/

        React.createElement("span", null, "Kanban View")
        ), /*#__PURE__*/
        React.createElement("button", {
          type: "button",
          onClick: (e) => {
            e.stopPropagation();
            setActiveProject(proj.id || proj.projectKey);
            navigate(projectWorkspaceUrl);
          },
          className: "py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs" }, /*#__PURE__*/

        React.createElement("span", null, "Open Project"), /*#__PURE__*/
        React.createElement(ArrowRight, { className: "w-3.5 h-3.5" })
        )
        )
        )
        ));

    })
    ),


    createModalOpen && /*#__PURE__*/createPortal(/*#__PURE__*/
      React.createElement("div", {
        className: "fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200",
        onClick: () => setCreateModalOpen(false) }, /*#__PURE__*/

      React.createElement("div", {
        className: "relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col",
        onClick: (e) => e.stopPropagation() }, /*#__PURE__*/


      React.createElement("div", { className: "flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/70" }, /*#__PURE__*/
      React.createElement("div", { className: "flex items-center gap-2.5" }, /*#__PURE__*/
      React.createElement("div", { className: "w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shadow-2xs" }, /*#__PURE__*/
      React.createElement(FolderPlus, { className: "w-5 h-5 text-teal-700" })
      ), /*#__PURE__*/
      React.createElement("div", null, /*#__PURE__*/
      React.createElement("h2", { className: "text-base font-black text-slate-900 tracking-tight font-display" }, "Create Project"

      ), /*#__PURE__*/
      React.createElement("p", { className: "text-xs text-slate-500 mt-0.5" }, "Set up an agile project workspace")
      )
      ), /*#__PURE__*/
      React.createElement("button", {
        type: "button",
        onClick: () => setCreateModalOpen(false),
        className: "p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer" }, /*#__PURE__*/

      React.createElement(X, { className: "w-5 h-5" })
      )
      ), /*#__PURE__*/


      React.createElement("form", { onSubmit: handleCreateProjectSubmit, className: "p-6 space-y-4" }, /*#__PURE__*/
      React.createElement("div", null, /*#__PURE__*/
      React.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "Project Name ", /*#__PURE__*/
      React.createElement("span", { className: "text-rose-500" }, "*")
      ), /*#__PURE__*/
      React.createElement("input", {
        type: "text",
        placeholder: "e.g. Mobile App Redesign, Internal Tools",
        value: newProjectName,
        onChange: (e) => handleNameChange(e.target.value),
        className: "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-all font-medium",
        autoFocus: true,
        required: true }
      )
      ), /*#__PURE__*/

      React.createElement("div", null, /*#__PURE__*/
      React.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "Project Key ", /*#__PURE__*/
      React.createElement("span", { className: "text-slate-400 font-normal" }, "(Used in task IDs like KEY-101)")
      ), /*#__PURE__*/
      React.createElement("input", {
        type: "text",
        placeholder: "e.g. APP, TOOL",
        maxLength: 5,
        value: newProjectKey,
        onChange: (e) => setNewProjectKey(e.target.value.toUpperCase()),
        className: "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-all font-mono font-bold tracking-wider" }
      )
      ), /*#__PURE__*/


      React.createElement("div", { className: "p-3 bg-teal-50/50 rounded-xl border border-teal-100 text-xs space-y-1" }, /*#__PURE__*/
      React.createElement("div", { className: "flex items-center gap-1.5 text-teal-800 font-bold" }, /*#__PURE__*/
      React.createElement(Check, { className: "w-3.5 h-3.5 text-teal-600" }), /*#__PURE__*/
      React.createElement("span", null, "Includes 3 Pre-configured Agile Work Items")
      ), /*#__PURE__*/
      React.createElement("p", { className: "text-[11px] text-teal-600/90 leading-relaxed" }, "Your new project will be preloaded with Sprint 1 backlog tasks, Kanban board, and velocity reports."

      )
      ), /*#__PURE__*/


      React.createElement("div", { className: "flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100" }, /*#__PURE__*/
      React.createElement("button", {
        type: "button",
        onClick: () => setCreateModalOpen(false),
        className: "px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer" },
      "Cancel"

      ), /*#__PURE__*/
      React.createElement("button", {
        type: "submit",
        className: "px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer" }, /*#__PURE__*/

      React.createElement(Plus, { className: "w-4 h-4" }), /*#__PURE__*/
      React.createElement("span", null, "Create Project")
      )
      )
      )
      )
      ),
      document.body
    ), /*#__PURE__*/


    React.createElement(UpgradeModal, {
      isOpen: upgradeOpen,
      onClose: () => setUpgradeOpen(false) }
    )
    ));

};