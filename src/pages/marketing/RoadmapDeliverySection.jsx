import React, { useState, useEffect, useRef } from 'react';
import {
  Map,
  Activity,
  CheckCircle2,
  GitBranch,
  TrendingDown,
  Clock,
} from 'lucide-react';

import crossRoadmapVideo from '../../assets/cross-roadmap.mp4';
import burndownVideo from '../../assets/burndown.mp4';

const ITEMS = [
  {
    id: 'roadmap',
    num: '01',
    category: 'Strategic Planning',
    icon: Map,
    title: 'Cross-Project Roadmaps',
    subtitle: 'Align engineering dependencies, milestone horizons, and release tracks in real-time across multiple squads.',
    videoSrc: crossRoadmapVideo,
    videoClass: 'w-full h-full object-contain object-center scale-100',
    bullets: [
      'Multi-squad cross-dependency mapping',
      'Interactive Gantt timeline with drag milestones',
      'Dynamic capacity & bottleneck projection',
    ],
  },
  {
    id: 'burndown',
    num: '02',
    category: 'Velocity & Burn Rate',
    icon: Activity,
    title: 'Sprint Burndown & Velocity',
    subtitle: 'Monitor iteration scope trajectory against ideal burn rate with automatic bottleneck detection and zero manual status chasing.',
    videoSrc: burndownVideo,
    videoClass: 'w-full h-full object-contain object-center scale-100',
    bullets: [
      'Ideal burn convergence tracking',
      'Automated scope-creep detection',
      'Predictive iteration forecasts',
    ],
  },
];

const CYCLE_DURATION = 7500; // 7.5 seconds auto-cycle

/**
 * Roadmap and Delivery Section
 * - Automatically cycles between Cross-Project Roadmap and Sprint Burndown videos
 * - Video positioned on the right side with zero borders/corners
 * - Pure white background with zero blue glow
 * - Compact vertical height to fit completely without scrolling
 */
