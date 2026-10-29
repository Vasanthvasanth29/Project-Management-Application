import React from 'react';
import { CheckCircle2, Circle, Clock, Download, GitBranch, MessageSquare, Rocket, Send, SlidersHorizontal, TrendingUp, } from 'lucide-react';
import { Avatar } from '../../components/common/Avatar';
import { ProgressBar } from '../../components/common/ProgressBar';
import { StatusBadge, PriorityBadge } from '../../components/common/Badges';
import { StatCard } from '../../components/common/StatCard';
/**
 * Feature illustrations for the marketing homepage. Each one is a small,
 * static composition of the real product UI (same components, colours and
 * column names the app uses) and is exposed as a single labelled image to
 * assistive technology.
 */
const Frame = ({ label, className = '', children }) => (<div className={`rounded-2xl border border-[#e2e5ea] bg-white shadow-fe-lg overflow-hidden ${className}`} role="img" aria-label={label}>
    <div aria-hidden="true">{children}</div>
  </div>);
/* ------------------------------------------------------------------ */
/* 1. Task management                                                  */
/* ------------------------------------------------------------------ */
export const TaskBoardMock = () => (<Frame label="Kanban board illustration with work items in Queued, Executing and Delivered columns.">
    <div className="flex items-center justify-between px-4 py-3 border-b border-[#e2e5ea] bg-[#f8fafc]">
      <span className="text-xs font-bold text-[#1a1d23]">Board · Commerce Platform</span>
      <span className="badge-teal text-[10px]">Drag &amp; drop</span>
    </div>
    <div className="grid grid-cols-3 gap-2 p-3 bg-[#f4f6f9]">
      {[
        {
            label: 'Queued',
            dot: 'bg-[#94a3b8]',
            items: [
                { key: 'ECOMM-412', title: 'Checkout address validation', status: 'TODO', priority: 'HIGH' },
                { key: 'ECOMM-418', title: 'Update confirmation copy', status: 'TODO', priority: 'MEDIUM' },
            ],
        },
        {
            label: 'Executing',
            dot: 'bg-[#0d9488]',
            items: [
                { key: 'ECOMM-399', title: 'Payment retry flow', status: 'IN_PROGRESS', priority: 'CRITICAL' },
                { key: 'ECOMM-407', title: 'Refund webhook handler', status: 'IN_PROGRESS', priority: 'HIGH' },
            ],
        },
        {
            label: 'Delivered',
            dot: 'bg-[#10b981]',
            items: [
                { key: 'ECOMM-375', title: 'Guest checkout toggle', status: 'DONE', priority: 'MEDIUM' },
            ],
        },
    ].map((column) => (<div key={column.label} className="min-w-0">
          <div className="flex items-center gap-1.5 mb-2">
            <span className={`w-2 h-2 rounded-full ${column.dot}`}/>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4b5563] truncate">
              {column.label}
            </span>
          </div>
          <div className="space-y-2">
            {column.items.map((item) => (<div key={item.key} className="bg-white rounded-lg border border-[#e2e5ea] p-2.5 shadow-fe-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-bold text-[#0d9488]">{item.key}</span>
                  <Circle className="w-2.5 h-2.5 text-[#cbd5e1]"/>
                </div>
                <p className="text-[11px] font-semibold text-[#1a1d23] leading-tight mb-2">
                  {item.title}
                </p>
                <div className="flex flex-wrap items-center gap-1">
                  <StatusBadge status={item.status}/>
                  <PriorityBadge priority={item.priority}/>
                </div>
              </div>))}
          </div>
        </div>))}
    </div>
  </Frame>);
