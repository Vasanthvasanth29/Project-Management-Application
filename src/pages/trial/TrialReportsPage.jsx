import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, Download, Crown, Lock, CheckCircle2,
  PieChart as PieIcon, TrendingUp, FileText, ArrowRight,
  Calendar, Layers, Sparkles, Filter, Check, Clock, User,
  ArrowUpRight, AlertCircle, ChevronDown, Activity, Flame } from
'lucide-react';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend } from
'recharts';
import { UpgradeModal } from '../../components/trial/UpgradeModal';
import { useTrialStore } from '../../store/trialStore';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';

export const TrialReportsPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { workspace, initForCurrentUser, getStats, getStatusBreakdown, getTrendData } = useTrialStore();

  useEffect(() => {
    if (currentUser?.id) {
      initForCurrentUser(currentUser.id, currentUser.name, currentUser.email, currentUser.avatarColor);
    }
  }, [currentUser?.id, currentUser?.name, currentUser?.email, currentUser?.avatarColor, initForCurrentUser]);

  const stats = getStats();
  const statusBreakdown = getStatusBreakdown();
  const trendData = getTrendData();
  const completionRate = stats.totalTasks > 0 ? Math.round(stats.completedTasks / stats.totalTasks * 100) : 0;

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState('Last 7 Days');
  const [chartView, setChartView] = useState('VELOCITY');

  // Real CSV export
  const handleExportCSV = () => {
    try {
      const headers = 'Key,Title,Status,Priority,Assignee,Updated\n';
      const rows = workspace.workItems.
      map(
        (w) =>
        `"${w.key}","${w.title.replace(/"/g, '""')}","${w.status}","${w.priority}","${w.assigneeName || 'Unassigned'}","${w.updated}"`
      ).
      join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${workspace.projectKey || 'TRIAL'}_Sprint_Report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`📊 ${workspace.projectKey || 'TRIAL'}_Sprint_Report.csv exported successfully!`);
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  // Executive PDF export simulation
  const handleExportPDF = () => {
    toast.success(`📄 Generating Executive PDF report for ${workspace.projectName}...`, {
      description: 'Sprint delivery health, velocity breakdown & team allocation included.'
    });
    setTimeout(() => {
      window.print();
    }, 600);
  };

  // Burndown chart data calculation
  const burndownData = useMemo(() => {
    const total = stats.totalTasks || 12;
    return [
    { day: 'Day 1', ideal: total, actual: total },
    { day: 'Day 2', ideal: Math.round(total * 0.83), actual: total - 1 },
    { day: 'Day 3', ideal: Math.round(total * 0.66), actual: total - 2 },
    { day: 'Day 4', ideal: Math.round(total * 0.5), actual: total - 3 },
    { day: 'Day 5', ideal: Math.round(total * 0.33), actual: total - 4 },
    { day: 'Day 6', ideal: Math.round(total * 0.16), actual: stats.totalTasks - stats.completedTasks },
    { day: 'Today', ideal: 0, actual: stats.totalTasks - stats.completedTasks }];

  }, [stats.totalTasks, stats.completedTasks]);

  // Dynamic team member allocation
  const teamMembers = useMemo(() => {
    const membersMap = {};

    workspace.workItems.forEach((item) => {
      const name = item.assigneeName || currentUser?.name || 'John Doe';
      const initials = item.assigneeInitials || name.slice(0, 2).toUpperCase();
      const color = item.assigneeColor || '#2563eb';

      if (!membersMap[name]) {
        membersMap[name] = {
          name,
          initials,
          color,
          role: name === currentUser?.name ? 'Lead Developer' : 'Senior Software Engineer',
          assigned: 0,
          done: 0,
          inProgress: 0
        };
      }
      membersMap[name].assigned += 1;
      if (item.status === 'Done') membersMap[name].done += 1;
      if (item.status === 'In Progress') membersMap[name].inProgress += 1;
    });

    const list = Object.values(membersMap);
    if (list.length === 0) {
      return [
      { name: 'John Doe', initials: 'JD', color: '#2563eb', role: 'Fullstack Engineer', assigned: 8, done: 4, inProgress: 3 },
      { name: 'Alex Smith', initials: 'AS', color: '#7c3aed', role: 'Senior UI/UX Dev', assigned: 4, done: 1, inProgress: 1 }];

    }
    return list;
  }, [workspace.workItems, currentUser?.name]);

  return (/*#__PURE__*/
    React.createElement("div", { className: "space-y-5 max-w-[1400px] mx-auto pb-10 font-sans animate-fade-in" }, /*#__PURE__*/

    React.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/90" }, /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2.5" }, /*#__PURE__*/
    React.createElement("h1", { className: "text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display" }, "Reports & Analytics"

    ), /*#__PURE__*/
    React.createElement("span", { className: "px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-[10px] font-black uppercase tracking-wider" }, "Active Sprint"

    ), /*#__PURE__*/
    React.createElement("span", { className: "hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full" }, /*#__PURE__*/
    React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-500" }),
    workspace.projectName, " (Iteration 1)"
    )
    ), /*#__PURE__*/
    React.createElement("p", { className: "text-xs text-slate-500 mt-1 font-medium" }, "Real-time delivery KPIs, team velocity, throughput trends, and sprint health."

    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex items-center gap-2.5" }, /*#__PURE__*/
    React.createElement("button", {
      onClick: handleExportCSV,
      className: "px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:shadow-xs",
      title: "Download formatted CSV dataset" }, /*#__PURE__*/

    React.createElement(Download, { className: "w-3.5 h-3.5 text-slate-500" }), /*#__PURE__*/
    React.createElement("span", null, "CSV Export")
    ), /*#__PURE__*/
    React.createElement("button", {
      onClick: handleExportPDF,
      className: "px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-xs hover:shadow-md cursor-pointer",
      title: "Generate executive PDF report" }, /*#__PURE__*/

    React.createElement(FileText, { className: "w-3.5 h-3.5" }), /*#__PURE__*/
    React.createElement("span", null, "Executive PDF")
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5" }, /*#__PURE__*/

    React.createElement("div", {
      onClick: () => navigate('/tasks?filter=DONE'),
      className: "bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md hover:border-emerald-300 hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between",
      title: "Click to view all completed tasks" }, /*#__PURE__*/

    React.createElement("div", null, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between mb-2" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("div", { className: "w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform" }, /*#__PURE__*/
    React.createElement(TrendingUp, { className: "w-4 h-4" })
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-xs font-bold text-slate-600" }, "Completion Rate")
    ), /*#__PURE__*/
    React.createElement(ArrowRight, { className: "w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" })
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex items-baseline justify-between" }, /*#__PURE__*/
    React.createElement("span", { className: "text-2xl font-black text-slate-900 tracking-tight" },
    completionRate, "%"
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-0.5" }, "▲ +14% vs avg"

    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2.5" }, /*#__PURE__*/
    React.createElement("div", {
      className: "h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all",
      style: { width: `${completionRate}%` } }
    )
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "mt-3 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px]" }, /*#__PURE__*/
    React.createElement("span", { className: "font-semibold text-slate-600" }, stats.completedTasks, " of ", stats.totalTasks, " items done"), /*#__PURE__*/
    React.createElement("span", { className: "text-emerald-600 font-bold" }, "On Track")
    )
    ), /*#__PURE__*/


    React.createElement("div", {
      onClick: () => navigate('/tasks?filter=IN_PROGRESS'),
      className: "bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between",
      title: "Click to view in-progress tasks" }, /*#__PURE__*/

    React.createElement("div", null, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between mb-2" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("div", { className: "w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform" }, /*#__PURE__*/
    React.createElement(Layers, { className: "w-4 h-4" })
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-xs font-bold text-slate-600" }, "Active WIP")
    ), /*#__PURE__*/
    React.createElement(ArrowRight, { className: "w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" })
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex items-baseline justify-between" }, /*#__PURE__*/
    React.createElement("span", { className: "text-2xl font-black text-slate-900 tracking-tight" },
    stats.inProgressTasks, " ", /*#__PURE__*/React.createElement("span", { className: "text-xs font-bold text-slate-400" }, "Tasks")
    ), /*#__PURE__*/
    React.createElement("span", { className: "flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60" }, /*#__PURE__*/
    React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" }), "In Dev"

    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2.5" }, /*#__PURE__*/
    React.createElement("div", {
      className: "h-full bg-blue-500 rounded-full transition-all",
      style: { width: `${Math.min(100, stats.inProgressTasks / 6 * 100)}%` } }
    )
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "mt-3 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px]" }, /*#__PURE__*/
    React.createElement("span", { className: "font-semibold text-slate-600" }, "WIP Capacity"), /*#__PURE__*/
    React.createElement("span", { className: "text-blue-600 font-bold" }, stats.inProgressTasks, " / 6 Limit")
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between" }, /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between mb-2" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("div", { className: "w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center" }, /*#__PURE__*/
    React.createElement(Clock, { className: "w-4 h-4" })
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-xs font-bold text-slate-600" }, "Average Cycle Time")
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/60" }, "Optimal"

    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex items-baseline justify-between" }, /*#__PURE__*/
    React.createElement("span", { className: "text-2xl font-black text-slate-900 tracking-tight" }, "2.4 ", /*#__PURE__*/
    React.createElement("span", { className: "text-xs font-bold text-slate-400" }, "Days")
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] font-medium text-slate-500" }, "Industry: 3.5d")
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "mt-3 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px]" }, /*#__PURE__*/
    React.createElement("span", { className: "text-slate-500 font-medium" }, "Sprint iteration cadence"), /*#__PURE__*/
    React.createElement("span", { className: "text-purple-600 font-bold" }, "Fast Pace")
    )
    ), /*#__PURE__*/


    React.createElement("div", {
      onClick: () => setUpgradeOpen(true),
      className: "bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md hover:border-amber-300 hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between",
      title: "Click to explore upgrade options" }, /*#__PURE__*/

    React.createElement("div", null, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between mb-2" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("div", { className: "w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform" }, /*#__PURE__*/
    React.createElement(Calendar, { className: "w-4 h-4" })
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-xs font-bold text-slate-600" }, "Trial Validity")
    ), /*#__PURE__*/
    React.createElement(ArrowRight, { className: "w-3.5 h-3.5 text-slate-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" })
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex items-baseline justify-between" }, /*#__PURE__*/
    React.createElement("span", { className: "text-2xl font-black text-amber-600 tracking-tight" },
    stats.daysLeft, " ", /*#__PURE__*/React.createElement("span", { className: "text-xs font-bold text-slate-400" }, "Days Left")
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-extrabold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200/70" }, "Active"

    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2.5" }, /*#__PURE__*/
    React.createElement("div", {
      className: "h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full",
      style: { width: `${Math.round((stats.daysTotal - stats.daysLeft) / stats.daysTotal * 100)}%` } }
    )
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "mt-3 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px]" }, /*#__PURE__*/
    React.createElement("span", { className: "text-slate-500 font-medium" }, "Expires on ", stats.expiresOn), /*#__PURE__*/
    React.createElement("span", { className: "text-amber-600 font-bold group-hover:underline" }, "Upgrade ↗")
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-5" }, /*#__PURE__*/
    React.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100" }, /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("h2", { className: "text-base font-black text-slate-900 tracking-tight" },
    chartView === 'VELOCITY' && 'Task Velocity & Throughput',
    chartView === 'BURNDOWN' && 'Sprint Burndown Curve (Ideal vs Actual)',
    chartView === 'STATUS' && 'Status & Workload Distribution'
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60" }, "Real-time"

    )
    ), /*#__PURE__*/
    React.createElement("p", { className: "text-xs text-slate-500 mt-0.5 font-medium" }, "Visual analytics generated for ",
    workspace.projectName, " (Iteration 1)."
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80" }, /*#__PURE__*/
    React.createElement("button", {
      onClick: () => setChartView('VELOCITY'),
      className: `px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
      chartView === 'VELOCITY' ?
      'bg-white text-teal-800 shadow-2xs font-extrabold' :
      'text-slate-600 hover:text-slate-900'}` },

    "Velocity Trend"

    ), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => setChartView('BURNDOWN'),
      className: `px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
      chartView === 'BURNDOWN' ?
      'bg-white text-teal-800 shadow-2xs font-extrabold' :
      'text-slate-600 hover:text-slate-900'}` }, /*#__PURE__*/


    React.createElement(Flame, { className: "w-3 h-3 text-amber-500" }), /*#__PURE__*/
    React.createElement("span", null, "Burndown")
    ), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => setChartView('STATUS'),
      className: `px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
      chartView === 'STATUS' ?
      'bg-white text-teal-800 shadow-2xs font-extrabold' :
      'text-slate-600 hover:text-slate-900'}` },

    "Status Breakdown"

    )
    ), /*#__PURE__*/

    React.createElement("select", {
      value: selectedRange,
      onChange: (e) => setSelectedRange(e.target.value),
      className: "bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 py-1.5 px-2.5 rounded-xl focus:outline-none cursor-pointer" }, /*#__PURE__*/

    React.createElement("option", { value: "Last 7 Days" }, "Last 7 Days"), /*#__PURE__*/
    React.createElement("option", { value: "Current Sprint" }, "Current Sprint")
    )
    )
    ),


    chartView === 'VELOCITY' && /*#__PURE__*/
    React.createElement("div", { className: "space-y-4" }, /*#__PURE__*/
    React.createElement("div", { className: "h-72 w-full" }, /*#__PURE__*/
    React.createElement(ResponsiveContainer, { width: "100%", height: "100%" }, /*#__PURE__*/
    React.createElement(AreaChart, { data: trendData, margin: { top: 10, right: 10, left: -20, bottom: 0 } }, /*#__PURE__*/
    React.createElement("defs", null, /*#__PURE__*/
    React.createElement("linearGradient", { id: "velocityColor", x1: "0", y1: "0", x2: "0", y2: "1" }, /*#__PURE__*/
    React.createElement("stop", { offset: "5%", stopColor: "#0d9488", stopOpacity: 0.4 }), /*#__PURE__*/
    React.createElement("stop", { offset: "95%", stopColor: "#0d9488", stopOpacity: 0.0 })
    ), /*#__PURE__*/
    React.createElement("linearGradient", { id: "inProgColor", x1: "0", y1: "0", x2: "0", y2: "1" }, /*#__PURE__*/
    React.createElement("stop", { offset: "5%", stopColor: "#3b82f6", stopOpacity: 0.3 }), /*#__PURE__*/
    React.createElement("stop", { offset: "95%", stopColor: "#3b82f6", stopOpacity: 0.0 })
    )
    ), /*#__PURE__*/
    React.createElement(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: "#f1f5f9" }), /*#__PURE__*/
    React.createElement(XAxis, { dataKey: "date", tickLine: false, axisLine: false, tick: { fill: '#94a3b8', fontSize: 11, fontWeight: 500 } }), /*#__PURE__*/
    React.createElement(YAxis, { tickLine: false, axisLine: false, tick: { fill: '#94a3b8', fontSize: 11, fontWeight: 500 } }), /*#__PURE__*/
    React.createElement(Tooltip, {
      contentStyle: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        fontSize: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
      } }
    ), /*#__PURE__*/
    React.createElement(Area, {
      type: "monotone",
      dataKey: "completed",
      name: "Completed Tasks",
      stroke: "#0d9488",
      strokeWidth: 2.5,
      fillOpacity: 1,
      fill: "url(#velocityColor)" }
    ), /*#__PURE__*/
    React.createElement(Area, {
      type: "monotone",
      dataKey: "inProgress",
      name: "In Progress Tasks",
      stroke: "#3b82f6",
      strokeWidth: 2,
      fillOpacity: 1,
      fill: "url(#inProgColor)" }
    )
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "flex items-center justify-center gap-6 pt-2 text-xs font-semibold text-slate-600 border-t border-slate-100" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-1.5" }, /*#__PURE__*/
    React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-teal-600" }), /*#__PURE__*/
    React.createElement("span", null, "Completed Velocity")
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-1.5" }, /*#__PURE__*/
    React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-blue-500" }), /*#__PURE__*/
    React.createElement("span", null, "Active Work in Progress")
    )
    )
    ),



    chartView === 'BURNDOWN' && /*#__PURE__*/
    React.createElement("div", { className: "space-y-4" }, /*#__PURE__*/
    React.createElement("div", { className: "h-72 w-full" }, /*#__PURE__*/
    React.createElement(ResponsiveContainer, { width: "100%", height: "100%" }, /*#__PURE__*/
    React.createElement(LineChart, { data: burndownData, margin: { top: 10, right: 10, left: -20, bottom: 0 } }, /*#__PURE__*/
    React.createElement(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: "#f1f5f9" }), /*#__PURE__*/
    React.createElement(XAxis, { dataKey: "day", tickLine: false, axisLine: false, tick: { fill: '#94a3b8', fontSize: 11, fontWeight: 500 } }), /*#__PURE__*/
    React.createElement(YAxis, { domain: [0, stats.totalTasks || 12], tickLine: false, axisLine: false, tick: { fill: '#94a3b8', fontSize: 11, fontWeight: 500 } }), /*#__PURE__*/
    React.createElement(Tooltip, {
      contentStyle: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        fontSize: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
      } }
    ), /*#__PURE__*/
    React.createElement(Line, {
      type: "monotone",
      dataKey: "ideal",
      name: "Ideal Burndown Guideline",
      stroke: "#94a3b8",
      strokeWidth: 2,
      strokeDasharray: "4 4",
      dot: false }
    ), /*#__PURE__*/
    React.createElement(Line, {
      type: "monotone",
      dataKey: "actual",
      name: "Actual Remaining Work",
      stroke: "#ef4444",
      strokeWidth: 2.5,
      dot: { fill: '#ef4444', r: 4 } }
    )
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "flex items-center justify-center gap-6 pt-2 text-xs font-semibold text-slate-600 border-t border-slate-100" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-1.5" }, /*#__PURE__*/
    React.createElement("span", { className: "w-4 h-0.5 border-t-2 border-dashed border-slate-400" }), /*#__PURE__*/
    React.createElement("span", null, "Ideal Burndown Guideline")
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-1.5" }, /*#__PURE__*/
    React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-rose-500" }), /*#__PURE__*/
    React.createElement("span", null, "Actual Remaining Tasks (", stats.totalTasks - stats.completedTasks, " left)")
    )
    )
    ),



    chartView === 'STATUS' && /*#__PURE__*/
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 items-center gap-6 py-2" }, /*#__PURE__*/
    React.createElement("div", { className: "h-64 relative flex items-center justify-center" }, /*#__PURE__*/
    React.createElement(ResponsiveContainer, { width: "100%", height: "100%" }, /*#__PURE__*/
    React.createElement(PieChart, null, /*#__PURE__*/
    React.createElement(Pie, {
      data: statusBreakdown,
      cx: "50%",
      cy: "50%",
      innerRadius: 68,
      outerRadius: 96,
      paddingAngle: 4,
      dataKey: "count" },

    statusBreakdown.map((entry, index) => /*#__PURE__*/
    React.createElement(Cell, { key: `cell-${index}`, fill: entry.color, stroke: "#ffffff", strokeWidth: 2 })
    )
    ), /*#__PURE__*/
    React.createElement(Tooltip, {
      contentStyle: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        fontSize: '12px'
      } }
    )
    )
    ), /*#__PURE__*/
    React.createElement("div", { className: "absolute inset-0 flex flex-col items-center justify-center pointer-events-none" }, /*#__PURE__*/
    React.createElement("span", { className: "text-2xl font-black text-slate-900 leading-tight" },
    stats.totalTasks
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wider" }, "Total Items"

    )
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "space-y-3" }, /*#__PURE__*/
    React.createElement("h4", { className: "text-xs font-bold uppercase tracking-wider text-slate-400" }, "Status Breakdown"), /*#__PURE__*/
    React.createElement("div", { className: "space-y-2" },
    statusBreakdown.map((item) => /*#__PURE__*/
    React.createElement("div", { key: item.name, className: "flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("span", { className: "w-2.5 h-2.5 rounded-full", style: { backgroundColor: item.color } }), /*#__PURE__*/
    React.createElement("span", { className: "font-bold text-slate-700" }, item.name)
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2 font-mono text-[11px]" }, /*#__PURE__*/
    React.createElement("span", { className: "font-extrabold text-slate-900" }, item.count, " tasks"), /*#__PURE__*/
    React.createElement("span", { className: "text-slate-400" }, "(", item.pct, "%)")
    )
    )
    )
    )
    )
    )

    ), /*#__PURE__*/


    React.createElement("div", { className: "bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden" }, /*#__PURE__*/
    React.createElement("div", { className: "p-5 border-b border-slate-100 flex items-center justify-between" }, /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("h3", { className: "text-sm font-black text-slate-900" }, "Team Member Allocation & Efficiency"), /*#__PURE__*/
    React.createElement("p", { className: "text-xs text-slate-500 mt-0.5 font-medium" }, "Tasks assigned, active workload, and delivery completion ratios.")
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200/60" },
    teamMembers.length, " Members Active"
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "overflow-x-auto" }, /*#__PURE__*/
    React.createElement("table", { className: "w-full text-left text-xs" }, /*#__PURE__*/
    React.createElement("thead", null, /*#__PURE__*/
    React.createElement("tr", { className: "bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider" }, /*#__PURE__*/
    React.createElement("th", { className: "py-3 px-5" }, "Team Member"), /*#__PURE__*/
    React.createElement("th", { className: "py-3 px-4" }, "Role"), /*#__PURE__*/
    React.createElement("th", { className: "py-3 px-4" }, "Assigned Tasks"), /*#__PURE__*/
    React.createElement("th", { className: "py-3 px-4" }, "Completion Progress"), /*#__PURE__*/
    React.createElement("th", { className: "py-3 px-4" }, "In Progress"), /*#__PURE__*/
    React.createElement("th", { className: "py-3 px-4" }, "Status & Health")
    )
    ), /*#__PURE__*/
    React.createElement("tbody", { className: "divide-y divide-slate-100 font-medium" },
    teamMembers.map((member) => {
      const memberPct = member.assigned > 0 ? Math.round(member.done / member.assigned * 100) : 0;
      return (/*#__PURE__*/
        React.createElement("tr", { key: member.name, className: "hover:bg-slate-50/80 transition-colors" }, /*#__PURE__*/

        React.createElement("td", { className: "py-3 px-5 whitespace-nowrap" }, /*#__PURE__*/
        React.createElement("div", { className: "flex items-center gap-2.5" }, /*#__PURE__*/
        React.createElement("div", {
          className: "w-7 h-7 rounded-xl text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-2xs",
          style: { backgroundColor: member.color } },

        member.initials
        ), /*#__PURE__*/
        React.createElement("span", { className: "font-bold text-slate-900" }, member.name)
        )
        ), /*#__PURE__*/


        React.createElement("td", { className: "py-3 px-4 text-slate-600 font-medium whitespace-nowrap" },
        member.role
        ), /*#__PURE__*/


        React.createElement("td", { className: "py-3 px-4 font-black text-slate-900 whitespace-nowrap" },
        member.assigned, " tasks"
        ), /*#__PURE__*/


        React.createElement("td", { className: "py-3 px-4 whitespace-nowrap min-w-[140px]" }, /*#__PURE__*/
        React.createElement("div", { className: "space-y-1" }, /*#__PURE__*/
        React.createElement("div", { className: "flex items-center justify-between text-[11px]" }, /*#__PURE__*/
        React.createElement("span", { className: "text-emerald-600 font-bold" }, member.done, " Done"), /*#__PURE__*/
        React.createElement("span", { className: "text-slate-400 font-semibold" }, memberPct, "%")
        ), /*#__PURE__*/
        React.createElement("div", { className: "w-full h-1.5 bg-slate-100 rounded-full overflow-hidden" }, /*#__PURE__*/
        React.createElement("div", {
          className: "h-full bg-emerald-500 rounded-full transition-all",
          style: { width: `${memberPct}%` } }
        )
        )
        )
        ), /*#__PURE__*/


        React.createElement("td", { className: "py-3 px-4 text-blue-600 font-bold whitespace-nowrap" },
        member.inProgress, " active"
        ), /*#__PURE__*/


        React.createElement("td", { className: "py-3 px-4 whitespace-nowrap" }, /*#__PURE__*/
        React.createElement("span", { className: "inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg font-bold text-[10px] border border-emerald-200" }, /*#__PURE__*/
        React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-500" }), "88% On Track"

        )
        )
        ));

    })
    )
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "bg-gradient-to-r from-teal-50 via-emerald-50/50 to-amber-50/30 rounded-3xl border border-teal-200/80 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-3" }, /*#__PURE__*/
    React.createElement("div", { className: "w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs" }, /*#__PURE__*/
    React.createElement(Sparkles, { className: "w-5 h-5" })
    ), /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("h4", { className: "text-sm font-black text-slate-900" }, "Unlock Enterprise-Grade Agile Analytics in Pro"), /*#__PURE__*/
    React.createElement("p", { className: "text-xs text-slate-600 mt-0.5 font-medium" }, "Cumulative Flow Diagrams (CFD), Epic Progress Trackers, Cross-Project Velocity, and Custom KPI Dashboards."

    )
    )
    ), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => setUpgradeOpen(true),
      className: "px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-xs hover:shadow-md" }, /*#__PURE__*/

    React.createElement(Crown, { className: "w-3.5 h-3.5 text-amber-300 fill-amber-300" }), /*#__PURE__*/
    React.createElement("span", null, "Upgrade to Pro Reports")
    )
    ), /*#__PURE__*/

    React.createElement(UpgradeModal, {
      isOpen: upgradeOpen,
      onClose: () => setUpgradeOpen(false) }
    )
    ));

};