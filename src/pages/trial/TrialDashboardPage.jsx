import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Folder, ListTodo, CheckCircle2, PlayCircle, MoreVertical,
  ArrowRight, Crown, X, Check, Lock, HelpCircle, ExternalLink,
  ChevronDown, FileText, Users, Shield, Settings, Plug,
  FolderPlus, GitBranch, BarChart3, Edit3, Calendar,
  Sparkles, Layout, Zap, ChevronRight, Plus, Flame, Clock, TrendingUp } from
'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from
'recharts';
import { TRIAL_VS_PRO_FEATURES } from '../../data/trialData';
import { UpgradeModal } from '../../components/trial/UpgradeModal';
import { useTrialStore } from '../../store/trialStore';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { matchProject, getProjectUrl } from '../../utils/idUtils';
import { toast } from 'sonner';

export const TrialDashboardPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { projects } = useAppStore();
  const { workspace, initForCurrentUser, getStats, getStatusBreakdown, getTrendData, addTask } = useTrialStore();

  const [bannerVisible, setBannerVisible] = useState(true);
  const [onboardingOpen, setOnboardingOpen] = useState(true);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedIteration, setSelectedIteration] = useState('This Iteration');
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskPriority, setQuickTaskPriority] = useState('Medium');
  const [hoveredSlice, setHoveredSlice] = useState(null);

  useEffect(() => {
    if (currentUser?.id) {
      initForCurrentUser(currentUser.id, currentUser.name, currentUser.email, currentUser.avatarColor);
    }
  }, [currentUser?.id, currentUser?.name, currentUser?.email, currentUser?.avatarColor, initForCurrentUser]);

  const targetProject = projects.find((p) => matchProject(p, { projectKey: workspace.projectKey })) || projects[0];
  const projectWorkspaceUrl = getProjectUrl(targetProject, currentUser?.role || 'MEMBER');

  const stats = getStats();
  const statusBreakdown = getStatusBreakdown();
  const trendData = getTrendData();
  const workItems = workspace.workItems;
  const completionRate = stats.totalTasks > 0 ? Math.round(stats.completedTasks / stats.totalTasks * 100) : 0;

  // Handle Quick Task submission
  const handleQuickTaskSubmit = (e) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    addTask(quickTaskTitle.trim(), quickTaskPriority, currentUser?.name || 'You');
    toast.success(`✨ Task "${quickTaskTitle.trim()}" added to Sprint!`);
    setQuickTaskTitle('');
  };

  // Key badge color mapping
  const getKeyBadgeClass = (color) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 text-blue-600 border border-blue-200/80';
      case 'purple':
        return 'bg-purple-50 text-purple-600 border border-purple-200/80';
      case 'rose':
        return 'bg-rose-50 text-rose-600 border border-rose-200/80';
      case 'cyan':
        return 'bg-cyan-50 text-cyan-700 border border-cyan-200/80';
      case 'amber':
        return 'bg-amber-50 text-amber-700 border border-amber-200/80';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-200/80';
    }
  };

  // Status badge styling with dot
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Done':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200/80';
      case 'In Progress':
        return 'bg-blue-50 text-blue-700 border border-blue-200/80';
      case 'To Do':
        return 'bg-slate-100 text-slate-600 border border-slate-200';
      case 'Blocked':
        return 'bg-rose-50 text-rose-700 border border-rose-200/80';
      default:
        return 'bg-slate-50 text-slate-600 border border-slate-200';
    }
  };

  const getStatusDotColor = (status) => {
    switch (status) {
      case 'Done':return 'bg-emerald-500';
      case 'In Progress':return 'bg-blue-500';
      case 'To Do':return 'bg-slate-400';
      case 'Blocked':return 'bg-rose-500';
      default:return 'bg-slate-400';
    }
  };

  // Priority badge styling
  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-50 text-rose-700 border border-rose-200/70';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border border-amber-200/70';
      case 'Low':
        return 'bg-slate-50 text-slate-600 border border-slate-200/70';
      default:
        return 'bg-slate-50 text-slate-600 border border-slate-200';
    }
  };

  // Feature icon mapping
  const getFeatureIcon = (icon) => {
    switch (icon) {
      case 'folder':
        return /*#__PURE__*/React.createElement(Folder, { className: "w-3.5 h-3.5 text-teal-600 shrink-0" });
      case 'edit':
        return /*#__PURE__*/React.createElement(Edit3, { className: "w-3.5 h-3.5 text-teal-600 shrink-0" });
      case 'git-branch':
        return /*#__PURE__*/React.createElement(GitBranch, { className: "w-3.5 h-3.5 text-teal-600 shrink-0" });
      case 'bar-chart':
        return /*#__PURE__*/React.createElement(BarChart3, { className: "w-3.5 h-3.5 text-teal-600 shrink-0" });
      case 'layout':
        return /*#__PURE__*/React.createElement(Layout, { className: "w-3.5 h-3.5 text-teal-600 shrink-0" });
      case 'folder-plus':
        return /*#__PURE__*/React.createElement(FolderPlus, { className: "w-3.5 h-3.5 text-amber-500 shrink-0" });
      case 'file-text':
        return /*#__PURE__*/React.createElement(FileText, { className: "w-3.5 h-3.5 text-amber-500 shrink-0" });
      case 'users':
        return /*#__PURE__*/React.createElement(Users, { className: "w-3.5 h-3.5 text-amber-500 shrink-0" });
      case 'shield':
        return /*#__PURE__*/React.createElement(Shield, { className: "w-3.5 h-3.5 text-amber-500 shrink-0" });
      case 'settings':
        return /*#__PURE__*/React.createElement(Settings, { className: "w-3.5 h-3.5 text-amber-500 shrink-0" });
      case 'plug':
        return /*#__PURE__*/React.createElement(Plug, { className: "w-3.5 h-3.5 text-amber-500 shrink-0" });
      case 'calendar':
        return /*#__PURE__*/React.createElement(Calendar, { className: "w-3.5 h-3.5 text-amber-500 shrink-0" });
      case 'sparkles':
        return /*#__PURE__*/React.createElement(Sparkles, { className: "w-3.5 h-3.5 text-amber-500 shrink-0" });
      default:
        return /*#__PURE__*/React.createElement(Lock, { className: "w-3.5 h-3.5 text-slate-400 shrink-0" });
    }
  };

  const daysPassed = Math.max(0, stats.daysTotal - stats.daysLeft);

  return (/*#__PURE__*/
    React.createElement("div", { className: "p-0 space-y-4 w-full font-sans animate-fade-in" },

    bannerVisible && /*#__PURE__*/
    React.createElement("div", { className: "relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-amber-100/30 to-teal-500/10 border border-amber-300/80 rounded-2xl p-3 sm:p-3.5 shadow-2xs transition-all" }, /*#__PURE__*/
    React.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3" }, /*#__PURE__*/

    React.createElement("div", { className: "flex items-center gap-3 min-w-0" }, /*#__PURE__*/
    React.createElement("div", { className: "w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20" }, /*#__PURE__*/
    React.createElement(Crown, { className: "w-4.5 h-4.5 fill-white/30" })
    ), /*#__PURE__*/
    React.createElement("div", { className: "min-w-0 space-y-1" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /*#__PURE__*/
    React.createElement("span", { className: "text-xs sm:text-sm font-black text-slate-900 tracking-tight" }, "7-Day Limited Trial Active"

    ), /*#__PURE__*/
    React.createElement("span", { className: "px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black tracking-wide shadow-2xs" }, "⚡ ",
    stats.daysLeft, " days remaining"
    ), /*#__PURE__*/

    React.createElement("div", { className: "hidden md:flex items-center gap-1 pl-1" },
    Array.from({ length: stats.daysTotal }).map((_, i) => /*#__PURE__*/
    React.createElement("div", {
      key: i,
      className: `h-1.5 w-3 rounded-full transition-all ${
      i < daysPassed ?
      'bg-amber-500' :
      i === daysPassed ?
      'bg-amber-400 ring-2 ring-amber-300 ring-offset-1 animate-pulse' :
      'bg-slate-200'}`,

      title: `Day ${i + 1}` }
    )
    )
    )
    ), /*#__PURE__*/
    React.createElement("p", { className: "text-[11px] text-slate-500 font-medium truncate hidden sm:block" }, "Explore Limber Lithe core features during your 7-day trial period."

    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "flex items-center gap-2.5 shrink-0 self-end sm:self-auto" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-1.5 text-[11px] text-slate-600 font-semibold bg-white/70 px-2.5 py-1 rounded-lg border border-amber-200/60 hidden md:flex" }, /*#__PURE__*/
    React.createElement(Calendar, { className: "w-3.5 h-3.5 text-amber-600" }), /*#__PURE__*/
    React.createElement("span", null, "Expires on ", /*#__PURE__*/React.createElement("strong", null, stats.expiresOn))
    ), /*#__PURE__*/

    React.createElement("button", {
      onClick: () => setUpgradeModalOpen(true),
      className: "px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5 group" }, /*#__PURE__*/

    React.createElement("span", null, "View Plans"), /*#__PURE__*/
    React.createElement(ArrowRight, { className: "w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" })
    ), /*#__PURE__*/

    React.createElement("button", {
      onClick: () => setBannerVisible(false),
      className: "p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-amber-100/60 transition-colors cursor-pointer",
      title: "Dismiss banner" }, /*#__PURE__*/

    React.createElement(X, { className: "w-3.5 h-3.5" })
    )
    )
    )
    ),



    onboardingOpen && /*#__PURE__*/
    React.createElement("div", { className: "bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between pb-2 border-b border-slate-100" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("div", { className: "w-6 h-6 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center" }, /*#__PURE__*/
    React.createElement(Sparkles, { className: "w-3.5 h-3.5" })
    ), /*#__PURE__*/
    React.createElement("h3", { className: "text-xs sm:text-sm font-black text-slate-900 tracking-tight" }, "Getting Started with Limber Lithe"

    ), /*#__PURE__*/
    React.createElement("span", { className: "px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-black" }, "3 of 5 completed (60%)"

    )
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("div", { className: "hidden sm:block w-28 h-2 bg-slate-100 rounded-full overflow-hidden" }, /*#__PURE__*/
    React.createElement("div", { className: "h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full w-[60%]" })
    ), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => setOnboardingOpen(false),
      className: "text-[11px] font-semibold text-slate-400 hover:text-slate-600 cursor-pointer" },
    "Dismiss"

    )
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1" }, /*#__PURE__*/

    React.createElement("div", {
      onClick: () => navigate('/projects'),
      className: "flex items-center justify-between p-2 rounded-xl bg-slate-50/80 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 transition-all cursor-pointer group shadow-2xs",
      title: "Click to view created workspace & projects" }, /*#__PURE__*/

    React.createElement("div", { className: "flex items-center gap-2 min-w-0" }, /*#__PURE__*/
    React.createElement("div", { className: "w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs" }, /*#__PURE__*/
    React.createElement(Check, { className: "w-2.5 h-2.5 stroke-[3]" })
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] font-bold text-slate-700 group-hover:text-emerald-900 truncate" }, "1. Workspace Created"

    )
    ), /*#__PURE__*/
    React.createElement(ChevronRight, { className: "w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-transform shrink-0" })
    ), /*#__PURE__*/


    React.createElement("div", {
      onClick: () => navigate('/tasks'),
      className: "flex items-center justify-between p-2 rounded-xl bg-slate-50/80 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 transition-all cursor-pointer group shadow-2xs",
      title: "Click to view sprint backlog & work items" }, /*#__PURE__*/

    React.createElement("div", { className: "flex items-center gap-2 min-w-0" }, /*#__PURE__*/
    React.createElement("div", { className: "w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs" }, /*#__PURE__*/
    React.createElement(Check, { className: "w-2.5 h-2.5 stroke-[3]" })
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] font-bold text-slate-700 group-hover:text-emerald-900 truncate" }, "2. Sprint Backlog Added"

    )
    ), /*#__PURE__*/
    React.createElement(ChevronRight, { className: "w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-transform shrink-0" })
    ), /*#__PURE__*/


    React.createElement("div", {
      onClick: () => navigate('/reports'),
      className: "flex items-center justify-between p-2 rounded-xl bg-slate-50/80 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 transition-all cursor-pointer group shadow-2xs",
      title: "Click to view team velocity & reports" }, /*#__PURE__*/

    React.createElement("div", { className: "flex items-center gap-2 min-w-0" }, /*#__PURE__*/
    React.createElement("div", { className: "w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs" }, /*#__PURE__*/
    React.createElement(Check, { className: "w-2.5 h-2.5 stroke-[3]" })
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] font-bold text-slate-700 group-hover:text-emerald-900 truncate" }, "3. Team Metrics Live"

    )
    ), /*#__PURE__*/
    React.createElement(ChevronRight, { className: "w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-transform shrink-0" })
    ), /*#__PURE__*/


    React.createElement("div", {
      onClick: () => navigate('/iterations'),
      className: "flex items-center justify-between p-2 rounded-xl bg-teal-50/70 hover:bg-teal-100/70 border border-teal-200 text-teal-800 transition-all cursor-pointer group shadow-2xs",
      title: "Click to open sprint board and drag tasks to Done" }, /*#__PURE__*/

    React.createElement("div", { className: "flex items-center gap-2 min-w-0" }, /*#__PURE__*/
    React.createElement("div", { className: "w-4 h-4 rounded-full border-2 border-teal-500 shrink-0" }), /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] font-bold text-teal-900 truncate" }, "4. Drag Task to Done")
    ), /*#__PURE__*/
    React.createElement(ChevronRight, { className: "w-3.5 h-3.5 text-teal-600 group-hover:translate-x-0.5 transition-transform shrink-0" })
    ), /*#__PURE__*/


    React.createElement("div", {
      onClick: () => navigate('/reports'),
      className: "flex items-center justify-between p-2 rounded-xl bg-slate-50/80 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 transition-all cursor-pointer group shadow-2xs",
      title: "Click to view analytics and sprint velocity reports" }, /*#__PURE__*/

    React.createElement("div", { className: "flex items-center gap-2 min-w-0" }, /*#__PURE__*/
    React.createElement("div", { className: "w-4 h-4 rounded-full border-2 border-slate-300 group-hover:border-emerald-500 shrink-0" }), /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] font-bold text-slate-700 group-hover:text-emerald-900 truncate" }, "5. Review Sprint Velocity"

    )
    ), /*#__PURE__*/
    React.createElement(ChevronRight, { className: "w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-transform shrink-0" })
    )
    )
    ), /*#__PURE__*/



    React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-3.5" }, /*#__PURE__*/

    React.createElement("div", { className: "lg:col-span-8 xl:col-span-8 space-y-3.5" }, /*#__PURE__*/

    React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3" }, /*#__PURE__*/

    React.createElement("div", {
      onClick: () => navigate('/projects'),
      className: "bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md hover:border-teal-300 hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between",
      title: "Click to view all projects" }, /*#__PURE__*/

    React.createElement("div", null, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between mb-2.5" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("div", { className: "w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform" }, /*#__PURE__*/
    React.createElement(Folder, { className: "w-4 h-4" })
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-xs font-bold text-slate-600" }, "Projects Access")
    ), /*#__PURE__*/
    React.createElement(ArrowRight, { className: "w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" })
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex items-baseline justify-between" }, /*#__PURE__*/
    React.createElement("span", { className: "text-2xl font-black text-slate-900 tracking-tight" },
    stats.projectsUsed, " ", /*#__PURE__*/React.createElement("span", { className: "text-xs font-bold text-slate-400" }, "/ ", stats.projectsAllowed)
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-extrabold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60" }, "50% Quota"

    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2" }, /*#__PURE__*/
    React.createElement("div", { className: "h-full bg-gradient-to-r from-blue-500 to-teal-500 rounded-full w-1/2" })
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "mt-3 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px]" }, /*#__PURE__*/
    React.createElement("span", { className: "font-semibold text-slate-600 truncate" }, workspace.projectName), /*#__PURE__*/
    React.createElement("span", { className: "text-teal-600 font-bold shrink-0" }, "+1 slot left")
    )
    ), /*#__PURE__*/


    React.createElement("div", {
      onClick: () => navigate('/tasks'),
      className: "bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md hover:border-teal-300 hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between",
      title: "Click to view all tasks in sprint backlog" }, /*#__PURE__*/

    React.createElement("div", null, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between mb-2.5" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("div", { className: "w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform" }, /*#__PURE__*/
    React.createElement(ListTodo, { className: "w-4 h-4" })
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-xs font-bold text-slate-600" }, "Total Tasks")
    ), /*#__PURE__*/
    React.createElement(ArrowRight, { className: "w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" })
    ), /*#__PURE__*/

    React.createElement("div", { className: "text-2xl font-black text-slate-900 tracking-tight" },
    stats.totalTasks
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "mt-3 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px]" }, /*#__PURE__*/
    React.createElement("span", { className: "font-medium text-slate-500" }, /*#__PURE__*/
    React.createElement("strong", { className: "text-emerald-600 font-bold" }, stats.completedTasks, " Done"), " • ", /*#__PURE__*/React.createElement("strong", { className: "text-blue-600 font-bold" }, stats.inProgressTasks, " Active")
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full shrink-0" }, "Sprint 1"

    )
    )
    ), /*#__PURE__*/


    React.createElement("div", {
      onClick: () => navigate('/tasks?filter=DONE'),
      className: "bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md hover:border-emerald-300 hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between",
      title: "Click to view all completed tasks" }, /*#__PURE__*/

    React.createElement("div", null, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between mb-2.5" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("div", { className: "w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform" }, /*#__PURE__*/
    React.createElement(CheckCircle2, { className: "w-4 h-4" })
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-xs font-bold text-slate-600" }, "Completed")
    ), /*#__PURE__*/
    React.createElement(ArrowRight, { className: "w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" })
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex items-baseline gap-2" }, /*#__PURE__*/
    React.createElement("span", { className: "text-2xl font-black text-slate-900 tracking-tight" },
    stats.completedTasks
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-xs font-extrabold text-emerald-600" },
    completionRate, "% rate"
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2" }, /*#__PURE__*/
    React.createElement("div", {
      className: "h-full bg-emerald-500 rounded-full transition-all",
      style: { width: `${completionRate}%` } }
    )
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "mt-3 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px]" }, /*#__PURE__*/
    React.createElement("span", { className: "text-slate-500 font-medium" }, stats.completedTasks, " of ", stats.totalTasks, " tasks"), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1 shrink-0" }, /*#__PURE__*/
    React.createElement(TrendingUp, { className: "w-2.5 h-2.5" }), "+2 today"

    )
    )
    ), /*#__PURE__*/


    React.createElement("div", {
      onClick: () => navigate('/tasks?filter=IN_PROGRESS'),
      className: "bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between",
      title: "Click to view actively executing tasks" }, /*#__PURE__*/

    React.createElement("div", null, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between mb-2.5" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("div", { className: "w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform" }, /*#__PURE__*/
    React.createElement(PlayCircle, { className: "w-4 h-4" })
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-xs font-bold text-slate-600" }, "In Progress")
    ), /*#__PURE__*/
    React.createElement(ArrowRight, { className: "w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" })
    ), /*#__PURE__*/

    React.createElement("div", { className: "text-2xl font-black text-slate-900 tracking-tight" },
    stats.inProgressTasks
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "mt-3 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px]" }, /*#__PURE__*/
    React.createElement("span", { className: "text-slate-500 font-medium" }, "Actively executing"), /*#__PURE__*/
    React.createElement("span", { className: "flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60 shrink-0" }, /*#__PURE__*/
    React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" }), "Active"

    )
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-3.5" }, /*#__PURE__*/

    React.createElement("div", { className: "bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between pb-2.5 border-b border-slate-100" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("h3", { className: "text-sm font-black text-slate-900" }, "Task Status Overview"), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-bold text-slate-400" }, "(", stats.totalTasks, " Total)")
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs text-slate-700 font-semibold cursor-pointer hover:bg-slate-50" }, /*#__PURE__*/
    React.createElement("span", null, selectedIteration), /*#__PURE__*/
    React.createElement(ChevronDown, { className: "w-3.5 h-3.5 text-slate-400" })
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 items-center gap-4 py-3" }, /*#__PURE__*/

    React.createElement("div", { className: "relative h-44 flex items-center justify-center" }, /*#__PURE__*/
    React.createElement(ResponsiveContainer, { width: "100%", height: "100%" }, /*#__PURE__*/
    React.createElement(PieChart, null, /*#__PURE__*/
    React.createElement(Pie, {
      data: statusBreakdown,
      cx: "50%",
      cy: "50%",
      innerRadius: 54,
      outerRadius: 74,
      paddingAngle: 4,
      dataKey: "count",
      onMouseEnter: (entry) => setHoveredSlice(entry?.name ?? null),
      onMouseLeave: () => setHoveredSlice(null) },

    statusBreakdown.map((entry, index) => /*#__PURE__*/
    React.createElement(Cell, {
      key: `cell-${index}`,
      fill: entry.color,
      stroke: "#ffffff",
      strokeWidth: 2 }
    )
    )
    )
    )
    ), /*#__PURE__*/
    React.createElement("div", { className: "absolute inset-0 flex flex-col items-center justify-center pointer-events-none" }, /*#__PURE__*/
    React.createElement("span", { className: "text-2xl font-black text-slate-900 leading-tight" },
    hoveredSlice || `${completionRate}%`
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wider" },
    hoveredSlice ? 'Status' : 'Completed'
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "space-y-2 pl-2" },
    statusBreakdown.map((item) => /*#__PURE__*/
    React.createElement("div", {
      key: item.name,
      onMouseEnter: () => setHoveredSlice(item.name),
      onMouseLeave: () => setHoveredSlice(null),
      className: "flex items-center justify-between text-xs py-0.5 hover:bg-slate-50 px-1.5 rounded-lg transition-colors cursor-pointer" }, /*#__PURE__*/

    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("span", {
      className: "w-2.5 h-2.5 rounded-full shrink-0",
      style: { backgroundColor: item.color } }
    ), /*#__PURE__*/
    React.createElement("span", { className: "font-semibold text-slate-700 text-[11px]" }, item.name)
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-1.5 font-mono text-[11px]" }, /*#__PURE__*/
    React.createElement("span", { className: "font-black text-slate-900" }, item.count), /*#__PURE__*/
    React.createElement("span", { className: "text-slate-400 font-medium" }, "(", item.pct, "%)")
    )
    )
    )
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between pb-2.5 border-b border-slate-100" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("h3", { className: "text-sm font-black text-slate-900" }, "Velocity & Trend"), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60" }, "Live"

    )
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs text-slate-700 font-semibold cursor-pointer hover:bg-slate-50" }, /*#__PURE__*/
    React.createElement("span", null, "Last 7 Days"), /*#__PURE__*/
    React.createElement(ChevronDown, { className: "w-3.5 h-3.5 text-slate-400" })
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "h-44 py-2" }, /*#__PURE__*/
    React.createElement(ResponsiveContainer, { width: "100%", height: "100%" }, /*#__PURE__*/
    React.createElement(AreaChart, { data: trendData, margin: { top: 8, right: 10, left: -22, bottom: 0 } }, /*#__PURE__*/
    React.createElement("defs", null, /*#__PURE__*/
    React.createElement("linearGradient", { id: "inProgressGrad", x1: "0", y1: "0", x2: "0", y2: "1" }, /*#__PURE__*/
    React.createElement("stop", { offset: "5%", stopColor: "#3b82f6", stopOpacity: 0.25 }), /*#__PURE__*/
    React.createElement("stop", { offset: "95%", stopColor: "#3b82f6", stopOpacity: 0.0 })
    ), /*#__PURE__*/
    React.createElement("linearGradient", { id: "completedGrad", x1: "0", y1: "0", x2: "0", y2: "1" }, /*#__PURE__*/
    React.createElement("stop", { offset: "5%", stopColor: "#10b981", stopOpacity: 0.25 }), /*#__PURE__*/
    React.createElement("stop", { offset: "95%", stopColor: "#10b981", stopOpacity: 0.0 })
    )
    ), /*#__PURE__*/
    React.createElement(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: "#f1f5f9" }), /*#__PURE__*/
    React.createElement(XAxis, {
      dataKey: "date",
      tickLine: false,
      axisLine: false,
      tick: { fill: '#94a3b8', fontSize: 10, fontWeight: 500 } }
    ), /*#__PURE__*/
    React.createElement(YAxis, {
      domain: [0, 15],
      ticks: [0, 5, 10, 15],
      tickLine: false,
      axisLine: false,
      tick: { fill: '#94a3b8', fontSize: 10, fontWeight: 500 } }
    ), /*#__PURE__*/
    React.createElement(Tooltip, {
      contentStyle: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        fontSize: '11px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
      } }
    ), /*#__PURE__*/
    React.createElement(Area, {
      type: "monotone",
      dataKey: "inProgress",
      name: "In Progress",
      stroke: "#3b82f6",
      strokeWidth: 2.5,
      fillOpacity: 1,
      fill: "url(#inProgressGrad)" }
    ), /*#__PURE__*/
    React.createElement(Area, {
      type: "monotone",
      dataKey: "completed",
      name: "Completed",
      stroke: "#10b981",
      strokeWidth: 2.5,
      fillOpacity: 1,
      fill: "url(#completedGrad)" }
    ), /*#__PURE__*/
    React.createElement(Area, {
      type: "monotone",
      dataKey: "created",
      name: "Created",
      stroke: "#14b8a6",
      strokeWidth: 1.5,
      strokeDasharray: "2 2",
      fill: "none" }
    )
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "flex items-center justify-center gap-6 pt-2 text-[11px] font-semibold text-slate-600 border-t border-slate-100" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-1.5" }, /*#__PURE__*/
    React.createElement("span", { className: "w-2 h-2 rounded-full bg-emerald-500" }), /*#__PURE__*/
    React.createElement("span", null, "Completed")
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-1.5" }, /*#__PURE__*/
    React.createElement("span", { className: "w-2 h-2 rounded-full bg-teal-500" }), /*#__PURE__*/
    React.createElement("span", null, "Created")
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-1.5" }, /*#__PURE__*/
    React.createElement("span", { className: "w-2 h-2 rounded-full bg-blue-500" }), /*#__PURE__*/
    React.createElement("span", null, "In Progress")
    )
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("h3", { className: "text-sm font-black text-slate-900" }, "Recent Work Items"), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full" },
    workItems.length, " items"
    )
    ), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => navigate('/iterations'),
      className: "flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700 cursor-pointer" }, /*#__PURE__*/

    React.createElement("span", null, "View Full Board"), /*#__PURE__*/
    React.createElement(ArrowRight, { className: "w-3.5 h-3.5" })
    )
    ), /*#__PURE__*/


    React.createElement("form", { onSubmit: handleQuickTaskSubmit, className: "p-3 border-b border-slate-100 bg-teal-50/20 flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("div", { className: "relative flex-1" }, /*#__PURE__*/
    React.createElement(Plus, { className: "w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" }), /*#__PURE__*/
    React.createElement("input", {
      type: "text",
      placeholder: "+ Add a quick task to Sprint (e.g. Design checkout modal) and press Enter...",
      value: quickTaskTitle,
      onChange: (e) => setQuickTaskTitle(e.target.value),
      className: "w-full h-8 pl-8 pr-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500" }
    )
    ), /*#__PURE__*/
    React.createElement("select", {
      value: quickTaskPriority,
      onChange: (e) => setQuickTaskPriority(e.target.value),
      className: "h-8 px-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-bold focus:outline-none" }, /*#__PURE__*/

    React.createElement("option", { value: "High" }, "High"), /*#__PURE__*/
    React.createElement("option", { value: "Medium" }, "Medium"), /*#__PURE__*/
    React.createElement("option", { value: "Low" }, "Low")
    ), /*#__PURE__*/
    React.createElement("button", {
      type: "submit",
      className: "h-8 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition cursor-pointer" },
    "Add"

    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "overflow-x-auto" }, /*#__PURE__*/
    React.createElement("table", { className: "w-full text-left text-xs" }, /*#__PURE__*/
    React.createElement("thead", null, /*#__PURE__*/
    React.createElement("tr", { className: "bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider" }, /*#__PURE__*/
    React.createElement("th", { className: "py-2.5 px-5" }, "Key"), /*#__PURE__*/
    React.createElement("th", { className: "py-2.5 px-4" }, "Title"), /*#__PURE__*/
    React.createElement("th", { className: "py-2.5 px-4" }, "Status"), /*#__PURE__*/
    React.createElement("th", { className: "py-2.5 px-4" }, "Priority"), /*#__PURE__*/
    React.createElement("th", { className: "py-2.5 px-4" }, "Assignee"), /*#__PURE__*/
    React.createElement("th", { className: "py-2.5 px-4" }, "Updated"), /*#__PURE__*/
    React.createElement("th", { className: "py-2.5 px-3 text-right" })
    )
    ), /*#__PURE__*/
    React.createElement("tbody", { className: "divide-y divide-slate-100 font-medium" },
    workItems.slice(0, 5).map((item) => /*#__PURE__*/
    React.createElement("tr", {
      key: item.id,
      onClick: () => navigate(`/member/tasks/${item.key}`),
      className: "hover:bg-teal-50/40 transition-colors cursor-pointer group" }, /*#__PURE__*/


    React.createElement("td", { className: "py-3 px-5 whitespace-nowrap" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-1.5" }, /*#__PURE__*/
    React.createElement(FileText, { className: "w-3.5 h-3.5 text-blue-500" }), /*#__PURE__*/
    React.createElement("span", { className: `px-2 py-0.5 rounded-md font-mono font-bold text-[11px] ${getKeyBadgeClass(item.keyColor)}` },
    item.key
    )
    )
    ), /*#__PURE__*/


    React.createElement("td", { className: "py-3 px-4 font-semibold text-slate-800 max-w-[240px] truncate" },
    item.title
    ), /*#__PURE__*/


    React.createElement("td", { className: "py-3 px-4 whitespace-nowrap" }, /*#__PURE__*/
    React.createElement("span", { className: `inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${getStatusBadgeClass(item.status)}` }, /*#__PURE__*/
    React.createElement("span", { className: `w-1.5 h-1.5 rounded-full ${getStatusDotColor(item.status)}` }),
    item.status
    )
    ), /*#__PURE__*/


    React.createElement("td", { className: "py-3 px-4 whitespace-nowrap" }, /*#__PURE__*/
    React.createElement("span", { className: `px-2 py-0.5 rounded-md text-[10px] font-extrabold ${getPriorityBadgeClass(item.priority)}` },
    item.priority
    )
    ), /*#__PURE__*/


    React.createElement("td", { className: "py-3 px-4 whitespace-nowrap" },
    item.assigneeName ? /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("div", {
      className: "w-6 h-6 rounded-full text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-2xs",
      style: { backgroundColor: item.assigneeColor || '#2563eb' } },

    item.assigneeInitials
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-slate-700 font-semibold" }, item.assigneeName)
    ) : /*#__PURE__*/

    React.createElement("span", { className: "text-slate-400 font-medium" }, "—")

    ), /*#__PURE__*/


    React.createElement("td", { className: "py-3 px-4 text-slate-500 whitespace-nowrap" },
    item.updated
    ), /*#__PURE__*/


    React.createElement("td", { className: "py-3 px-3 text-right whitespace-nowrap" }, /*#__PURE__*/
    React.createElement("button", { className: "p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer" }, /*#__PURE__*/
    React.createElement(MoreVertical, { className: "w-4 h-4" })
    )
    )
    )
    )
    )
    )
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "lg:col-span-4 xl:col-span-4 space-y-3.5" }, /*#__PURE__*/

    React.createElement("div", { className: "bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between pb-2 border-b border-slate-100" }, /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-1.5" }, /*#__PURE__*/
    React.createElement("h3", { className: "text-sm font-black text-slate-900 tracking-tight" }, "Plan Capabilities"), /*#__PURE__*/
    React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-amber-500" })
    ), /*#__PURE__*/
    React.createElement("p", { className: "text-[11px] text-slate-400 font-medium mt-0.5" }, "Workspace Capabilities Overview")
    ), /*#__PURE__*/
    React.createElement("span", { className: "px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/80 text-[10px] font-black uppercase tracking-wider" }, "Active Plan"

    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "space-y-1" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 pb-1.5 border-b border-slate-100/60" }, /*#__PURE__*/
    React.createElement("span", null, "Feature"), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-4 text-right" }, /*#__PURE__*/
    React.createElement("span", { className: "w-14 text-center" }, "Included"), /*#__PURE__*/
    React.createElement("span", { className: "w-16 text-right font-black text-amber-600" }, "Pro Pack")
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "space-y-0.5 divide-y divide-slate-100/60 max-h-[380px] overflow-y-auto pr-0.5 no-scrollbar" },
    TRIAL_VS_PRO_FEATURES.map((feature) => /*#__PURE__*/
    React.createElement("div", {
      key: feature.name,
      onClick: () => {
        if (!feature.isUnlockedInTrial) setUpgradeModalOpen(true);
      },
      className: `flex items-center justify-between py-1.5 first:pt-1 text-xs rounded-lg px-1 transition-colors ${
      !feature.isUnlockedInTrial ? 'hover:bg-amber-50/50 cursor-pointer group' : ''}` }, /*#__PURE__*/



    React.createElement("div", { className: "flex items-center gap-2 min-w-0 pr-2" },
    getFeatureIcon(feature.icon), /*#__PURE__*/
    React.createElement("span", { className: `text-[11px] font-semibold truncate ${feature.isUnlockedInTrial ? 'text-slate-800' : 'text-slate-600'}` },
    feature.name
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "flex items-center gap-3 shrink-0" }, /*#__PURE__*/

    React.createElement("div", { className: "w-14 flex justify-center" },
    typeof feature.trial === 'string' ? /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200/60" },
    feature.trial
    ) :
    feature.trial ? /*#__PURE__*/
    React.createElement("div", { className: "w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center" }, /*#__PURE__*/
    React.createElement(Check, { className: "w-3 h-3 stroke-[3]" })
    ) : /*#__PURE__*/

    React.createElement(Lock, { className: "w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500 transition-colors" })

    ), /*#__PURE__*/


    React.createElement("div", { className: "w-16 flex justify-end" },
    typeof feature.pro === 'string' ? /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60" },
    feature.pro
    ) : /*#__PURE__*/

    React.createElement("span", { className: "text-[10px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60" }, "Unlimited"

    )

    )
    )
    )
    )
    )
    ), /*#__PURE__*/


    React.createElement("button", {
      onClick: () => setUpgradeModalOpen(true),
      className: "w-full py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer mt-2" }, /*#__PURE__*/

    React.createElement("span", null, "Compare All Plan Details"), /*#__PURE__*/
    React.createElement(ArrowRight, { className: "w-3.5 h-3.5" })
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-2.5" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2.5" }, /*#__PURE__*/
    React.createElement("div", { className: "w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0" }, /*#__PURE__*/
    React.createElement(HelpCircle, { className: "w-4 h-4" })
    ), /*#__PURE__*/
    React.createElement("h4", { className: "text-xs font-black text-slate-900" }, "Need Help?")
    ), /*#__PURE__*/
    React.createElement("p", { className: "text-[11px] text-slate-500 leading-relaxed font-medium" }, "Check our documentation or contact support for any questions."

    ), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => navigate('/help'),
      className: "w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer" }, /*#__PURE__*/

    React.createElement(ExternalLink, { className: "w-3.5 h-3.5 text-slate-500" }), /*#__PURE__*/
    React.createElement("span", null, "View Help & Support")
    )
    )
    )
    ), /*#__PURE__*/


    React.createElement(UpgradeModal, {
      isOpen: upgradeModalOpen,
      onClose: () => setUpgradeModalOpen(false) }
    )
    ));

};