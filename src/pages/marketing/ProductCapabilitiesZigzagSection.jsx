import React from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarRange,
  KanbanSquare,
  Users,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Target,
  Sparkles,
} from 'lucide-react';
import {
  IterationMock,
  TaskBoardMock,
  CollaborationMock,
  ReportingMock,
} from './FeaturePreviews';
import { site } from '../../config/siteConfig';

const CAPABILITIES = [
  {
    id: 'plan',
    stepNumber: '01',
    label: 'Plan',
    eyebrow: 'Sprint & Project Planning',
    title: 'Plan sprints, iterations, and full project roadmaps',
    description:
      'Structure delivery the way your growing teams work: sprint planning boards, program increments, milestone roadmaps, and a live iteration view that keeps everyone aligned.',
    bullets: [
      'Sprint and program-increment planning configured once, reused everywhere',
      'Backlog grooming with drag-and-drop story prioritization',
      'Gantt-style roadmap timelines across multiple projects',
      'Release planning and version management',
    ],
    icon: CalendarRange,
    visual: IterationMock,
    accent: {
      primary: '#0d9488',
      light: '#f0fdfa',
      border: '#99f6e4',
      tagBg: 'bg-teal-50 border-teal-200 text-teal-800',
    },
    chip: 'PI 2026.2 Active · 68% Completed',
    reverse: false, // Content Left, Image Right
  },
  {
    id: 'track',
    stepNumber: '02',
    label: 'Track',
    eyebrow: 'Kanban & Task Tracking',
    title: 'Every task and project on one living Kanban board',
    description:
      'Stories, tasks, bugs and sub-tasks live on a Kanban board with real workflow statuses. Drag work across columns, respect WIP limits and see status, priority and ownership at a glance.',
    bullets: [
      'Kanban board with drag-and-drop and WIP-aware columns',
      'Work item types: story, task, bug, sub-task and initiative',
      'Gantt chart and dependency management',
      'Advanced search, filters, flagged tasks and bookmarks',
    ],
    icon: KanbanSquare,
    visual: TaskBoardMock,
    accent: {
      primary: '#2563eb',
      light: '#eff6ff',
      border: '#bfdbfe',
      tagBg: 'bg-blue-50 border-blue-200 text-blue-800',
    },
    chip: 'WIP Limits & Column Bottlenecks',
    reverse: true, // Image Left, Content Right (Zigzag!)
  },
  {
    id: 'collaborate',
    stepNumber: '03',
    label: 'Collaborate',
    eyebrow: 'Team Collaboration',
    title: 'Keep admins, PMs, leads and members in sync',
    description:
      'Decisions happen where the work lives. Comment on tasks, mention teammates, follow activity and let real-time notifications reach everyone who needs them — no more status meetings.',
    bullets: [
      'Comments, mentions, activity feed and real-time notifications',
      'Team assignments with workload and capacity visibility',
      'Personal work queues, flagged tasks and bookmarks per member',
      'Single sign-on with Microsoft Entra ID, Google and Okta SAML',
    ],
    icon: Users,
    visual: CollaborationMock,
    accent: {
      primary: '#d97706',
      light: '#fffbeb',
      border: '#fde68a',
      tagBg: 'bg-amber-50 border-amber-200 text-amber-800',
    },
    chip: 'Contextual Mentions & Enterprise SSO',
    reverse: false, // Content Left, Image Right (Zigzag!)
  },
  {
    id: 'report',
    stepNumber: '04',
    label: 'Report',
    eyebrow: 'Analytics & Reporting',
    title: 'Actionable insights for stand-ups, steering and audits',
    description:
      'Dashboards for every role, project health signals, cross-project roadmaps and one-click PDF exports — so status reporting takes minutes instead of a morning.',
    bullets: [
      'Role dashboards for admins, PMs, leads and members',
      'Sprint burndown, velocity charts, and project health signals',
      'Cross-project roadmap and initiative progress tracking',
      'Sprint, project, and release reports exported to PDF',
    ],
    icon: BarChart3,
    visual: ReportingMock,
    accent: {
      primary: '#7c3aed',
      light: '#f5f3ff',
      border: '#ddd6fe',
      tagBg: 'bg-violet-50 border-violet-200 text-violet-800',
    },
    chip: 'Delivery Health Score: 88/100',
    reverse: true, // Image Left, Content Right (Zigzag!)
  },
];

