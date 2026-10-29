import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, CalendarRange, CheckCircle2, KanbanSquare, Map, ShieldCheck, Users, Workflow, Zap, Target, TrendingUp, ChevronRight, ChevronDown, Play, Hourglass, } from 'lucide-react';
import { ProductPreview } from './ProductPreview';
import { ClickUpProductShowcase } from './ClickUpProductShowcase';
import { AccessMock, BurndownMock, CapacityMock, ReleaseMock, RoadmapMock, WorkflowMock, } from './FeaturePreviews';
import { ProductCapabilitiesHorizontalZigzag } from './ProductCapabilitiesHorizontalZigzag';
import { RoadmapDeliverySection } from './RoadmapDeliverySection';
import { MemberPricingSection } from './MemberPricing';
import { site, trial } from '../../config/siteConfig';
import a1Video from '../../assets/a1.mp4';
import crossRoadmapVideo from '../../assets/cross-roadmap.mp4';
import burndownVideo from '../../assets/burndown.mp4';
import releaseManagementVideo from '../../assets/release-management.mp4';
/** Core capabilities strip */
const CAPABILITIES = [
    { label: 'Kanban Boards', icon: KanbanSquare },
    { label: 'Sprint Planning', icon: CalendarRange },
    { label: 'Gantt Charts', icon: Map },
    { label: 'Team Workload', icon: Users },
    { label: 'Analytics & Reports', icon: BarChart3 },
    { label: 'Enterprise SSO', icon: ShieldCheck },
];

/**
 * Showcase Video Player Component for Delivery at a Glance
 */
const ShowcaseVideo = ({ src, title }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-[#e2e5ea] bg-slate-950 aspect-[16/9] group/video shadow-xs">
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover object-center"
      />

      {/* Play/Pause Control on Hover */}
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? `Pause ${title} animation` : `Play ${title} animation`}
        className="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-lg bg-black/60 hover:bg-black/85 text-white flex items-center justify-center opacity-0 group-hover/video:opacity-100 transition-opacity backdrop-blur-xs border border-white/20 cursor-pointer"
      >
        {isPlaying ? (
          <span className="w-2.5 h-2.5 flex items-center justify-between">
            <span className="w-0.5 h-full bg-white rounded-full" />
            <span className="w-0.5 h-full bg-white rounded-full" />
          </span>
        ) : (
          <Play className="w-3 h-3 fill-current ml-0.5 text-white" />
        )}
      </button>
    </div>
  );
};

