import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, CalendarRange, CheckCircle2, KanbanSquare, Map, ShieldCheck, Users, Workflow, Zap, Target, TrendingUp, ChevronRight, Play, GitBranch, Split, Repeat, Hourglass, } from 'lucide-react';
import { ProductPreview } from './ProductPreview';
import { AccessMock, BurndownMock, CapacityMock, CollaborationMock, IterationMock, ReleaseMock, ReportingMock, RoadmapMock, TaskBoardMock, } from './FeaturePreviews';
import { WorkflowShowcase } from './WorkflowShowcase';
import { MemberPricingSection } from './MemberPricing';
import { site, trial } from '../../config/siteConfig';
const CAPABILITY_TABS = [
    {
        id: 'plan',
        label: 'Plan',
        eyebrow: 'Sprint & project planning',
        title: 'Plan sprints, iterations, and full project roadmaps',
        description: 'Structure delivery the way your growing teams work: sprint planning boards, program increments, milestone roadmaps, and a live iteration view that keeps everyone aligned.',
        bullets: [
            'Sprint and program-increment planning configured once, reused everywhere',
            'Backlog grooming with drag-and-drop story prioritization',
            'Gantt-style roadmap timelines across multiple projects',
            'Release planning and version management',
        ],
        icon: CalendarRange,
        visual: IterationMock,
    },
    {
        id: 'track',
        label: 'Track',
        eyebrow: 'Kanban & task tracking',
        title: 'Every task and project on one living Kanban board',
        description: 'Stories, tasks, bugs and sub-tasks live on a Kanban board with real workflow statuses. Drag work across columns, respect WIP limits and see status, priority and ownership at a glance.',
        bullets: [
            'Kanban board with drag-and-drop and WIP-aware columns',
            'Work item types: story, task, bug, sub-task and initiative',
            'Gantt chart and dependency management',
            'Advanced search, filters, flagged tasks and bookmarks',
        ],
        icon: KanbanSquare,
        visual: TaskBoardMock,
    },
    {
        id: 'collaborate',
        label: 'Collaborate',
        eyebrow: 'Team collaboration',
        title: 'Keep admins, PMs, leads and members in sync',
        description: 'Decisions happen where the work lives. Comment on tasks, mention teammates, follow activity and let real-time notifications reach everyone who needs them — no more status meetings.',
        bullets: [
            'Comments, mentions, activity feed and real-time notifications',
            'Team assignments with workload and capacity visibility',
            'Personal work queues, flagged tasks and bookmarks per member',
            'Single sign-on with Microsoft Entra ID, Google and Okta SAML',
        ],
        icon: Users,
        visual: CollaborationMock,
    },
    {
        id: 'report',
        label: 'Report',
        eyebrow: 'Analytics & reporting',
        title: 'Actionable insights for stand-ups, steering and audits',
        description: 'Dashboards for every role, project health signals, cross-project roadmaps and one-click PDF exports — so status reporting takes minutes instead of a morning.',
        bullets: [
            'Role dashboards for admins, PMs, leads and members',
            'Sprint burndown, velocity charts, and project health signals',
            'Cross-project roadmap and initiative progress tracking',
            'Sprint, project, and release reports exported to PDF',
        ],
        icon: BarChart3,
        visual: ReportingMock,
    },
];
/** Core capabilities strip */
const CAPABILITIES = [
    { label: 'Kanban Boards', icon: KanbanSquare },
    { label: 'Sprint Planning', icon: CalendarRange },
    { label: 'Gantt Charts', icon: Map },
    { label: 'Team Workload', icon: Users },
    { label: 'Analytics & Reports', icon: BarChart3 },
    { label: 'Enterprise SSO', icon: ShieldCheck },
];
/** Delivery showcase items */
const SHOWCASE = [
    { title: 'Roadmap timelines', caption: 'Plan across projects', Visual: RoadmapMock },
    { title: 'Sprint burndown', caption: 'Track the iteration', Visual: BurndownMock },
    { title: 'Team capacity', caption: 'Balance the workload', Visual: CapacityMock },
    { title: 'Release management', caption: 'Ship with confidence', Visual: ReleaseMock },
];
/** Benefits listed beside the animated workflow showcase. */
const WORKFLOW_BENEFITS = [
    { icon: GitBranch, title: 'Custom statuses and transitions', text: 'Add statuses and connect them in any order, per project.' },
    { icon: Split, title: 'Conditional branches', text: 'Route work on outcomes such as Pass or Fail.' },
    { icon: Repeat, title: 'Retry loops', text: 'Send failed work back to an earlier status for another pass.' },
];
/** Feature storytelling sections */
const STORY_SECTIONS = [
    {
        id: 'workflow',
        eyebrow: 'Workflow customization',
        eyebrowIcon: Workflow,
        title: 'Your workflow, your rules',
        description: 'Configure the statuses, WIP limits and required fields each project needs. Keep lightweight teams light, and give governance-heavy teams the controls they expect.',
        bullets: [
            'Custom workflow statuses and transitions per project',
            'Work-in-progress limits that surface bottlenecks early',
            'Issue-type schemes, custom fields and required-field rules',
            'Automation rules for status changes and notifications',
        ],
        Visual: WorkflowShowcase,
        flip: false,
        bg: '',
    },
    {
        id: 'access',
        eyebrow: 'Role-based access',
        eyebrowIcon: ShieldCheck,
        title: 'The right permissions for every role',
        description: 'Four roles with a clear permission model: who creates projects, who manages people, who updates work. Admins bypass every gate while members stay focused — every change is audit-logged.',
        bullets: [
            'Roles: Admin, Project Manager, Team Leader and Member',
            'Admins manage users, roles, settings and the full audit trail',
            'PMs and leads manage projects, members, assignments and sprints',
            'Members update and comment on their own work items',
        ],
        Visual: AccessMock,
        flip: true,
        bg: 'bg-[#f8fafc] border-y border-[#e2e5ea]',
    },
];
/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export const HomePage = () => {
    const [activeTab, setActiveTab] = useState(CAPABILITY_TABS[0].id);
    const [workflowReplay, setWorkflowReplay] = useState(0);
    const tabRefs = useRef({});
    const focusTab = (id) => {
        setActiveTab(id);
        tabRefs.current[id]?.focus();
    };
    const handleTabKeyDown = (event) => {
        const index = CAPABILITY_TABS.findIndex((tab) => tab.id === activeTab);
        if (index < 0)
            return;
        let nextIndex = null;
        if (event.key === 'ArrowRight')
            nextIndex = (index + 1) % CAPABILITY_TABS.length;
        else if (event.key === 'ArrowLeft')
            nextIndex = (index - 1 + CAPABILITY_TABS.length) % CAPABILITY_TABS.length;
        else if (event.key === 'Home')
            nextIndex = 0;
        else if (event.key === 'End')
            nextIndex = CAPABILITY_TABS.length - 1;
        if (nextIndex === null)
            return;
        event.preventDefault();
        focusTab(CAPABILITY_TABS[nextIndex].id);
    };
    return (<>
      {/* ============================================================ */}
      {/* HERO SECTION                                                  */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-[#0a0f1e]">
        {/* Deep navy → teal ambient gradient backdrop */}
        <div aria-hidden="true" className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 900px 500px at 50% -10%, rgba(13,148,136,0.32) 0%, transparent 60%), radial-gradient(ellipse 700px 440px at 90% 20%, rgba(6,182,212,0.18) 0%, transparent 58%), radial-gradient(ellipse 640px 400px at 5% 35%, rgba(245,158,11,0.11) 0%, transparent 58%)',
        }}/>
        {/* Subtle grid */}
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.13]" style={{
            backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            maskImage: 'radial-gradient(ellipse 72% 65% at 50% 0%, #000 22%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 72% 65% at 50% 0%, #000 22%, transparent 80%)',
        }}/>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-48 sm:pb-56 text-center">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.08] border border-white/[0.14] text-[#5eead4] text-xs font-bold tracking-wide backdrop-blur-sm animate-fade-in">
            <Zap className="w-3.5 h-3.5" aria-hidden="true"/>
            {site.tagline}
          </span>

          {/* Main headline — exact copy from brief */}
          <h1 className="mt-7 font-display font-extrabold text-white tracking-tight text-4xl sm:text-5xl lg:text-[64px] lg:leading-[1.06] max-w-5xl mx-auto animate-slide-up">
            {site.name} —{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #2dd4bf, #06b6d4, #38bdf8)' }}>
              Smart Project Management
            </span>{' '}
            Software for Growing Teams
          </h1>

          {/* Supporting copy — exact from brief */}
          <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto animate-slide-up">
            Track tasks, manage team workloads, and deliver projects on time with intuitive Kanban boards,
            Gantt charts, and real-time sprint tracking.
          </p>

          {/* CTAs */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 animate-slide-up">
            <Link to="/register" id="hero-get-started" className="btn-lg w-full sm:w-auto group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2dd4bf] focus:ring-offset-2 focus:ring-offset-[#0a0f1e]" style={{
            background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
            boxShadow: '0 0 32px rgba(13,148,136,0.45), 0 4px 16px rgba(13,148,136,0.3)',
        }}>
              Get Started Free
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5"/>
            </Link>
            <a href="#features" id="hero-explore" className="btn-lg w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-white/[0.09] border border-white/[0.18] hover:bg-white/[0.15] hover:border-white/[0.28] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2dd4bf] focus:ring-offset-2 focus:ring-offset-[#0a0f1e]">
              <Play className="w-4 h-4 fill-current" aria-hidden="true"/>
              Explore Features
            </a>
          </div>

          {/* 7-Day Limited Trial — separate entry point from Get Started Free */}
          <div className="mt-4 flex justify-center">
            <Link to="/trial" id="home-start-limited-trial" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-[#fbbf24] border border-[#f59e0b]/60 bg-[#f59e0b]/10 hover:bg-[#f59e0b]/20 hover:border-[#f59e0b] transition-colors focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:ring-offset-2 focus:ring-offset-[#0a0f1e]">
              <Hourglass className="w-4 h-4" aria-hidden="true"/>
              Start {trial.durationDays}-Day Limited Trial
              <ArrowRight className="w-4 h-4" aria-hidden="true"/>
            </Link>
          </div>

          <p className="mt-5 text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-[#5eead4] font-semibold hover:text-[#99f6e4] transition-colors">
              Log in
            </Link>
            {' · '}
            <Link to="/pricing" className="text-[#5eead4] font-semibold hover:text-[#99f6e4] transition-colors">
              View pricing
            </Link>
          </p>
        </div>

        {/* ---- Hero product visual ---- */}
        <div id="product" className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-36 sm:-mt-40 scroll-mt-20">
          {/* glow ring behind the preview */}
          <div aria-hidden="true" className="absolute -inset-x-4 top-8 bottom-8 rounded-[36px] blur-3xl" style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.3), rgba(6,182,212,0.2), rgba(245,158,11,0.15))' }}/>
          {/* Browser chrome wrapper */}
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] transition-transform duration-500 hover:-translate-y-1">
            {/* Chrome bar */}
            <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1e293b] border-b border-white/[0.08]">
              <span className="w-3 h-3 rounded-full bg-[#ef4444]/70"/>
              <span className="w-3 h-3 rounded-full bg-[#f59e0b]/70"/>
              <span className="w-3 h-3 rounded-full bg-[#10b981]/70"/>
              <div className="flex-1 mx-4 h-5 rounded-md bg-white/[0.06] flex items-center justify-center">
                <span className="text-[10px] text-slate-400 font-medium tracking-wide">app.flowexec.com</span>
              </div>
            </div>
            <ProductPreview />
          </div>
          <p className="mt-4 text-center text-xs text-slate-400">
            Live project workspace rendered with real {site.name} components — the Kanban board, analytics
            and progress shown here are the product itself.
          </p>
        </div>
        <div className="h-20 sm:h-24" aria-hidden="true"/>
      </section>

      {/* ============================================================ */}
      {/* CAPABILITY STRIP                                             */}
      {/* ============================================================ */}
      <section className="border-b border-[#e2e5ea] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-wrap items-center justify-center gap-2.5">
          {CAPABILITIES.map(({ label, icon: Icon }) => (<span key={label} className="inline-flex items-center gap-2 rounded-full border border-[#e2e5ea] bg-[#f8fafc] px-4 py-2 text-[11px] font-bold text-[#4b5563] shadow-fe-xs hover:border-[#0d9488]/40 hover:text-[#0f766e] hover:bg-[#f0fdfa] transition-all duration-200">
              <Icon className="w-3.5 h-3.5 text-[#0d9488]" aria-hidden="true"/>
              {label}
            </span>))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* PRODUCT CAPABILITIES TABS                                    */}
      {/* ============================================================ */}
      <section id="features" className="scroll-mt-20 py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="max-w-2xl mx-auto text-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0d9488]">
              <Target className="w-3.5 h-3.5" aria-hidden="true"/>
              Product capabilities
            </span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0a0f1e]">
              Everything {site.name} ships with today
            </h2>
            <p className="mt-4 text-[#4b5563] leading-relaxed">
              Four powerful workflows — all available in the product. Explore them in your workspace after you sign up.
            </p>
          </div>

          {/* Tab list */}
          <div role="tablist" aria-label="Product capabilities" className="mt-10 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-[#e2e5ea] bg-[#f8fafc] p-2 w-fit mx-auto">
            {CAPABILITY_TABS.map((tab) => {
            const Icon = tab.icon;
            const selected = tab.id === activeTab;
            return (<button key={tab.id} ref={(node) => { tabRefs.current[tab.id] = node; }} type="button" role="tab" id={`capability-tab-${tab.id}`} aria-selected={selected} aria-controls={`capability-panel-${tab.id}`} tabIndex={selected ? 0 : -1} onClick={() => setActiveTab(tab.id)} onKeyDown={handleTabKeyDown} className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/40 ${selected
                    ? 'bg-white text-[#0f766e] shadow-fe-md border border-[#e2e5ea]'
                    : 'text-[#4b5563] hover:text-[#0f766e] hover:bg-white/70'}`}>
                  <Icon className={`w-4 h-4 ${selected ? 'text-[#0d9488]' : 'text-[#9ca3af]'}`} aria-hidden="true"/>
                  {tab.label}
                </button>);
        })}
          </div>

          {/* Tab panels */}
          <div className="mt-14">
            {CAPABILITY_TABS.map((tab) => {
            const Visual = tab.visual;
            return (<div key={tab.id} role="tabpanel" id={`capability-panel-${tab.id}`} aria-labelledby={`capability-tab-${tab.id}`} hidden={tab.id !== activeTab} tabIndex={0} className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center focus:outline-none">
                  {/* Text side */}
                  <div>
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#f0fdfa] border border-[#99f6e4] text-[#0f766e] text-xs font-bold uppercase tracking-wider">
                      <tab.icon className="w-4 h-4" aria-hidden="true"/>
                      {tab.eyebrow}
                    </div>
                    <h3 className="mt-5 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0a0f1e] leading-tight">
                      {tab.title}
                    </h3>
                    <p className="mt-4 text-[#4b5563] leading-relaxed">{tab.description}</p>
                    <ul className="mt-6 space-y-3">
                      {tab.bullets.map((bullet) => (<li key={bullet} className="flex items-start gap-3 text-sm text-[#1a1d23]">
                          <CheckCircle2 className="w-4.5 h-4.5 text-[#0d9488] flex-shrink-0 mt-0.5" aria-hidden="true"/>
                          <span>{bullet}</span>
                        </li>))}
                    </ul>
                    <div className="mt-7">
                      <Link to="/register" className="inline-flex items-center gap-2 text-sm font-bold text-[#0d9488] hover:text-[#0f766e] group transition-colors">
                        Try it free
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5"/>
                      </Link>
                    </div>
                  </div>
                  {/* Visual side */}
                  <div>
                    <Visual />
                  </div>
                </div>);
        })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* DELIVERY SHOWCASE — 2×2 GRID                                 */}
      {/* ============================================================ */}
      <section id="showcase" className="scroll-mt-20 py-20 sm:py-24 bg-[#f8fafc] border-y border-[#e2e5ea]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0d9488]">
              <TrendingUp className="w-3.5 h-3.5" aria-hidden="true"/>
              Delivery at a glance
            </span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0a0f1e]">
              From roadmap to release, all in one timeline
            </h2>
            <p className="mt-4 text-[#4b5563] leading-relaxed">
              Roadmaps, burndown, capacity and releases are rendered from the same work items —
              no exports, no spreadsheets, no status-chasing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
            {SHOWCASE.map(({ title, caption, Visual }) => (<div key={title} className="group rounded-2xl border border-[#e2e5ea] bg-white p-5 shadow-fe-sm hover:shadow-fe-lg hover:-translate-y-0.5 transition-all duration-200">
                <div className="mb-4 flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-bold text-[#0a0f1e]">{title}</h3>
                  <span className="text-xs font-semibold text-[#9ca3af]">{caption}</span>
                </div>
                <Visual />
              </div>))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* WORKFLOW CUSTOMIZATION                                        */}
      {/* ============================================================ */}
      <section id="workflow" className="scroll-mt-20 py-20 sm:py-24 bg-white">
        {/* Copy on the left, compact animated workflow card on the right (stacked below xl so the multi-level graph keeps readable labels). */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 xl:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] gap-10 xl:gap-14 items-center">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#f0fdfa] border border-[#99f6e4] text-[#0f766e] text-[11px] font-bold uppercase tracking-wider">
              <Workflow className="w-3.5 h-3.5" aria-hidden="true"/>
              Workflow automation
            </div>
            <h2 className="mt-4 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0a0f1e] leading-tight">
              Build workflows{' '}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #0d9488, #06b6d4)' }}>
                your way
              </span>
            </h2>
            <p className="mt-3 text-[15px] text-[#4b5563] leading-relaxed">
              Design the statuses, transitions, conditional branches and retry loops your team actually
              follows, then watch work move through them. No code and no rigid templates.
            </p>
            <ul className="mt-6 space-y-4">
              {WORKFLOW_BENEFITS.map(({ icon: Icon, title, text }) => (<li key={title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-[#ccfbf1] bg-[#f0fdfa] text-[#0d9488]">
                    <Icon className="w-4 h-4" aria-hidden="true"/>
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-[#0f172a]">{title}</span>
                    <span className="block text-sm text-[#64748b]">{text}</span>
                  </span>
                </li>))}
            </ul>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link to="/register" className="btn-primary">
                Start building
                <ArrowRight className="w-4 h-4"/>
              </Link>
              <button type="button" onClick={() => setWorkflowReplay((n) => n + 1)} className="btn-secondary">
                <Play className="w-4 h-4" aria-hidden="true"/>
                See how it works
              </button>
            </div>
          </div>
          <div className="w-full max-w-[720px] xl:ml-auto">
            <WorkflowShowcase replaySignal={workflowReplay}/>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* ROLE-BASED ACCESS                                            */}
      {/* ============================================================ */}
      <section id="access" className="scroll-mt-20 py-20 sm:py-24 bg-[#f8fafc] border-y border-[#e2e5ea]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="lg:order-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#f0fdfa] border border-[#99f6e4] text-[#0f766e] text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" aria-hidden="true"/>
              Role-based access
            </div>
            <h2 className="mt-5 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0a0f1e] leading-tight">
              The right permissions for{' '}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #0d9488, #06b6d4)' }}>
                every role
              </span>
            </h2>
            <p className="mt-4 text-[#4b5563] leading-relaxed">
              Four roles with a clear permission model: who creates projects, who manages people, who
              updates work. Admins bypass every gate while members stay focused — every change is recorded
              in an immutable audit trail.
            </p>
            <ul className="mt-6 space-y-3">
              {[
            'Roles: Admin, Project Manager, Team Leader and Member',
            'Admins manage users, roles, settings and the full audit trail',
            'PMs and leads manage projects, members, assignments and sprints',
            'Members update and comment on their own work items',
        ].map((bullet) => (<li key={bullet} className="flex items-start gap-3 text-sm text-[#1a1d23]">
                  <CheckCircle2 className="w-4.5 h-4.5 text-[#0d9488] flex-shrink-0 mt-0.5" aria-hidden="true"/>
                  <span>{bullet}</span>
                </li>))}
            </ul>
          </div>
          <div className="lg:order-1">
            <AccessMock />
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* PRICING CALCULATOR                                           */}
      {/* ============================================================ */}
      <MemberPricingSection id="pricing" heading="Pay only for the members you add"/>

      {/* ============================================================ */}
      {/* FINAL CTA                                                     */}
      {/* ============================================================ */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl px-8 sm:px-14 py-14 sm:py-16 text-center text-white" style={{
            background: 'linear-gradient(145deg, #0a0f1e 0%, #0f1a30 55%, #0a1628 100%)',
            boxShadow: '0 30px 60px -12px rgba(0,0,0,0.4)',
        }}>
            {/* Glow orbs */}
            <div aria-hidden="true" className="absolute inset-0" style={{
            background: 'radial-gradient(640px 320px at 50% -20%, rgba(13,148,136,0.38) 0%, transparent 65%), radial-gradient(520px 280px at 100% 120%, rgba(245,158,11,0.2) 0%, transparent 60%), radial-gradient(400px 240px at 0% 120%, rgba(6,182,212,0.15) 0%, transparent 60%)',
        }}/>
            {/* Grid overlay */}
            <div aria-hidden="true" className="absolute inset-0 opacity-[0.07]" style={{
            backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
        }}/>
            <div className="relative">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.09] border border-white/20 text-[#5eead4] text-xs font-bold tracking-wide mb-6">
                <Zap className="w-3.5 h-3.5" aria-hidden="true"/>
                Start in minutes
              </span>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                Ready to run your projects on{' '}
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #2dd4bf, #38bdf8)' }}>
                  {site.name}?
                </span>
              </h2>
              <p className="mt-5 text-slate-300 max-w-xl mx-auto text-lg leading-relaxed">
                Create your account and start planning your first sprint in minutes.
                No payment details required.
              </p>
              <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/register" id="cta-get-started" className="btn-lg w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2dd4bf] focus:ring-offset-2 focus:ring-offset-[#0a0f1e]" style={{
            background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
            boxShadow: '0 0 28px rgba(13,148,136,0.5)',
        }}>
                  Get Started Free
                  <ArrowRight className="w-4 h-4"/>
                </Link>
                <Link to="/pricing" className="btn-lg w-full sm:w-auto text-white bg-white/[0.09] border border-white/[0.22] hover:bg-white/[0.16] inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#0a0f1e]">
                  View pricing
                </Link>
              </div>
              <p className="mt-5 text-sm text-slate-400">
                No credit card required · Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>
    </>);
};
export default HomePage;