export const ProductCapabilitiesZigzagSection = () => {
  return (
    <section
      id="features"
      className="scroll-mt-20 py-16 sm:py-24 bg-[#f8fafd] border-b border-[#e2e8ea] relative overflow-hidden"
    >
      {/* Background subtle dot pattern */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ============================================================ */}
        {/* SECTION HEADER                                               */}
        {/* ============================================================ */}
        <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-20">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-xs font-extrabold uppercase tracking-widest text-[#0d9488] shadow-xs">
            <Target className="w-3.5 h-3.5" aria-hidden="true" />
            Product Capabilities
          </span>

          <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0a0f1e]">
            Everything {site.name} ships with today
          </h2>

          <p className="mt-3.5 text-sm sm:text-base text-[#475569] leading-relaxed max-w-2xl mx-auto">
            Four powerful workflows — all available in the product. Explore them in your workspace after you sign up.
          </p>
        </div>

        {/* ============================================================ */}
        {/* ZIGZAG ROWS: Alternating Content and Images                  */}
        {/* ============================================================ */}
        <div className="space-y-16 sm:space-y-24">
          {CAPABILITIES.map((cap) => {
            const Visual = cap.visual;

            return (
              <div
                key={cap.id}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center"
              >
                {/* ---------------------------------------------------- */}
                {/* CONTENT SIDE (Alternates left or right)              */}
                {/* ---------------------------------------------------- */}
                <div
                  className={`lg:col-span-5 flex flex-col justify-center ${
                    cap.reverse ? 'lg:order-2' : 'lg:order-1'
                  }`}
                >
                  {/* Yellow/Amber Pointing Line & Hollow Square Node */}
                  <div className="flex items-center mb-3.5">
                    <div className="w-10 sm:w-16 h-[2px] bg-amber-400 flex-shrink-0" />
                    <div className="w-2.5 h-2.5 border-2 border-amber-500 bg-white flex-shrink-0 -ml-[1px] mr-3 shadow-xs" />
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${cap.accent.tagBg}`}
                    >
                      <cap.icon className="w-3 h-3" aria-hidden="true" />
                      {cap.stepNumber} · {cap.eyebrow}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0a0f1e] leading-snug">
                    {cap.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-3 text-sm sm:text-base text-[#475569] leading-relaxed">
                    {cap.description}
                  </p>

                  {/* Bullet points */}
                  <ul className="mt-5 space-y-2.5">
                    {cap.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-start gap-2.5 text-xs sm:text-sm text-[#1e293b]"
                      >
                        <CheckCircle2
                          className="w-4 h-4 flex-shrink-0 mt-0.5"
                          style={{ color: cap.accent.primary }}
                          aria-hidden="true"
                        />
                        <span className="font-medium leading-snug">{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA link */}
                  <div className="mt-6 flex items-center gap-3">
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-fe-sm hover:shadow-fe-md hover:-translate-y-0.5 transition-all group"
                      style={{ backgroundColor: cap.accent.primary }}
                    >
                      Explore {cap.label} in Workspace
                      <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>

                {/* ---------------------------------------------------- */}
                {/* IMAGE / VISUAL SIDE (Alternates right or left)       */}
                {/* ---------------------------------------------------- */}
                <div
                  className={`lg:col-span-7 relative ${
                    cap.reverse ? 'lg:order-1' : 'lg:order-2'
                  }`}
                >
                  {/* Subtle accent glow behind mockup */}
                  <div
                    aria-hidden="true"
                    className="absolute -inset-2 rounded-3xl opacity-30 blur-xl pointer-events-none"
                    style={{ backgroundColor: cap.accent.border }}
                  />

                  {/* Visual container with frame & feature badge */}
                  <div className="relative rounded-2xl border border-[#e2e8ea] bg-white p-2.5 sm:p-3 shadow-fe-md hover:shadow-fe-xl transition-all duration-300">
                    {/* Floating feature chip */}
                    <div className="absolute -top-3 right-6 z-10 hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e2e8ea] text-[10px] font-bold text-[#0a0f1e] shadow-xs">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>{cap.chip}</span>
                    </div>

                    <div className="w-full overflow-hidden rounded-xl">
                      <Visual />
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default ProductCapabilitiesZigzagSection;