/* ------------------------------------------------------------------ */
/* 2. Iteration planning                                               */
/* ------------------------------------------------------------------ */
export const IterationMock = () => (<Frame label="Iteration planning illustration showing an active iteration, its progress and program increment structure.">
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="badge-amber text-[10px]">ACTIVE</span>
        <span className="text-xs font-bold text-[#1a1d23]">Iteration 3 · 9–20 Jun</span>
        <span className="ml-auto badge-teal text-[10px]">PI 2026.2</span>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold text-[#1a1d23]">Iteration progress</span>
          <span className="text-[11px] font-semibold text-[#0d9488]">68%</span>
        </div>
        <ProgressBar value={68} height="sm" showLabel={false}/>
      </div>

      <div className="rounded-xl border border-[#e2e5ea] bg-[#f8fafc] p-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] mb-2.5">
          Program increment plan
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
        { name: 'Sprint 1', state: 'COMPLETED', pct: 100, color: '#10b981' },
        { name: 'Sprint 2', state: 'COMPLETED', pct: 100, color: '#10b981' },
        { name: 'Sprint 3', state: 'ACTIVE', pct: 68, color: '#0d9488' },
    ].map((sprint) => (<div key={sprint.name} className="bg-white rounded-lg border border-[#e2e5ea] p-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sprint.color }}/>
                <span className="text-[10px] font-bold text-[#1a1d23]">{sprint.name}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#f1f5f9] overflow-hidden mb-1.5">
                <div className="h-full rounded-full" style={{ width: `${sprint.pct}%`, backgroundColor: sprint.color }}/>
              </div>
              <span className="text-[9px] font-semibold text-[#9ca3af]">{sprint.state}</span>
            </div>))}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="flex items-center gap-1.5 text-[#4b5563]">
          <Clock className="w-3.5 h-3.5 text-[#f59e0b]"/>
          14 of 21 days elapsed
        </span>
        <span className="flex items-center gap-1.5 font-semibold text-[#059669]">
          <TrendingUp className="w-3.5 h-3.5"/>
          Velocity 42 pts
        </span>
      </div>
    </div>
  </Frame>);
