import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban, CheckCircle2, Clock, Users,
  ChevronDown, ArrowRight, Plus, Settings2,
  Calendar as CalendarIcon, ExternalLink, Mail,
  RefreshCw, Trash2, Activity as ActivityIcon, ShieldCheck,
  Check, Sparkles, ChevronRight } from
'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { Avatar } from '../common/Avatar';
import { RoleBadge } from '../common/Badges';
import { ActivityFeed } from '../common/ActivityFeed';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatDate, isOverdue } from '../../utils/dateUtils';
import { issuePath } from '../../utils/issueUrl';
import { getProjectUrl } from '../../utils/idUtils';








export const ModernWarmDashboard = ({
  onCreateProject,
  onCreateUser
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { projects, tasks, users, activities, resendInvitation, deactivateUser } = useAppStore();

  // Active filters and state
  const [selectedDayOffset, setSelectedDayOffset] = useState(2); // Wednesday by default
  const [showAdminSection, setShowAdminSection] = useState(true);
  const [activityFilter, setActivityFilter] = useState('ALL');
  const [confirmCancel, setConfirmCancel] = useState(null);

  // Time of day greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = currentUser?.name ? currentUser.name.split(' ')[0] : 'there';

  // Metrics
  const activeProjects = useMemo(() => projects.filter((p) => p.status === 'ACTIVE' && !p.isArchived), [projects]);
  const completedProjects = useMemo(() => projects.filter((p) => p.status === 'COMPLETED'), [projects]);
  const activeUsers = useMemo(() => users.filter((u) => u.status === 'ACTIVE'), [users]);
  const pendingInvitations = useMemo(() => users.filter((u) => u.status === 'INVITATION_PENDING'), [users]);

  const completedTasks = useMemo(() => tasks.filter((t) => t.status === 'DONE'), [tasks]);
  const inProgressTasks = useMemo(() => tasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW'), [tasks]);
  const openTasks = useMemo(() => tasks.filter((t) => t.status !== 'DONE'), [tasks]);
  const todoTasks = useMemo(() => tasks.filter((t) => t.status === 'TODO' || t.status === 'BACKLOG'), [tasks]);
  const reviewTasks = useMemo(() => tasks.filter((t) => t.status === 'IN_REVIEW'), [tasks]);
  const overdueTasks = useMemo(() => tasks.filter((t) => t.status !== 'DONE' && isOverdue(t.dueDate)), [tasks]);

  // Donut chart calculations
  const totalTasksCount = Math.max(tasks.length, 1);
  const completedPct = Math.round(completedTasks.length / totalTasksCount * 100);
  const inProgressPct = Math.round(inProgressTasks.length / totalTasksCount * 100);
  const todoPct = 100 - completedPct - inProgressPct;

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashCompleted = completedPct / 100 * circumference;
  const strokeDashInProgress = inProgressPct / 100 * circumference;
  const strokeDashTodo = todoPct / 100 * circumference;

  // Calendar dates calculation for current week (Mon-Sun)
  const weekDays = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sun, 1 is Mon
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday);

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((dayName, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const isToday = d.toDateString() === today.toDateString();
      return {
        name: dayName,
        date: d.getDate(),
        fullDate: d,
        isToday,
        index: idx
      };
    });
  }, []);

  // Top 4 projects for Project Progress card
  const progressProjects = useMemo(() => {
    return projects.slice(0, 4).map((p, idx) => {
      const colors = [
      { bg: 'bg-blue-50 text-blue-600', bar: 'bg-blue-600' },
      { bg: 'bg-purple-50 text-purple-600', bar: 'bg-purple-600' },
      { bg: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-600' },
      { bg: 'bg-amber-50 text-amber-600', bar: 'bg-amber-500' }];

      const color = colors[idx % colors.length];
      return {
        ...p,
        color,
        calculatedProgress: p.progress || Math.min(95, Math.max(25, (idx + 1) * 22))
      };
    });
  }, [projects]);

  // Team members list with dynamic lively online statuses
  const teamMemberList = useMemo(() => {
    const statuses = ['Online', 'Online', 'In a meeting', 'Online', 'Away'];
    return users.slice(0, 5).map((user, idx) => {
      const status = statuses[idx % statuses.length];
      return {
        ...user,
        onlineStatus: status,
        roleTitle: user.role === 'PROJECT_MANAGER' ? 'Product Manager' :
        user.role === 'TEAM_LEADER' ? 'Lead Designer / Dev' :
        'Fullstack Engineer'
      };
    });
  }, [users]);

  // Weekly tasks activity mock/real distribution
  const activityDays = [
  { day: 'Mon', completed: 8, inProgress: 8, created: 8, total: 24 },
  { day: 'Tue', completed: 11, inProgress: 9, created: 10, total: 30 },
  { day: 'Wed', completed: 12, inProgress: 10, created: 12, total: 34 },
  { day: 'Thu', completed: 8, inProgress: 9, created: 8, total: 25 },
  { day: 'Fri', completed: 14, inProgress: 9, created: 11, total: 34 },
  { day: 'Sat', completed: 4, inProgress: 7, created: 6, total: 17 },
  { day: 'Sun', completed: 8, inProgress: 8, created: 8, total: 24 }];


  // Scheduled events for the selected day
  const daySchedule = useMemo(() => {
    const list = [
    {
      id: '1',
      title: 'Design Review & UX Alignment',
      time: '10:00 AM – 11:00 AM',
      color: 'bg-blue-500',
      attendees: users.slice(0, 2)
    },
    {
      id: '2',
      title: 'Sprint Planning & Backlog Grooming',
      time: '1:00 PM – 2:00 PM',
      color: 'bg-rose-500',
      attendees: users.slice(1, 3)
    },
    {
      id: '3',
      title: 'Client Feedback & Milestone Sign-off',
      time: '3:00 PM – 4:00 PM',
      color: 'bg-amber-500',
      attendees: users.slice(0, 4)
    }];

    return list;
  }, [users]);

  // Tasks for 4 Kanban Columns
  const kanbanColumns = useMemo(() => {
    return [
    {
      id: 'todo',
      name: 'To Do',
      count: todoTasks.length,
      items: todoTasks.slice(0, 3),
      headerBg: 'bg-slate-100/90 text-slate-700',
      badgeBg: 'bg-slate-200 text-slate-800',
      borderColor: 'border-slate-200'
    },
    {
      id: 'in_progress',
      name: 'In Progress',
      count: inProgressTasks.length,
      items: inProgressTasks.slice(0, 3),
      headerBg: 'bg-blue-50 text-blue-700',
      badgeBg: 'bg-blue-100 text-blue-800',
      borderColor: 'border-blue-200'
    },
    {
      id: 'review',
      name: 'Review',
      count: reviewTasks.length,
      items: reviewTasks.slice(0, 2),
      headerBg: 'bg-amber-50 text-amber-700',
      badgeBg: 'bg-amber-100 text-amber-800',
      borderColor: 'border-amber-200'
    },
    {
      id: 'done',
      name: 'Done',
      count: completedTasks.length,
      items: completedTasks.slice(0, 3),
      headerBg: 'bg-emerald-50 text-emerald-700',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      borderColor: 'border-emerald-200'
    }];

  }, [todoTasks, inProgressTasks, reviewTasks, completedTasks]);

  // Filtered Activities & Audit Log
  const filteredActivities = useMemo(() => {
    if (activityFilter === 'ALL') return activities;
    return activities.filter((a) => {
      switch (activityFilter) {
        case 'USER':return a.entityType === 'USER';
        case 'PROJECT':return a.entityType === 'PROJECT';
        case 'TASK':return a.entityType === 'TASK';
        case 'BUG':return a.entityType === 'BUG';
        case 'SPRINT':return a.entityType === 'SPRINT';
        default:return true;
      }
    });
  }, [activities, activityFilter]);

  const auditLog = useMemo(() => {
    return activities.filter((a) =>
    a.action.includes('created') ||
    a.action.includes('deleted') ||
    a.action.includes('assigned project') ||
    a.action.includes('updated status') ||
    a.action.includes('started sprint') ||
    a.action.includes('completed sprint')
    ).slice(0, 8);
  }, [activities]);

  const activityFilters = [
  { key: 'ALL', label: 'All' },
  { key: 'USER', label: 'Users' },
  { key: 'PROJECT', label: 'Projects' },
  { key: 'TASK', label: 'Tasks' },
  { key: 'BUG', label: 'Bugs' },
  { key: 'SPRINT', label: 'Iterations' }];


  return (/*#__PURE__*/
    React.createElement("div", { className: "w-full space-y-2.5 text-slate-800 animate-fade-in font-sans" }, /*#__PURE__*/


    React.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-0.5" }, /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("h1", { className: "text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5" }, /*#__PURE__*/
    React.createElement("span", null, greeting, ", ", firstName, "!"), /*#__PURE__*/
    React.createElement("span", { className: "text-xl" }, "👋")
    ), /*#__PURE__*/
    React.createElement("p", { className: "text-[11px] sm:text-xs text-slate-500 mt-0.5" }, "Here's what's happening with your projects today."

    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "flex items-center gap-1.5 flex-wrap" }, /*#__PURE__*/
    React.createElement("div", { className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs text-[11px] font-semibold text-slate-600" }, /*#__PURE__*/
    React.createElement(CalendarIcon, { className: "w-3 h-3 text-slate-400" }), /*#__PURE__*/
    React.createElement("span", null, "May 1, 2025 – May 31, 2025"), /*#__PURE__*/
    React.createElement(ChevronDown, { className: "w-3 h-3 text-slate-400" })
    ), /*#__PURE__*/

    React.createElement("button", {
      type: "button",
      onClick: () => navigate('/admin/settings'),
      className: "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer" }, /*#__PURE__*/

    React.createElement(Settings2, { className: "w-3 h-3 text-slate-500" }), /*#__PURE__*/
    React.createElement("span", { className: "hidden sm:inline" }, "Settings")
    ),

    onCreateProject && /*#__PURE__*/
    React.createElement("button", {
      type: "button",
      onClick: onCreateProject,
      className: "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer" }, /*#__PURE__*/

    React.createElement(FolderKanban, { className: "w-3 h-3 text-blue-600" }), /*#__PURE__*/
    React.createElement("span", null, "New Project")
    ),


    onCreateUser && /*#__PURE__*/
    React.createElement("button", {
      type: "button",
      onClick: onCreateUser,
      className: "inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-2xs text-[11px] font-semibold transition cursor-pointer" }, /*#__PURE__*/

    React.createElement(Plus, { className: "w-3 h-3" }), /*#__PURE__*/
    React.createElement("span", null, "Add User")
    )

    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-2.5" }, /*#__PURE__*/


    React.createElement("div", { className: "bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-3 hover:border-slate-300 transition-all" }, /*#__PURE__*/
    React.createElement("div", { className: "w-9 h-9 rounded-xl bg-blue-500 text-white flex items-center justify-center flex-shrink-0 shadow-2xs" }, /*#__PURE__*/
    React.createElement(FolderKanban, { className: "w-4 h-4" })
    ), /*#__PURE__*/
    React.createElement("div", { className: "min-w-0 flex-1" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] text-slate-500 font-medium block leading-tight" }, "Active Projects"), /*#__PURE__*/
    React.createElement("div", { className: "flex items-baseline gap-1.5 mt-0.5" }, /*#__PURE__*/
    React.createElement("span", { className: "text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-none" },
    activeProjects.length
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-bold text-emerald-600 flex items-center leading-none" }, "↑ 25%"

    )
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[9.5px] text-slate-400 block mt-0.5 leading-none" }, "vs last month")
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-3 hover:border-slate-300 transition-all" }, /*#__PURE__*/
    React.createElement("div", { className: "w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-2xs" }, /*#__PURE__*/
    React.createElement(CheckCircle2, { className: "w-4 h-4" })
    ), /*#__PURE__*/
    React.createElement("div", { className: "min-w-0 flex-1" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] text-slate-500 font-medium block leading-tight" }, "Tasks Completed"), /*#__PURE__*/
    React.createElement("div", { className: "flex items-baseline gap-1.5 mt-0.5" }, /*#__PURE__*/
    React.createElement("span", { className: "text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-none" },
    completedTasks.length
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-bold text-emerald-600 flex items-center leading-none" }, "↑ 18%"

    )
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[9.5px] text-slate-400 block mt-0.5 leading-none" }, "vs last month")
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-3 hover:border-slate-300 transition-all" }, /*#__PURE__*/
    React.createElement("div", { className: "w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-2xs" }, /*#__PURE__*/
    React.createElement(Clock, { className: "w-4 h-4" })
    ), /*#__PURE__*/
    React.createElement("div", { className: "min-w-0 flex-1" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] text-slate-500 font-medium block leading-tight" }, "Pending Tasks"), /*#__PURE__*/
    React.createElement("div", { className: "flex items-baseline gap-1.5 mt-0.5" }, /*#__PURE__*/
    React.createElement("span", { className: "text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-none" },
    openTasks.length
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-bold text-rose-500 flex items-center leading-none" }, "↓ 12%"

    )
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[9.5px] text-slate-400 block mt-0.5 leading-none" }, "vs last month")
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-3 hover:border-slate-300 transition-all" }, /*#__PURE__*/
    React.createElement("div", { className: "w-9 h-9 rounded-xl bg-purple-500 text-white flex items-center justify-center flex-shrink-0 shadow-2xs" }, /*#__PURE__*/
    React.createElement(Users, { className: "w-4 h-4" })
    ), /*#__PURE__*/
    React.createElement("div", { className: "min-w-0 flex-1" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] text-slate-500 font-medium block leading-tight" }, "Team Members"), /*#__PURE__*/
    React.createElement("div", { className: "flex items-baseline gap-1.5 mt-0.5" }, /*#__PURE__*/
    React.createElement("span", { className: "text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-none" },
    activeUsers.length
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-bold text-emerald-600 flex items-center leading-none" }, "↑ 0%"

    )
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[9.5px] text-slate-400 block mt-0.5 leading-none" }, "Active this month")
    )
    )

    ), /*#__PURE__*/


    React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch" }, /*#__PURE__*/


    React.createElement("div", { className: "lg:col-span-4 bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-2.5" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between pb-0.5" }, /*#__PURE__*/
    React.createElement("h3", { className: "text-xs sm:text-sm font-bold text-slate-900" }, "Project Progress"), /*#__PURE__*/
    React.createElement("button", {
      type: "button",
      onClick: () => currentUser && navigate('/admin/projects'),
      className: "text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer" }, /*#__PURE__*/

    React.createElement("span", null, "View All"), /*#__PURE__*/
    React.createElement(ArrowRight, { className: "w-3 h-3" })
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "space-y-2.5 flex-1" },
    progressProjects.map((proj) => /*#__PURE__*/
    React.createElement("div", { key: proj.id, className: "space-y-1 group" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between text-xs" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2 min-w-0" }, /*#__PURE__*/
    React.createElement("div", { className: `w-6 h-6 rounded-md ${proj.color.bg} flex items-center justify-center flex-shrink-0 font-bold text-[10px]` }, /*#__PURE__*/
    React.createElement(FolderKanban, { className: "w-3 h-3" })
    ), /*#__PURE__*/
    React.createElement("button", {
      type: "button",
      onClick: () => currentUser && navigate(getProjectUrl(proj, currentUser.role)),
      className: "font-bold text-slate-800 group-hover:text-blue-600 transition truncate text-left cursor-pointer text-xs" },

    proj.name
    )
    ), /*#__PURE__*/
    React.createElement("span", { className: "font-bold text-slate-700 font-mono text-[11px] flex-shrink-0" },
    proj.calculatedProgress, "%"
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "w-full h-1.5 rounded-full bg-slate-100 overflow-hidden" }, /*#__PURE__*/
    React.createElement("div", {
      className: `h-full rounded-full ${proj.color.bar} transition-all duration-700`,
      style: { width: `${proj.calculatedProgress}%` } }
    )
    )
    )
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "lg:col-span-4 bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between items-center text-center space-y-2" }, /*#__PURE__*/
    React.createElement("div", { className: "w-full flex items-center justify-between pb-0.5 text-left" }, /*#__PURE__*/
    React.createElement("h3", { className: "text-xs sm:text-sm font-bold text-slate-900" }, "Tasks Overview")
    ), /*#__PURE__*/


    React.createElement("div", { className: "relative w-32 h-32 flex items-center justify-center my-auto" }, /*#__PURE__*/
    React.createElement("svg", { viewBox: "0 0 130 130", className: "w-full h-full -rotate-90 transform" }, /*#__PURE__*/
    React.createElement("circle", {
      cx: "65",
      cy: "65",
      r: radius,
      fill: "none",
      stroke: "#e2e8f0",
      strokeWidth: "12" }
    ), /*#__PURE__*/
    React.createElement("circle", {
      cx: "65",
      cy: "65",
      r: radius,
      fill: "none",
      stroke: "#2563eb",
      strokeWidth: "12",
      strokeDasharray: `${strokeDashCompleted} ${circumference}`,
      strokeDashoffset: 0,
      strokeLinecap: "round",
      className: "transition-all duration-700" }
    ), /*#__PURE__*/
    React.createElement("circle", {
      cx: "65",
      cy: "65",
      r: radius,
      fill: "none",
      stroke: "#38bdf8",
      strokeWidth: "12",
      strokeDasharray: `${strokeDashInProgress} ${circumference}`,
      strokeDashoffset: -strokeDashCompleted,
      strokeLinecap: "round",
      className: "transition-all duration-700" }
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "absolute inset-0 flex flex-col items-center justify-center text-center" }, /*#__PURE__*/
    React.createElement("span", { className: "text-xl font-black text-slate-900 tracking-tight leading-none" },
    tasks.length
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5" }, "Total Tasks"

    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "w-full grid grid-cols-3 gap-1 pt-1.5 border-t border-slate-100 text-[11px]" }, /*#__PURE__*/
    React.createElement("div", { className: "flex flex-col items-center" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-1 text-slate-600 font-medium text-[10px]" }, /*#__PURE__*/
    React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-blue-600" }), /*#__PURE__*/
    React.createElement("span", null, "Completed")
    ), /*#__PURE__*/
    React.createElement("span", { className: "font-bold text-slate-900 text-xs mt-0.5" }, completedTasks.length)
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex flex-col items-center" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-1 text-slate-600 font-medium text-[10px]" }, /*#__PURE__*/
    React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-[#38bdf8]" }), /*#__PURE__*/
    React.createElement("span", null, "In Progress")
    ), /*#__PURE__*/
    React.createElement("span", { className: "font-bold text-slate-900 text-xs mt-0.5" }, inProgressTasks.length)
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex flex-col items-center" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-1 text-slate-600 font-medium text-[10px]" }, /*#__PURE__*/
    React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-slate-300" }), /*#__PURE__*/
    React.createElement("span", null, "To Do")
    ), /*#__PURE__*/
    React.createElement("span", { className: "font-bold text-slate-900 text-xs mt-0.5" }, todoTasks.length)
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "lg:col-span-4 bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-2.5" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between pb-0.5" }, /*#__PURE__*/
    React.createElement("h3", { className: "text-xs sm:text-sm font-bold text-slate-900" }, "This Week"), /*#__PURE__*/
    React.createElement("button", {
      type: "button",
      onClick: () => toast.info('Navigating to full calendar…'),
      className: "text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer" }, /*#__PURE__*/

    React.createElement("span", null, "View Calendar"), /*#__PURE__*/
    React.createElement(ArrowRight, { className: "w-3 h-3" })
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "grid grid-cols-7 gap-1 text-center" },
    weekDays.map((d) => {
      const isSelected = d.index === selectedDayOffset;
      return (/*#__PURE__*/
        React.createElement("button", {
          key: d.name,
          type: "button",
          onClick: () => setSelectedDayOffset(d.index),
          className: "flex flex-col items-center gap-0.5 cursor-pointer group" }, /*#__PURE__*/

        React.createElement("span", { className: "text-[9.5px] text-slate-400 font-semibold" }, d.name), /*#__PURE__*/
        React.createElement("div", {
          className: `w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
          isSelected ?
          'bg-blue-600 text-white shadow-2xs' :
          'text-slate-700 hover:bg-slate-100'}` },


        d.date
        ), /*#__PURE__*/

        React.createElement("span", {
          className: `w-1 h-1 rounded-full ${
          d.index === 2 ? 'bg-blue-500' : d.index === 3 ? 'bg-amber-500' : 'bg-transparent'}` }

        )
        ));

    })
    ), /*#__PURE__*/


    React.createElement("div", { className: "space-y-1.5 pt-1 border-t border-slate-100" },
    daySchedule.map((item) => /*#__PURE__*/
    React.createElement("div", {
      key: item.id,
      className: "flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-50/70 hover:bg-slate-100/70 transition" }, /*#__PURE__*/

    React.createElement("div", { className: "flex items-center gap-2 min-w-0" }, /*#__PURE__*/
    React.createElement("span", { className: `w-1.5 h-1.5 rounded-full ${item.color} flex-shrink-0` }), /*#__PURE__*/
    React.createElement("div", { className: "min-w-0" }, /*#__PURE__*/
    React.createElement("p", { className: "text-xs font-bold text-slate-800 truncate" }, item.title), /*#__PURE__*/
    React.createElement("span", { className: "text-[9.5px] text-slate-400 block" }, item.time)
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex items-center -space-x-1 flex-shrink-0" },
    item.attendees.map((user) => /*#__PURE__*/
    React.createElement(Avatar, { key: user.id, name: user.name, color: user.avatarColor, size: "xs" })
    )
    )
    )
    )
    )
    )

    ), /*#__PURE__*/


    React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch" }, /*#__PURE__*/


    React.createElement("div", { className: "lg:col-span-5 bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-2.5" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between pb-0.5" }, /*#__PURE__*/
    React.createElement("h3", { className: "text-xs sm:text-sm font-bold text-slate-900" }, "Team Members"), /*#__PURE__*/
    React.createElement("button", {
      type: "button",
      onClick: () => navigate('/admin/users'),
      className: "text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer" }, /*#__PURE__*/

    React.createElement("span", null, "View All"), /*#__PURE__*/
    React.createElement(ArrowRight, { className: "w-3 h-3" })
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "space-y-2 flex-1" },
    teamMemberList.map((member) => /*#__PURE__*/
    React.createElement("div", { key: member.id, className: "flex items-center justify-between gap-2 p-1 rounded-lg hover:bg-slate-50 transition" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2 min-w-0" }, /*#__PURE__*/
    React.createElement(Avatar, { name: member.name, color: member.avatarColor, size: "xs" }), /*#__PURE__*/
    React.createElement("div", { className: "min-w-0" }, /*#__PURE__*/
    React.createElement("p", { className: "text-xs font-bold text-slate-800 truncate leading-tight" }, member.name), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] text-slate-400 block truncate leading-tight" }, member.roleTitle)
    )
    ), /*#__PURE__*/

    React.createElement("span", {
      className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
      member.onlineStatus === 'Online' ?
      'bg-emerald-50 text-emerald-700 border border-emerald-200' :
      member.onlineStatus === 'In a meeting' ?
      'bg-amber-50 text-amber-700 border border-amber-200' :
      'bg-slate-100 text-slate-600 border border-slate-200'}` }, /*#__PURE__*/


    React.createElement("span", {
      className: `w-1 h-1 rounded-full ${
      member.onlineStatus === 'Online' ?
      'bg-emerald-500' :
      member.onlineStatus === 'In a meeting' ?
      'bg-amber-500' :
      'bg-slate-400'}` }

    ), /*#__PURE__*/
    React.createElement("span", null, member.onlineStatus)
    )
    )
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "lg:col-span-7 bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-2.5" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between pb-0.5" }, /*#__PURE__*/
    React.createElement("h3", { className: "text-xs sm:text-sm font-bold text-slate-900" }, "Tasks Activity"), /*#__PURE__*/
    React.createElement("div", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-200 text-[11px] font-semibold text-slate-600 cursor-pointer hover:bg-slate-50" }, /*#__PURE__*/
    React.createElement("span", null, "Last 7 days"), /*#__PURE__*/
    React.createElement(ChevronDown, { className: "w-2.5 h-2.5 text-slate-400" })
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "pt-1" }, /*#__PURE__*/
    React.createElement("div", { className: "h-28 flex items-end justify-between gap-2 px-1 border-b border-slate-100 pb-1.5" },
    activityDays.map((col) => {
      const maxVal = 40;
      const completedH = col.completed / maxVal * 100;
      const inProgressH = col.inProgress / maxVal * 100;
      const createdH = col.created / maxVal * 100;

      return (/*#__PURE__*/
        React.createElement("div", { key: col.day, className: "flex-1 flex flex-col items-center justify-end h-full group cursor-pointer" }, /*#__PURE__*/
        React.createElement("div", { className: "w-full max-w-[20px] flex flex-col-reverse rounded-t-md overflow-hidden transition-all duration-300 group-hover:opacity-90" }, /*#__PURE__*/
        React.createElement("div", { className: "bg-[#1e40af] w-full", style: { height: `${completedH}%` }, title: `Completed: ${col.completed}` }), /*#__PURE__*/
        React.createElement("div", { className: "bg-[#3b82f6] w-full", style: { height: `${inProgressH}%` }, title: `In Progress: ${col.inProgress}` }), /*#__PURE__*/
        React.createElement("div", { className: "bg-[#bfdbfe] w-full", style: { height: `${createdH}%` }, title: `Created: ${col.created}` })
        ), /*#__PURE__*/
        React.createElement("span", { className: "text-[9.5px] text-slate-400 font-semibold mt-1 group-hover:text-blue-600 transition" },
        col.day
        )
        ));

    })
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "flex items-center justify-center gap-4 pt-0.5 text-[11px] text-slate-600" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-1.5" }, /*#__PURE__*/
    React.createElement("span", { className: "w-2 h-2 rounded-full bg-[#1e40af]" }), /*#__PURE__*/
    React.createElement("span", { className: "font-medium" }, "Completed")
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-1.5" }, /*#__PURE__*/
    React.createElement("span", { className: "w-2 h-2 rounded-full bg-[#3b82f6]" }), /*#__PURE__*/
    React.createElement("span", { className: "font-medium" }, "In Progress")
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-1.5" }, /*#__PURE__*/
    React.createElement("span", { className: "w-2 h-2 rounded-full bg-[#bfdbfe]" }), /*#__PURE__*/
    React.createElement("span", { className: "font-medium" }, "Created")
    )
    )
    )

    ), /*#__PURE__*/


    React.createElement("div", { className: "bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between pb-0.5" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-1.5" }, /*#__PURE__*/
    React.createElement("div", { className: "w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center" }, /*#__PURE__*/
    React.createElement(FolderKanban, { className: "w-3.5 h-3.5" })
    ), /*#__PURE__*/
    React.createElement("h3", { className: "text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight" }, "Kanban Board")
    ), /*#__PURE__*/
    React.createElement("button", {
      type: "button",
      onClick: () => {
        if (projects.length > 0 && currentUser) {
          navigate(getProjectUrl(projects[0], currentUser.role));
        }
      },
      className: "text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer" }, /*#__PURE__*/

    React.createElement("span", null, "View Full Board"), /*#__PURE__*/
    React.createElement(ArrowRight, { className: "w-3 h-3" })
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 items-start" },
    kanbanColumns.map((col) => /*#__PURE__*/
    React.createElement("div", {
      key: col.id,
      className: "bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/70 space-y-2 flex flex-col justify-between min-h-[220px]" }, /*#__PURE__*/


    React.createElement("div", { className: "flex items-center justify-between pb-1.5 border-b border-slate-200/60" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-1.5" }, /*#__PURE__*/
    React.createElement("span", { className: "text-xs font-extrabold text-slate-800" }, col.name), /*#__PURE__*/
    React.createElement("span", { className: `px-1.5 py-0.2 rounded-full text-[9.5px] font-bold ${col.badgeBg}` },
    col.count
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "space-y-1.5 flex-1" },
    col.items.length === 0 ? /*#__PURE__*/
    React.createElement("div", { className: "py-6 text-center text-slate-400 text-[11px] italic" }, "No items in ",
    col.name.toLowerCase()
    ) :

    col.items.map((task) => {
      const assignee = users.find((u) => u.id === task.assigneeId);
      const isDone = task.status === 'DONE';

      return (/*#__PURE__*/
        React.createElement("div", {
          key: task.id,
          onClick: () => navigate(issuePath(task)),
          className: "bg-white p-2.5 rounded-lg border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-blue-300 transition-all cursor-pointer space-y-1.5 group" }, /*#__PURE__*/

        React.createElement("div", { className: "flex items-start gap-1.5" },
        isDone && /*#__PURE__*/
        React.createElement("div", { className: "w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5" }, /*#__PURE__*/
        React.createElement(Check, { className: "w-2 h-2" })
        ), /*#__PURE__*/

        React.createElement("p", { className: `text-xs font-bold leading-tight group-hover:text-blue-600 transition ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}` },
        task.title
        )
        ), /*#__PURE__*/

        React.createElement("div", { className: "flex items-center justify-between pt-0.5 text-[9.5px]" }, /*#__PURE__*/
        React.createElement("div", { className: "flex items-center gap-1" },
        !isDone && /*#__PURE__*/
        React.createElement("span", {
          className: `px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
          task.priority === 'CRITICAL' || task.priority === 'HIGH' ?
          'bg-rose-50 text-rose-700 border border-rose-200' :
          task.priority === 'MEDIUM' ?
          'bg-amber-50 text-amber-700 border border-amber-200' :
          'bg-emerald-50 text-emerald-700 border border-emerald-200'}` },


        task.priority
        ),

        task.dueDate && /*#__PURE__*/
        React.createElement("span", { className: "text-slate-400 flex items-center gap-0.5" }, /*#__PURE__*/
        React.createElement(CalendarIcon, { className: "w-2.5 h-2.5" }),
        formatDate(task.dueDate)
        )

        ),

        assignee && /*#__PURE__*/
        React.createElement(Avatar, { name: assignee.name, color: assignee.avatarColor, size: "xs" })

        )
        ));

    })

    ), /*#__PURE__*/


    React.createElement("button", {
      type: "button",
      onClick: () => {
        if (projects.length > 0 && currentUser) {
          navigate(getProjectUrl(projects[0], currentUser.role));
        }
      },
      className: "w-full py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200/90 text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs" }, /*#__PURE__*/

    React.createElement(Plus, { className: "w-3 h-3 text-slate-400" }), /*#__PURE__*/
    React.createElement("span", null, "Add Task")
    )
    )
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden" }, /*#__PURE__*/
    React.createElement("button", {
      type: "button",
      onClick: () => setShowAdminSection((prev) => !prev),
      className: "w-full p-2.5 px-3.5 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/70 transition cursor-pointer" }, /*#__PURE__*/

    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement(ShieldCheck, { className: "w-3.5 h-3.5 text-blue-600" }), /*#__PURE__*/
    React.createElement("h3", { className: "text-xs sm:text-sm font-bold text-slate-900" }, "Organization Activity, Audit Logs & Pending Invitations"

    ),
    pendingInvitations.length > 0 && /*#__PURE__*/
    React.createElement("span", { className: "px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200" },
    pendingInvitations.length, " Pending"
    )

    ), /*#__PURE__*/
    React.createElement(ChevronDown, {
      className: `w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
      showAdminSection ? 'rotate-180' : ''}` }

    )
    ),

    showAdminSection && /*#__PURE__*/
    React.createElement("div", { className: "p-3.5 border-t border-slate-100 space-y-4" }, /*#__PURE__*/


    React.createElement("div", { className: "space-y-2" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between pb-1 border-b border-slate-100" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-1.5" }, /*#__PURE__*/
    React.createElement(Mail, { className: "w-3.5 h-3.5 text-amber-600" }), /*#__PURE__*/
    React.createElement("h4", { className: "text-[11px] font-bold text-slate-900 uppercase tracking-wider" }, "Pending Invitations (",
    pendingInvitations.length, ")"
    )
    ),
    onCreateUser && /*#__PURE__*/
    React.createElement("button", {
      type: "button",
      onClick: onCreateUser,
      className: "text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer" },
    "+ Invite New User"

    )

    ),

    pendingInvitations.length === 0 ? /*#__PURE__*/
    React.createElement("p", { className: "text-[11px] text-slate-400 py-2 text-center italic" }, "No pending invitations. All members have active accounts."

    ) : /*#__PURE__*/

    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2" },
    pendingInvitations.map((user) => /*#__PURE__*/
    React.createElement("div", {
      key: user.id,
      className: "flex items-center justify-between gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50/50" }, /*#__PURE__*/

    React.createElement("div", { className: "flex items-center gap-2 min-w-0" }, /*#__PURE__*/
    React.createElement(Avatar, { name: user.name, color: user.avatarColor, size: "xs" }), /*#__PURE__*/
    React.createElement("div", { className: "min-w-0" }, /*#__PURE__*/
    React.createElement("p", { className: "text-xs font-bold text-slate-800 truncate" }, user.name), /*#__PURE__*/
    React.createElement("span", { className: "text-[9.5px] text-slate-400 block truncate" }, user.email)
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex items-center gap-1 flex-shrink-0" }, /*#__PURE__*/
    React.createElement(RoleBadge, { role: user.role }), /*#__PURE__*/
    React.createElement("button", {
      type: "button",
      onClick: () => {
        resendInvitation(user.id);
        toast.success(`Invitation resent to ${user.email}`);
      },
      className: "p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition cursor-pointer",
      title: "Resend invitation" }, /*#__PURE__*/

    React.createElement(RefreshCw, { className: "w-3 h-3" })
    ), /*#__PURE__*/
    React.createElement("button", {
      type: "button",
      onClick: () => setConfirmCancel({ userId: user.id, userName: user.name }),
      className: "p-1 rounded-md text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer",
      title: "Cancel invitation" }, /*#__PURE__*/

    React.createElement(Trash2, { className: "w-3 h-3" })
    )
    )
    )
    )
    )

    ), /*#__PURE__*/


    React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-3.5 pt-1 border-t border-slate-100" }, /*#__PURE__*/


    React.createElement("div", { className: "lg:col-span-7 space-y-2" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between pb-0.5" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-1.5" }, /*#__PURE__*/
    React.createElement(ActivityIcon, { className: "w-3.5 h-3.5 text-blue-600" }), /*#__PURE__*/
    React.createElement("h4", { className: "text-[11px] font-bold text-slate-900 uppercase tracking-wider" }, "Recent Activity Feed"

    )
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-1" },
    activityFilters.map((f) => /*#__PURE__*/
    React.createElement("button", {
      key: f.key,
      type: "button",
      onClick: () => setActivityFilter(f.key),
      className: `px-1.5 py-0.2 rounded text-[9.5px] font-semibold transition cursor-pointer ${
      activityFilter === f.key ?
      'bg-blue-600 text-white' :
      'text-slate-500 hover:text-slate-800 bg-slate-100'}` },


    f.label
    )
    )
    )
    ), /*#__PURE__*/
    React.createElement(ActivityFeed, { activities: filteredActivities, limit: 5 })
    ), /*#__PURE__*/


    React.createElement("div", { className: "lg:col-span-5 space-y-2" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between pb-0.5" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-1.5" }, /*#__PURE__*/
    React.createElement(ShieldCheck, { className: "w-3.5 h-3.5 text-indigo-600" }), /*#__PURE__*/
    React.createElement("h4", { className: "text-[11px] font-bold text-slate-900 uppercase tracking-wider" }, "Audit Logs"

    )
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[9.5px] text-slate-400" }, "Admin Governance")
    ), /*#__PURE__*/

    React.createElement("div", { className: "space-y-1.5" },
    auditLog.length === 0 ? /*#__PURE__*/
    React.createElement("p", { className: "text-xs text-slate-400 py-2 text-center italic" }, "No audit records found.") :

    auditLog.slice(0, 5).map((act) => {
      const actor = users.find((u) => u.id === act.userId);
      return (/*#__PURE__*/
        React.createElement("div", { key: act.id, className: "flex items-start gap-1.5 p-1.5 rounded-lg bg-slate-50/70 text-xs" }, /*#__PURE__*/
        React.createElement(Avatar, { name: actor?.name || 'System', color: actor?.avatarColor, size: "xs" }), /*#__PURE__*/
        React.createElement("div", { className: "min-w-0 flex-1" }, /*#__PURE__*/
        React.createElement("p", { className: "text-slate-800 text-[10.5px] leading-tight" }, /*#__PURE__*/
        React.createElement("span", { className: "font-bold text-slate-900" }, actor?.name || 'System'), ' ', /*#__PURE__*/
        React.createElement("span", { className: "text-slate-600" }, act.action), ' ', /*#__PURE__*/
        React.createElement("span", { className: "font-semibold text-slate-900" }, act.entityTitle)
        ), /*#__PURE__*/
        React.createElement("span", { className: "text-[9px] text-slate-400 mt-0.5 block" }, formatDate(act.createdAt))
        )
        ));

    })

    )
    )

    )

    )

    ), /*#__PURE__*/


    React.createElement(ConfirmDialog, {
      isOpen: !!confirmCancel,
      onClose: () => setConfirmCancel(null),
      onConfirm: () => {
        if (confirmCancel) {
          deactivateUser(confirmCancel.userId);
          toast.success(`Invitation cancelled for ${confirmCancel.userName}`);
        }
        setConfirmCancel(null);
      },
      title: "Cancel Invitation",
      message: `Are you sure you want to cancel the invitation for ${confirmCancel?.userName}? They will no longer be able to accept the invitation.`,
      confirmLabel: "Cancel Invitation",
      danger: true }
    )

    ));

};