/** Delivery showcase items */
const SHOWCASE = [
    {
      title: 'Roadmap timelines',
      caption: 'Plan across projects',
      video: crossRoadmapVideo,
      Visual: RoadmapMock,
    },
    {
      title: 'Sprint burndown',
      caption: 'Track the iteration',
      video: burndownVideo,
      Visual: BurndownMock,
    },
    {
      title: 'Release management',
      caption: 'Ship with confidence',
      video: releaseManagementVideo,
      Visual: ReleaseMock,
    },
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
        Visual: WorkflowMock,
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
const GLYPHS = '01#_%&<>[]XØ$*+-=~';

/**
 * Cybernetic Robotic Glitch Headline:
 * Synchronized electric flicker, terminal character decrypt, and RGB chromatic aberration shift
 * applied simultaneously to BOTH "Turn Deadlines into" and "Done-Lines."
 */
export const RoboticGlitchHeadline = () => {
  const line1Target = 'Turn Deadlines into';
  const line2Target = 'Done-Lines.';

  const [line1Display, setLine1Display] = useState(line1Target);
  const [line2Display, setLine2Display] = useState(line2Target);
  const [isGlitching, setIsGlitching] = useState(false);

  const triggerGlitch = useCallback(() => {
    setIsGlitching(true);
    let iteration = 0;

    const interval = setInterval(() => {
      // Scramble Line 1
      setLine1Display(
        line1Target
          .split('')
          .map((char, index) => {
            if (index < iteration * 2) {
              return line1Target[index];
            }
            if (char === ' ') return ' ';
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join('')
      );

      // Scramble Line 2
      setLine2Display(
        line2Target
          .split('')
          .map((char, index) => {
            if (index < iteration) {
              return line2Target[index];
            }
            if (char === ' ' || char === '-') return char;
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join('')
      );

      if (iteration >= line2Target.length) {
        clearInterval(interval);
        setLine1Display(line1Target);
        setLine2Display(line2Target);
        setIsGlitching(false);
      }
      iteration += 1 / 4.2;
    }, 70);
  }, []);

  useEffect(() => {
    // Initial robotic glitch flicker on page load
    const initialTimer = setTimeout(triggerGlitch, 500);

    // Periodic slow electric glitch flicker burst every 7.5s
    const intervalTimer = setInterval(triggerGlitch, 7500);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [triggerGlitch]);

  return (
    <h1
      onMouseEnter={triggerGlitch}
      className="mt-5 font-display font-extrabold tracking-tight text-4xl sm:text-5xl lg:text-[62px] lg:leading-[1.1] max-w-4xl mx-auto animate-slide-up cursor-pointer select-none group"
    >
      {/* LINE 1: "Turn Deadlines into" with Robotic Electric Flicker & RGB Glitch */}
      <span
        className={`relative inline-block ${
          isGlitching ? 'animate-cyber-flicker' : ''
        }`}
        data-text={line1Display}
      >
        {/* Main Solid White Text */}
        <span className="relative z-10 text-white font-extrabold tracking-tight">
          {line1Display}
        </span>

        {/* Cyan RGB Chromatic Shift */}
        <span
          aria-hidden="true"
          className={`absolute inset-0 select-none pointer-events-none text-cyan-400 font-extrabold tracking-tight ${
            isGlitching
              ? 'opacity-85 animate-glitch-cyan'
              : 'opacity-0 group-hover:opacity-40 transition-opacity'
          }`}
        >
          {line1Display}
        </span>

        {/* Magenta RGB Chromatic Shift */}
        <span
          aria-hidden="true"
          className={`absolute inset-0 select-none pointer-events-none text-pink-500 font-extrabold tracking-tight ${
            isGlitching
              ? 'opacity-75 animate-glitch-magenta'
              : 'opacity-0 group-hover:opacity-35 transition-opacity'
          }`}
        >
          {line1Display}
        </span>
      </span>

      <br className="hidden sm:inline" />{' '}

      {/* LINE 2: "Done-Lines." with Electric Gradient Flicker & Cyber Caret */}
      <span
        className={`relative inline-block mt-1 sm:mt-0 ${
          isGlitching ? 'animate-cyber-flicker' : ''
        }`}
        data-text={line2Display}
      >
        {/* Main Gradient Text */}
        <span
          className="relative z-10 bg-clip-text text-transparent font-black tracking-tight"
          style={{
            backgroundImage: 'linear-gradient(90deg, #2dd4bf, #06b6d4, #38bdf8)',
          }}
        >
          {line2Display}
        </span>

        {/* Line 2 Cyan RGB Ghost */}
        <span
          aria-hidden="true"
          className={`absolute inset-0 select-none pointer-events-none text-cyan-400 font-black tracking-tight ${
            isGlitching
              ? 'opacity-90 animate-glitch-cyan'
              : 'opacity-0 group-hover:opacity-60 transition-opacity'
          }`}
        >
          {line2Display}
        </span>

        {/* Line 2 Magenta RGB Ghost */}
        <span
          aria-hidden="true"
          className={`absolute inset-0 select-none pointer-events-none text-pink-500 font-black tracking-tight ${
            isGlitching
              ? 'opacity-80 animate-glitch-magenta'
              : 'opacity-0 group-hover:opacity-50 transition-opacity'
          }`}
        >
          {line2Display}
        </span>
      </span>
    </h1>
  );
};

/**
 * Seamless Dual-Buffered Hero Video Loop
 * Provides continuous, buttery smooth visuals with a gradual 1.2s cross-dissolve,
 * eliminating all abrupt cuts, loop jumps, and blank frames.
 */
const SeamlessHeroVideo = ({ src }) => {
  const videoRefA = useRef(null);
  const videoRefB = useRef(null);
  const [activePlayer, setActivePlayer] = useState('A');
  const isTransitioningRef = useRef(false);

  useEffect(() => {
    const vA = videoRefA.current;
    const vB = videoRefB.current;
    if (!vA || !vB) return;

    vA.currentTime = 0;
    vA.play().catch(() => {});

    const FADE_TIME = 1.2; // 1.2s gradual cinematic cross-fade

    const checkA = () => {
      if (!vA.duration) return;
      if (vA.currentTime >= vA.duration - FADE_TIME && !isTransitioningRef.current) {
        isTransitioningRef.current = true;
        vB.currentTime = 0;
        vB.play().then(() => {
          setActivePlayer('B');
          setTimeout(() => {
            vA.pause();
            vA.currentTime = 0;
            isTransitioningRef.current = false;
          }, FADE_TIME * 1000 + 100);
        }).catch(() => {
          isTransitioningRef.current = false;
        });
      }
    };

    const checkB = () => {
      if (!vB.duration) return;
      if (vB.currentTime >= vB.duration - FADE_TIME && !isTransitioningRef.current) {
        isTransitioningRef.current = true;
        vA.currentTime = 0;
        vA.play().then(() => {
          setActivePlayer('A');
          setTimeout(() => {
            vB.pause();
            vB.currentTime = 0;
            isTransitioningRef.current = false;
          }, FADE_TIME * 1000 + 100);
        }).catch(() => {
          isTransitioningRef.current = false;
        });
      }
    };

    vA.addEventListener('timeupdate', checkA);
    vB.addEventListener('timeupdate', checkB);

    const onEndedA = () => {
      vB.play().catch(() => {});
      setActivePlayer('B');
    };
    const onEndedB = () => {
      vA.play().catch(() => {});
      setActivePlayer('A');
    };

    vA.addEventListener('ended', onEndedA);
    vB.addEventListener('ended', onEndedB);

    return () => {
      vA.removeEventListener('timeupdate', checkA);
      vB.removeEventListener('timeupdate', checkB);
      vA.removeEventListener('ended', onEndedA);
      vB.removeEventListener('ended', onEndedB);
    };
  }, [src]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
      <video
        ref={videoRefA}
        src={src}
        muted
        playsInline
        preload="auto"
        className={`w-full h-full object-cover object-center mix-blend-screen transition-opacity duration-1000 ease-in-out absolute inset-0 ${
          activePlayer === 'A' ? 'opacity-40 sm:opacity-45 z-10' : 'opacity-0 z-0'
        }`}
        style={{
          transform: 'translate3d(0, 0, 0)',
          imageRendering: '-webkit-optimize-contrast',
        }}
      />
      <video
        ref={videoRefB}
        src={src}
        muted
        playsInline
        preload="auto"
        className={`w-full h-full object-cover object-center mix-blend-screen transition-opacity duration-1000 ease-in-out absolute inset-0 ${
          activePlayer === 'B' ? 'opacity-40 sm:opacity-45 z-10' : 'opacity-0 z-0'
        }`}
        style={{
          transform: 'translate3d(0, 0, 0)',
          imageRendering: '-webkit-optimize-contrast',
        }}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export const HomePage = () => {
    return (<>
      {/* ============================================================ */}
      {/* HERO SECTION: Dedicated First Fold with Agile Video & Headline */}
      {/* ============================================================ */}
      <section className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center overflow-hidden bg-[#0a0f1e] pt-10 pb-8 sm:pt-14 sm:pb-10">
        {/* Background Video Animation: a1.mp4 (Continuous Seamless Dual-Buffered Loop) */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center">
          <SeamlessHeroVideo src={a1Video} />
          {/* Ambient vignette & gradient overlays: balanced so video is softly faded as a sleek backdrop */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 85% 75% at 50% 45%, rgba(10, 15, 30, 0.58) 0%, rgba(10, 15, 30, 0.85) 72%, #0a0f1e 100%), linear-gradient(to bottom, rgba(10,15,30,0.5) 0%, transparent 40%, rgba(10,15,30,0.85) 85%, #0a0f1e 100%)',
            }}
          />
        </div>

        {/* Deep navy → teal ambient gradient backdrop */}
        <div aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse 900px 500px at 50% 10%, rgba(13,148,136,0.3) 0%, transparent 60%), radial-gradient(ellipse 700px 440px at 90% 20%, rgba(6,182,212,0.18) 0%, transparent 58%), radial-gradient(ellipse 640px 400px at 5% 35%, rgba(245,158,11,0.1) 0%, transparent 58%)',
        }}/>
        {/* Subtle grid */}
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.13] z-0 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            maskImage: 'radial-gradient(ellipse 72% 65% at 50% 45%, #000 25%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 72% 65% at 50% 45%, #000 25%, transparent 80%)',
        }}/>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10 my-auto">
          {/* Minimal & Apt Headline with Dual-Text Robotic Flicker & Glitch */}
          <RoboticGlitchHeadline />

          {/* Clean, Neat & Crystal-Clear Subtitle (Zero Messy Boxes) */}
          <p className="mt-5 text-base sm:text-lg lg:text-[19px] text-slate-200 font-medium leading-relaxed max-w-2xl mx-auto animate-slide-up drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
            Plan sprints, track iteration velocity, and deliver complex roadmaps on time. Intuitive Kanban boards, real-time burndown intelligence, and cross-team workflows in one fluid workspace.
          </p>

          {/* Sleek Minimal Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 animate-slide-up">
            <Link
              to="/register"
              id="hero-get-started"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm sm:text-base text-white transition-all duration-200 shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
              }}
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5"/>
            </Link>
            <a
              href="#product"
              id="hero-explore"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm sm:text-base text-white bg-slate-900/80 border border-white/20 hover:bg-slate-800 hover:border-white/35 transition-all duration-200 backdrop-blur-md shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-current text-teal-400" aria-hidden="true"/>
              <span>Explore Features</span>
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

          {/* 7-Day Free Trial Notice - Elegant & High Legibility */}
          <p className="mt-5 text-sm font-medium text-slate-300 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
            <span className="text-white font-semibold">Free 7-day trial</span> · No credit card required ·{' '}
            <Link to="/login" className="text-teal-300 font-semibold hover:underline hover:text-teal-200 transition-colors">
              Log in
            </Link>
          </p>
        </div>

        {/* Subtle Down Scroll Indicator to Product Overview */}
        <div className="relative z-10 pt-4 pb-2 animate-bounce">
          <a
            href="#product"
            aria-label="Scroll down to Product Overview"
            className="inline-flex items-center justify-center text-slate-400 hover:text-teal-400 transition-colors p-2"
          >
            <ChevronDown className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* ============================================================ */}
      {/* PRODUCT OVERVIEW SECTION (Down below the Hero fold)          */}
      {/* ============================================================ */}
      <section id="product" className="relative scroll-mt-16 py-14 sm:py-20 bg-[#0a0f1e] border-t border-slate-800/80">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Subtle glow ring behind showcase */}
          <div aria-hidden="true" className="absolute -inset-x-4 top-8 bottom-8 rounded-[36px] blur-3xl opacity-60 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.25), rgba(6,182,212,0.18), rgba(245,158,11,0.12))' }}/>
          
          <div className="relative rounded-3xl border border-white/20 bg-white/95 backdrop-blur-xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.45)] p-4 sm:p-6">
            <ClickUpProductShowcase />
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            Interactive Limber Lithe Member Portal showcase — explore Dashboard, Projects, Tasks, Sprint Iterations, and Work Queue in real-time.
          </p>
        </div>
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
      {/* PRODUCT CAPABILITIES — HORIZONTAL SCROLL ZIGZAG              */}
      {/* ============================================================ */}
      <div id="product-capabilities" className="scroll-mt-16" />
      <ProductCapabilitiesHorizontalZigzag />

      {/* ============================================================ */}
      {/* ROADMAP AND DELIVERY — INTERACTIVE FEATURE DECK               */}
      {/* ============================================================ */}
      <div id="showcase" className="scroll-mt-16" />
      <RoadmapDeliverySection />

      {/* ============================================================ */}
      {/* WORKFLOW CUSTOMIZATION                                        */}
      {/* ============================================================ */}
      <section id="workflow" className="scroll-mt-20 py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#f0fdfa] border border-[#99f6e4] text-[#0f766e] text-xs font-bold uppercase tracking-wider">
              <Workflow className="w-4 h-4" aria-hidden="true"/>
              Workflow customization
            </div>
            <h2 className="mt-5 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0a0f1e] leading-tight">
              Your workflow,{' '}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #0d9488, #06b6d4)' }}>
                your rules
              </span>
            </h2>
            <p className="mt-4 text-[#4b5563] leading-relaxed">
              Configure the statuses, WIP limits and required fields each project needs. Keep lightweight
              teams light, and give governance-heavy teams the controls they expect.
            </p>
            <ul className="mt-6 space-y-3">
              {[
            'Custom workflow statuses and transitions per project',
            'Work-in-progress limits that surface bottlenecks early',
            'Issue-type schemes, custom fields and required-field rules',
            'Automation rules for status changes, releases and notifications',
        ].map((bullet) => (<li key={bullet} className="flex items-start gap-3 text-sm text-[#1a1d23]">
                  <CheckCircle2 className="w-4.5 h-4.5 text-[#0d9488] flex-shrink-0 mt-0.5" aria-hidden="true"/>
                  <span>{bullet}</span>
                </li>))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-2.5">
              <Link to="/register" className="btn-primary">
                Start building
                <ArrowRight className="w-4 h-4"/>
              </Link>
              <Link to="/pricing" className="btn-secondary">
                View pricing
              </Link>
            </div>
          </div>
          <div>
            <WorkflowMock />
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
    </>);
};
export default HomePage;
