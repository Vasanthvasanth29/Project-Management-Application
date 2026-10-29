import React, { useLayoutEffect, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  CalendarRange,
  KanbanSquare,
  Users,
  BarChart3,
  CheckCircle2,
  Clock,
  Circle,
  TrendingUp,
  Download,
  ShieldCheck,
  Zap,
  ArrowRight,
  GitBranch,
  Layers,
  Sparkles,
} from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
  window.ScrollTrigger = ScrollTrigger;
}

// ===================================================================
// AUTHENTIC PRODUCT UI WIDGETS FOR EACH CAPABILITY (Clean White Theme)
// ===================================================================

// --- 1. PLAN UI COMPONENTS ---
const PlanMainUI = () => (
  <div className="w-full h-full bg-white text-slate-800 p-4 flex flex-col justify-between font-sans border border-slate-200/80 rounded-sm select-none shadow-sm">
    <div>
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold tracking-wide text-slate-900">Iteration 3 · 9–20 Jun</span>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          PI 2026.2
        </span>
      </div>

      <div className="mt-3.5 bg-slate-50/90 rounded-md p-3 border border-slate-200/70">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-slate-500 font-medium">Iteration Progress</span>
          <span className="text-emerald-600 font-bold">68% · 42/62 SP</span>
        </div>
        <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
          <div className="w-[68%] h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
          Program Increment Sprints
        </div>
        {[
          { name: 'Sprint 1 · Setup', state: 'DONE', points: '18 SP', color: 'bg-emerald-500', stateCls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
          { name: 'Sprint 2 · Checkout', state: 'DONE', points: '24 SP', color: 'bg-emerald-500', stateCls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
          { name: 'Sprint 3 · Payments', state: 'ACTIVE', points: '20 SP', color: 'bg-amber-500', stateCls: 'bg-amber-50 text-amber-700 border border-amber-200' },
          { name: 'Sprint 4 · Hardening', state: 'PLANNED', points: '16 SP', color: 'bg-slate-400', stateCls: 'bg-slate-100 text-slate-600 border border-slate-200' },
        ].map((sprint) => (
          <div key={sprint.name} className="flex items-center justify-between px-2.5 py-2 rounded bg-slate-50/70 border border-slate-200/80 text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${sprint.color}`} />
              <span className="font-medium text-slate-800">{sprint.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 font-medium">{sprint.points}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${sprint.stateCls}`}>{sprint.state}</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
      <span>Sprint Velocity: <strong className="text-slate-900 font-bold">52 SP</strong></span>
      <span className="text-emerald-600 font-semibold">Confidence: 94%</span>
    </div>
  </div>
);

const PlanBannerUI = () => (
  <div className="w-full h-full bg-white text-slate-800 p-3 flex flex-col justify-between font-sans border border-slate-200/80 rounded-sm select-none shadow-sm">
    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-[11px]">
      <span className="font-bold text-slate-900">Milestone Roadmap Timeline</span>
      <span className="font-mono text-slate-400 text-[10px] font-medium">Q3 - Q4 2026</span>
    </div>
    <div className="space-y-1.5 my-1">
      {[
        { label: 'Core Billing Engine', bar: 'w-[75%]', color: 'from-teal-500 to-emerald-500', status: 'In Review' },
        { label: 'Multi-Org Workspaces', bar: 'w-[90%]', color: 'from-emerald-500 to-teal-400', status: 'Delivered' },
        { label: 'Global Audit Pipeline', bar: 'w-[45%]', color: 'from-amber-500 to-yellow-500', status: 'On Track' },
      ].map((item) => (
        <div key={item.label} className="text-[10px]">
          <div className="flex justify-between text-slate-700 font-medium mb-0.5">
            <span>{item.label}</span>
            <span className="text-slate-400 font-mono text-[9px]">{item.status}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
            <div className={`h-full ${item.bar} bg-gradient-to-r ${item.color} rounded-full`} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const PlanSquareUI = () => (
  <div className="w-full h-full bg-white text-slate-800 p-3.5 flex flex-col justify-between font-sans border border-slate-200/80 rounded-sm select-none shadow-sm">
    <div>
      <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">Velocity Cadence</span>
      <div className="mt-1 text-2xl font-extrabold text-emerald-600">48 pts</div>
      <p className="text-[11px] text-slate-500 mt-0.5 font-medium">+15% vs previous PI cadence</p>
    </div>
    <div className="h-16 flex items-end gap-1.5 pt-2 border-b border-slate-100">
      {[32, 40, 44, 46, 52, 48].map((h, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-xs" style={{ height: `${h}px` }} />
          <span className="text-[8px] text-slate-400 font-mono">S{i + 1}</span>
        </div>
      ))}
    </div>
    <div className="text-[10px] text-emerald-700 flex items-center justify-between pt-1 font-semibold">
      <span>On-Time Delivery</span>
      <span className="font-bold">94%</span>
    </div>
  </div>
);

// --- 2. TRACK UI COMPONENTS ---
const TrackMainUI = () => (
  <div className="w-full h-full bg-white text-slate-800 p-3.5 flex flex-col justify-between font-sans border border-slate-200/80 rounded-sm select-none shadow-sm">
    <div>
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <span className="text-xs font-bold text-slate-900">Living Kanban Board · Commerce</span>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
          WIP Aware
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {/* Queued */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Queued (2)
          </div>
          <div className="space-y-1.5">
            <div className="bg-slate-50 p-2 rounded border border-slate-200/90 text-[10px] shadow-xs">
              <span className="text-blue-600 font-bold font-mono">ECOMM-412</span>
              <p className="text-slate-700 font-medium leading-tight mt-1">Checkout address validation</p>
              <div className="mt-1.5 flex justify-between text-[8px] text-slate-500">
                <span className="bg-slate-200/80 px-1 rounded font-medium">5 SP</span>
                <span className="text-amber-600 font-bold">HIGH</span>
              </div>
            </div>
          </div>
        </div>

        {/* Executing */}
        <div>
          <div className="text-[10px] font-bold text-blue-600 uppercase mb-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Executing (2/3)
          </div>
          <div className="space-y-1.5">
            <div className="bg-blue-50/60 p-2 rounded border border-blue-200 text-[10px] shadow-xs">
              <span className="text-blue-600 font-bold font-mono">ECOMM-399</span>
              <p className="text-slate-900 font-semibold leading-tight mt-1">Payment retry webhook flow</p>
              <div className="mt-1.5 flex justify-between text-[8px]">
                <span className="bg-blue-100 text-blue-700 px-1 rounded font-bold">8 SP</span>
                <span className="text-rose-600 font-bold">CRITICAL</span>
              </div>
            </div>
            <div className="bg-slate-50 p-2 rounded border border-slate-200/90 text-[10px]">
              <span className="text-blue-600 font-bold font-mono">ECOMM-407</span>
              <p className="text-slate-700 font-medium leading-tight mt-1">Refund webhook handler</p>
            </div>
          </div>
        </div>

        {/* Delivered */}
        <div>
          <div className="text-[10px] font-bold text-emerald-600 uppercase mb-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Delivered (4)
          </div>
          <div className="space-y-1.5">
            <div className="bg-emerald-50/50 p-2 rounded border border-emerald-200 text-[10px] shadow-xs">
              <span className="text-emerald-700 font-bold font-mono">ECOMM-375</span>
              <p className="text-slate-700 font-medium leading-tight mt-1">Guest checkout toggle</p>
              <div className="mt-1.5 text-[8px] text-emerald-700 font-bold">DONE</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="pt-2.5 border-t border-slate-100 text-[10px] text-slate-500 font-medium flex justify-between">
      <span>WIP Limits: <strong className="text-slate-900 font-bold">Enforced</strong></span>
      <span className="text-blue-600 font-semibold">Zero Bottlenecks</span>
    </div>
  </div>
);

const TrackBannerUI = () => (
  <div className="w-full h-full bg-white text-slate-800 p-3 flex flex-col justify-between font-sans border border-slate-200/80 rounded-sm select-none shadow-sm">
    <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-slate-100">
      <span className="font-bold text-slate-900">Custom Status Transition Scheme</span>
      <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
        Automated
      </span>
    </div>
    <div className="flex items-center justify-between my-2 px-2 text-[10px] font-mono">
      <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">Backlog</span>
      <span className="text-blue-500 font-bold">→</span>
      <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">In Progress</span>
      <span className="text-blue-500 font-bold">→</span>
      <span className="px-2 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">QA Review</span>
      <span className="text-emerald-500 font-bold">→</span>
      <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">Done</span>
    </div>
  </div>
);

const TrackSquareUI = () => (
  <div className="w-full h-full bg-white text-slate-800 p-3.5 flex flex-col justify-between font-sans border border-slate-200/80 rounded-sm select-none shadow-sm">
    <div>
      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono font-medium">
        <span>WORK ITEM DETAIL</span>
        <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">P0 · CRITICAL</span>
      </div>
      <div className="text-sm font-bold text-slate-900 mt-1">ECOMM-399 · Stripe Webhook</div>
      <p className="text-[11px] text-slate-500 mt-1 font-medium">Idempotency handler and automated retry loop</p>
    </div>
    <div className="space-y-1.5 text-[10px] bg-slate-50 p-2.5 rounded border border-slate-200/80 font-mono">
      <div className="flex justify-between">
        <span className="text-slate-400 font-medium">Assignee:</span>
        <span className="text-blue-600 font-semibold">Sarah Chen</span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-400 font-medium">Estimate:</span>
        <span className="text-slate-700 font-medium">8 SP (6h logged)</span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-400 font-medium">Dependency:</span>
        <span className="text-emerald-600 font-semibold">GATE-104 (Done)</span>
      </div>
    </div>
  </div>
);

// --- 3. COLLABORATE UI COMPONENTS ---
const CollaborateMainUI = () => (
  <div className="w-full h-full bg-white text-slate-800 p-3.5 flex flex-col justify-between font-sans border border-slate-200/80 rounded-sm select-none shadow-sm">
    <div>
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-900">Team Discussion & Activity</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 font-medium">4 Active Members</span>
      </div>

      <div className="mt-3 space-y-2.5">
        <div className="bg-slate-50/90 p-2.5 rounded border border-slate-200/80 text-xs shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold">SC</span>
            <span className="font-bold text-slate-900 text-[11px]">Sarah Chen (Lead)</span>
            <span className="text-[9px] text-slate-400 ml-auto">10m ago</span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            @alex staging ingress verified with the payment gateway. Ready for production cutover at 18:00 UTC?
          </p>
          <div className="mt-1.5 flex gap-2 text-[9px] text-slate-500 font-medium">
            <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">👍 4</span>
            <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">🚀 2</span>
          </div>
        </div>

        <div className="bg-slate-50/90 p-2.5 rounded border border-slate-200/80 text-xs shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">AM</span>
            <span className="font-bold text-slate-900 text-[11px]">Alex Morgan</span>
            <span className="text-[9px] text-slate-400 ml-auto">2m ago</span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Confirmed! Cluster 2 green-lit. Automated release pipeline ready.
          </p>
        </div>
      </div>
    </div>

    <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-medium flex justify-between">
      <span>Contextual Decisions</span>
      <span className="text-amber-700 font-bold">Zero Status Meetings</span>
    </div>
  </div>
);

const CollaborateBannerUI = () => (
  <div className="w-full h-full bg-white text-slate-800 p-3 flex flex-col justify-between font-sans border border-slate-200/80 rounded-sm select-none shadow-sm">
    <div className="flex justify-between text-[11px] pb-1 border-b border-slate-100">
      <span className="font-bold text-slate-900">Team Workload & Capacity Allocation</span>
      <span className="font-mono text-slate-400 text-[10px] font-medium">Sprint 3 Target</span>
    </div>
    <div className="grid grid-cols-4 gap-2 my-1 text-[10px] text-center">
      <div className="bg-slate-50 border border-slate-200/80 p-1.5 rounded">
        <span className="text-slate-400 block text-[9px] font-medium">Sarah</span>
        <span className="text-emerald-600 font-bold">82%</span>
      </div>
      <div className="bg-slate-50 border border-slate-200/80 p-1.5 rounded">
        <span className="text-slate-400 block text-[9px] font-medium">Alex</span>
        <span className="text-emerald-600 font-bold">65%</span>
      </div>
      <div className="bg-slate-50 border border-slate-200/80 p-1.5 rounded">
        <span className="text-slate-400 block text-[9px] font-medium">David</span>
        <span className="text-amber-600 font-bold">90%</span>
      </div>
      <div className="bg-slate-50 border border-slate-200/80 p-1.5 rounded">
        <span className="text-slate-400 block text-[9px] font-medium">Priya</span>
        <span className="text-emerald-600 font-bold">45%</span>
      </div>
    </div>
  </div>
);

const CollaborateSquareUI = () => (
  <div className="w-full h-full bg-white text-slate-800 p-3.5 flex flex-col justify-between font-sans border border-slate-200/80 rounded-sm select-none shadow-sm">
    <div>
      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Enterprise Security</span>
      <div className="text-sm font-bold text-slate-900 mt-1">SSO & Identity Sync</div>
      <p className="text-[11px] text-slate-500 mt-1 font-medium">Multi-tenant role-based access control</p>
    </div>
    <div className="space-y-1.5 text-[10px] font-mono">
      <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200">
        <span className="text-slate-700 font-medium">Microsoft Entra ID</span>
        <span className="text-emerald-600 font-bold">CONNECTED</span>
      </div>
      <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200">
        <span className="text-slate-700 font-medium">Okta SAML 2.0</span>
        <span className="text-emerald-600 font-bold">VERIFIED</span>
      </div>
    </div>
    <div className="text-[10px] text-emerald-700 font-semibold">MFA Enforced: 100% compliant</div>
  </div>
);

// --- 4. REPORT UI COMPONENTS ---
const ReportMainUI = () => (
  <div className="w-full h-full bg-white text-slate-800 p-3.5 flex flex-col justify-between font-sans border border-slate-200/80 rounded-sm select-none shadow-sm">
    <div>
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <span className="text-xs font-bold text-slate-900">Executive Delivery Signals</span>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
          Audit Ready
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between bg-purple-50/50 p-3 rounded-md border border-purple-100">
        <div>
          <span className="text-[10px] text-purple-600 font-mono block font-medium">PROJECT HEALTH SCORE</span>
          <span className="text-3xl font-extrabold text-purple-900">88/100</span>
        </div>
        <div className="text-right">
          <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 text-xs font-bold">STRONG</span>
          <span className="block text-[10px] text-slate-500 mt-1 font-medium">0 Critical Risks</span>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Delivery Signals</div>
        <div className="flex justify-between items-center text-xs p-2 rounded bg-slate-50 border border-slate-200/70">
          <span className="text-slate-700 font-medium">Sprint Burndown</span>
          <span className="text-emerald-600 font-bold">On Schedule</span>
        </div>
        <div className="flex justify-between items-center text-xs p-2 rounded bg-slate-50 border border-slate-200/70">
          <span className="text-slate-700 font-medium">Velocity Predictability</span>
          <span className="text-teal-600 font-bold">96% Accuracy</span>
        </div>
        <div className="flex justify-between items-center text-xs p-2 rounded bg-slate-50 border border-slate-200/70">
          <span className="text-slate-700 font-medium">Scope Creep</span>
          <span className="text-emerald-600 font-bold">0% (Locked)</span>
        </div>
      </div>
    </div>

    <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-medium flex justify-between">
      <span>Boardroom Ready</span>
      <span className="text-purple-700 font-bold">1-Click PDF Export</span>
    </div>
  </div>
);

const ReportBannerUI = () => (
  <div className="w-full h-full bg-white text-slate-800 p-3 flex flex-col justify-between font-sans border border-slate-200/80 rounded-sm select-none shadow-sm">
    <div className="flex justify-between text-[11px] pb-1 border-b border-slate-100">
      <span className="font-bold text-slate-900">Sprint Velocity & Burndown Trajectory</span>
      <span className="font-mono text-slate-400 text-[10px] font-medium">Actual vs Planned</span>
    </div>
    <div className="h-16 flex items-end justify-between px-4 my-1">
      {[18, 26, 34, 42, 48, 52].map((val, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div className="w-6 bg-gradient-to-t from-purple-600 to-indigo-500 rounded-t-xs" style={{ height: `${val}px` }} />
          <span className="text-[8px] font-mono text-slate-400 font-medium">PI.{i + 1}</span>
        </div>
      ))}
    </div>
  </div>
);

const ReportSquareUI = () => (
  <div className="w-full h-full bg-white text-slate-800 p-3.5 flex flex-col justify-between font-sans border border-slate-200/80 rounded-sm select-none shadow-sm">
    <div>
      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Executive Export</span>
      <div className="text-sm font-bold text-slate-900 mt-1">Boardroom PDF Report</div>
      <p className="text-[11px] text-slate-500 mt-1 font-medium">Generated sprint & release audit briefing</p>
    </div>
    <div className="bg-slate-50 p-2 rounded border border-slate-200 text-[10px] font-mono text-slate-700">
      <div>📄 FlowExec_Report_Q3.pdf</div>
      <div className="text-slate-400 text-[9px] mt-0.5 font-medium">14 Pages · Complete Metrics</div>
    </div>
    <div className="flex items-center justify-between text-[10px] text-purple-700 font-bold pt-1">
      <span className="flex items-center gap-1">
        <Download className="w-3.5 h-3.5" /> Download PDF
      </span>
      <span>Instant</span>
    </div>
  </div>
);

// 4 Product Capabilities mapped with their authentic product UI widgets
const CAPABILITIES = [
  {
    id: 'plan',
    title: 'Plan',
    stepNumber: '01',
    subtitle: 'Sprint & Project Planning',
    description:
      'Structure delivery the way your growing teams work: sprint planning boards, program increments, milestone roadmaps, and a live iteration view that keeps everyone aligned.',
    ui: {
      leftTall: PlanMainUI,
      topBanner: PlanBannerUI,
      bottomSquare: PlanSquareUI,
    },
  },
  {
    id: 'track',
    title: 'Track',
    stepNumber: '02',
    subtitle: 'Kanban & Task Tracking',
    description:
      'Stories, tasks, bugs and sub-tasks live on a Kanban board with real workflow statuses. Drag work across columns, respect WIP limits and see status, priority and ownership at a glance.',
    ui: {
      leftTall: TrackMainUI,
      topBanner: TrackBannerUI,
      bottomSquare: TrackSquareUI,
    },
  },
  {
    id: 'collaborate',
    title: 'Collaborate',
    stepNumber: '03',
    subtitle: 'Team Collaboration',
    description:
      'Decisions happen where the work lives. Comment on tasks, mention teammates, follow activity and let real-time notifications reach everyone who needs them — no more status meetings.',
    ui: {
      leftTall: CollaborateMainUI,
      topBanner: CollaborateBannerUI,
      bottomSquare: CollaborateSquareUI,
    },
  },
  {
    id: 'report',
    title: 'Report',
    stepNumber: '04',
    subtitle: 'Analytics & Reporting',
    description:
      'Dashboards for every role, project health signals, cross-project roadmaps and one-click PDF exports — so status reporting takes minutes instead of a morning.',
    ui: {
      leftTall: ReportMainUI,
      topBanner: ReportBannerUI,
      bottomSquare: ReportSquareUI,
    },
  },
];

export const ProductCapabilitiesHorizontalZigzag = () => {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const progressBarRef = useRef(null);

  const useIsomorphicLayoutEffect =
    typeof window !== 'undefined' ? useLayoutEffect : useEffect;

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const getScrollWidth = () => track.scrollWidth - window.innerWidth;

    const ctx = gsap.context(() => {
      // Snappy and optimized scroll distance (~30% shorter for comfortable wheel navigation)
      gsap.to(track, {
        x: () => -getScrollWidth(),
        ease: 'none',
        scrollTrigger: {
          id: 'capabilities-scroll',
          trigger: section,
          start: 'top top',
          end: () => `+=${Math.max(1200, getScrollWidth() * 0.72)}`,
          pin: true,
          scrub: 0.9,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            if (progressBarRef.current) {
              progressBarRef.current.style.width = `${self.progress * 100}%`;
            }
          },
        },
      });

      // Subtle parallax on left tall UI cards
      gsap.utils.toArray('.capability-left-ui').forEach((el) => {
        gsap.to(el, {
          yPercent: 3,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: () => `+=${getScrollWidth() * 0.72}`,
            scrub: 1.5,
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative w-full h-screen overflow-hidden text-white select-none"
      style={{
        backgroundColor: '#062014', // Exact Forest Green
      }}
    >
      {/* ============================================================ */}
      {/* BACKGROUND: Green Tech Pixel Grid Pattern                    */}
      {/* ============================================================ */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, #22c55e 1.5px, transparent 1.5px),
            linear-gradient(to right, rgba(16, 185, 129, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(16, 185, 129, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px, 108px 108px, 108px 108px',
        }}
      />

      {/* Atmospheric dark green lighting */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 85% 65% at 50% 50%, rgba(6, 32, 20, 0.4) 0%, rgba(3, 16, 10, 0.95) 100%)',
        }}
      />

      {/* Ambient pixel blocks */}
      <div className="absolute top-20 left-[14%] w-14 h-14 bg-emerald-500/10 pointer-events-none" />
      <div className="absolute bottom-28 left-[45%] w-12 h-12 bg-emerald-400/5 pointer-events-none" />
      <div className="absolute top-44 left-[68%] w-16 h-16 bg-emerald-500/10 pointer-events-none" />
      <div className="absolute top-24 right-[12%] w-12 h-12 bg-emerald-400/10 pointer-events-none" />

      {/* Top minimal progress bar */}
      <div className="absolute top-0 left-0 right-0 z-40 h-[2.5px] bg-emerald-950/80">
        <div
          ref={progressBarRef}
          className="h-full bg-gradient-to-r from-teal-500 via-teal-300 to-cyan-400 shadow-[0_0_10px_rgba(45,212,191,0.7)] transition-all duration-75"
          style={{ width: '0%' }}
        />
      </div>

      {/* ============================================================ */}
      {/* HORIZONTAL CONTINUOUS PINNED TRACK                           */}
      {/* ============================================================ */}
      <div
        ref={trackRef}
        className="relative h-full flex items-center will-change-transform pl-10 sm:pl-16 pr-36"
      >
        {CAPABILITIES.map((cap, idx) => {
          const LeftTall = cap.ui.leftTall;
          const TopBanner = cap.ui.topBanner;
          const BottomSquare = cap.ui.bottomSquare;
          const isLast = idx === CAPABILITIES.length - 1;

          return (
            <div
              key={cap.id}
              className="relative flex items-center flex-shrink-0 mr-40"
              style={{
                width: '1114px',
                height: '86vh',
              }}
            >
              {/* ------------------------------------------------------ */}
              {/* 1. LEFT PRODUCT UI: Main Tall Interface (340px x 520px)*/}
              {/* ------------------------------------------------------ */}
              <div className="capability-left-ui relative w-[340px] h-[520px] rounded-md overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.55)] flex-shrink-0 border border-white/30 bg-white">
                <LeftTall />
              </div>

              {/* ------------------------------------------------------ */}
              {/* 2. BESIDE LEFT UI: "Product Capabilities" Title        */}
              {/* ------------------------------------------------------ */}
              <div className="relative ml-8 w-[250px] flex flex-col justify-between h-[520px] flex-shrink-0 z-10">
                {/* Title: Only display "Product Capabilities" on the first card */}
                <div className="pt-2">
                  {idx === 0 ? (
                    <>
                      <h1 className="font-display font-extrabold text-4xl sm:text-[46px] leading-[1.05] tracking-tight text-white drop-shadow-[0_8px_20px_rgba(0,0,0,0.7)]">
                        Product
                        <br />
                        Capabilities
                      </h1>
                      <p className="mt-2 text-[11px] font-mono uppercase tracking-[0.2em] text-teal-400 font-semibold">
                        01 · {cap.title}
                      </p>
                    </>
                  ) : (
                    <>
                      <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-teal-400 font-semibold block">
                        {cap.stepNumber} · STAGE
                      </span>
                      <h2 className="font-display font-extrabold text-3xl sm:text-[42px] leading-[1.08] tracking-tight text-white mt-1">
                        {cap.title}
                      </h2>
                      <p className="mt-1 text-[11px] font-mono text-slate-400">
                        {cap.subtitle}
                      </p>
                    </>
                  )}
                </div>

                {/* 3. BOTTOM PRODUCT UI: Square Metric / Detail (240px x 270px) */}
                <div className="relative w-[240px] h-[270px] rounded-md overflow-hidden shadow-[0_16px_36px_rgba(0,0,0,0.45)] border border-white/30 bg-white">
                  <BottomSquare />
                </div>
              </div>

              {/* ------------------------------------------------------ */}
              {/* 4. STAGGERED STACK: Top Banner UI + Yellow Drop Line   */}
              {/* ------------------------------------------------------ */}
              <div className="relative ml-8 w-[460px] h-[520px] flex-shrink-0 z-10">
                
                {/* TOP LANDSCAPE BANNER UI (460px x 140px) */}
                <div className="relative w-[460px] h-[140px]">
                  <div className="w-full h-full rounded-md overflow-hidden shadow-[0_16px_36px_rgba(0,0,0,0.45)] border border-white/30 bg-white">
                    <TopBanner />
                  </div>

                  {/* CONNECTING HORIZONTAL TEAL LINE TO NEXT CARD (Attached directly to previous image!) */}
                  {!isLast && (
                    <div className="absolute top-1/2 -translate-y-1/2 left-full w-40 flex items-center pointer-events-none z-30">
                      <div className="w-full h-[2px] bg-[#2dd4bf] shadow-[0_0_8px_rgba(45,212,191,0.6)]" />
                      <div className="w-3 h-3 border-2 border-[#2dd4bf] bg-[#062014] flex-shrink-0 -ml-[1px] shadow-[0_0_10px_rgba(45,212,191,0.75)]" />
                    </div>
                  )}
                </div>

                {/* TEAL DROP LINE + HOLLOW SQUARE (Continuous attached SVG - Website Brand Theme) */}
                <svg
                  className="absolute pointer-events-none"
                  style={{
                    left: '104px',
                    top: '139px',
                    width: '16px',
                    height: '196px',
                    overflow: 'visible',
                    zIndex: 10,
                  }}
                >
                  {/* Vertical teal line dropping seamlessly from bottom of banner */}
                  <line
                    x1="6"
                    y1="0"
                    x2="6"
                    y2="182"
                    stroke="#2dd4bf"
                    strokeWidth="2"
                  />
                  {/* Hollow Square attached directly to the end of the line */}
                  <rect
                    x="0"
                    y="182"
                    width="12"
                    height="12"
                    fill="#062014"
                    stroke="#2dd4bf"
                    strokeWidth="2"
                    style={{ filter: 'drop-shadow(0 0 8px rgba(45,212,191,0.75))' }}
                  />
                </svg>

                {/* CAPABILITY TITLE & DESCRIPTION (Positioned right beside the hollow square) */}
                <div
                  className="absolute"
                  style={{
                    left: '128px',
                    top: '312px',
                    maxWidth: '330px',
                  }}
                >
                  <h2 className="text-3xl font-extrabold text-white tracking-tight font-display leading-none">
                    {cap.title}
                  </h2>
                  <p className="mt-3 text-xs sm:text-[13px] text-slate-300 leading-relaxed font-sans">
                    {cap.description}
                  </p>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-4 left-8 sm:left-12 z-30 flex items-center gap-2 text-[10px] font-mono text-teal-400/80">
        <span className="w-2 h-2 border border-teal-400 animate-spin inline-block" />
        <span>SCROLL DOWN TO ADVANCE TIMELINE</span>
        <span className="text-teal-400 font-bold">→</span>
      </div>
    </section>
  );
};

export default ProductCapabilitiesHorizontalZigzag;