/* ------------------------------------------------------------------ */
/* 3. Team collaboration                                               */
/* ------------------------------------------------------------------ */
export const CollaborationMock = () => (<Frame label="Collaboration illustration with a work item comment thread, mention and activity notification.">
    <div className="p-4 space-y-3.5">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-[#0d9488]">ECOMM-399</span>
        <span className="text-xs font-bold text-[#1a1d23] truncate">Payment retry flow</span>
        <span className="badge-indigo text-[10px] ml-auto">In Review</span>
      </div>

      <div className="space-y-2.5">
        <div className="flex gap-2.5">
          <Avatar name="Sofia Marino" color="#d97706" size="sm"/>
          <div className="min-w-0 flex-1 bg-[#f8fafc] border border-[#e2e5ea] rounded-xl rounded-tl-sm px-3 py-2">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="text-[11px] font-bold text-[#1a1d23]">Sofia Marino</span>
              <span className="text-[9px] text-[#9ca3af]">09:41</span>
            </div>
            <p className="text-[11px] text-[#4b5563] leading-snug">
              Retry webhook is ready for review — added the idempotency guard we discussed.
            </p>
          </div>
        </div>

        <div className="flex gap-2.5">
          <Avatar name="Liam Chen" color="#6366f1" size="sm"/>
          <div className="min-w-0 flex-1 bg-[#f0fdfa] border border-[#99f6e4] rounded-xl rounded-tl-sm px-3 py-2">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="text-[11px] font-bold text-[#1a1d23]">Liam Chen</span>
              <span className="text-[9px] text-[#9ca3af]">09:46</span>
            </div>
            <p className="text-[11px] text-[#4b5563] leading-snug">
              <span className="font-bold text-[#0d9488]">@Amara Okafor</span> can you re-verify the
              bug fix before we move it to Delivered?
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-[#eef2ff] border border-[#d2e3fc] px-3 py-2">
        <MessageSquare className="w-3.5 h-3.5 text-[#4f46e5] flex-shrink-0"/>
        <span className="text-[10px] text-[#3730a3] font-medium truncate">
          Notification sent to 3 watchers · Activity logged
        </span>
      </div>

      <div className="flex items-center gap-2 border border-[#e2e5ea] rounded-xl px-3 py-2">
        <Avatar name="Amara Okafor" color="#0f766e" size="xs"/>
        <span className="text-[11px] text-[#9ca3af] flex-1 truncate">Add a comment…</span>
        <Send className="w-3.5 h-3.5 text-[#0d9488]"/>
      </div>
    </div>
  </Frame>);
/* ------------------------------------------------------------------ */
/* 5. Role-based access                                                */
/* ------------------------------------------------------------------ */
const ROLE_ROWS = [
    {
        role: 'Admin',
        badgeClass: 'badge-purple',
        scope: 'Full system administration',
        chips: ['Users & roles', 'All projects', 'Audit log'],
    },
    {
        role: 'Project Manager',
        badgeClass: 'badge-teal',
        scope: 'Projects and programmes',
        chips: ['Create projects', 'Workflows', 'Roadmaps & health'],
    },
    {
        role: 'Team Leader',
        badgeClass: 'badge-blue',
        scope: 'Team and sprint delivery',
        chips: ['Manage members', 'Assign work', 'Run iterations'],
    },
    {
        role: 'Member',
        badgeClass: 'badge-gray',
        scope: 'Own work items',
        chips: ['Update own work', 'Comment', 'View project'],
    },
];
export const AccessMock = () => (<Frame label="Role-based access illustration showing Admin, Project Manager, Team Leader and Member roles with their permissions.">
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#1a1d23]">Roles &amp; permissions</span>
        <span className="badge-teal text-[10px]">4 roles</span>
      </div>

      {ROLE_ROWS.map((row) => (<div key={row.role} className="rounded-xl border border-[#e2e5ea] bg-white p-3 shadow-fe-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`${row.badgeClass} text-xs`}>{row.role}</span>
            <span className="text-xs text-[#9ca3af]">{row.scope}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {row.chips.map((chip) => (<span key={chip} className="inline-flex items-center gap-1 rounded-lg bg-[#f0fdfa] border border-[#99f6e4] px-2 py-0.5 text-[11px] font-semibold text-[#0f766e]">
                <CheckCircle2 className="w-3 h-3" aria-hidden="true"/>
                {chip}
              </span>))}
          </div>
        </div>))}
    </div>
  </Frame>);
/* ------------------------------------------------------------------ */
/* 4. Reporting                                                        */
/* ------------------------------------------------------------------ */
export const ReportingMock = () => (<Frame label="Reporting illustration with delivery statistics, an iteration velocity chart and a PDF export action.">
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard title="Delivered" value="36" icon={CheckCircle2} iconColor="#059669" iconBg="#d1fae5" trend={12} trendLabel="vs last iteration"/>
        <StatCard title="Open bugs" value="7" icon={Circle} iconColor="#dc2626" iconBg="#fee2e2"/>
      </div>

      <div className="rounded-xl border border-[#e2e5ea] p-3.5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-[#1a1d23]">Iteration velocity</span>
          <span className="text-[10px] font-semibold text-[#9ca3af]">Story points</span>
        </div>
        <div className="flex items-end gap-2 h-24">
          {[28, 34, 31, 39, 36, 42].map((value, index) => (<div key={index} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-md" style={{
            height: `${(value / 45) * 100}%`,
            background: index === 5
                ? 'linear-gradient(180deg, #0d9488, #06b6d4)'
                : '#ccfbf1',
        }}/>
              <span className="text-[8px] font-semibold text-[#9ca3af]">S{index + 1}</span>
            </div>))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="btn-primary btn-xs pointer-events-none">
          <Download className="w-3 h-3"/>
          Export PDF
        </span>
        <span className="btn-secondary btn-xs pointer-events-none">Sprint report</span>
        <span className="btn-secondary btn-xs pointer-events-none">Roadmap summary</span>
      </div>
    </div>
  </Frame>);
/* ------------------------------------------------------------------ */
/* 6. Cross-project roadmap timeline                                   */
/* ------------------------------------------------------------------ */
const ROADMAP_LANES = [
    {
        project: 'Commerce Platform',
        dot: '#0d9488',
        bars: [
            { label: 'Checkout v2', left: 4, width: 38, color: 'linear-gradient(90deg,#0d9488,#14b8a6)' },
            { label: 'Loyalty', left: 48, width: 30, color: 'linear-gradient(90deg,#5eead4,#99f6e4)' },
        ],
    },
    {
        project: 'Mobile App',
        dot: '#6366f1',
        bars: [
            { label: 'Offline mode', left: 14, width: 44, color: 'linear-gradient(90deg,#4f46e5,#818cf8)' },
            { label: 'Push beta', left: 64, width: 26, color: 'linear-gradient(90deg,#c7d2fe,#e0e7ff)' },
        ],
    },
    {
        project: 'Data Platform',
        dot: '#d97706',
        bars: [
            { label: 'Warehouse migration', left: 8, width: 52, color: 'linear-gradient(90deg,#d97706,#f59e0b)' },
            { label: 'Lineage', left: 66, width: 24, color: 'linear-gradient(90deg,#fde68a,#fef3c7)' },
        ],
    },
];
export const RoadmapMock = () => (<Frame label="Cross-project roadmap illustration with delivery timelines for three projects, milestone markers and a today line.">
    <div className="p-4 space-y-3.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#1a1d23]">Cross-project roadmap</span>
        <span className="badge-teal text-[10px]">2026 H2</span>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <div className="relative min-w-[420px]">
          {/* Month scale */}
          <div className="flex justify-between text-[9px] font-semibold text-[#9ca3af] pl-[92px] pb-1.5">
            <span>Jul</span>
            <span>Aug</span>
            <span>Sep</span>
            <span>Oct</span>
            <span>Nov</span>
          </div>

          <div className="relative rounded-xl border border-[#e2e5ea] bg-[#f8fafc] p-2.5 space-y-2.5">
            {/* Today marker */}
            <span className="absolute top-0 bottom-0 w-px bg-[#f59e0b]/70" style={{ left: '58%' }} aria-hidden="true"/>
            <span className="absolute -top-0.5 text-[8px] font-bold text-[#b45309] bg-[#fffbeb] border border-[#fde68a] rounded px-1" style={{ left: '58%', transform: 'translateX(-50%)' }}>
              Today
            </span>

            {ROADMAP_LANES.map((lane) => (<div key={lane.project} className="flex items-center gap-2">
                <span className="w-[84px] shrink-0 flex items-center gap-1.5 text-[10px] font-bold text-[#1a1d23] truncate">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: lane.dot }}/>
                  {lane.project}
                </span>
                <div className="relative flex-1 h-6">
                  {lane.bars.map((bar) => (<span key={bar.label} className="absolute top-1/2 -translate-y-1/2 h-4 rounded-md flex items-center px-1.5 text-[8px] font-bold text-white whitespace-nowrap overflow-hidden" style={{ left: `${bar.left}%`, width: `${bar.width}%`, background: bar.color }}>
                      {bar.label}
                    </span>))}
                </div>
              </div>))}
          </div>

          {/* Milestones */}
          <div className="mt-2.5 flex items-center gap-3 pl-[92px] text-[9px] font-semibold text-[#4b5563]">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rotate-45 bg-[#0d9488]" aria-hidden="true"/> Beta cut
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rotate-45 bg-[#6366f1]" aria-hidden="true"/> PI review
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rotate-45 bg-[#d97706]" aria-hidden="true"/> GA release
            </span>
          </div>
        </div>
      </div>
    </div>
  </Frame>);
/* ------------------------------------------------------------------ */
/* 7. Burndown chart                                                   */
/* ------------------------------------------------------------------ */
export const BurndownMock = () => (<Frame label="Sprint burndown illustration comparing the ideal trend with actual remaining work and a forecast to the sprint goal.">
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#1a1d23]">Iteration burndown</span>
        <span className="badge-amber text-[10px]">Day 14 / 21</span>
      </div>

      <svg viewBox="0 0 280 120" className="w-full h-auto" role="presentation" aria-hidden="true">
        {/* Grid */}
        {[12, 38, 64, 90].map((y) => (<line key={y} x1="10" x2="270" y1={y} y2={y} stroke="#eef1f5" strokeWidth="1"/>))}
        <line x1="10" x2="270" y1="104" y2="104" stroke="#e2e5ea" strokeWidth="1"/>

        {/* Ideal trend */}
        <path d="M10 12 L270 104" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4"/>
        {/* Actual remaining work */}
        <path d="M10 12 L47 24 L84 38 L121 44 L158 60 L195 68 L232 86" fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {/* Forecast to sprint end */}
        <path d="M232 86 L270 96" fill="none" stroke="#14b8a6" strokeWidth="2" strokeDasharray="3 4"/>
        {/* Today dot */}
        <circle cx="232" cy="86" r="3.5" fill="#0d9488"/>
        <circle cx="232" cy="86" r="6" fill="#0d9488" fillOpacity="0.18"/>
      </svg>

      <div className="flex items-center justify-between text-[10px] font-semibold text-[#9ca3af]">
        <span>D1</span>
        <span>D7</span>
        <span>D14</span>
        <span>D21</span>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold text-[#4b5563]">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded-full bg-[#cbd5e1]" aria-hidden="true"/> Ideal
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded-full bg-[#0d9488]" aria-hidden="true"/> Remaining
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded-full bg-[#14b8a6]" aria-hidden="true"/> Forecast
        </span>
        <span className="ml-auto inline-flex items-center gap-1 font-bold text-[#0f766e]">
          <TrendingUp className="w-3 h-3" aria-hidden="true"/>
          4 pts ahead
        </span>
      </div>
    </div>
  </Frame>);
/* ------------------------------------------------------------------ */
/* 8. Team capacity                                                    */
/* ------------------------------------------------------------------ */
const CAPACITY_ROWS = [
    { name: 'Amara Okafor', color: '#0f766e', load: 92, state: 'Overloaded', stateColor: '#ef4444' },
    { name: 'Liam Chen', color: '#6366f1', load: 74, state: 'Near capacity', stateColor: '#f59e0b' },
    { name: 'Sofia Marino', color: '#d97706', load: 58, state: 'Available', stateColor: '#10b981' },
    { name: 'Noah Patel', color: '#0891b2', load: 41, state: 'Available', stateColor: '#10b981' },
];
export const CapacityMock = () => (<Frame label="Team capacity illustration showing each member's workload against capacity with overloaded, near-capacity and available states.">
    <div className="p-4 space-y-3.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#1a1d23]">Team capacity</span>
        <span className="badge-teal text-[10px]">78% utilised</span>
      </div>

      <div className="space-y-2.5">
        {CAPACITY_ROWS.map((row) => (<div key={row.name} className="rounded-xl border border-[#e2e5ea] bg-white p-2.5 shadow-fe-xs">
            <div className="flex items-center gap-2">
              <Avatar name={row.name} color={row.color} size="xs"/>
              <span className="text-[11px] font-bold text-[#1a1d23] truncate flex-1">{row.name}</span>
              <span className="text-[9px] font-bold rounded-md px-1.5 py-0.5" style={{ backgroundColor: `${row.stateColor}1a`, color: row.stateColor }}>
                {row.state}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-[#f1f5f9] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${row.load}%`, backgroundColor: row.stateColor }}/>
              </div>
              <span className="text-[9px] font-bold text-[#9ca3af] w-7 text-right">{row.load}%</span>
            </div>
          </div>))}
      </div>
    </div>
  </Frame>);
/* ------------------------------------------------------------------ */
/* 9. Release management                                               */
/* ------------------------------------------------------------------ */
const RELEASE_ROWS = [
    { version: 'v2.4', name: 'Checkout v2', progress: 82, status: 'In progress', color: '#0d9488', date: '20 Jun' },
    { version: 'v2.3', name: 'Search relevance', progress: 100, status: 'Released', color: '#10b981', date: '30 May' },
    { version: 'v2.5', name: 'Loyalty points', progress: 26, status: 'Planned', color: '#6366f1', date: '18 Jul' },
];
export const ReleaseMock = () => (<Frame label="Release management illustration listing three releases with completion progress, status and target dates.">
    <div className="p-4 space-y-3.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#1a1d23]">Releases</span>
        <span className="badge-indigo text-[10px]">Commerce Platform</span>
      </div>

      <div className="space-y-2.5">
        {RELEASE_ROWS.map((release) => (<div key={release.version} className="rounded-xl border border-[#e2e5ea] bg-white p-3 shadow-fe-xs">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#f0fdfa] border border-[#99f6e4] text-[#0f766e] inline-flex items-center justify-center flex-shrink-0">
                <Rocket className="w-3.5 h-3.5" aria-hidden="true"/>
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-[#1a1d23] truncate">{release.name}</span>
                  <span className="text-[9px] font-bold text-[#9ca3af]">{release.version}</span>
                </div>
                <span className="text-[9px] font-semibold text-[#9ca3af]">Target {release.date}</span>
              </div>
              <span className="text-[9px] font-bold rounded-md px-1.5 py-0.5" style={{ backgroundColor: `${release.color}1a`, color: release.color }}>
                {release.status}
              </span>
            </div>
            <div className="mt-2">
              <ProgressBar value={release.progress} height="sm" showLabel color={release.color}/>
            </div>
          </div>))}
      </div>
    </div>
  </Frame>);
/* ------------------------------------------------------------------ */
/* 10. Workflow customization                                          */
/* ------------------------------------------------------------------ */
const WORKFLOW_STATUSES = [
    { name: 'Backlog', wip: '—', color: '#94a3b8' },
    { name: 'Ready', wip: 'WIP 8', color: '#6366f1' },
    { name: 'Executing', wip: 'WIP 5', color: '#0d9488' },
    { name: 'Review', wip: 'WIP 3', color: '#d97706' },
    { name: 'Delivered', wip: '—', color: '#10b981' },
];
export const WorkflowMock = () => (<Frame label="Workflow customization illustration with five configurable statuses, work-in-progress limits and an automation rule.">
    <div className="p-4 space-y-3.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#1a1d23]">Workflow · Delivery</span>
        <span className="badge-teal text-[10px]">Custom</span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {WORKFLOW_STATUSES.map((status, index) => (<React.Fragment key={status.name}>
            <div className="shrink-0 rounded-lg border border-[#e2e5ea] bg-white px-2.5 py-2 text-center shadow-fe-xs">
              <span className="block w-1.5 h-1.5 rounded-full mx-auto mb-1" style={{ backgroundColor: status.color }}/>
              <span className="block text-[10px] font-bold text-[#1a1d23] whitespace-nowrap">{status.name}</span>
              <span className="block text-[8px] font-semibold text-[#9ca3af]">{status.wip}</span>
            </div>
            {index < WORKFLOW_STATUSES.length - 1 && (<GitBranch className="w-3.5 h-3.5 text-[#cbd5e1] shrink-0" aria-hidden="true"/>)}
          </React.Fragment>))}
      </div>

      <div className="rounded-xl border border-[#e2e5ea] bg-[#f8fafc] p-3 space-y-2">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#0d9488]" aria-hidden="true"/>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#4b5563]">
            Per-project configuration
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['Custom statuses', 'WIP limits', 'Required fields', 'Issue-type schemes'].map((chip) => (<span key={chip} className="inline-flex items-center gap-1 rounded-lg bg-white border border-[#e2e5ea] px-2 py-0.5 text-[10px] font-semibold text-[#4b5563]">
              <CheckCircle2 className="w-3 h-3 text-[#0d9488]" aria-hidden="true"/>
              {chip}
            </span>))}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-[#eef2ff] border border-[#d2e3fc] px-3 py-2">
        <Clock className="w-3.5 h-3.5 text-[#4f46e5] flex-shrink-0" aria-hidden="true"/>
        <span className="text-[10px] text-[#3730a3] font-medium truncate">
          Automation: when status → Delivered, notify watchers and log the release
        </span>
      </div>
    </div>
  </Frame>);
