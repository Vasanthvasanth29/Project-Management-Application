import React from 'react';
import { Search, Bell, Flag, MoreHorizontal, Filter, Download, ChevronDown } from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Avatar } from '../../components/common/Avatar';
import { StatusBadge, PriorityBadge } from '../../components/common/Badges';
import { site } from '../../config/siteConfig';
const COLUMNS = [
    {
        label: 'Queued',
        headerBg: 'bg-gradient-to-r from-slate-50 to-slate-100',
        dot: 'bg-[#94a3b8]',
        tasks: [
            { key: 'ECOMM-412', title: 'Checkout address validation', status: 'TODO', priority: 'HIGH', assignee: 'Amara Okafor', color: '#0f766e' },
            { key: 'ECOMM-418', title: 'Update order confirmation copy', status: 'TODO', priority: 'MEDIUM', assignee: 'Liam Chen', color: '#6366f1' },
        ],
    },
    {
        label: 'Executing',
        headerBg: 'bg-gradient-to-r from-teal-50 to-emerald-50',
        dot: 'bg-[#0d9488]',
        tasks: [
            { key: 'ECOMM-399', title: 'Payment retry flow', status: 'IN_PROGRESS', priority: 'CRITICAL', assignee: 'Sofia Marino', color: '#d97706' },
            { key: 'ECOMM-405', title: 'Cart persistence on reload', status: 'IN_PROGRESS', priority: 'MEDIUM', assignee: 'Noah Patel', color: '#0891b2' },
            { key: 'ECOMM-407', title: 'Refund webhook handler', status: 'IN_PROGRESS', priority: 'HIGH', assignee: 'Amara Okafor', color: '#0f766e' },
        ],
    },
    {
        label: 'Review',
        headerBg: 'bg-gradient-to-r from-indigo-50 to-violet-50',
        dot: 'bg-[#6366f1]',
        tasks: [
            { key: 'ECOMM-388', title: 'Loyalty points calculation', status: 'IN_REVIEW', priority: 'HIGH', assignee: 'Liam Chen', color: '#6366f1' },
            { key: 'ECOMM-391', title: 'Search filters a11y pass', status: 'IN_REVIEW', priority: 'LOW', assignee: 'Sofia Marino', color: '#d97706' },
        ],
    },
    {
        label: 'Delivered',
        headerBg: 'bg-gradient-to-r from-emerald-50 to-green-50',
        dot: 'bg-[#10b981]',
        tasks: [
            { key: 'ECOMM-375', title: 'Guest checkout toggle', status: 'DONE', priority: 'MEDIUM', assignee: 'Noah Patel', color: '#0891b2' },
            { key: 'ECOMM-381', title: 'Invoice PDF template', status: 'DONE', priority: 'MEDIUM', assignee: 'Amara Okafor', color: '#0f766e' },
        ],
    },
];
const TaskCard = ({ task }) => (<div className="bg-white rounded-xl border border-[#e2e5ea] p-3.5 shadow-fe-xs hover:border-[#0d9488]/40 transition-colors">
    <div className="flex items-center justify-between gap-2 mb-2">
      <span className="text-xs font-bold text-[#0d9488] tracking-wide">{task.key}</span>
      <div className="flex items-center gap-1.5 text-[#9ca3af]">
        <Flag className="w-3.5 h-3.5" aria-hidden="true"/>
        <MoreHorizontal className="w-4 h-4" aria-hidden="true"/>
      </div>
    </div>
    <p className="text-sm font-semibold text-[#1a1d23] leading-snug mb-3">{task.title}</p>
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 min-w-0">
        <StatusBadge status={task.status}/>
        <PriorityBadge priority={task.priority}/>
      </div>
      <Avatar name={task.assignee} color={task.color} size="xs"/>
    </div>
  </div>);
