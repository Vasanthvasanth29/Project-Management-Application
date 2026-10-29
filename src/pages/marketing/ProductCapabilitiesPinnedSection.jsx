import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarRange,
  KanbanSquare,
  Users,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Target,
  Sparkles,
  ArrowRight,
  MousePointer2,
} from 'lucide-react';
import {
  IterationMock,
  TaskBoardMock,
  CollaborationMock,
  ReportingMock,
} from './FeaturePreviews';
import { site } from '../../config/siteConfig';

const HEADER_OFFSET = 64; // Sticky navbar height in pixels (h-16)

const CAPABILITIES = [
  {
    id: 'plan',
    stepNumber: '01',
    label: 'Plan',
    eyebrow: 'Sprint & project planning',
    badgeText: 'Agile Cadence',
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
      ring: 'rgba(13, 148, 136, 0.25)',
      glow: 'rgba(13, 148, 136, 0.15)',
      tagBg: 'bg-teal-50 border-teal-200 text-teal-800',
    },
    floatingPill: '⚡ Live Sprint Velocity Tracking',
  },
  {
    id: 'track',
    stepNumber: '02',
    label: 'Track',
    eyebrow: 'Kanban & task tracking',
    badgeText: 'Realtime WIP',
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
      ring: 'rgba(37, 99, 235, 0.25)',
      glow: 'rgba(37, 99, 235, 0.15)',
      tagBg: 'bg-blue-50 border-blue-200 text-blue-800',
    },
    floatingPill: '🎯 Column Bottleneck Warnings',
  },
  {
    id: 'collaborate',
    stepNumber: '03',
    label: 'Collaborate',
    eyebrow: 'Team collaboration',
    badgeText: 'Zero Friction',
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
      ring: 'rgba(217, 119, 6, 0.25)',
      glow: 'rgba(217, 119, 6, 0.15)',
      tagBg: 'bg-amber-50 border-amber-200 text-amber-800',
    },
    floatingPill: '💬 Contextual Mentions & Threads',
  },
  {
    id: 'report',
    stepNumber: '04',
    label: 'Report',
    eyebrow: 'Analytics & reporting',
    badgeText: 'Audit Ready',
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
      ring: 'rgba(124, 58, 237, 0.25)',
      glow: 'rgba(124, 58, 237, 0.15)',
      tagBg: 'bg-violet-50 border-violet-200 text-violet-800',
    },
    floatingPill: '📊 One-Click Boardroom PDF Export',
  },
];

