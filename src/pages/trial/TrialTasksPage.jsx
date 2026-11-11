import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FileText, Plus, Filter, MoreVertical, Crown,
  CheckCircle2, Clock, AlertCircle, Lock, Search,
  LayoutList, Kanban, ChevronRight, X, ArrowUpRight,
  UserCircle2, Tag, Calendar, CheckSquare, Sparkles,
  Check, ArrowRight, CornerDownLeft, Eye, Trash2, Edit3, Circle,
  Copy, MessageSquare, Paperclip, Layers, Send } from
'lucide-react';

import { UpgradeModal } from '../../components/trial/UpgradeModal';
import { useTrialStore } from '../../store/trialStore';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';

export const TrialTasksPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { workspace, initForCurrentUser, updateTaskStatus, addTask, deleteTask } = useTrialStore();

  useEffect(() => {
    if (currentUser?.id) {
      initForCurrentUser(currentUser.id, currentUser.name, currentUser.email, currentUser.avatarColor);
    }
  }, [currentUser?.id, currentUser?.name, currentUser?.email, currentUser?.avatarColor, initForCurrentUser]);

  const tasks = workspace.workItems;
  const [searchParams, setSearchParams] = useSearchParams();
  const urlFilter = searchParams.get('filter')?.toUpperCase() || 'ALL';
  const [filter, setFilter] = useState(
    ['ALL', 'DONE', 'IN_PROGRESS', 'TODO', 'BLOCKED'].includes(urlFilter) ? urlFilter : 'ALL'
  );

  useEffect(() => {
    const f = searchParams.get('filter')?.toUpperCase();
    if (f && ['ALL', 'DONE', 'IN_PROGRESS', 'TODO', 'BLOCKED'].includes(f)) {
      setFilter(f);
    }
    const taskParam = searchParams.get('task');
    if (taskParam && tasks.length > 0) {
      const found = tasks.find((t) => t.key.toLowerCase() === taskParam.toLowerCase() || t.id === taskParam);
      if (found) setSelectedTask(found);
    }
  }, [searchParams, tasks]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    if (newFilter === 'ALL') {
      setSearchParams({});
    } else {
      setSearchParams({ filter: newFilter });
    }
  };

  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('LIST');
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskCriteria, setTaskCriteria] = useState([
  { id: 1, text: 'Elasticsearch query integration & index mapping', done: true },
  { id: 2, text: 'Debounced search auto-complete (300ms debounce)', done: true },
  { id: 3, text: 'Multi-facet filtering by category and price range', done: false }]
  );
  const [taskComment, setTaskComment] = useState('');
  const [newTaskModalOpen, setNewTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');

  // Inline quick task title state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState('Medium');

  const filteredTasks = useMemo(() => {
    return tasks.filter((item) => {
      if (filter === 'DONE' && item.status !== 'Done') return false;
      if (filter === 'IN_PROGRESS' && item.status !== 'In Progress') return false;
      if (filter === 'TODO' && item.status !== 'To Do') return false;
      if (filter === 'BLOCKED' && item.status !== 'Blocked') return false;

      if (priorityFilter !== 'ALL' && item.priority !== priorityFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchKey = item.key.toLowerCase().includes(q);
        const matchAssignee = item.assigneeName?.toLowerCase().includes(q);
        if (!matchTitle && !matchKey && !matchAssignee) return false;
      }
      return true;
    });
  }, [tasks, filter, priorityFilter, searchQuery]);

  const handleUpdateStatus = (taskId, newStatus) => {
    updateTaskStatus(taskId, newStatus);
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask((prev) => prev ? { ...prev, status: newStatus, updated: 'Just now' } : null);
    }
    toast.success(`Task status updated to ${newStatus}`);
  };

  const toggleTaskDone = (e, item) => {
    e.stopPropagation();
    const nextStatus = item.status === 'Done' ? 'To Do' : 'Done';
    handleUpdateStatus(item.id, nextStatus);
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    addTask(newTaskTitle.trim(), newTaskPriority, currentUser?.name || 'You');
    setNewTaskTitle('');
    setNewTaskModalOpen(false);
    toast.success(`✨ Created task "${newTaskTitle.trim()}" successfully!`);
  };

  const handleInlineQuickAdd = (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    addTask(quickTitle.trim(), quickPriority, currentUser?.name || 'You');
    toast.success(`✨ Added "${quickTitle.trim()}" to Sprint!`);
    setQuickTitle('');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Done':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/90';
      case 'In Progress':
        return 'bg-blue-50 text-blue-700 border-blue-200/90';
      case 'To Do':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Blocked':
        return 'bg-rose-50 text-rose-700 border-rose-200/90';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getStatusDot = (status) => {
    switch (status) {
      case 'Done':return 'bg-emerald-500';
      case 'In Progress':return 'bg-blue-500';
      case 'To Do':return 'bg-slate-400';
      case 'Blocked':return 'bg-rose-500';
      default:return 'bg-slate-400';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Low':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const counts = {
    all: tasks.length,
    done: tasks.filter((t) => t.status === 'Done').length,
    inProgress: tasks.filter((t) => t.status === 'In Progress').length,
    todo: tasks.filter((t) => t.status === 'To Do').length,
    blocked: tasks.filter((t) => t.status === 'Blocked').length
  };

  const completionPct = counts.all > 0 ? Math.round(counts.done / counts.all * 100) : 0;

  return (/*#__PURE__*/
    React.createElement("div", { className: "space-y-5 max-w-[1400px] mx-auto pb-10 font-sans animate-fade-in" }, /*#__PURE__*/

    React.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/90" }, /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2.5 flex-wrap" }, /*#__PURE__*/
    React.createElement("h1", { className: "text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display" }, "My Tasks"

    ), /*#__PURE__*/
    React.createElement("span", { className: "px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-black uppercase tracking-wider" },
    tasks.length, " Total Tasks"
    ), /*#__PURE__*/
    React.createElement("div", { className: "hidden md:flex items-center gap-2 pl-1 text-[11px] font-semibold text-slate-500" }, /*#__PURE__*/
    React.createElement("span", { className: "text-emerald-600 font-bold" }, counts.done, " Done (", completionPct, "%)"), /*#__PURE__*/
    React.createElement("span", null, "•"), /*#__PURE__*/
    React.createElement("span", { className: "text-blue-600 font-bold" }, counts.inProgress, " In Progress"),
    counts.blocked > 0 && /*#__PURE__*/
    React.createElement(React.Fragment, null, /*#__PURE__*/
    React.createElement("span", null, "•"), /*#__PURE__*/
    React.createElement("span", { className: "text-rose-600 font-bold" }, counts.blocked, " Blocked")
    )

    )
    ), /*#__PURE__*/
    React.createElement("p", { className: "text-xs text-slate-500 mt-1 font-medium" }, "Work items assigned to ",
    workspace.projectName, ". Click any task row to view details."
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex items-center gap-2.5" }, /*#__PURE__*/

    React.createElement("div", { className: "flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80" }, /*#__PURE__*/
    React.createElement("button", {
      onClick: () => setViewMode('LIST'),
      className: `p-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
      viewMode === 'LIST' ?
      'bg-white text-teal-900 shadow-2xs font-extrabold' :
      'text-slate-500 hover:text-slate-900'}`,

      title: "Table view" }, /*#__PURE__*/

    React.createElement(LayoutList, { className: "w-3.5 h-3.5" }), /*#__PURE__*/
    React.createElement("span", null, "Table")
    ), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => setViewMode('BOARD'),
      className: `p-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
      viewMode === 'BOARD' ?
      'bg-white text-teal-900 shadow-2xs font-extrabold' :
      'text-slate-500 hover:text-slate-900'}`,

      title: "Board view" }, /*#__PURE__*/

    React.createElement(Kanban, { className: "w-3.5 h-3.5" }), /*#__PURE__*/
    React.createElement("span", null, "Board")
    )
    ), /*#__PURE__*/

    React.createElement("button", {
      onClick: () => setNewTaskModalOpen(true),
      className: "px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-xs hover:shadow-md cursor-pointer" }, /*#__PURE__*/

    React.createElement(Plus, { className: "w-4 h-4 stroke-[2.5]" }), /*#__PURE__*/
    React.createElement("span", null, "New Task")
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs space-y-3" }, /*#__PURE__*/
    React.createElement("div", { className: "flex flex-col lg:flex-row lg:items-center justify-between gap-3" }, /*#__PURE__*/

    React.createElement("div", { className: "flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5" }, /*#__PURE__*/
    React.createElement("button", {
      onClick: () => handleFilterChange('ALL'),
      className: `px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
      filter === 'ALL' ?
      'bg-slate-900 text-white shadow-2xs' :
      'text-slate-600 hover:bg-slate-100'}` }, /*#__PURE__*/


    React.createElement("span", null, "All"), /*#__PURE__*/
    React.createElement("span", { className: `px-1.5 py-0.2 rounded-full text-[10px] ${filter === 'ALL' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'}` },
    counts.all
    )
    ), /*#__PURE__*/

    React.createElement("button", {
      onClick: () => handleFilterChange('IN_PROGRESS'),
      className: `px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
      filter === 'IN_PROGRESS' ?
      'bg-blue-600 text-white shadow-2xs' :
      'text-slate-600 hover:bg-blue-50/70'}` }, /*#__PURE__*/


    React.createElement("span", { className: `w-1.5 h-1.5 rounded-full ${filter === 'IN_PROGRESS' ? 'bg-white' : 'bg-blue-500'}` }), /*#__PURE__*/
    React.createElement("span", null, "In Progress"), /*#__PURE__*/
    React.createElement("span", { className: `px-1.5 py-0.2 rounded-full text-[10px] ${filter === 'IN_PROGRESS' ? 'bg-blue-700 text-blue-100' : 'bg-blue-50 text-blue-700 border border-blue-200'}` },
    counts.inProgress
    )
    ), /*#__PURE__*/

    React.createElement("button", {
      onClick: () => handleFilterChange('DONE'),
      className: `px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
      filter === 'DONE' ?
      'bg-emerald-600 text-white shadow-2xs' :
      'text-slate-600 hover:bg-emerald-50/70'}` }, /*#__PURE__*/


    React.createElement("span", { className: `w-1.5 h-1.5 rounded-full ${filter === 'DONE' ? 'bg-white' : 'bg-emerald-500'}` }), /*#__PURE__*/
    React.createElement("span", null, "Done"), /*#__PURE__*/
    React.createElement("span", { className: `px-1.5 py-0.2 rounded-full text-[10px] ${filter === 'DONE' ? 'bg-emerald-700 text-emerald-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}` },
    counts.done
    )
    ), /*#__PURE__*/

    React.createElement("button", {
      onClick: () => handleFilterChange('TODO'),
      className: `px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
      filter === 'TODO' ?
      'bg-slate-700 text-white shadow-2xs' :
      'text-slate-600 hover:bg-slate-100'}` }, /*#__PURE__*/


    React.createElement("span", { className: `w-1.5 h-1.5 rounded-full ${filter === 'TODO' ? 'bg-white' : 'bg-slate-400'}` }), /*#__PURE__*/
    React.createElement("span", null, "To Do"), /*#__PURE__*/
    React.createElement("span", { className: `px-1.5 py-0.2 rounded-full text-[10px] ${filter === 'TODO' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'}` },
    counts.todo
    )
    ), /*#__PURE__*/

    React.createElement("button", {
      onClick: () => handleFilterChange('BLOCKED'),
      className: `px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
      filter === 'BLOCKED' ?
      'bg-rose-600 text-white shadow-2xs' :
      'text-slate-600 hover:bg-rose-50/70'}` }, /*#__PURE__*/


    React.createElement("span", { className: `w-1.5 h-1.5 rounded-full ${filter === 'BLOCKED' ? 'bg-white' : 'bg-rose-500'}` }), /*#__PURE__*/
    React.createElement("span", null, "Blocked"), /*#__PURE__*/
    React.createElement("span", { className: `px-1.5 py-0.2 rounded-full text-[10px] ${filter === 'BLOCKED' ? 'bg-rose-700 text-rose-100' : 'bg-rose-50 text-rose-700 border border-rose-200'}` },
    counts.blocked
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("select", {
      value: priorityFilter,
      onChange: (e) => setPriorityFilter(e.target.value),
      className: "bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 py-1.5 px-2.5 rounded-xl focus:outline-none focus:border-teal-500 cursor-pointer" }, /*#__PURE__*/

    React.createElement("option", { value: "ALL" }, "All Priorities"), /*#__PURE__*/
    React.createElement("option", { value: "High" }, "High Priority"), /*#__PURE__*/
    React.createElement("option", { value: "Medium" }, "Medium Priority"), /*#__PURE__*/
    React.createElement("option", { value: "Low" }, "Low Priority")
    ), /*#__PURE__*/

    React.createElement("div", { className: "relative w-full sm:w-60" }, /*#__PURE__*/
    React.createElement(Search, { className: "w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" }), /*#__PURE__*/
    React.createElement("input", {
      type: "text",
      placeholder: "Search by title, key, or assignee...",
      value: searchQuery,
      onChange: (e) => setSearchQuery(e.target.value),
      className: "w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-all font-medium" }
    ),
    searchQuery && /*#__PURE__*/
    React.createElement("button", {
      onClick: () => setSearchQuery(''),
      className: "absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer" }, /*#__PURE__*/

    React.createElement(X, { className: "w-3 h-3" })
    )

    )
    )
    )
    ),


    viewMode === 'LIST' ? /*#__PURE__*/
    React.createElement("div", { className: "bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden" }, /*#__PURE__*/

    React.createElement("form", {
      onSubmit: handleInlineQuickAdd,
      className: "p-3 bg-teal-50/25 border-b border-slate-200/80 flex items-center gap-2 flex-wrap sm:flex-nowrap" }, /*#__PURE__*/

    React.createElement("div", { className: "relative flex-1 min-w-[200px]" }, /*#__PURE__*/
    React.createElement(Plus, { className: "w-3.5 h-3.5 text-teal-600 absolute left-3 top-1/2 -translate-y-1/2" }), /*#__PURE__*/
    React.createElement("input", {
      type: "text",
      placeholder: "+ Quickly type a new work item and press Enter...",
      value: quickTitle,
      onChange: (e) => setQuickTitle(e.target.value),
      className: "w-full h-8 pl-8 pr-3 text-xs bg-white border border-slate-200/90 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium" }
    )
    ), /*#__PURE__*/
    React.createElement("select", {
      value: quickPriority,
      onChange: (e) => setQuickPriority(e.target.value),
      className: "h-8 px-2 text-xs bg-white border border-slate-200/90 rounded-xl text-slate-700 font-bold focus:outline-none cursor-pointer" }, /*#__PURE__*/

    React.createElement("option", { value: "High" }, "High Priority"), /*#__PURE__*/
    React.createElement("option", { value: "Medium" }, "Medium Priority"), /*#__PURE__*/
    React.createElement("option", { value: "Low" }, "Low Priority")
    ), /*#__PURE__*/
    React.createElement("button", {
      type: "submit",
      className: "h-8 px-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs transition cursor-pointer shadow-2xs shrink-0 flex items-center gap-1" }, /*#__PURE__*/

    React.createElement("span", null, "Add"), /*#__PURE__*/
    React.createElement(CornerDownLeft, { className: "w-3 h-3 opacity-70" })
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "overflow-x-auto" }, /*#__PURE__*/
    React.createElement("table", { className: "w-full text-left text-xs" }, /*#__PURE__*/
    React.createElement("thead", null, /*#__PURE__*/
    React.createElement("tr", { className: "bg-slate-50/80 border-b border-slate-100 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider" }, /*#__PURE__*/
    React.createElement("th", { className: "py-3 px-4 w-12 text-center" }, "Done"), /*#__PURE__*/
    React.createElement("th", { className: "py-3 px-4" }, "Issue Key"), /*#__PURE__*/
    React.createElement("th", { className: "py-3 px-4" }, "Summary"), /*#__PURE__*/
    React.createElement("th", { className: "py-3 px-4" }, "Status"), /*#__PURE__*/
    React.createElement("th", { className: "py-3 px-4" }, "Priority"), /*#__PURE__*/
    React.createElement("th", { className: "py-3 px-4" }, "Assignee"), /*#__PURE__*/
    React.createElement("th", { className: "py-3 px-4" }, "Updated"), /*#__PURE__*/
    React.createElement("th", { className: "py-3 px-4 text-right w-12" })
    )
    ), /*#__PURE__*/
    React.createElement("tbody", { className: "divide-y divide-slate-100 font-medium" },
    filteredTasks.length === 0 ? /*#__PURE__*/
    React.createElement("tr", null, /*#__PURE__*/
    React.createElement("td", { colSpan: 8, className: "py-14 text-center text-slate-400" }, /*#__PURE__*/
    React.createElement("div", { className: "max-w-xs mx-auto space-y-2" }, /*#__PURE__*/
    React.createElement(CheckCircle2, { className: "w-8 h-8 text-slate-300 mx-auto" }), /*#__PURE__*/
    React.createElement("p", { className: "font-bold text-slate-600 text-sm" }, "No tasks found"), /*#__PURE__*/
    React.createElement("p", { className: "text-xs text-slate-400" }, "Try clearing filters or add a new task to your sprint."

    )
    )
    )
    ) :

    filteredTasks.map((item) => {
      const isDone = item.status === 'Done';
      return (/*#__PURE__*/
        React.createElement("tr", {
          key: item.id,
          onClick: () => setSelectedTask(item),
          className: `transition-colors cursor-pointer group ${
          isDone ? 'bg-slate-50/40 hover:bg-slate-100/60' : 'hover:bg-teal-50/30'}` }, /*#__PURE__*/



        React.createElement("td", { className: "py-3 px-4 text-center", onClick: (e) => toggleTaskDone(e, item) }, /*#__PURE__*/
        React.createElement("button", {
          type: "button",
          className: `w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-pointer mx-auto ${
          isDone ?
          'bg-emerald-500 text-white shadow-2xs scale-105' :
          'border-2 border-slate-300 hover:border-emerald-500 text-transparent hover:text-emerald-500 hover:bg-emerald-50/50'}`,

          title: isDone ? 'Click to mark as Incomplete' : 'Click to mark as Done' }, /*#__PURE__*/

        React.createElement(Check, { className: "w-3 h-3 stroke-[3]" })
        )
        ), /*#__PURE__*/


        React.createElement("td", { className: "py-3 px-4 whitespace-nowrap" }, /*#__PURE__*/
        React.createElement("div", { className: "flex items-center gap-1.5" }, /*#__PURE__*/
        React.createElement(FileText, { className: `w-3.5 h-3.5 ${isDone ? 'text-slate-400' : 'text-teal-600'}` }), /*#__PURE__*/
        React.createElement("span", { className: "font-mono font-black text-[11px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/80" },
        item.key
        )
        )
        ), /*#__PURE__*/


        React.createElement("td", { className: "py-3 px-4 max-w-[340px]" }, /*#__PURE__*/
        React.createElement("div", { className: "space-y-0.5" }, /*#__PURE__*/
        React.createElement("span", {
          className: `font-bold block truncate transition-colors ${
          isDone ?
          'line-through text-slate-400' :
          'text-slate-900 group-hover:text-teal-700'}` },


        item.title
        ), /*#__PURE__*/
        React.createElement("span", { className: "text-[10px] text-slate-400 font-normal" }, "Sprint 1 • Core Feature"

        )
        )
        ), /*#__PURE__*/


        React.createElement("td", { className: "py-3 px-4 whitespace-nowrap" }, /*#__PURE__*/
        React.createElement("span", {
          className: `inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-black border ${getStatusBadge(
            item.status
          )}` }, /*#__PURE__*/

        React.createElement("span", { className: `w-1.5 h-1.5 rounded-full ${getStatusDot(item.status)}` }),
        item.status
        )
        ), /*#__PURE__*/


        React.createElement("td", { className: "py-3 px-4 whitespace-nowrap" }, /*#__PURE__*/
        React.createElement("span", {
          className: `px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${getPriorityBadge(
            item.priority
          )}` },

        item.priority
        )
        ), /*#__PURE__*/


        React.createElement("td", { className: "py-3 px-4 whitespace-nowrap" },
        item.assigneeName ? /*#__PURE__*/
        React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
        React.createElement("div", {
          className: "w-6 h-6 rounded-lg text-white font-black text-[9px] flex items-center justify-center shadow-2xs",
          style: { backgroundColor: item.assigneeColor || '#0d9488' } },

        item.assigneeInitials
        ), /*#__PURE__*/
        React.createElement("span", { className: "text-slate-700 font-semibold text-[11px]" },
        item.assigneeName
        )
        ) : /*#__PURE__*/

        React.createElement("span", { className: "text-slate-400 italic text-[11px]" }, "Unassigned")

        ), /*#__PURE__*/


        React.createElement("td", { className: "py-3 px-4 whitespace-nowrap text-slate-400 text-[11px] font-medium" },
        item.updated
        ), /*#__PURE__*/


        React.createElement("td", { className: "py-3 px-4 whitespace-nowrap text-right", onClick: (e) => e.stopPropagation() }, /*#__PURE__*/
        React.createElement("button", {
          onClick: () => setSelectedTask(item),
          className: "p-1.5 text-slate-400 hover:text-teal-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors",
          title: "Inspect task details" }, /*#__PURE__*/

        React.createElement(ChevronRight, { className: "w-4 h-4 group-hover:translate-x-0.5 transition-transform" })
        )
        )
        ));

    })

    )
    )
    )
    ) : /*#__PURE__*/

    /* Board View (Enhanced Mini Kanban) */
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4" },
    ['To Do', 'In Progress', 'Done', 'Blocked'].map((colStatus) => {
      const colTasks = filteredTasks.filter((t) => t.status === colStatus);
      return (/*#__PURE__*/
        React.createElement("div", { key: colStatus, className: "bg-slate-50/90 rounded-3xl p-3.5 border border-slate-200/90 space-y-3 shadow-2xs flex flex-col" }, /*#__PURE__*/
        React.createElement("div", { className: "flex items-center justify-between pb-2 border-b border-slate-200/80 font-bold text-xs" }, /*#__PURE__*/
        React.createElement("div", { className: "flex items-center gap-1.5 text-slate-800" }, /*#__PURE__*/
        React.createElement("span", { className: `w-2 h-2 rounded-full ${getStatusDot(colStatus)}` }), /*#__PURE__*/
        React.createElement("span", { className: "font-black" }, colStatus)
        ), /*#__PURE__*/
        React.createElement("span", { className: "px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 text-[10px] font-black shadow-2xs" },
        colTasks.length
        )
        ), /*#__PURE__*/

        React.createElement("div", { className: "space-y-2.5 flex-1" },
        colTasks.length === 0 ? /*#__PURE__*/
        React.createElement("div", { className: "py-8 text-center text-slate-400 text-xs italic" }, "No tasks in this column"

        ) :

        colTasks.map((task) => /*#__PURE__*/
        React.createElement("div", {
          key: task.id,
          onClick: () => setSelectedTask(task),
          className: "bg-white rounded-2xl p-3.5 border border-slate-200/90 hover:border-teal-400 shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-2.5 group" }, /*#__PURE__*/

        React.createElement("div", { className: "flex items-center justify-between" }, /*#__PURE__*/
        React.createElement("span", { className: "font-mono text-[10px] font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200" },
        task.key
        ), /*#__PURE__*/
        React.createElement("span", { className: `px-2 py-0.5 rounded text-[9px] font-black border ${getPriorityBadge(task.priority)}` },
        task.priority
        )
        ), /*#__PURE__*/

        React.createElement("h4", { className: "text-xs font-bold text-slate-900 line-clamp-2 group-hover:text-teal-700 transition-colors" },
        task.title
        ), /*#__PURE__*/

        React.createElement("div", { className: "flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400" }, /*#__PURE__*/
        React.createElement("span", { className: "font-medium" }, task.updated),
        task.assigneeInitials && /*#__PURE__*/
        React.createElement("div", { className: "w-5 h-5 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-[9px] shadow-2xs" },
        task.assigneeInitials
        )

        )
        )
        )

        )
        ));

    })
    ),



    selectedTask && /*#__PURE__*/
    React.createElement("div", {
      className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in",
      onClick: () => setSelectedTask(null) }, /*#__PURE__*/

    React.createElement("div", {
      className: "relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150",
      onClick: (e) => e.stopPropagation() }, /*#__PURE__*/


    React.createElement("div", { className: "flex items-center justify-between px-6 py-3.5 bg-slate-50/90 border-b border-slate-200/80" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2 text-xs text-slate-500 font-medium" }, /*#__PURE__*/
    React.createElement("span", { className: "font-semibold text-slate-700" }, workspace.projectName), /*#__PURE__*/
    React.createElement("span", null, "/"), /*#__PURE__*/
    React.createElement("span", { className: "text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60" }, "Sprint 1"

    ), /*#__PURE__*/
    React.createElement("span", null, "/"), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => {
        navigator.clipboard?.writeText(selectedTask.key);
        toast.success(`Copied ${selectedTask.key} to clipboard!`);
      },
      className: "inline-flex items-center gap-1 font-mono font-black text-xs text-teal-800 bg-white hover:bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 transition-colors cursor-pointer group shadow-2xs",
      title: "Click to copy key" }, /*#__PURE__*/

    React.createElement("span", null, selectedTask.key), /*#__PURE__*/
    React.createElement(Copy, { className: "w-3 h-3 text-teal-600 group-hover:scale-110 transition-transform" })
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex items-center gap-1.5" }, /*#__PURE__*/
    React.createElement("button", {
      onClick: () => {
        deleteTask(selectedTask.id);
        setSelectedTask(null);
        toast.success('Task removed');
      },
      className: "p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer",
      title: "Delete task" }, /*#__PURE__*/

    React.createElement(Trash2, { className: "w-4 h-4" })
    ), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => setSelectedTask(null),
      className: "p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer",
      title: "Close (Esc)" }, /*#__PURE__*/

    React.createElement(X, { className: "w-4 h-4" })
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100" }, /*#__PURE__*/

    React.createElement("div", { className: "md:col-span-7 p-6 space-y-6" }, /*#__PURE__*/

    React.createElement("div", { className: "space-y-2" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("span", { className: "inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-md" }, /*#__PURE__*/
    React.createElement(FileText, { className: "w-3 h-3 text-teal-600" }), "Task"

    ), /*#__PURE__*/
    React.createElement("span", { className: `px-2 py-0.5 rounded-md text-[10px] font-black border ${getStatusBadge(selectedTask.status)}` },
    selectedTask.status
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] text-slate-400 ml-auto" }, "Updated ",
    selectedTask.updated || 'Recently'
    )
    ), /*#__PURE__*/

    React.createElement("h1", { className: "text-xl font-black text-slate-900 tracking-tight leading-snug" },
    selectedTask.title
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "space-y-2" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between text-xs font-bold text-slate-700" }, /*#__PURE__*/
    React.createElement("span", { className: "flex items-center gap-1.5" }, /*#__PURE__*/
    React.createElement(Edit3, { className: "w-3.5 h-3.5 text-teal-600" }), "Description"

    )
    ), /*#__PURE__*/
    React.createElement("div", { className: "text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 font-normal" }, "Core deliverable for ", /*#__PURE__*/
    React.createElement("strong", { className: "font-bold text-slate-900" }, workspace.projectName), " under Iteration 1. All unit tests and acceptance criteria must pass before final QA sign-off."
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "space-y-3" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between" }, /*#__PURE__*/
    React.createElement("span", { className: "text-xs font-bold text-slate-800 flex items-center gap-1.5" }, /*#__PURE__*/
    React.createElement(CheckSquare, { className: "w-3.5 h-3.5 text-teal-600" }), "Acceptance Criteria"

    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] font-bold text-slate-400" },
    taskCriteria.filter((c) => c.done).length, " of ", taskCriteria.length, " completed"
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "w-full h-1.5 bg-slate-100 rounded-full overflow-hidden" }, /*#__PURE__*/
    React.createElement("div", {
      className: "h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-300",
      style: {
        width: `${taskCriteria.filter((c) => c.done).length / taskCriteria.length * 100}%`
      } }
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "space-y-2" },
    taskCriteria.map((criterion) => /*#__PURE__*/
    React.createElement("div", {
      key: criterion.id,
      onClick: () => {
        setTaskCriteria((prev) =>
        prev.map((c) =>
        c.id === criterion.id ? { ...c, done: !c.done } : c
        )
        );
      },
      className: `flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
      criterion.done ?
      'bg-teal-50/40 border-teal-200/80 text-slate-600' :
      'bg-white border-slate-200 hover:border-slate-300 text-slate-800'}` }, /*#__PURE__*/


    React.createElement("div", {
      className: `w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border transition-colors ${
      criterion.done ?
      'bg-teal-600 border-teal-600 text-white' :
      'border-slate-300 bg-white'}` },


    criterion.done && /*#__PURE__*/React.createElement(Check, { className: "w-3 h-3 stroke-[3]" })
    ), /*#__PURE__*/
    React.createElement("span", { className: `leading-relaxed ${criterion.done ? 'line-through text-slate-400' : 'font-medium'}` },
    criterion.text
    )
    )
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "space-y-2 pt-2 border-t border-slate-100" }, /*#__PURE__*/
    React.createElement("span", { className: "text-xs font-bold text-slate-700 flex items-center gap-1.5" }, /*#__PURE__*/
    React.createElement(MessageSquare, { className: "w-3.5 h-3.5 text-teal-600" }), "Activity & Notes"

    ), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("div", { className: "w-7 h-7 rounded-full bg-teal-600 text-white font-black text-xs flex items-center justify-center shrink-0" },
    currentUser?.name?.charAt(0) || 'U'
    ), /*#__PURE__*/
    React.createElement("div", { className: "relative flex-1" }, /*#__PURE__*/
    React.createElement("input", {
      type: "text",
      placeholder: "Leave a comment or sprint update...",
      value: taskComment,
      onChange: (e) => setTaskComment(e.target.value),
      onKeyDown: (e) => {
        if (e.key === 'Enter' && taskComment.trim()) {
          toast.success('Comment added to task');
          setTaskComment('');
        }
      },
      className: "w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-all font-medium" }
    ), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => {
        if (taskComment.trim()) {
          toast.success('Comment added to task');
          setTaskComment('');
        }
      },
      disabled: !taskComment.trim(),
      className: "absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-teal-600 hover:bg-teal-50 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer" }, /*#__PURE__*/

    React.createElement(Send, { className: "w-3.5 h-3.5" })
    )
    )
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "md:col-span-5 p-6 space-y-5 bg-slate-50/50" }, /*#__PURE__*/

    React.createElement("div", { className: "space-y-2" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] font-bold text-slate-400 uppercase tracking-wider block" }, "Status"

    ), /*#__PURE__*/
    React.createElement("div", { className: "grid grid-cols-2 gap-1.5" },
    ['To Do', 'In Progress', 'Done', 'Blocked'].map((st) => {
      const isActive = selectedTask.status === st;
      const colorMap = {
        'To Do': isActive ? 'bg-slate-700 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200',
        'In Progress': isActive ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-blue-700 hover:bg-blue-50 border border-slate-200',
        'Done': isActive ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-slate-200',
        'Blocked': isActive ? 'bg-rose-600 text-white shadow-xs' : 'bg-white text-rose-700 hover:bg-rose-50 border border-slate-200'
      };

      return (/*#__PURE__*/
        React.createElement("button", {
          key: st,
          onClick: () => handleUpdateStatus(selectedTask.id, st),
          className: `py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${colorMap[st]}` }, /*#__PURE__*/

        React.createElement("span", {
          className: `w-1.5 h-1.5 rounded-full ${
          isActive ? 'bg-white' : st === 'Done' ? 'bg-emerald-500' : st === 'In Progress' ? 'bg-blue-500' : st === 'Blocked' ? 'bg-rose-500' : 'bg-slate-400'}` }

        ),
        st
        ));

    })
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "space-y-2" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] font-bold text-slate-400 uppercase tracking-wider block" }, "Assignee"

    ), /*#__PURE__*/
    React.createElement("div", { className: "bg-white p-3 rounded-2xl border border-slate-200/80 flex items-center gap-3 shadow-2xs" }, /*#__PURE__*/
    React.createElement("div", { className: "w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs" },
    selectedTask.assigneeName ? selectedTask.assigneeName.split(' ').map((n) => n[0]).join('') : 'U'
    ), /*#__PURE__*/
    React.createElement("div", { className: "min-w-0 flex-1" }, /*#__PURE__*/
    React.createElement("div", { className: "font-bold text-xs text-slate-900 truncate" },
    selectedTask.assigneeName || 'Unassigned'
    ), /*#__PURE__*/
    React.createElement("div", { className: "text-[10px] text-slate-400 font-medium" }, "Sprint Contributor")
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "space-y-2" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] font-bold text-slate-400 uppercase tracking-wider block" }, "Priority"

    ), /*#__PURE__*/
    React.createElement("div", { className: "bg-white p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between shadow-2xs" }, /*#__PURE__*/
    React.createElement("span", { className: "text-xs font-bold text-slate-700" }, "Urgency Level"), /*#__PURE__*/
    React.createElement("span", { className: `px-2.5 py-1 rounded-lg text-xs font-black border ${getPriorityBadge(selectedTask.priority)}` },
    selectedTask.priority
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "space-y-2" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] font-bold text-slate-400 uppercase tracking-wider block" }, "Sprint Cadence"

    ), /*#__PURE__*/
    React.createElement("div", { className: "bg-white p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between shadow-2xs text-xs" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2 font-bold text-slate-800" }, /*#__PURE__*/
    React.createElement(Calendar, { className: "w-4 h-4 text-teal-600" }), /*#__PURE__*/
    React.createElement("span", null, "Iteration 1")
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200" }, "Active"

    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "space-y-2 pt-2 border-t border-slate-200/60" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1" }, /*#__PURE__*/
    React.createElement(Lock, { className: "w-3 h-3 text-amber-500" }), "Pro Fields Preview"

    ), /*#__PURE__*/
    React.createElement("div", { className: "grid grid-cols-2 gap-2 text-[11px]" }, /*#__PURE__*/
    React.createElement("div", { className: "bg-white/80 p-2.5 rounded-xl border border-slate-200/60 text-slate-500" }, /*#__PURE__*/
    React.createElement("div", { className: "text-[10px] text-slate-400" }, "Story Points"), /*#__PURE__*/
    React.createElement("div", { className: "font-bold text-slate-700 flex items-center gap-1 mt-0.5" }, /*#__PURE__*/
    React.createElement("span", null, "5 Pts"), /*#__PURE__*/
    React.createElement("span", { className: "text-[9px] font-black text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200" }, "PRO")
    )
    ), /*#__PURE__*/
    React.createElement("div", { className: "bg-white/80 p-2.5 rounded-xl border border-slate-200/60 text-slate-500" }, /*#__PURE__*/
    React.createElement("div", { className: "text-[10px] text-slate-400" }, "Time Estimate"), /*#__PURE__*/
    React.createElement("div", { className: "font-bold text-slate-700 flex items-center gap-1 mt-0.5" }, /*#__PURE__*/
    React.createElement("span", null, "6.5 Hours"), /*#__PURE__*/
    React.createElement("span", { className: "text-[9px] font-black text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200" }, "PRO")
    )
    )
    )
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "bg-gradient-to-r from-amber-50 via-amber-100/50 to-teal-50 border-t border-amber-200/80 px-6 py-3.5 flex items-center justify-between gap-4" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2.5" }, /*#__PURE__*/
    React.createElement("div", { className: "w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0" }, /*#__PURE__*/
    React.createElement(Crown, { className: "w-4 h-4 text-amber-600 fill-amber-500/30" })
    ), /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("div", { className: "text-xs font-black text-amber-950" }, "Unlock Story Points, File Attachments & Time Tracking"

    ), /*#__PURE__*/
    React.createElement("div", { className: "text-[11px] text-amber-800/80 font-medium" }, "Upgrade to Pro Pack for complete agile customization & multi-sprint workflows."

    )
    )
    ), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => {
        setSelectedTask(null);
        setUpgradeOpen(true);
      },
      className: "px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-xs rounded-xl shrink-0 cursor-pointer shadow-xs transition-transform hover:scale-[1.02]" },
    "Upgrade to Pro"

    )
    )
    )
    ),



    newTaskModalOpen && /*#__PURE__*/
    React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in" }, /*#__PURE__*/
    React.createElement("div", { className: "relative w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-6 space-y-4" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between pb-3 border-b border-slate-100" }, /*#__PURE__*/
    React.createElement("h3", { className: "text-base font-black text-slate-900 flex items-center gap-2" }, /*#__PURE__*/
    React.createElement(Plus, { className: "w-4 h-4 text-teal-600" }), "Create Task"

    ), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => setNewTaskModalOpen(false),
      className: "p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer" }, /*#__PURE__*/

    React.createElement(X, { className: "w-4 h-4" })
    )
    ), /*#__PURE__*/

    React.createElement("form", { onSubmit: handleCreateTask, className: "space-y-4" }, /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "Task Title ", /*#__PURE__*/
    React.createElement("span", { className: "text-rose-500" }, "*")
    ), /*#__PURE__*/
    React.createElement("input", {
      type: "text",
      required: true,
      placeholder: "e.g., Setup Stripe webhook handler",
      value: newTaskTitle,
      onChange: (e) => setNewTaskTitle(e.target.value),
      className: "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white font-medium" }
    )
    ), /*#__PURE__*/

    React.createElement("div", null, /*#__PURE__*/
    React.createElement("label", { className: "text-xs font-bold text-slate-700 block mb-1" }, "Priority"

    ), /*#__PURE__*/
    React.createElement("select", {
      value: newTaskPriority,
      onChange: (e) => setNewTaskPriority(e.target.value),
      className: "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-bold" }, /*#__PURE__*/

    React.createElement("option", { value: "High" }, "High Priority"), /*#__PURE__*/
    React.createElement("option", { value: "Medium" }, "Medium Priority"), /*#__PURE__*/
    React.createElement("option", { value: "Low" }, "Low Priority")
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "pt-2 flex items-center justify-end gap-2" }, /*#__PURE__*/
    React.createElement("button", {
      type: "button",
      onClick: () => setNewTaskModalOpen(false),
      className: "px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer" },
    "Cancel"

    ), /*#__PURE__*/
    React.createElement("button", {
      type: "submit",
      className: "px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-xs cursor-pointer shadow-xs" },
    "Create Task"

    )
    )
    )
    )
    ), /*#__PURE__*/


    React.createElement(UpgradeModal, {
      isOpen: upgradeOpen,
      onClose: () => setUpgradeOpen(false) }
    )
    ));

};