export const RoadmapDeliverySection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const roadmapVideoRef = useRef(null);
  const burndownVideoRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  const activeItem = ITEMS[activeIndex];

  // Automatic cycling between Roadmap and Burndown videos
  useEffect(() => {
    if (isPaused) return;

    startTimeRef.current = Date.now() - (progress / 100) * CYCLE_DURATION;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const currentProgress = (elapsed / CYCLE_DURATION) * 100;

      if (currentProgress >= 100) {
        setProgress(0);
        setActiveIndex((prev) => (prev + 1) % ITEMS.length);
        startTimeRef.current = Date.now();
      } else {
        setProgress(currentProgress);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isPaused, activeIndex]);

  // Reset and play the active video when switching tabs
  useEffect(() => {
    if (activeIndex === 0 && roadmapVideoRef.current) {
      try {
        roadmapVideoRef.current.currentTime = 0;
        roadmapVideoRef.current.play().catch(() => {});
      } catch (e) {}
    } else if (activeIndex === 1 && burndownVideoRef.current) {
      try {
        burndownVideoRef.current.currentTime = 0;
        burndownVideoRef.current.play().catch(() => {});
      } catch (e) {}
    }
  }, [activeIndex]);

  const selectItem = (index) => {
    setActiveIndex(index);
    setProgress(0);
    startTimeRef.current = Date.now();
  };

  return (
    <section
      id="showcase"
      className="scroll-mt-20 py-4 sm:py-6 bg-white text-[#0a0f1e] border-y border-[#e2e5ea] relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ========================================================== */}
        {/* CENTERED SECTION HEADER                                    */}
        {/* ========================================================== */}
        <div className="max-w-2xl mx-auto text-center mb-3 sm:mb-4">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0a0f1e] leading-tight">
            RoadMap and Delivery
          </h2>
          <p className="mt-1 text-[#4b5563] text-xs sm:text-sm leading-relaxed max-w-xl mx-auto">
            From strategic milestone planning to automated sprint iterations — track progress and velocity with real-time delivery intelligence.
          </p>
        </div>

        {/* ========================================================== */}
        {/* 2-COLUMN LAYOUT: CONTENT ON LEFT, AUTO-VIDEO ON RIGHT      */}
        {/* ========================================================== */}
        <div
          className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7 items-center"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* -------------------------------------------------------- */}
          {/* LEFT COLUMN: 2 INTERACTIVE CARDS WITH PROGRESS BARS      */}
          {/* -------------------------------------------------------- */}
          <div className="lg:col-span-5 flex flex-col justify-center gap-3">
            {ITEMS.map((item, idx) => {
              const isActive = activeIndex === idx;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => selectItem(idx)}
                  className={`relative rounded-xl p-3.5 sm:p-4 transition-all duration-200 cursor-pointer border ${
                    isActive
                      ? 'bg-white border-[#0d9488]/40 shadow-xs ring-1 ring-[#0d9488]/20'
                      : 'bg-[#f8fafc] border-[#e2e5ea] hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {/* Active Progress Bar Underlay */}
                  {isActive && (
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-slate-100 rounded-b-xl overflow-hidden">
                      <div
                        className="h-full bg-[#0d9488] transition-all duration-75 rounded-b-xl"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}

                  {/* Header Row: Number + Category */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center font-mono text-[10px] font-bold transition-colors ${
                          isActive
                            ? 'bg-[#0a0f1e] text-white'
                            : 'bg-white border border-[#e2e5ea] text-slate-500'
                        }`}
                      >
                        {item.num}
                      </span>
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${
                          isActive ? 'text-[#0f766e]' : 'text-slate-500'
                        }`}
                      >
                        {item.category}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border transition-colors ${
                        isActive
                          ? 'text-[#0f766e] border-teal-200 bg-teal-50'
                          : 'text-slate-500 border-slate-200 bg-white'
                      }`}
                    >
                      <Icon className="w-2.5 h-2.5" />
                      {isActive ? 'Active' : 'Click to view'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    className={`font-display text-base sm:text-lg font-bold tracking-tight transition-colors ${
                      isActive ? 'text-[#0a0f1e]' : 'text-slate-700'
                    }`}
                  >
                    {item.title}
                  </h3>

                  {/* Details */}
                  {isActive ? (
                    <div className="mt-1.5 pt-1.5 border-t border-slate-100">
                      <p className="text-xs text-[#4b5563] leading-relaxed mb-2">
                        {item.subtitle}
                      </p>
                      <ul className="space-y-1">
                        {item.bullets.map((bullet) => (
                          <li
                            key={bullet}
                            className="flex items-center gap-1.5 text-xs text-[#1a1d23]"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#0d9488] shrink-0" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                      {item.subtitle}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* -------------------------------------------------------- */}
          {/* RIGHT COLUMN: AUTO-CROSSFADING VIDEOS (NO BORDERS)       */}
          {/* -------------------------------------------------------- */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Seamless Video Stage with Zero Corners and Zero Border Boxes */}
            <div className="relative w-full h-[260px] sm:h-[300px] lg:h-[330px] overflow-hidden bg-transparent group/video">
              {/* Video 1: Cross-Project Roadmap */}
              <video
                ref={roadmapVideoRef}
                src={crossRoadmapVideo}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className={`w-full h-full object-contain object-center scale-100 absolute inset-0 transition-opacity duration-500 ${
                  activeIndex === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
                style={{
                  filter: 'contrast(1.06) brightness(1.12)',
                  mixBlendMode: 'multiply',
                  imageRendering: '-webkit-optimize-contrast',
                  transform: 'translate3d(0, 0, 0)',
                }}
              />

              {/* Video 2: Sprint Burndown */}
              <video
                ref={burndownVideoRef}
                src={burndownVideo}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className={`w-full h-full object-contain object-center absolute inset-0 transition-opacity duration-500 ${
                  activeIndex === 1 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
                style={{
                  imageRendering: '-webkit-optimize-contrast',
                  transform: 'translate3d(0, 0, 0)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RoadmapDeliverySection;