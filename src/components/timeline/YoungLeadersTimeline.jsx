import React, { useLayoutEffect, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  CalendarRange,
  KanbanSquare,
  Users,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Workflow,
  Download,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  IterationMock,
  TaskBoardMock,
  CollaborationMock,
  ReportingMock,
  RoadmapMock,
  BurndownMock,
  CapacityMock,
  ReleaseMock,
  WorkflowMock,
  AccessMock,
} from '../../pages/marketing/FeaturePreviews';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// FlowExec Product Capabilities data
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
    accent: '#0d9488',
    visuals: {
      leftMain: IterationMock,
      centerTop: RoadmapMock,
      centerBottom: ReleaseMock,
      rightSide: CapacityMock,
    },
    chip: '⚡ PI 2026.2 Active · 68% Completed',
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
    accent: '#2563eb',
    visuals: {
      leftMain: TaskBoardMock,
      centerTop: WorkflowMock,
      centerBottom: BurndownMock,
      rightSide: AccessMock,
    },
    chip: '🎯 Realtime WIP Limits & Column Bottlenecks',
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
    accent: '#d97706',
    visuals: {
      leftMain: CollaborationMock,
      centerTop: CapacityMock,
      centerBottom: AccessMock,
      rightSide: TaskBoardMock,
    },
    chip: '💬 Contextual Mentions & Enterprise SSO',
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
    accent: '#7c3aed',
    visuals: {
      leftMain: ReportingMock,
      centerTop: BurndownMock,
      centerBottom: RoadmapMock,
      rightSide: ReleaseMock,
    },
    chip: '📊 Executive Delivery Health: 88/100 Strong',
  },
];

