import React, { useState, useEffect } from 'react';
import {
  GitBranch, Calendar, PlayCircle, Plus, Crown,
  Lock, CheckCircle2, AlertCircle, ArrowRight, Clock,
  ChevronRight, Sparkles, Target, Zap, Check, Flame, ListTree } from
'lucide-react';

import { UpgradeModal } from '../../components/trial/UpgradeModal';
import { useTrialStore } from '../../store/trialStore';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { ProductIncrementsTab } from '../pm/ProductIncrementsTab';
import { toast } from 'sonner';

export const TrialIterationsPage = () => {
  const { currentUser } = useAuthStore();
  const { workspace, initForCurrentUser, updateTaskStatus } = useTrialStore();
  const { projects } = useAppStore();

  const targetProject = projects.find(
    (p) => p.key === workspace.projectKey || p.name.toLowerCase().includes(workspace.projectName.toLowerCase())
  ) || projects[0];
  const targetProjectId = targetProject?.id || 'proj-001';

  useEffect(() => {
    if (currentUser?.id) {
      initForCurrentUser(currentUser.id, currentUser.name, currentUser.email, currentUser.avatarColor);
    }
  }, [currentUser?.id, currentUser?.name, currentUser?.email, currentUser?.avatarColor, initForCurrentUser]);

  const tasks = workspace.workItems;
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('BOARD');

  const moveTask = (taskId, targetStatus) => {
    updateTaskStatus(taskId, targetStatus);
    toast.success(`Moved to ${targetStatus}`);
  };

  const doneCount = tasks.filter((t) => t.status === 'Done').length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const todoCount = tasks.filter((t) => t.status === 'To Do').length;
  const blockedCount = tasks.filter((t) => t.status === 'Blocked').length;
  const completionPct = Math.round(doneCount / tasks.length * 100);

  return (/*#__PURE__*/
    React.createElement("div", { className: "space-y-6 max-w-[1400px] mx-auto pb-8" }, /*#__PURE__*/

    React.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200" }, /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2.5" }, /*#__PURE__*/
    React.createElement("h1", { className: "text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display" }, "Iterations & Sprints"

    ), /*#__PURE__*/
    React.createElement("span", { className: "px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wide" }, "Sprint 1 Active (Trial)"

    )
    ), /*#__PURE__*/
    React.createElement("p", { className: "text-xs text-slate-500 mt-1" }, "Track agile sprint cadence, team velocity, burndown, and retrospective milestones."

    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex items-center gap-2.5" }, /*#__PURE__*/
    React.createElement("button", {
      onClick: () => setUpgradeOpen(true),
      className: "px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100/80 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs" }, /*#__PURE__*/

    React.createElement(Crown, { className: "w-3.5 h-3.5 text-amber-600 fill-amber-500/30" }), /*#__PURE__*/
    React.createElement("span", null, "Unlock Multi-Sprint Cadence")
    ), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => setUpgradeOpen(true),
      className: "px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer" }, /*#__PURE__*/

    React.createElement(Plus, { className: "w-4 h-4" }), /*#__PURE__*/
    React.createElement("span", null, "New Iteration")
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "flex items-center gap-2 border-b border-slate-200" }, /*#__PURE__*/
    React.createElement("button", {
      onClick: () => setActiveTab('BOARD'),
      className: `flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
      activeTab === 'BOARD' ?
      'border-teal-600 text-teal-800 font-black' :
      'border-transparent text-slate-500 hover:text-slate-800'}` }, /*#__PURE__*/


    React.createElement(GitBranch, { className: "w-3.5 h-3.5" }), /*#__PURE__*/
    React.createElement("span", null, "Sprint Board")
    ), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => setActiveTab('PRODUCT_INCREMENTS'),
      className: `flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
      activeTab === 'PRODUCT_INCREMENTS' ?
      'border-teal-600 text-teal-800 font-black' :
      'border-transparent text-slate-500 hover:text-slate-800'}` }, /*#__PURE__*/


    React.createElement(ListTree, { className: "w-3.5 h-3.5" }), /*#__PURE__*/
    React.createElement("span", null, "Product Increments (PIs)"), /*#__PURE__*/
    React.createElement("span", { className: "px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-[10px] font-black uppercase" }, "Trial Limit: 2 PIs"

    )
    )
    ),

    activeTab === 'PRODUCT_INCREMENTS' ? /*#__PURE__*/
    React.createElement(ProductIncrementsTab, {
      projectId: targetProjectId,
      onOpenIterations: () => setActiveTab('BOARD') }
    ) : /*#__PURE__*/

    React.createElement(React.Fragment, null, /*#__PURE__*/

    React.createElement("div", { className: "bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-5" }, /*#__PURE__*/
    React.createElement("div", { className: "flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-start sm:items-center gap-3.5" }, /*#__PURE__*/
    React.createElement("div", { className: "w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200/80 flex items-center justify-center font-black shadow-2xs shrink-0" }, /*#__PURE__*/
    React.createElement(GitBranch, { className: "w-6 h-6" })
    ), /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /*#__PURE__*/
    React.createElement("h2", { className: "text-lg font-black text-slate-900 tracking-tight" }, "Sprint 1 — Core Commerce Checkout Flow"

    ), /*#__PURE__*/
    React.createElement("span", { className: "px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold" }, "Active Sprint"

    )
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap" }, /*#__PURE__*/
    React.createElement("span", { className: "flex items-center gap-1 font-semibold text-slate-700" }, /*#__PURE__*/
    React.createElement(Calendar, { className: "w-3.5 h-3.5 text-teal-600" }), "Oct 20, 2026 – Oct 30, 2026"

    ), /*#__PURE__*/
    React.createElement("span", { className: "text-slate-300" }, "•"), /*#__PURE__*/
    React.createElement("span", { className: "flex items-center gap-1 font-semibold text-amber-600" }, /*#__PURE__*/
    React.createElement(Clock, { className: "w-3.5 h-3.5" }), "4 Days Remaining"

    ), /*#__PURE__*/
    React.createElement("span", { className: "text-slate-300" }, "•"), /*#__PURE__*/
    React.createElement("span", { className: "font-semibold text-slate-600" }, "32 Total Story Points")
    )
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex items-center gap-4 self-end lg:self-auto bg-slate-50 p-3 rounded-2xl border border-slate-200/70" }, /*#__PURE__*/
    React.createElement("div", { className: "text-right" }, /*#__PURE__*/
    React.createElement("div", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wider" }, "Completion"), /*#__PURE__*/
    React.createElement("div", { className: "text-xl font-black text-teal-700" }, completionPct, "%")
    ), /*#__PURE__*/
    React.createElement("div", { className: "w-12 h-12 rounded-full border-4 border-teal-100 border-t-teal-600 flex items-center justify-center font-extrabold text-[11px] text-teal-800" },
    doneCount, "/", tasks.length
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "flex items-center gap-2.5 bg-teal-50/60 border border-teal-200/80 rounded-2xl px-4 py-2.5 text-xs text-teal-900 font-medium" }, /*#__PURE__*/
    React.createElement(Target, { className: "w-4 h-4 text-teal-700 shrink-0" }), /*#__PURE__*/
    React.createElement("span", null, /*#__PURE__*/
    React.createElement("strong", { className: "font-extrabold" }, "Sprint Goal:"), " Ship stable cart checkout with Stripe payment simulation and order verification webhooks."
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 pt-1" }, /*#__PURE__*/

    React.createElement("div", { className: "bg-slate-50/90 rounded-2xl p-3 border border-slate-200/90 space-y-3" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-bold text-slate-700" }, /*#__PURE__*/
    React.createElement("span", { className: "flex items-center gap-1.5" }, /*#__PURE__*/
    React.createElement("span", { className: "w-2 h-2 rounded-full bg-slate-400" }), "TO DO"

    ), /*#__PURE__*/
    React.createElement("span", { className: "bg-white text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 text-[10px] font-extrabold" },
    todoCount
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "space-y-2.5" },
    tasks.
    filter((t) => t.status === 'To Do').
    map((task) => /*#__PURE__*/
    React.createElement("div", {
      key: task.id,
      className: "bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all space-y-2.5" }, /*#__PURE__*/

    React.createElement("div", { className: "flex items-center justify-between" }, /*#__PURE__*/
    React.createElement("span", { className: "font-mono text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200" },
    task.key
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded" },
    task.priority
    )
    ), /*#__PURE__*/
    React.createElement("div", { className: "text-xs font-bold text-slate-800" }, task.title), /*#__PURE__*/
    React.createElement("div", { className: "pt-2 border-t border-slate-100 flex items-center justify-between" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] text-slate-400" }, task.assigneeName || 'Unassigned'), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => moveTask(task.id, 'In Progress'),
      className: "px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-200 transition-colors cursor-pointer" },
    "Start →"

    )
    )
    )
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "bg-blue-50/40 rounded-2xl p-3 border border-blue-100 space-y-3" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between pb-2 border-b border-blue-100 text-xs font-bold text-blue-900" }, /*#__PURE__*/
    React.createElement("span", { className: "flex items-center gap-1.5" }, /*#__PURE__*/
    React.createElement("span", { className: "w-2 h-2 rounded-full bg-blue-500" }), "IN PROGRESS"

    ), /*#__PURE__*/
    React.createElement("span", { className: "bg-white text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 text-[10px] font-extrabold" },
    inProgressCount
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "space-y-2.5" },
    tasks.
    filter((t) => t.status === 'In Progress').
    map((task) => /*#__PURE__*/
    React.createElement("div", {
      key: task.id,
      className: "bg-white rounded-xl p-3 border border-blue-100 shadow-2xs hover:shadow-xs transition-all space-y-2.5" }, /*#__PURE__*/

    React.createElement("div", { className: "flex items-center justify-between" }, /*#__PURE__*/
    React.createElement("span", { className: "font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200" },
    task.key
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded" },
    task.priority
    )
    ), /*#__PURE__*/
    React.createElement("div", { className: "text-xs font-bold text-slate-800" }, task.title), /*#__PURE__*/
    React.createElement("div", { className: "pt-2 border-t border-slate-100 flex items-center justify-between" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-semibold text-slate-600" }, task.assigneeName), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => moveTask(task.id, 'Done'),
      className: "px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200 transition-colors cursor-pointer" },
    "Complete →"

    )
    )
    )
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "bg-emerald-50/40 rounded-2xl p-3 border border-emerald-100 space-y-3" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between pb-2 border-b border-emerald-100 text-xs font-bold text-emerald-900" }, /*#__PURE__*/
    React.createElement("span", { className: "flex items-center gap-1.5" }, /*#__PURE__*/
    React.createElement("span", { className: "w-2 h-2 rounded-full bg-emerald-500" }), "DONE"

    ), /*#__PURE__*/
    React.createElement("span", { className: "bg-white text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px] font-extrabold" },
    doneCount
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "space-y-2.5 max-h-[380px] overflow-y-auto pr-0.5 no-scrollbar" },
    tasks.
    filter((t) => t.status === 'Done').
    map((task) => /*#__PURE__*/
    React.createElement("div", {
      key: task.id,
      className: "bg-white rounded-xl p-3 border border-emerald-100 shadow-2xs space-y-2 opacity-95" }, /*#__PURE__*/

    React.createElement("div", { className: "flex items-center justify-between" }, /*#__PURE__*/
    React.createElement("span", { className: "font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200" },
    task.key
    ), /*#__PURE__*/
    React.createElement("span", { className: "flex items-center gap-0.5 text-[10px] font-bold text-emerald-600" }, /*#__PURE__*/
    React.createElement(Check, { className: "w-3 h-3" }), "Done"

    )
    ), /*#__PURE__*/
    React.createElement("div", { className: "text-xs font-bold text-slate-700 line-through decoration-slate-300" },
    task.title
    ), /*#__PURE__*/
    React.createElement("div", { className: "text-[10px] text-slate-400 pt-1 border-t border-slate-50" }, "Completed by ",
    task.assigneeName || 'Dev'
    )
    )
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "bg-rose-50/40 rounded-2xl p-3 border border-rose-100 space-y-3" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between pb-2 border-b border-rose-100 text-xs font-bold text-rose-900" }, /*#__PURE__*/
    React.createElement("span", { className: "flex items-center gap-1.5" }, /*#__PURE__*/
    React.createElement("span", { className: "w-2 h-2 rounded-full bg-rose-500" }), "BLOCKED"

    ), /*#__PURE__*/
    React.createElement("span", { className: "bg-white text-rose-700 px-2 py-0.5 rounded-full border border-rose-200 text-[10px] font-extrabold" },
    blockedCount
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "space-y-2.5" },
    tasks.
    filter((t) => t.status === 'Blocked').
    map((task) => /*#__PURE__*/
    React.createElement("div", {
      key: task.id,
      className: "bg-white rounded-xl p-3 border border-rose-200 shadow-2xs space-y-2.5" }, /*#__PURE__*/

    React.createElement("div", { className: "flex items-center justify-between" }, /*#__PURE__*/
    React.createElement("span", { className: "font-mono text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200" },
    task.key
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200" }, "Flagged"

    )
    ), /*#__PURE__*/
    React.createElement("div", { className: "text-xs font-bold text-slate-800" }, task.title), /*#__PURE__*/
    React.createElement("div", { className: "pt-2 border-t border-slate-100 flex items-center justify-between" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] text-slate-500" }, task.assigneeName), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => moveTask(task.id, 'In Progress'),
      className: "px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg cursor-pointer" },
    "Unblock"

    )
    )
    )
    )
    )
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-5" }, /*#__PURE__*/

    React.createElement("div", { className: "bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between space-y-4 opacity-95" }, /*#__PURE__*/
    React.createElement("div", { className: "space-y-2" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between" }, /*#__PURE__*/
    React.createElement("span", { className: "px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-extrabold" }, "Upcoming Iteration"

    ), /*#__PURE__*/
    React.createElement("span", { className: "flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md" }, /*#__PURE__*/
    React.createElement(Lock, { className: "w-3 h-3 text-amber-600" }), "Pro Pack"

    )
    ), /*#__PURE__*/
    React.createElement("h3", { className: "text-base font-extrabold text-slate-900" }, "Sprint 2 — Performance & Mobile Checkout"), /*#__PURE__*/
    React.createElement("p", { className: "text-xs text-slate-500" }, "Scheduled for Nov 01 – Nov 14, 2026. Includes 14 backlog stories and automated sprint transitions."

    )
    ), /*#__PURE__*/

    React.createElement("button", {
      onClick: () => setUpgradeOpen(true),
      className: "w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-extrabold text-xs border border-amber-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer" }, /*#__PURE__*/

    React.createElement(Crown, { className: "w-3.5 h-3.5 text-amber-600 fill-amber-500/20" }), /*#__PURE__*/
    React.createElement("span", null, "Unlock Sprint 2 & Sprint Backlog Planning")
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "bg-gradient-to-br from-teal-50/60 to-emerald-50/30 rounded-3xl border border-teal-200/80 p-5 shadow-2xs flex flex-col justify-between space-y-4" }, /*#__PURE__*/
    React.createElement("div", { className: "space-y-2" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between" }, /*#__PURE__*/
    React.createElement("span", { className: "px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-extrabold" }, "Sprint Retrospective"

    ), /*#__PURE__*/
    React.createElement("span", { className: "flex items-center gap-1 text-[10px] font-extrabold text-teal-700" }, /*#__PURE__*/
    React.createElement(Sparkles, { className: "w-3 h-3" }), "Agile Insights"

    )
    ), /*#__PURE__*/
    React.createElement("h3", { className: "text-base font-extrabold text-slate-900" }, "Sprint Retrospective & Action Items"), /*#__PURE__*/
    React.createElement("p", { className: "text-xs text-slate-600 leading-relaxed" }, "Capture what went well, what to improve, and create trackable action items directly linked to upcoming iterations."

    )
    ), /*#__PURE__*/

    React.createElement("button", {
      onClick: () => setUpgradeOpen(true),
      className: "w-full py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer" }, /*#__PURE__*/

    React.createElement("span", null, "Review Retrospective Tools"), /*#__PURE__*/
    React.createElement(ArrowRight, { className: "w-3.5 h-3.5" })
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