export const ProductCapabilitiesPinnedSection = () => {
  const outerContainerRef = useRef(null);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartScrollY = useRef(0);
  const touchStartX = useRef(0);
  const wheelCooldownRef = useRef(false);

  // Smooth lerped progress state for 60/120fps buttery animation
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const animFrameId = useRef(null);

  // Measure and compute scroll progress inside the pinned section
  const handleScroll = useCallback(() => {
    if (!outerContainerRef.current) return;
    const rect = outerContainerRef.current.getBoundingClientRect();
    const visibleHeight = window.innerHeight - HEADER_OFFSET;
    const totalDist = rect.height - visibleHeight;
    if (totalDist <= 0) return;

    // Scrolled distance from when the section hits top-16 (64px)
    const scrolled = -(rect.top - HEADER_OFFSET);
    const rawRatio = scrolled / totalDist;
    const clamped = Math.max(0, Math.min(1, rawRatio));
    targetProgressRef.current = clamped;

    // Exact active step index based on progress
    const stepIndex = Math.min(
      CAPABILITIES.length - 1,
      Math.floor(clamped * (CAPABILITIES.length - 0.05))
    );
    setActiveStep(stepIndex);
  }, []);

  // RAF loop for smooth interpolated progress (eliminates micro-stutters)
  useEffect(() => {
    const updateInterpolation = () => {
      const diff = targetProgressRef.current - currentProgressRef.current;
      if (Math.abs(diff) > 0.0004) {
        currentProgressRef.current += diff * 0.24; // smooth spring easing
        setScrollProgress(currentProgressRef.current);
      } else {
        currentProgressRef.current = targetProgressRef.current;
        setScrollProgress(currentProgressRef.current);
      }
      animFrameId.current = requestAnimationFrame(updateInterpolation);
    };

    animFrameId.current = requestAnimationFrame(updateInterpolation);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [handleScroll]);

  // Programmatic scroll to a specific capability step
  const scrollToStep = useCallback((index) => {
    if (!outerContainerRef.current) return;
    const rect = outerContainerRef.current.getBoundingClientRect();
    const absoluteTop = window.scrollY + rect.top - HEADER_OFFSET;
    const visibleHeight = window.innerHeight - HEADER_OFFSET;
    const totalDist = rect.height - visibleHeight;
    const targetScrollY = absoluteTop + (index / (CAPABILITIES.length - 1)) * totalDist;

    window.scrollTo({
      top: targetScrollY,
      behavior: 'smooth',
    });
  }, []);

  // Step-snapped Wheel Scroll: when cursor is over the pinned section, wheeling down/up steps cleanly from card to card
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheel = (e) => {
      if (!outerContainerRef.current) return;
      const rect = outerContainerRef.current.getBoundingClientRect();
      const isPinned =
        rect.top <= HEADER_OFFSET + 6 && rect.bottom >= window.innerHeight - 6;

      if (!isPinned) return;

      // When cooldown is active, prevent default jump during transition
      if (wheelCooldownRef.current) {
        if (
          (e.deltaY > 0 && activeStep < CAPABILITIES.length - 1) ||
          (e.deltaY < 0 && activeStep > 0)
        ) {
          e.preventDefault();
        }
        return;
      }

      // Scrolling down (deltaY > 15) -> advance to next card
      if (e.deltaY > 15 && activeStep < CAPABILITIES.length - 1) {
        e.preventDefault();
        wheelCooldownRef.current = true;
        const next = activeStep + 1;
        scrollToStep(next);
        setTimeout(() => {
          wheelCooldownRef.current = false;
        }, 550);
      }
      // Scrolling up (deltaY < -15) -> move back to previous card
      else if (e.deltaY < -15 && activeStep > 0) {
        e.preventDefault();
        wheelCooldownRef.current = true;
        const prev = activeStep - 1;
        scrollToStep(prev);
        setTimeout(() => {
          wheelCooldownRef.current = false;
        }, 550);
      }
      // At boundaries (card 4 scrolling down, or card 1 scrolling up), do not preventDefault
      // allowing the page to scroll smoothly to adjacent sections!
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [activeStep, scrollToStep]);

  // Mouse drag-to-navigate handling
  const onMouseDown = (e) => {
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartScrollY.current = window.scrollY;
  };

  const onMouseMove = (e) => {
    if (!isDragging || !outerContainerRef.current) return;
    const deltaX = e.clientX - dragStartX.current;
    const rect = outerContainerRef.current.getBoundingClientRect();
    const visibleHeight = window.innerHeight - HEADER_OFFSET;
    const totalDist = rect.height - visibleHeight;
    const scrollFactor = totalDist / (window.innerWidth * 1.1);
    window.scrollTo({
      top: dragStartScrollY.current - deltaX * scrollFactor,
      behavior: 'auto',
    });
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  // Touch swipe support on mobile/tablet
  const onTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      touchStartX.current = e.touches[0].clientX;
    }
  };

  const onTouchEnd = (e) => {
    if (e.changedTouches && e.changedTouches[0]) {
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(deltaX) > 40) {
        if (deltaX < 0) {
          // Swiped left -> next slide
          scrollToStep(Math.min(CAPABILITIES.length - 1, activeStep + 1));
        } else {
          // Swiped right -> prev slide
          scrollToStep(Math.max(0, activeStep - 1));
        }
      }
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      const next = Math.min(CAPABILITIES.length - 1, activeStep + 1);
      scrollToStep(next);
    } else if (e.key === 'ArrowLeft') {
      const prev = Math.max(0, activeStep - 1);
      scrollToStep(prev);
    }
  };

  // Horizontal translation percentage (0% to (CAPABILITIES.length - 1) * 100%)
  const maxSlideIndex = CAPABILITIES.length - 1;
  const currentTranslateXPercent = scrollProgress * maxSlideIndex * 100;

  // SVG Line drawing percentage
  const strokePercent = scrollProgress * 100;

  return (
    <div
      ref={outerContainerRef}
      id="features"
      className="relative w-full bg-[#f8fafd] select-none"
      style={{ height: '360vh' }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Interactive Product Capabilities Timeline"
    >
      {/* Pinned Sticky Viewport docked right under top-16 navbar */}
      <div
        ref={viewportRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="sticky top-16 h-[calc(100vh-4rem)] w-full overflow-hidden flex flex-col justify-between pt-2.5 pb-2 border-b border-[#e2e8ea] bg-[#f8fafd]"
      >
        {/* Dynamic ambient background glow that shifts with active step */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none transition-all duration-700 ease-out"
          style={{
            background: `radial-gradient(1100px 580px at ${
              25 + scrollProgress * 50
            }% 40%, ${
              CAPABILITIES[activeStep]?.accent?.glow || 'rgba(13,148,136,0.1)'
            } 0%, transparent 70%)`,
          }}
        />

        {/* Ambient Grid pattern */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #0a0f1e 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* ============================================================ */}
        {/* HEADER: SECTION TITLE & INTERACTIVE TIMELINE SVG             */}
        {/* ============================================================ */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-shrink-0">
          
          {/* Top badge & headline */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-1.5 border-b border-[#e2e8ea]/80">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#0d9488]">
                <Target className="w-3.5 h-3.5" aria-hidden="true" />
                Product Capabilities
                <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-[#0d9488]/40" />
                <span className="hidden sm:inline-block text-[#64748b] text-[11px] font-semibold tracking-normal normal-case">
                  Scroll or click steps to explore
                </span>
              </div>
              <h2 className="mt-0.5 font-display text-lg sm:text-2xl font-extrabold tracking-tight text-[#0a0f1e]">
                Everything {site.name} ships with today
              </h2>
            </div>

            {/* Stepper info badge + Quick Prev/Next buttons */}
            <div className="flex items-center gap-2.5">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#e2e8ea] bg-white/95 backdrop-blur-md px-3 py-1 text-xs font-bold text-[#334155] shadow-fe-xs">
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: CAPABILITIES[activeStep].accent.primary }}
                />
                <span>
                  Stage <strong style={{ color: CAPABILITIES[activeStep].accent.primary }}>{activeStep + 1}</strong> of {CAPABILITIES.length}
                </span>
                <span className="text-[#cbd5e1]">|</span>
                <span className="uppercase text-[10px] tracking-wider text-[#64748b]">
                  {CAPABILITIES[activeStep].label}
                </span>
              </div>

              {/* Prev / Next Chevrons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scrollToStep(Math.max(0, activeStep - 1))}
                  disabled={activeStep === 0}
                  className="p-1.5 rounded-lg border border-[#e2e8ea] bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-[#334155] transition-all shadow-fe-xs"
                  aria-label="Previous capability"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToStep(Math.min(CAPABILITIES.length - 1, activeStep + 1))}
                  disabled={activeStep === CAPABILITIES.length - 1}
                  className="p-1.5 rounded-lg border border-[#e2e8ea] bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-[#334155] transition-all shadow-fe-xs"
                  aria-label="Next capability"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SVG LINE DRAWING & TIMELINE NAVIGATION                       */}
          {/* ============================================================ */}
          <div className="relative mt-2 pt-1 pb-1">
            {/* SVG Connecting Rail */}
            <div className="absolute top-[20px] left-[6%] right-[6%] h-[4px] -translate-y-1/2 pointer-events-none z-0">
              {/* Background inactive rail */}
              <div className="absolute inset-0 bg-[#e2e8ea] rounded-full" />

              {/* Active Animated SVG Line Drawing */}
              <svg
                className="absolute inset-0 w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0d9488" />
                    <stop offset="35%" stopColor="#2563eb" />
                    <stop offset="70%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
                <line
                  x1="0%"
                  y1="50%"
                  x2="100%"
                  y2="50%"
                  stroke="url(#timelineGradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: '100%',
                    strokeDashoffset: `${100 - strokePercent}%`,
                    transition: 'stroke-dashoffset 0.1s linear',
                  }}
                />
              </svg>
            </div>

            {/* 4 Interactive Timeline Milestone Nodes */}
            <div className="relative z-10 grid grid-cols-4 w-full">
              {CAPABILITIES.map((cap, idx) => {
                const Icon = cap.icon;
                const isPassed = scrollProgress >= idx / (CAPABILITIES.length - 1) - 0.05;
                const isCurrent = activeStep === idx;

                return (
                  <button
                    key={cap.id}
                    type="button"
                    onClick={() => scrollToStep(idx)}
                    className="group flex flex-col items-center focus:outline-none cursor-pointer"
                  >
                    {/* Node Circle */}
                    <div
                      className={`relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 transition-all duration-300 ${
                        isCurrent
                          ? 'bg-white shadow-md scale-110'
                          : isPassed
                          ? 'bg-white shadow-sm'
                          : 'bg-white border-[#cbd5e1] text-[#94a3b8] group-hover:border-[#94a3b8]'
                      }`}
                      style={{
                        borderColor: isCurrent || isPassed ? cap.accent.primary : undefined,
                        boxShadow: isCurrent ? `0 0 12px ${cap.accent.ring}` : undefined,
                      }}
                    >
                      {/* Pulse ring for active current node */}
                      {isCurrent && (
                        <span
                          className="absolute inset-0 rounded-full animate-ping opacity-35 pointer-events-none"
                          style={{ backgroundColor: cap.accent.primary }}
                        />
                      )}

                      <Icon
                        className="w-3.5 h-3.5 transition-colors duration-200"
                        style={{
                          color: isCurrent || isPassed ? cap.accent.primary : '#94a3b8',
                        }}
                      />
                    </div>

                    {/* Step Label & Number */}
                    <div className="mt-1 text-center transition-all duration-200">
                      <span
                        className={`block text-[11px] font-extrabold uppercase tracking-wider transition-colors ${
                          isCurrent
                            ? 'text-[#0a0f1e]'
                            : isPassed
                            ? 'text-[#475569]'
                            : 'text-[#94a3b8] group-hover:text-[#475569]'
                        }`}
                      >
                        {cap.stepNumber}. {cap.label}
                      </span>
                      <span className="hidden sm:block text-[10px] text-[#64748b] font-medium truncate max-w-[130px]">
                        {cap.badgeText}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* HORIZONTAL CAROUSEL TRACK: UNIFIED SELF-CONTAINED CARDS      */}
        {/* ============================================================ */}
        <div
          ref={trackRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          className={`relative z-10 w-full flex-1 flex items-center overflow-visible cursor-grab active:cursor-grabbing ${
            isDragging ? 'cursor-grabbing' : ''
          }`}
        >
          <div
            className="flex w-[400vw] transition-transform duration-100 ease-out will-change-transform"
            style={{
              transform: `translateX(-${currentTranslateXPercent}vw)`,
            }}
          >
            {CAPABILITIES.map((cap, idx) => {
              const Visual = cap.visual;
              const isCurrent = activeStep === idx;
              const slideDist = Math.abs(scrollProgress * maxSlideIndex - idx);

              return (
                <div
                  key={cap.id}
                  className="w-[100vw] flex-shrink-0 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-1"
                >
                  {/* UNIFIED SELF-CONTAINED SHOWCASE CARD */}
                  <div
                    className={`max-w-6xl w-full bg-white rounded-2xl sm:rounded-3xl border-2 transition-all duration-500 overflow-hidden ${
                      isCurrent
                        ? 'opacity-100 scale-100 shadow-2xl'
                        : 'opacity-40 scale-[0.96] shadow-sm pointer-events-none'
                    }`}
                    style={{
                      borderColor: isCurrent ? cap.accent.primary : '#e2e8ea',
                      boxShadow: isCurrent
                        ? `0 20px 45px -15px ${cap.accent.glow}, 0 0 0 1px ${cap.accent.border}`
                        : undefined,
                    }}
                  >
                    {/* CARD HEADER STRIP: Clearly identifies the capability and step */}
                    <div
                      className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b"
                      style={{
                        backgroundColor: cap.accent.light,
                        borderColor: cap.accent.border,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${cap.accent.tagBg}`}
                        >
                          <cap.icon className="w-3.5 h-3.5" aria-hidden="true" />
                          {cap.eyebrow}
                        </span>
                        <span className="text-xs font-bold text-[#64748b]">
                          {cap.stepNumber} of 04
                        </span>
                      </div>

                      {/* Feature pill on card top-right */}
                      <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white border border-[#e2e8ea] text-[11px] font-bold text-[#0a0f1e] shadow-xs">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>{cap.floatingPill}</span>
                      </div>
                    </div>

                    {/* CARD BODY: Left Text + Right Image inside the same unified frame */}
                    <div className="p-4 sm:p-6 lg:p-7 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center bg-white">
                      
                      {/* LEFT COLUMN: TITLE, BULLETS & CTA */}
                      <div className="lg:col-span-5 flex flex-col justify-center">
                        <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0a0f1e] leading-snug">
                          {cap.title}
                        </h3>

                        <p className="mt-2 text-[#475569] text-xs sm:text-sm leading-relaxed">
                          {cap.description}
                        </p>

                        {/* Bullet points */}
                        <ul className="mt-3.5 space-y-1.5 sm:space-y-2">
                          {cap.bullets.map((bullet) => (
                            <li
                              key={bullet}
                              className="flex items-start gap-2 text-xs text-[#1e293b]"
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

                        {/* Action buttons */}
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <Link
                            to="/register"
                            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-fe-sm hover:shadow-fe-md hover:-translate-y-0.5 transition-all group"
                            style={{ backgroundColor: cap.accent.primary }}
                          >
                            Explore in Workspace
                            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                          </Link>

                          {idx < CAPABILITIES.length - 1 && (
                            <button
                              type="button"
                              onClick={() => scrollToStep(idx + 1)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#475569] hover:text-[#0a0f1e] transition-colors"
                            >
                              Next: {CAPABILITIES[idx + 1].label}
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* RIGHT COLUMN: CORRESPONDING MOCKUP (Locked to this exact card!) */}
                      <div className="lg:col-span-7 flex items-center justify-center">
                        <div
                          className="w-full rounded-xl border border-[#e2e8ea] bg-slate-50/50 p-1.5 sm:p-2 shadow-xs overflow-hidden max-h-[380px]"
                        >
                          <Visual />
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ============================================================ */}
        {/* BOTTOM CONTROLS: PROGRESS SCRUB RAIL & INTERACTION HINT      */}
        {/* ============================================================ */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-shrink-0 pt-1">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl border border-[#e2e8ea] px-4 py-2 shadow-fe-xs">
            
            {/* Interaction guidance hint */}
            <div className="flex items-center gap-2 text-xs text-[#64748b]">
              <MousePointer2 className="w-3.5 h-3.5 text-[#0d9488]" />
              <span className="font-semibold text-[#1e293b]">Scroll mouse wheel</span> or click
              dots to step through capabilities
            </div>

            {/* Micro Scrub Indicator Bar */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-[11px] font-bold text-[#64748b] min-w-[32px]">
                {activeStep + 1} / {CAPABILITIES.length}
              </span>
              <div
                className="relative h-2 w-full sm:w-44 bg-[#e2e8ea] rounded-full overflow-hidden cursor-pointer"
                onClick={(e) => {
                  const bar = e.currentTarget.getBoundingClientRect();
                  const clickRatio = (e.clientX - bar.left) / bar.width;
                  const step = Math.round(clickRatio * (CAPABILITIES.length - 1));
                  scrollToStep(step);
                }}
              >
                <div
                  className="h-full rounded-full transition-all duration-150"
                  style={{
                    width: `${((activeStep + 1) / CAPABILITIES.length) * 100}%`,
                    backgroundColor: CAPABILITIES[activeStep].accent.primary,
                  }}
                />
              </div>

              {/* 4 dots on the scrub bar */}
              <div className="flex items-center gap-1.5">
                {CAPABILITIES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => scrollToStep(i)}
                    className={`h-2 rounded-full transition-all duration-200 ${
                      activeStep === i
                        ? 'w-5 bg-[#0d9488]'
                        : 'w-2 bg-[#cbd5e1] hover:bg-[#94a3b8]'
                    }`}
                    aria-label={`Jump to step ${i + 1}`}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