export const YoungLeadersTimeline = () => {
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
      // 1. Horizontal pinning on vertical wheel scroll
      gsap.to(track, {
        x: () => -getScrollWidth(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${getScrollWidth()}`,
          pin: true,
          scrub: 1.2, // Silky smooth scrub
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            if (progressBarRef.current) {
              progressBarRef.current.style.width = `${self.progress * 100}%`;
            }
          },
        },
      });

      // 2. Subtle organic floating parallax on the primary collage mocks
      gsap.utils.toArray('.collage-primary-ui').forEach((el) => {
        gsap.to(el, {
          yPercent: 3,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: () => `+=${getScrollWidth()}`,
            scrub: 2,
          },
        });
      });

      gsap.utils.toArray('.collage-secondary-ui').forEach((el) => {
        gsap.to(el, {
          yPercent: -3,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: () => `+=${getScrollWidth()}`,
            scrub: 2,
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
      {/* BACKGROUND: Subtle Tech Pixel Grid with Accent Tiles         */}
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

      {/* Atmospheric dark green gradient lighting */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 85% 65% at 50% 50%, rgba(6, 32, 20, 0.4) 0%, rgba(3, 16, 10, 0.95) 100%)',
        }}
      />

      {/* Ambient pixel glow squares */}
      <div className="absolute top-20 left-[12%] w-14 h-14 bg-emerald-500/10 pointer-events-none" />
      <div className="absolute bottom-32 left-[40%] w-12 h-12 bg-emerald-400/5 pointer-events-none" />
      <div className="absolute top-48 left-[65%] w-16 h-16 bg-emerald-500/10 pointer-events-none" />
      <div className="absolute top-24 right-[16%] w-12 h-12 bg-emerald-400/10 pointer-events-none" />

      {/* Top minimal progress line */}
      <div className="absolute top-0 left-0 right-0 z-40 h-[2px] bg-emerald-950/80">
        <div
          ref={progressBarRef}
          className="h-full bg-yellow-400 transition-all duration-75"
          style={{ width: '0%' }}
        />
      </div>

      {/* ============================================================ */}
      {/* HORIZONTAL CONTINUOUS PINNED TRACK                           */}
      {/* ============================================================ */}
      <div
        ref={trackRef}
        className="relative h-full flex items-center will-change-transform pl-8 sm:pl-12 pr-32"
      >
        {CAPABILITIES.map((cap) => {
          const LeftMain = cap.visuals.leftMain;
          const CenterTop = cap.visuals.centerTop;
          const CenterBottom = cap.visuals.centerBottom;
          const RightSide = cap.visuals.rightSide;

          return (
            <div
              key={cap.id}
              className="relative min-w-[1260px] h-[88vh] flex flex-col justify-between flex-shrink-0 mr-20"
            >
              {/* ======================================================== */}
              {/* 1. TOP UI COLLAGE: FlowExec Product Interfaces           */}
              {/* ======================================================== */}
              <div className="relative w-full pt-4 flex items-start gap-4">
                
                {/* Visual 1 (Left Tall UI Showcase): e.g. Iteration / Task Board */}
                <div className="collage-primary-ui w-[360px] h-[450px] rounded-lg overflow-hidden shadow-2xl flex-shrink-0 bg-white border border-emerald-900/40 p-2">
                  <div className="w-full h-full overflow-hidden rounded-md">
                    <LeftMain />
                  </div>
                </div>

                {/* Visual 2 & 3 (Center Staggered Stack): Roadmap / Workflow / Release */}
                <div className="flex flex-col gap-3 flex-shrink-0 w-[300px]">
                  {/* Visual 2 (Center Top): Landscape Banner */}
                  <div className="w-full h-[215px] rounded-lg overflow-hidden shadow-xl bg-white border border-emerald-900/40 p-1.5">
                    <div className="w-full h-full overflow-hidden rounded-md">
                      <CenterTop />
                    </div>
                  </div>

                  {/* Visual 3 (Center Bottom): Secondary Widget */}
                  <div className="w-full h-[220px] rounded-lg overflow-hidden shadow-xl bg-white border border-emerald-900/40 p-1.5">
                    <div className="w-full h-full overflow-hidden rounded-md">
                      <CenterBottom />
                    </div>
                  </div>
                </div>

                {/* Visual 4 (Far Right UI Showcase): Capacity / Access / Reporting */}
                <div className="collage-secondary-ui ml-2 w-[360px] h-[450px] rounded-lg overflow-hidden shadow-2xl flex-shrink-0 bg-white border border-emerald-900/40 p-2">
                  <div className="w-full h-full overflow-hidden rounded-md">
                    <RightSide />
                  </div>
                </div>

              </div>

              {/* ======================================================== */}
              {/* 2. BOTTOM: YELLOW LINE + SQUARE POINTER + EXPLANATION    */}
              {/* ======================================================== */}
              <div className="relative w-full pb-6 flex items-center">
                
                {/* Continuous Yellow / Gold Timeline Line from Left */}
                <div className="w-16 sm:w-24 h-[1.5px] bg-yellow-400 flex-shrink-0" />

                {/* Pointing Node: Hollow Yellow 8x8 Square Marker */}
                <div className="w-2.5 h-2.5 border-2 border-yellow-400 bg-[#062014] flex-shrink-0 -ml-[1px] mr-4 shadow-[0_0_8px_rgba(250,204,21,0.5)]" />

                {/* Explanation Block: Capability Heading + Description */}
                <div className="flex flex-col max-w-[480px] pr-8">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                      {cap.stepNumber} · {cap.eyebrow}
                    </span>
                    <span className="text-gray-500 text-xs">|</span>
                    <span className="text-[10px] font-mono text-yellow-400/90 tracking-wide">
                      {cap.chip}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans mt-0.5">
                    {cap.label}
                  </h2>

                  <p className="mt-1.5 text-xs sm:text-[13px] text-gray-300 leading-relaxed font-sans opacity-95">
                    {cap.description}
                  </p>

                  {/* Bullet points & Try free CTA */}
                  <div className="mt-2.5 flex items-center gap-4">
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-yellow-400 hover:text-yellow-300 transition-colors"
                    >
                      Explore in Workspace
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    <span className="text-xs text-gray-500 font-mono">
                      {cap.bullets[0]}
                    </span>
                  </div>
                </div>

                {/* Connecting Yellow Line extending out to next capability */}
                <div className="flex-1 h-[1.5px] bg-yellow-400/80 -ml-2" />

                {/* Small terminal joint marker leading into upcoming card */}
                <div className="w-1.5 h-1.5 bg-yellow-400 flex-shrink-0" />

              </div>

            </div>
          );
        })}
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-3 right-8 z-30 flex items-center gap-2 text-[10px] font-mono text-emerald-400/70">
        <span>SCROLL DOWN TO PROGRESS</span>
        <span className="text-yellow-400">→</span>
      </div>
    </section>
  );
};

export default YoungLeadersTimeline;
