import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Search,
  Sparkles,
  Calendar,
  Layers,
  Flame,
  Check,
  Target } from
'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { Avatar } from '../../components/common/Avatar';
import { StatusBadge, PriorityBadge } from '../../components/common/Badges';
import { toast } from 'sonner';








export const WorkloadCapacityTab = ({ projectId }) => {
  const { tasks, users, sprints, updateTask, projects, teams } = useAppStore();
  const { currentUser } = useAuthStore();

  const project = useMemo(() => projects.find((p) => p.id === projectId), [projects, projectId]);
  const projectSprints = useMemo(
    () => sprints.filter((s) => s.projectId === projectId && !s.isArchived),
    [sprints, projectId]
  );

  // Sort sprints: ACTIVE first, then PLANNED, then COMPLETED
  const sortedProjectSprints = useMemo(() => {
    return [...projectSprints].sort((a, b) => {
      const orderMap = { ACTIVE: 1, PLANNED: 2, COMPLETED: 3 };
      const diff = (orderMap[a.status] || 4) - (orderMap[b.status] || 4);
      if (diff !== 0) return diff;
      return (a.iterationNumber || a.name || '').localeCompare(b.iterationNumber || b.name || '');
    });
  }, [projectSprints]);

  const [searchParams, setSearchParams] = useSearchParams();
  const sprintFromUrl = searchParams.get('sprint');

  const defaultSprint = useMemo(() => {
    if (sprintFromUrl && sortedProjectSprints.some((s) => s.id === sprintFromUrl)) {
      return sortedProjectSprints.find((s) => s.id === sprintFromUrl);
    }
    const active = projectSprints.find((s) => s.status === 'ACTIVE');
    if (active) {
      const activeHasTasks = tasks.some((t) => t.projectId === projectId && t.sprintId === active.id);
      if (activeHasTasks) return active;
    }
    const sprintWithTasks = sortedProjectSprints.find((s) =>
    tasks.some((t) => t.projectId === projectId && t.sprintId === s.id)
    );
    return sprintWithTasks || active || sortedProjectSprints[0];
  }, [projectSprints, sortedProjectSprints, sprintFromUrl, tasks, projectId]);

  // State: ALWAYS single sprint scope (no overall/ALL)
  const [selectedSprintId, setSelectedSprintId] = useState(() => defaultSprint?.id || '');

  const handleSprintChange = (sprintId) => {
    setSelectedSprintId(sprintId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('sprint', sprintId);
      return next;
    });
  };
  const [metricMode, setMetricMode] = useState('HOURS');
  const [maxSprintCapacity, setMaxSprintCapacity] = useState(40); // 40h default per sprint
  const [maxPointsCapacity, setMaxPointsCapacity] = useState(15); // 15 pts default per sprint
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedUsers, setExpandedUsers] = useState(() => new Set());

  // Keep selectedSprintId synced to a valid sprint
  useEffect(() => {
    if (sortedProjectSprints.length > 0) {
      const exists = sortedProjectSprints.some((s) => s.id === selectedSprintId);
      if (!exists) {
        setSelectedSprintId(defaultSprint?.id || sortedProjectSprints[0].id);
      }
    }
  }, [sortedProjectSprints, defaultSprint, selectedSprintId]);

  const currentSprint = useMemo(() => {
    return projectSprints.find((s) => s.id === selectedSprintId) || defaultSprint;
  }, [projectSprints, selectedSprintId, defaultSprint]);

  // Threshold based on metric
  const capacityLimit = metricMode === 'HOURS' ? maxSprintCapacity : maxPointsCapacity;

  // Filter tasks strictly by current project AND the SINGLE selected sprint
  const scopedTasks = useMemo(() => {
    if (!selectedSprintId) return [];
    return tasks.filter((t) => t.projectId === projectId && t.sprintId === selectedSprintId);
  }, [tasks, projectId, selectedSprintId]);

  // Team members for this project and sprint
  const projectMembers = useMemo(() => {
    const assignedUserIds = new Set(scopedTasks.map((t) => t.assigneeId).filter(Boolean));
    const projectTeamIds = new Set(project?.teamIds || []);

    return users.filter((u) => {
      if (assignedUserIds.has(u.id)) return true;
      if (u.teamId && projectTeamIds.has(u.teamId) && (u.teamId === 'team-dev' || u.teamId === 'team-qa')) return true;
      if (currentSprint?.memberIds && currentSprint.memberIds.includes(u.id)) return true;
      return false;
    });
  }, [users, scopedTasks, project, currentSprint]);

  // Aggregate stats per user strictly within this one sprint
  const userWorkloads = useMemo(() => {
    return projectMembers.map((member) => {
      const userTasks = scopedTasks.filter((t) => t.assigneeId === member.id);

      const hoursDone = userTasks.
      filter((t) => t.status === 'DONE').
      reduce((sum, t) => sum + (t.estimatedHours || t.originalEstimate || 6), 0);
      const hoursInProgress = userTasks.
      filter((t) => t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW' || t.status === 'TESTING').
      reduce((sum, t) => sum + (t.estimatedHours || t.originalEstimate || 8), 0);
      const hoursTodo = userTasks.
      filter((t) => t.status === 'TODO' || t.status === 'BACKLOG').
      reduce((sum, t) => sum + (t.estimatedHours || t.originalEstimate || 4), 0);
      const totalHours = hoursDone + hoursInProgress + hoursTodo;

      const pointsDone = userTasks.
      filter((t) => t.status === 'DONE').
      reduce((sum, t) => sum + (t.storyPoints || 0), 0);
      const pointsInProgress = userTasks.
      filter((t) => t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW' || t.status === 'TESTING').
      reduce((sum, t) => sum + (t.storyPoints || 0), 0);
      const pointsTodo = userTasks.
      filter((t) => t.status === 'TODO' || t.status === 'BACKLOG').
      reduce((sum, t) => sum + (t.storyPoints || 0), 0);
      const totalPoints = pointsDone + pointsInProgress + pointsTodo;

      const totalAllocated = metricMode === 'HOURS' ? totalHours : totalPoints;
      const pct = capacityLimit > 0 ? Math.round(totalAllocated / capacityLimit * 100) : 0;
      const isOverloaded = totalAllocated > capacityLimit;
      const hasBandwidth = pct < 80;
      const remaining = Math.max(0, capacityLimit - totalAllocated);
      const excess = Math.max(0, totalAllocated - capacityLimit);

      const team = teams.find((tm) => tm.id === member.teamId);

      return {
        member,
        teamName: team?.name || 'Engineering',
        tasks: userTasks,
        taskCount: userTasks.length,
        hoursDone,
        hoursInProgress,
        hoursTodo,
        totalHours,
        pointsDone,
        pointsInProgress,
        pointsTodo,
        totalPoints,
        totalAllocated,
        pct,
        isOverloaded,
        hasBandwidth,
        remaining,
        excess
      };
    });
  }, [projectMembers, scopedTasks, metricMode, capacityLimit, teams]);

  // Default-expand members who have tasks in this sprint
  useEffect(() => {
    const membersWithTasks = userWorkloads.filter((u) => u.tasks.length > 0).map((u) => u.member.id);
    if (membersWithTasks.length > 0) {
      setExpandedUsers(new Set(membersWithTasks.slice(0, 2)));
    } else {
      setExpandedUsers(new Set());
    }
  }, [selectedSprintId, userWorkloads.length]);

  // Unassigned tasks in this sprint
  const unassignedTasks = useMemo(() => {
    return scopedTasks.filter((t) => !t.assigneeId);
  }, [scopedTasks]);

  const unassignedTotal = useMemo(() => {
    if (metricMode === 'HOURS') {
      return unassignedTasks.reduce((sum, t) => sum + (t.estimatedHours || 3), 0);
    }
    return unassignedTasks.reduce((sum, t) => sum + (t.storyPoints || 2), 0);
  }, [unassignedTasks, metricMode]);

  // Sprint Stats for the single sprint
  const sprintStats = useMemo(() => {
    const totalCapacity = userWorkloads.length * capacityLimit;
    const totalAllocated = userWorkloads.reduce((sum, u) => sum + u.totalAllocated, 0);
    const overloadedCount = userWorkloads.filter((u) => u.isOverloaded).length;
    const bandwidthCount = userWorkloads.filter((u) => u.hasBandwidth).length;
    const overallPct = totalCapacity > 0 ? Math.round(totalAllocated / totalCapacity * 100) : 0;

    return {
      totalCapacity,
      totalAllocated,
      overloadedCount,
      bandwidthCount,
      overallPct
    };
  }, [userWorkloads, capacityLimit]);

  // Rebalancing suggestion within this sprint
  const rebalanceHint = useMemo(() => {
    const overloaded = userWorkloads.find((u) => u.isOverloaded);
    const available = userWorkloads.find((u) => u.hasBandwidth && u.tasks.length < 5);
    if (overloaded && available) {
      return {
        overloadedUser: overloaded.member.name,
        excess: overloaded.excess,
        availableUser: available.member.name,
        remaining: available.remaining
      };
    }
    return null;
  }, [userWorkloads]);

  // Filtered rows for display
  const filteredWorkloads = useMemo(() => {
    return userWorkloads.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.member.name.toLowerCase().includes(q);
        const matchesRole = (item.member.jobTitle || item.member.role).toLowerCase().includes(q);
        const matchesTeam = item.teamName.toLowerCase().includes(q);
        if (!matchesName && !matchesRole && !matchesTeam) return false;
      }
      if (statusFilter === 'OVERLOADED') return item.isOverloaded;
      if (statusFilter === 'BANDWIDTH') return item.hasBandwidth;
      return true;
    }).sort((a, b) => b.totalAllocated - a.totalAllocated);
  }, [userWorkloads, searchQuery, statusFilter]);

  const toggleExpand = (userId) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);else
      next.add(userId);
      return next;
    });
  };

  const handleReassignTask = (taskId, newAssigneeId) => {
    try {
      updateTask(taskId, { assigneeId: newAssigneeId || undefined });
      const targetUser = users.find((u) => u.id === newAssigneeId);
      toast.success(
        targetUser ?
        `Work item reassigned to ${targetUser.name}` :
        'Work item unassigned'
      );
    } catch {
      toast.error('Failed to reassign task.');
    }
  };

  return (/*#__PURE__*/
    React.createElement("div", { className: "space-y-5", "data-testid": "workload-capacity-tab" }, /*#__PURE__*/

    React.createElement("div", { className: "card p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-4" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-start justify-between gap-4 flex-wrap" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-3" }, /*#__PURE__*/
    React.createElement("div", { className: "w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#0d9488] flex items-center justify-center shrink-0 shadow-2xs" }, /*#__PURE__*/
    React.createElement(Users, { className: "w-5 h-5" })
    ), /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement("h2", { className: "text-base font-bold text-slate-900" }, "Workload & Team Capacity"), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 tracking-wider" }, "Single Sprint View"

    )
    ), /*#__PURE__*/
    React.createElement("p", { className: "text-xs text-slate-500" }, "Track allocated workload per team member for a single sprint cycle, prevent burnout (> ",
    capacityLimit, " ", metricMode === 'HOURS' ? 'hrs' : 'pts', "), and rebalance sprint tasks."
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "flex items-center gap-2.5 flex-wrap" }, /*#__PURE__*/

    React.createElement("div", { className: "flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs" }, /*#__PURE__*/
    React.createElement(Layers, { className: "w-4 h-4 text-teal-600 shrink-0" }), /*#__PURE__*/
    React.createElement("span", { className: "font-semibold text-slate-500" }, "Sprint:"), /*#__PURE__*/
    React.createElement("select", {
      "aria-label": "Filter workload by single sprint or iteration",
      value: selectedSprintId,
      onChange: (e) => handleSprintChange(e.target.value),
      className: "bg-transparent font-bold text-slate-900 outline-none cursor-pointer" },

    sortedProjectSprints.length === 0 ? /*#__PURE__*/
    React.createElement("option", { value: "" }, "No Sprints Available") :

    sortedProjectSprints.map((s) => {
      const label = s.iterationNumber ? `Iteration ${s.iterationNumber}` : s.name;
      return (/*#__PURE__*/
        React.createElement("option", { key: s.id, value: s.id },
        label, " (", s.status, ")"
        ));

    })

    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold" }, /*#__PURE__*/
    React.createElement("button", {
      type: "button",
      onClick: () => setMetricMode('HOURS'),
      className: `flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
      metricMode === 'HOURS' ?
      'bg-white text-slate-900 shadow-2xs font-bold' :
      'text-slate-500 hover:text-slate-800'}` }, /*#__PURE__*/


    React.createElement(Clock, { className: "w-3.5 h-3.5" }), /*#__PURE__*/
    React.createElement("span", null, "Hours")
    ), /*#__PURE__*/
    React.createElement("button", {
      type: "button",
      onClick: () => setMetricMode('POINTS'),
      className: `flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
      metricMode === 'POINTS' ?
      'bg-white text-slate-900 shadow-2xs font-bold' :
      'text-slate-500 hover:text-slate-800'}` }, /*#__PURE__*/


    React.createElement(Zap, { className: "w-3.5 h-3.5" }), /*#__PURE__*/
    React.createElement("span", null, "Points")
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs" }, /*#__PURE__*/
    React.createElement("span", { className: "text-slate-400 font-medium" }, "Sprint Cap:"), /*#__PURE__*/
    React.createElement("input", {
      type: "number",
      "aria-label": "Sprint capacity threshold per member",
      min: "5",
      max: "100",
      value: metricMode === 'HOURS' ? maxSprintCapacity : maxPointsCapacity,
      onChange: (e) => {
        const val = Number(e.target.value) || 40;
        if (metricMode === 'HOURS') setMaxSprintCapacity(val);else
        setMaxPointsCapacity(val);
      },
      className: "w-12 text-center bg-white border border-slate-200 rounded px-1 py-0.5 font-bold text-slate-800 outline-none" }
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-slate-500 font-semibold" }, metricMode === 'HOURS' ? 'h' : 'pts')
    )
    )
    ),


    currentSprint && /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between gap-3 p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/80 text-teal-950 text-xs flex-wrap" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-3 min-w-0" }, /*#__PURE__*/
    React.createElement("div", { className: "w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs" },
    currentSprint.iterationNumber || 'SP'
    ), /*#__PURE__*/
    React.createElement("div", { className: "min-w-0" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /*#__PURE__*/
    React.createElement("span", { className: "font-bold text-sm text-slate-900" },
    currentSprint.iterationNumber ? `Iteration ${currentSprint.iterationNumber}` : currentSprint.name
    ), /*#__PURE__*/
    React.createElement("span", {
      className: `text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
      currentSprint.status === 'ACTIVE' ?
      'bg-emerald-100 text-emerald-800 border border-emerald-300' :
      currentSprint.status === 'PLANNED' ?
      'bg-blue-100 text-blue-800 border border-blue-300' :
      'bg-slate-200 text-slate-700'}` },


    currentSprint.status
    ),
    currentSprint.startDate && currentSprint.endDate && /*#__PURE__*/
    React.createElement("span", { className: "flex items-center gap-1 text-slate-500 text-[11px] font-medium" }, /*#__PURE__*/
    React.createElement(Calendar, { className: "w-3.5 h-3.5 text-slate-400" }),
    currentSprint.startDate, " → ", currentSprint.endDate
    )

    ),
    currentSprint.goal && /*#__PURE__*/
    React.createElement("p", { className: "text-[11px] text-slate-600 truncate max-w-xl mt-0.5" }, /*#__PURE__*/
    React.createElement("strong", null, "Goal:"), " ", currentSprint.goal
    )

    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex items-center gap-2 shrink-0" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] font-bold text-teal-800 bg-white/90 border border-teal-200 px-2.5 py-1 rounded-lg" },
    scopedTasks.length, " Work Items in this Sprint"
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[10px] font-bold text-teal-700 uppercase tracking-wider bg-teal-100/90 px-2 py-1 rounded-lg" }, "1 Sprint Scope"

    )
    )
    ),



    rebalanceHint && /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement(Sparkles, { className: "w-4 h-4 text-amber-600 shrink-0" }), /*#__PURE__*/
    React.createElement("span", null, /*#__PURE__*/
    React.createElement("strong", null, "Sprint Rebalance Suggestion:"), " ", /*#__PURE__*/React.createElement("strong", null, rebalanceHint.overloadedUser), " is overloaded by +", rebalanceHint.excess, metricMode === 'HOURS' ? 'h' : 'pts', ". ", /*#__PURE__*/React.createElement("strong", null, rebalanceHint.availableUser), " has ", rebalanceHint.remaining, metricMode === 'HOURS' ? 'h' : 'pts', " available sprint capacity."
    )
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md shrink-0" }, "Rebalance Recommended"

    )
    ), /*#__PURE__*/



    React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1" }, /*#__PURE__*/
    React.createElement("div", { className: "p-3.5 rounded-xl bg-slate-50 border border-slate-200/80" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] font-semibold text-slate-500 uppercase tracking-wide" }, "Sprint Team Capacity"), /*#__PURE__*/
    React.createElement("div", { className: "flex items-baseline gap-1 mt-1" }, /*#__PURE__*/
    React.createElement("span", { className: "text-xl font-extrabold text-slate-900" }, sprintStats.totalCapacity), /*#__PURE__*/
    React.createElement("span", { className: "text-xs text-slate-500 font-semibold" }, metricMode === 'HOURS' ? 'hours' : 'points')
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] text-slate-400 mt-0.5 block" }, projectMembers.length, " team members")
    ), /*#__PURE__*/

    React.createElement("div", { className: "p-3.5 rounded-xl bg-slate-50 border border-slate-200/80" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] font-semibold text-slate-500 uppercase tracking-wide" }, "Sprint Workload"), /*#__PURE__*/
    React.createElement("div", { className: "flex items-baseline gap-1.5 mt-1" }, /*#__PURE__*/
    React.createElement("span", { className: "text-xl font-extrabold text-slate-900" }, sprintStats.totalAllocated), /*#__PURE__*/
    React.createElement("span", { className: "text-xs text-slate-500 font-semibold" }, metricMode === 'HOURS' ? 'h' : 'pts'), /*#__PURE__*/
    React.createElement("span", { className: "text-xs font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded ml-auto" },
    sprintStats.overallPct, "%"
    )
    ), /*#__PURE__*/
    React.createElement("div", { className: "w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden" }, /*#__PURE__*/
    React.createElement("div", {
      className: "h-full bg-teal-600 rounded-full transition-all duration-500",
      style: { width: `${Math.min(100, sprintStats.overallPct)}%` } }
    )
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] font-semibold text-rose-700 uppercase tracking-wide flex items-center gap-1" }, /*#__PURE__*/
    React.createElement(Flame, { className: "w-3.5 h-3.5 text-rose-600" }), " Overloaded in Sprint"
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex items-baseline gap-1 mt-1" }, /*#__PURE__*/
    React.createElement("span", { className: "text-xl font-extrabold text-rose-900" }, sprintStats.overloadedCount), /*#__PURE__*/
    React.createElement("span", { className: "text-xs text-rose-600 font-semibold" }, "member", sprintStats.overloadedCount === 1 ? '' : 's')
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] text-rose-600/90 mt-0.5 block" },
    sprintStats.overloadedCount > 0 ? `Exceeding ${capacityLimit}${metricMode === 'HOURS' ? 'h' : 'pts'} limit` : 'No one overloaded in sprint!'
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] font-semibold text-emerald-700 uppercase tracking-wide flex items-center gap-1" }, /*#__PURE__*/
    React.createElement(CheckCircle2, { className: "w-3.5 h-3.5 text-emerald-600" }), " Sprint Bandwidth"
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex items-baseline gap-1 mt-1" }, /*#__PURE__*/
    React.createElement("span", { className: "text-xl font-extrabold text-emerald-900" }, sprintStats.bandwidthCount), /*#__PURE__*/
    React.createElement("span", { className: "text-xs text-emerald-600 font-semibold" }, "available")
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] text-emerald-600/90 mt-0.5 block" }, "Ready for more sprint items")
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "flex items-center justify-between gap-3 flex-wrap" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /*#__PURE__*/
    React.createElement("div", { className: "relative" }, /*#__PURE__*/
    React.createElement(Search, { className: "w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" }), /*#__PURE__*/
    React.createElement("input", {
      type: "text",
      placeholder: "Search member, role, or team...",
      value: searchQuery,
      onChange: (e) => setSearchQuery(e.target.value),
      className: "pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-teal-500 w-56 sm:w-64" }
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200 text-xs" }, /*#__PURE__*/
    React.createElement("button", {
      type: "button",
      onClick: () => setStatusFilter('ALL'),
      className: `px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-colors ${
      statusFilter === 'ALL' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}` },

    "All (",
    userWorkloads.length, ")"
    ), /*#__PURE__*/
    React.createElement("button", {
      type: "button",
      onClick: () => setStatusFilter('OVERLOADED'),
      className: `px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-colors ${
      statusFilter === 'OVERLOADED' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-500 hover:text-rose-600'}` },

    "Overloaded (",
    sprintStats.overloadedCount, ")"
    ), /*#__PURE__*/
    React.createElement("button", {
      type: "button",
      onClick: () => setStatusFilter('BANDWIDTH'),
      className: `px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-colors ${
      statusFilter === 'BANDWIDTH' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-emerald-600'}` },

    "Has Bandwidth (",
    sprintStats.bandwidthCount, ")"
    )
    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "text-xs text-slate-500 font-medium" }, "Showing ", /*#__PURE__*/
    React.createElement("span", { className: "font-bold text-slate-800" }, filteredWorkloads.length), " members in this sprint"
    )
    ),


    unassignedTasks.length > 0 && /*#__PURE__*/
    React.createElement("div", { className: "p-4 rounded-2xl bg-amber-50 border border-amber-200/90 space-y-3" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between gap-2 flex-wrap" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2.5 text-xs text-amber-900" }, /*#__PURE__*/
    React.createElement(AlertTriangle, { className: "w-4 h-4 text-amber-600 shrink-0" }), /*#__PURE__*/
    React.createElement("span", { className: "font-bold" },
    unassignedTasks.length, " Unassigned Work Item", unassignedTasks.length === 1 ? '' : 's', " in this Sprint (", unassignedTotal, " ", metricMode === 'HOURS' ? 'hours' : 'points', ")"
    )
    ), /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] text-amber-700 font-semibold bg-amber-100/90 px-2 py-0.5 rounded-lg" }, "Needs allocation in this sprint"

    )
    ), /*#__PURE__*/

    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5" },
    unassignedTasks.slice(0, 6).map((task) => /*#__PURE__*/
    React.createElement("div", {
      key: task.id,
      className: "bg-white p-3 rounded-xl border border-amber-200/70 shadow-2xs space-y-2 text-xs" }, /*#__PURE__*/

    React.createElement("div", { className: "flex items-center justify-between gap-1" }, /*#__PURE__*/
    React.createElement("span", { className: "font-mono text-[11px] font-bold text-slate-500" }, task.issueKey || task.id), /*#__PURE__*/
    React.createElement(PriorityBadge, { priority: task.priority })
    ), /*#__PURE__*/
    React.createElement("p", { className: "font-bold text-slate-800 truncate", title: task.title },
    task.title
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between gap-2 pt-1 border-t border-slate-100" }, /*#__PURE__*/
    React.createElement("span", { className: "text-[11px] text-slate-500 font-semibold" },
    metricMode === 'HOURS' ? `${task.estimatedHours || 3} hrs` : `${task.storyPoints || 2} pts`
    ), /*#__PURE__*/
    React.createElement("select", {
      "aria-label": `Assign ${task.issueKey || task.title}`,
      onChange: (e) => handleReassignTask(task.id, e.target.value),
      defaultValue: "",
      className: "text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-2 py-1 outline-none cursor-pointer" }, /*#__PURE__*/

    React.createElement("option", { value: "", disabled: true }, "Assign to..."),
    projectMembers.map((m) => /*#__PURE__*/
    React.createElement("option", { key: m.id, value: m.id },
    m.name
    )
    )
    )
    )
    )
    )
    )
    ),



    scopedTasks.length === 0 && /*#__PURE__*/
    React.createElement("div", { className: "p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-3" }, /*#__PURE__*/
    React.createElement("div", { className: "w-12 h-12 mx-auto rounded-full bg-teal-50 flex items-center justify-center text-teal-600" }, /*#__PURE__*/
    React.createElement(Layers, { className: "w-6 h-6" })
    ), /*#__PURE__*/
    React.createElement("div", { className: "space-y-1" }, /*#__PURE__*/
    React.createElement("h3", { className: "text-sm font-bold text-slate-800" }, "No work items assigned to ",
    currentSprint?.iterationNumber ? `Iteration ${currentSprint.iterationNumber}` : currentSprint?.name || 'this sprint'
    ), /*#__PURE__*/
    React.createElement("p", { className: "text-xs text-slate-500 max-w-md mx-auto" }, "This sprint currently has 0 tasks planned. All team members have 100% capacity (",
    capacityLimit, metricMode === 'HOURS' ? 'h' : 'pts', ") available for this sprint cycle. You can move tasks from the Backlog into this iteration in the Work Queue tab."
    )
    )
    ), /*#__PURE__*/



    React.createElement("div", { className: "space-y-3" },
    filteredWorkloads.map((item) => {
      const { member, tasks: userTasks } = item;
      const isExpanded = expandedUsers.has(member.id);

      // Segments percentages
      const donePct = capacityLimit > 0 ? (metricMode === 'HOURS' ? item.hoursDone : item.pointsDone) / capacityLimit * 100 : 0;
      const inProgressPct = capacityLimit > 0 ? (metricMode === 'HOURS' ? item.hoursInProgress : item.pointsInProgress) / capacityLimit * 100 : 0;
      const todoPct = capacityLimit > 0 ? (metricMode === 'HOURS' ? item.hoursTodo : item.pointsTodo) / capacityLimit * 100 : 0;

      return (/*#__PURE__*/
        React.createElement("div", {
          key: member.id,
          className: `bg-white rounded-2xl border transition-all shadow-2xs overflow-hidden ${
          item.isOverloaded ?
          'border-rose-200 ring-1 ring-rose-300' :
          'border-slate-200/90 hover:border-slate-300'}` }, /*#__PURE__*/



        React.createElement("div", { className: "p-4 sm:p-5 space-y-3.5" }, /*#__PURE__*/
        React.createElement("div", { className: "flex items-center justify-between gap-3 flex-wrap" }, /*#__PURE__*/

        React.createElement("div", { className: "flex items-center gap-3 min-w-0" }, /*#__PURE__*/
        React.createElement(Avatar, {
          name: member.name,
          color: member.avatarColor,
          imageUrl: member.avatarUrl,
          size: "md" }
        ), /*#__PURE__*/
        React.createElement("div", { className: "min-w-0" }, /*#__PURE__*/
        React.createElement("div", { className: "flex items-center gap-2" }, /*#__PURE__*/
        React.createElement("span", { className: "font-bold text-sm text-slate-900 truncate" }, member.name), /*#__PURE__*/
        React.createElement("span", { className: "text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md" },
        item.teamName
        )
        ), /*#__PURE__*/
        React.createElement("p", { className: "text-xs text-slate-400 truncate" },
        member.jobTitle || member.role, " • ", item.taskCount, " item", item.taskCount === 1 ? '' : 's', " in this sprint"
        )
        )
        ), /*#__PURE__*/


        React.createElement("div", { className: "flex items-center gap-3 flex-shrink-0" }, /*#__PURE__*/
        React.createElement("div", { className: "text-right" }, /*#__PURE__*/
        React.createElement("div", { className: "flex items-center gap-1.5 justify-end" }, /*#__PURE__*/
        React.createElement("span", { className: "text-base font-extrabold text-slate-900" },
        item.totalAllocated
        ), /*#__PURE__*/
        React.createElement("span", { className: "text-xs font-semibold text-slate-400" }, "/ ",
        capacityLimit, " ", metricMode === 'HOURS' ? 'h' : 'pts'
        )
        ), /*#__PURE__*/
        React.createElement("div", { className: "text-[11px] font-semibold" },
        item.isOverloaded ? /*#__PURE__*/
        React.createElement("span", { className: "text-rose-600 font-bold flex items-center gap-1 justify-end" }, /*#__PURE__*/
        React.createElement(Flame, { className: "w-3 h-3" }), " +", item.excess, metricMode === 'HOURS' ? 'h' : 'pts', " Overloaded (", item.pct, "%)"
        ) :
        item.hasBandwidth ? /*#__PURE__*/
        React.createElement("span", { className: "text-emerald-600 font-bold flex items-center gap-1 justify-end" }, /*#__PURE__*/
        React.createElement(Check, { className: "w-3 h-3" }), " ", item.remaining, metricMode === 'HOURS' ? 'h' : 'pts', " Free (", item.pct, "%)"
        ) : /*#__PURE__*/

        React.createElement("span", { className: "text-amber-600 font-bold" }, "Balanced (",
        item.pct, "%)"
        )

        )
        ), /*#__PURE__*/

        React.createElement("button", {
          type: "button",
          onClick: () => toggleExpand(member.id),
          className: "p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer",
          title: isExpanded ? 'Hide sprint items' : 'View sprint items' },

        isExpanded ? /*#__PURE__*/React.createElement(ChevronDown, { className: "w-4 h-4" }) : /*#__PURE__*/React.createElement(ChevronRight, { className: "w-4 h-4" })
        )
        )
        ), /*#__PURE__*/


        React.createElement("div", { className: "space-y-1" }, /*#__PURE__*/
        React.createElement("div", { className: "relative w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner" }, /*#__PURE__*/

        React.createElement("div", {
          className: "h-full bg-emerald-500 transition-all duration-300",
          style: { width: `${Math.min(100, donePct)}%` },
          title: `Completed in sprint: ${metricMode === 'HOURS' ? item.hoursDone : item.pointsDone} ${metricMode === 'HOURS' ? 'h' : 'pts'}` }
        ), /*#__PURE__*/

        React.createElement("div", {
          className: "h-full bg-sky-500 transition-all duration-300",
          style: { width: `${Math.min(100 - donePct, inProgressPct)}%` },
          title: `Active in sprint: ${metricMode === 'HOURS' ? item.hoursInProgress : item.pointsInProgress} ${metricMode === 'HOURS' ? 'h' : 'pts'}` }
        ), /*#__PURE__*/

        React.createElement("div", {
          className: "h-full bg-slate-400 transition-all duration-300",
          style: { width: `${Math.min(100 - (donePct + inProgressPct), todoPct)}%` },
          title: `To Do in sprint: ${metricMode === 'HOURS' ? item.hoursTodo : item.pointsTodo} ${metricMode === 'HOURS' ? 'h' : 'pts'}` }
        ),

        item.isOverloaded && /*#__PURE__*/
        React.createElement("div", {
          className: "h-full bg-rose-500 animate-pulse transition-all duration-300",
          style: { width: '100%' },
          title: `Sprint Overload: +${item.excess} ${metricMode === 'HOURS' ? 'h' : 'pts'}` }
        )

        ), /*#__PURE__*/


        React.createElement("div", { className: "flex items-center justify-between text-[11px] text-slate-500 pt-0.5" }, /*#__PURE__*/
        React.createElement("div", { className: "flex items-center gap-3" }, /*#__PURE__*/
        React.createElement("span", { className: "inline-flex items-center gap-1 font-medium text-emerald-700" }, /*#__PURE__*/
        React.createElement("span", { className: "w-2 h-2 rounded-full bg-emerald-500" }), " Done (", metricMode === 'HOURS' ? `${item.hoursDone}h` : `${item.pointsDone}p`, ")"
        ), /*#__PURE__*/
        React.createElement("span", { className: "inline-flex items-center gap-1 font-medium text-sky-700" }, /*#__PURE__*/
        React.createElement("span", { className: "w-2 h-2 rounded-full bg-sky-500" }), " Active (", metricMode === 'HOURS' ? `${item.hoursInProgress}h` : `${item.pointsInProgress}p`, ")"
        ), /*#__PURE__*/
        React.createElement("span", { className: "inline-flex items-center gap-1 font-medium text-slate-600" }, /*#__PURE__*/
        React.createElement("span", { className: "w-2 h-2 rounded-full bg-slate-400" }), " To Do (", metricMode === 'HOURS' ? `${item.hoursTodo}h` : `${item.pointsTodo}p`, ")"
        )
        ), /*#__PURE__*/

        React.createElement("div", { className: "text-slate-400" }, "Sprint Limit: ",
        capacityLimit, " ", metricMode === 'HOURS' ? 'hours' : 'points'
        )
        )
        )
        ),


        isExpanded && /*#__PURE__*/
        React.createElement("div", { className: "border-t border-slate-100 bg-slate-50/70 p-4 space-y-2" }, /*#__PURE__*/
        React.createElement("div", { className: "flex items-center justify-between mb-2" }, /*#__PURE__*/
        React.createElement("span", { className: "text-xs font-bold text-slate-700 uppercase tracking-wide" }, "Assigned Sprint Items (",
        userTasks.length, ")"
        ), /*#__PURE__*/
        React.createElement("span", { className: "text-[11px] text-slate-400" }, "Reassign within sprint to balance workload"

        )
        ),

        userTasks.length === 0 ? /*#__PURE__*/
        React.createElement("p", { className: "text-xs text-slate-400 italic py-2" }, "No work items assigned to this member in this sprint cycle.") : /*#__PURE__*/

        React.createElement("div", { className: "divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden" },
        userTasks.map((task) => /*#__PURE__*/
        React.createElement("div", {
          key: task.id,
          className: "flex items-center justify-between gap-3 p-3 hover:bg-slate-50/80 transition-colors text-xs" }, /*#__PURE__*/

        React.createElement("div", { className: "flex items-center gap-2.5 min-w-0" }, /*#__PURE__*/
        React.createElement("span", { className: "font-mono text-[11px] font-bold text-slate-500 shrink-0" },
        task.issueKey || task.id
        ), /*#__PURE__*/
        React.createElement("span", { className: "font-bold text-slate-800 truncate", title: task.title },
        task.title
        )
        ), /*#__PURE__*/

        React.createElement("div", { className: "flex items-center gap-3 shrink-0" }, /*#__PURE__*/
        React.createElement(StatusBadge, { status: task.status }), /*#__PURE__*/
        React.createElement(PriorityBadge, { priority: task.priority }), /*#__PURE__*/
        React.createElement("span", { className: "font-mono font-bold text-slate-700 w-12 text-right" },
        metricMode === 'HOURS' ? `${task.estimatedHours || 3}h` : `${task.storyPoints || 2}p`
        ), /*#__PURE__*/


        React.createElement("select", {
          "aria-label": `Reassign ${task.issueKey || task.title}`,
          value: task.assigneeId || '',
          onChange: (e) => handleReassignTask(task.id, e.target.value),
          className: "text-[11px] font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 outline-none cursor-pointer" },

        projectMembers.map((m) => /*#__PURE__*/
        React.createElement("option", { key: m.id, value: m.id },
        m.name, " ", m.id === member.id ? '(Current)' : ''
        )
        ), /*#__PURE__*/
        React.createElement("option", { value: "" }, "Unassign")
        )
        )
        )
        )
        )

        )

        ));

    })
    )
    ));

};