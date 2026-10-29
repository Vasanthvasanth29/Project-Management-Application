import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowRight, CalendarCheck, CheckCircle2, ClipboardList, FolderKanban, Hourglass, Info, Lock, LogOut, Sparkles, Timer, } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge, PriorityBadge } from '../../components/common/Badges';
import { EmptyState } from '../../components/common/EmptyState';
import { issuePath } from '../../utils/issueUrl';
import { resolveIssueKey } from '../../utils/issueKeyResolver';
import { getProjectUrl } from '../../utils/idUtils';
import { getTrialStatus, splitRemaining } from '../../utils/trialStatus';
import { getTrialProjects, TRIAL_INCLUDED_FEATURES, TRIAL_LOCKED_FEATURES } from '../../utils/trialAccess';
import { trial } from '../../config/siteConfig';
/**
 * Dashboard for 7-Day Limited Trial accounts. Shows the trial window, the
 * sample project the trial can open, its work items, and the premium features
 * that stay locked. The Admin and role dashboards are untouched.
 */
const formatDate = (iso) => format(new Date(iso), 'EEE d MMM yyyy');
const RECENT_LIMIT = 6;
const useNow = (intervalMs) => {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = window.setInterval(() => setNow(Date.now()), intervalMs);
        return () => window.clearInterval(id);
    }, [intervalMs]);
    return now;
};
export const TrialDashboard = () => {
    const navigate = useNavigate();
    const { currentUser, logout } = useAuthStore();
    const { projects, tasks } = useAppStore();
    const now = useNow(60000);
    const status = getTrialStatus(currentUser?.subscription?.startedAt, now, currentUser?.subscription?.durationDays);
    const { days, hours } = splitRemaining(status.remainingMs);
    const expired = status.state === 'expired';
    const trialProjects = getTrialProjects(currentUser, projects);
    const trialProjectIds = trialProjects.map((p) => p.id);
    const trialTasks = tasks.filter((t) => trialProjectIds.includes(t.projectId));
    const openTasks = trialTasks.filter((t) => t.status !== 'DONE');
    const inProgress = trialTasks.filter((t) => t.status === 'IN_PROGRESS');
    const done = trialTasks.filter((t) => t.status === 'DONE');
    const recent = openTasks.slice(0, RECENT_LIMIT);
    return (<div className="space-y-6 animate-fade-in w-full max-w-[1100px]">
      {/* Trial banner */}
      <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8 mt-12 lg:mt-0" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #78350f 100%)' }}>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#f59e0b]/15 text-[#fbbf24] text-xs font-bold mb-3 border border-[#f59e0b]/30">
              <Hourglass className="w-3.5 h-3.5" aria-hidden="true"/>
              {trial.durationDays}-Day Limited Trial
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight font-display">
              Welcome, {currentUser?.name.split(' ')[0]}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              {expired
            ? 'Your limited trial has ended. No charge was made and nothing renews automatically.'
            : 'Explore the core of FlowExec on a sample project. Premium features stay locked during the trial.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <Link to="/pricing" id="trial-view-plans" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-[#0a0f1e] bg-[#fbbf24] hover:bg-[#f59e0b] transition-colors">
              <Sparkles className="w-4 h-4" aria-hidden="true"/>
              {expired ? 'Upgrade Plan' : 'View Plans'}
            </Link>
            {/* The global Topbar (and its sign-out) only renders on role dashboards. */}
            <button type="button" id="trial-sign-out" onClick={() => { logout(); navigate('/'); }} className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-white/10 border border-white/20 hover:bg-white/20 transition-colors">
              <LogOut className="w-4 h-4" aria-hidden="true"/>
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Trial window */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Trial started" value={status.startedAt ? formatDate(status.startedAt) : '—'} icon={CalendarCheck} iconColor="#0d9488" iconBg="#ccfbf1"/>
        <StatCard title={expired ? 'Trial expired' : 'Trial expires'} value={status.expiresAt ? formatDate(status.expiresAt) : '—'} icon={Hourglass} iconColor="#d97706" iconBg="#fef3c7"/>
        <StatCard title="Days remaining" value={expired ? 'Ended' : `${days}d ${hours}h`} icon={Timer} iconColor={expired ? '#ef4444' : '#0284c7'} iconBg={expired ? '#fee2e2' : '#e0f2fe'} badge={!expired && days < 2 ? 'Ending soon' : undefined} badgeColor="badge-amber"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Trial projects */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#f1f5f9]">
              <h2 className="section-title mb-0">Your trial project</h2>
              <span className="text-xs text-[#6b7280]">Trial access: sample project only</span>
            </div>
            {trialProjects.length === 0 ? (<EmptyState icon={FolderKanban} title="No trial project available" description="The sample project could not be found."/>) : (<div className="space-y-3">
                {trialProjects.map((project) => (<button key={project.id} type="button" onClick={() => navigate(getProjectUrl(project, 'MEMBER'))} className="w-full text-left card p-4 hover:border-[#0d9488]/40 transition-colors group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-[#0d9488]">{project.key}</span>
                        <p className="font-semibold text-[#1a1d23] truncate">{project.name}</p>
                        <p className="text-xs text-[#6b7280] mt-1 line-clamp-2">{project.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#9ca3af] group-hover:text-[#0d9488] flex-shrink-0 mt-1" aria-hidden="true"/>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#4b5563]">
                      <span><strong className="text-[#1a1d23]">{openTasks.length}</strong> open</span>
                      <span><strong className="text-[#1a1d23]">{inProgress.length}</strong> in progress</span>
                      <span><strong className="text-[#1a1d23]">{done.length}</strong> done</span>
                    </div>
                  </button>))}
              </div>)}
          </div>

          {/* Work items */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#f1f5f9]">
              <h2 className="section-title mb-0">Open work items</h2>
              <span className="text-xs text-[#6b7280]">Showing {recent.length} of {openTasks.length}</span>
            </div>
            {recent.length === 0 ? (<EmptyState icon={ClipboardList} title="No open work items" description="Everything in the trial project is done."/>) : (<ul className="divide-y divide-[#f1f5f9]">
                {recent.map((task) => {
                const project = trialProjects.find((p) => p.id === task.projectId);
                return (<li key={task.id}>
                      <button type="button" onClick={() => navigate(issuePath(task))} className="w-full text-left py-3 flex items-center gap-3 hover:bg-[#f8fafc] rounded-lg px-2 -mx-2">
                        <span className="text-[11px] font-bold text-[#0d9488] w-24 flex-shrink-0 truncate">{resolveIssueKey(project, task)}</span>
                        <span className="flex-1 min-w-0 text-sm text-[#1a1d23] truncate">{task.title}</span>
                        <StatusBadge status={task.status}/>
                        <span className="hidden sm:inline"><PriorityBadge priority={task.priority}/></span>
                      </button>
                    </li>);
            })}
              </ul>)}
          </div>
        </div>

        <div className="space-y-6">
          {/* Included */}
          <div className="card p-6">
            <h2 className="section-title">Included in your trial</h2>
            <ul className="space-y-2.5">
              {TRIAL_INCLUDED_FEATURES.map((feature) => (<li key={feature} className="flex items-start gap-2 text-sm text-[#1a1d23]">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#0d9488]" aria-hidden="true"/>
                  {feature}
                </li>))}
            </ul>
          </div>

          {/* Locked premium */}
          <div className="card p-6 border-[#fcd34d] bg-[#fffbeb]">
            <h2 className="section-title flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#b45309]" aria-hidden="true"/>
              Premium features — locked
            </h2>
            <ul className="space-y-2.5">
              {TRIAL_LOCKED_FEATURES.map((feature) => (<li key={feature} className="flex items-start gap-2 text-sm text-[#6b7280]">
                  <Lock className="w-3.5 h-3.5 mt-1 flex-shrink-0 text-[#9ca3af]" aria-label="Locked"/>
                  {feature}
                </li>))}
            </ul>
            <Link to="/pricing" className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[#0d9488] hover:bg-[#0f766e] transition-colors">
              <Sparkles className="w-4 h-4" aria-hidden="true"/>
              Upgrade Plan
            </Link>
          </div>

          <p className="text-xs text-[#6b7280] flex items-start gap-1.5 px-1">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden="true"/>
            Trial scope is a preview pending business approval and is applied in this browser only.
          </p>
        </div>
      </div>
    </div>);
};
export default TrialDashboard;