export const ProductPreview = () => (<div className="rounded-2xl overflow-hidden border border-[#e2e5ea] bg-[#f4f6f9] shadow-fe-xl" role="img" aria-label="Illustration of the FlowExec Live Iteration Board: work items moving across the Queued, Executing, Review and Delivered columns, with iteration statistics and progress above the board.">
    <div aria-hidden="true">
      {/* Browser-style chrome */}
      <div className="flex items-center gap-3 px-4 sm:px-5 py-3 bg-white border-b border-[#e2e5ea]">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#f87171]"/>
          <span className="w-3 h-3 rounded-full bg-[#fbbf24]"/>
          <span className="w-3 h-3 rounded-full bg-[#34d399]"/>
        </div>
        <div className="flex-1 flex justify-center">
          <span className="text-xs font-semibold text-[#9ca3af] bg-[#f1f5f9] rounded-lg px-3 py-1">
            {site.name} Workspace · Live Iteration Board
          </span>
        </div>
        <span className="hidden sm:inline text-[11px] font-bold text-[#0d9488] bg-[#ccfbf1] rounded-md px-2 py-0.5">
          Live
        </span>
      </div>

      {/* App top bar */}
      <div className="px-4 sm:px-5 py-3.5 bg-white border-b border-[#e2e5ea] flex flex-wrap items-center gap-3">
        <span className="badge-teal text-xs">ECOMM</span>
        <span className="text-sm font-bold text-[#1a1d23]">Commerce Platform</span>
        <span className="badge-amber text-xs">Iteration 3 · ACTIVE</span>
        <div className="ml-auto hidden sm:flex items-center gap-2.5">
          <span className="flex items-center gap-2 text-sm text-[#9ca3af] bg-[#f1f5f9] rounded-lg px-3 py-1.5 w-52">
            <Search className="w-4 h-4"/>
            Search work items
          </span>
          <Bell className="w-4 h-4 text-[#9ca3af]"/>
          <div className="flex -space-x-2">
            <Avatar name="Amara Okafor" color="#0f766e" size="xs"/>
            <Avatar name="Liam Chen" color="#6366f1" size="xs"/>
            <Avatar name="Sofia Marino" color="#d97706" size="xs"/>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Stats row — real StatCard component */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard title="Open work items" value="128" icon={Filter} iconColor="#0d9488" iconBg="#ccfbf1"/>
          <StatCard title="Executing now" value="24" icon={Flag} iconColor="#6366f1" iconBg="#e0e7ff"/>
          <StatCard title="Delivered this iteration" value="36" icon={Download} iconColor="#d97706" iconBg="#fef3c7" trend={12} trendLabel="vs previous iteration"/>
        </div>

        {/* Board */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {COLUMNS.map((column) => (<div key={column.label} className="rounded-xl border border-[#e2e5ea] bg-white overflow-hidden">
              <div className={`flex items-center justify-between px-3 py-2.5 ${column.headerBg} border-b border-[#e2e5ea]`}>
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#4b5563]">
                  <span className={`w-2 h-2 rounded-full ${column.dot}`}/>
                  {column.label}
                </span>
                <span className="text-xs font-semibold text-[#9ca3af]">{column.tasks.length}</span>
              </div>
              <div className="p-2.5 space-y-2.5 bg-[#f8fafc] min-h-[170px]">
                {column.tasks.map((task) => (<TaskCard key={task.key} task={task}/>))}
              </div>
            </div>))}
        </div>

        {/* Footer: progress + actions */}
        <div className="rounded-xl border border-[#e2e5ea] bg-white p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-bold text-[#1a1d23]">Iteration 3 progress</span>
              <span className="text-sm font-semibold text-[#0d9488]">64% complete</span>
            </div>
            <ProgressBar value={64} height="sm"/>
          </div>
          <div className="flex items-center gap-2">
            <span className="btn-secondary btn-xs pointer-events-none">
              <Filter className="w-3 h-3"/>
              Filter
            </span>
            <span className="btn-primary btn-xs pointer-events-none">
              <Download className="w-3 h-3"/>
              Export report
            </span>
            <span className="btn-ghost btn-xs pointer-events-none">
              Board
              <ChevronDown className="w-3 h-3"/>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>);
export default ProductPreview;
