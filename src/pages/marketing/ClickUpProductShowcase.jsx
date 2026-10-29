import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FolderGit2,
  CheckSquare,
  CalendarRange,
  Compass,
  ClipboardList,
  Bug,
  Activity,
  Flag,
  Bell,
  ListTodo,
  Settings,
  ArrowRight,
  Play,
  Pause,
  Maximize2,
  X,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

// Cropped high-resolution FlowExec Member Portal screens (inner sidebar removed)
import limberLitheMark from '../../assets/limber-lithe-mark.png';
import dashboardImg from '../../assets/showcase/dashboard.png';
import myProjectsImg from '../../assets/showcase/my-projects.png';
import myTasksImg from '../../assets/showcase/my-tasks.png';
import myIterationImg from '../../assets/showcase/my-iteration.png';
import workQueueImg from '../../assets/showcase/work-queue.png';
import bugsImg from '../../assets/showcase/bugs.png';
import activityImg from '../../assets/showcase/activity.png';
import flaggedTasksImg from '../../assets/showcase/flagged-tasks.png';
import notificationsImg from '../../assets/showcase/notifications.png';

/**
 * 12 FlowExec Member Portal Navigation Tabs
 * Each tab renders the exact cropped main screen (no duplicate inner menu):
 */
export const MEMBER_TABS = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    badge: 'Live',
    image: dashboardImg,
    urlPath: 'dashboard',
    category: 'Execution Hub',
    description: 'Personalized developer greeting, 4 daily stat metrics, tasks due today, and responsibility hierarchy.',
  },
  {
    id: 'my-projects',
    title: 'My Projects',
    icon: FolderGit2,
    badge: '5 Active',
    image: myProjectsImg,
    urlPath: 'projects',
    category: 'Portfolio',
    description: '5 active projects: E-Commerce Platform (42%), Hospital Management (28%), Mobile Banking (5%), LMS (71%).',
  },
  {
    id: 'my-tasks',
    title: 'My Tasks',
    icon: CheckSquare,
    badge: '46 Tasks',
    image: myTasksImg,
    urlPath: 'tasks',
    category: 'Assigned Work',
    description: 'Full hierarchy table spanning Epics, Stories, Tasks, and Sub-tasks with story points and assignees.',
  },
  {
    id: 'my-iteration',
    title: 'My Iteration',
    icon: CalendarRange,
    badge: 'Sprint 3',
    image: myIterationImg,
    urlPath: 'iteration',
    category: 'Agile Cadence',
    description: 'Current iteration board (ECOMM 4.0) with WIP limits across Queued, Executing, Blocked, and Review columns.',
  },
  {
    id: 'work-queue',
    title: 'Work Queue',
    icon: ClipboardList,
    badge: '3 Ready',
    image: workQueueImg,
    urlPath: 'work-queue',
    category: 'Backlog Priority',
    description: 'Prioritized ticket queue with multi-dimensional filtering by epics, statuses, priorities, and assignees.',
  },
  {
    id: 'bugs',
    title: 'Bugs',
    icon: Bug,
    badge: '3 Bugs',
    image: bugsImg,
    urlPath: 'bugs',
    category: 'Quality Control',
    description: 'Bug tracking and rework board: severity filters, reproduction steps, assignee, and fix statuses.',
  },
  {
    id: 'activity',
    title: 'Activity',
    icon: Activity,
    badge: '13 Stream',
    image: activityImg,
    urlPath: 'activity',
    category: 'Audit Stream',
    description: 'Chronological member activity stream across task changes, sprint starts, and bug submissions.',
  },
  {
    id: 'flagged-tasks',
    title: 'Flagged Tasks',
    icon: Flag,
    badge: '1 Impeded',
    image: flaggedTasksImg,
    urlPath: 'flagged',
    category: 'Blockers',
    description: 'Critical roadblocks, bookmarks, and dependencies requiring immediate leadership unblock.',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    badge: '3 New',
    image: notificationsImg,
    urlPath: 'notifications',
    category: 'Alerts',
    description: 'Real-time notifications for task assignments, due dates, mentions, and workflow updates.',
  },
  {
    id: 'initiatives',
    title: 'Initiatives',
    icon: Compass,
    badge: null,
    image: myProjectsImg,
    urlPath: 'initiatives',
    category: 'Strategy',
    description: 'Strategic company-wide goals mapped directly to active engineering deliveries.',
  },
  {
    id: 'my-todo',
    title: 'My Todo',
    icon: ListTodo,
    badge: null,
    image: myTasksImg,
    urlPath: 'todo',
    category: 'Personal Focus',
    description: 'Private scratchpad and personal checklists to keep daily engineering execution sharp.',
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: Settings,
    badge: null,
    image: dashboardImg,
    urlPath: 'settings',
    category: 'Preferences',
    description: 'Developer workspace preferences, notifications, theme, and API credentials.',
  },
];

export const ClickUpProductShowcase = () => {
  const [activeTabId, setActiveTabId] = useState('dashboard');
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const duration = 6000; // 6-second auto-advance
  const tickInterval = 50;
  const step = (tickInterval / duration) * 100;

  const activeIndex = MEMBER_TABS.findIndex((t) => t.id === activeTabId);
  const activeTab = MEMBER_TABS[activeIndex] || MEMBER_TABS[0];

  const handleNextTab = useCallback(() => {
    setActiveTabId((prevId) => {
      const idx = MEMBER_TABS.findIndex((t) => t.id === prevId);
      const nextIdx = (idx + 1) % MEMBER_TABS.length;
      return MEMBER_TABS[nextIdx].id;
    });
    setProgress(0);
  }, []);

  const handleTabClick = (tabId) => {
    setActiveTabId(tabId);
    setProgress(0);
  };

  useEffect(() => {
    if (isPaused || isZoomed) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev + step >= 100) {
          handleNextTab();
          return 0;
        }
        return prev + step;
      });
    }, tickInterval);

    return () => clearInterval(timer);
  }, [isPaused, isZoomed, handleNextTab, step]);

  return (
    <div
      className="w-full select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ============================================================ */}
      {/* MOBILE HORIZONTAL PILL SCROLLER (< lg)                       */}
      {/* ============================================================ */}
      <div className="lg:hidden w-full flex items-center gap-2 overflow-x-auto pb-3 mb-3 scrollbar-none">
        {MEMBER_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              type="button"
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#0d9488] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.title}</span>
              {tab.badge && (
                <span className="text-[9px] px-1 rounded bg-white/20 ml-0.5">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 items-stretch">
        
        {/* ============================================================ */}
        {/* LEFT COLUMN: SINGLE FLOWEXEC MEMBER SIDEBAR NAVIGATION      */}
        {/* ============================================================ */}
        <div className="hidden lg:flex w-full lg:w-1/4 xl:w-[23%] flex-col justify-between flex-shrink-0 bg-[#081325] rounded-2xl p-3 text-white border border-slate-800 shadow-xl">
          <div>
            {/* Sidebar Brand Header */}
            <div className="px-2 py-2 mb-2 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src={limberLitheMark} alt="Limber Lithe" className="w-7 h-7 object-contain flex-shrink-0" />
                <div>
                  <span className="block text-xs font-bold text-white tracking-tight leading-tight">Limber Lithe</span>
                  <span className="block text-[9px] font-semibold text-teal-400">Technologies</span>
                </div>
              </div>
              <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>

            <span className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
              Navigation
            </span>

            {/* List of Member Tabs */}
            <div className="space-y-0.5 mt-1">
              {MEMBER_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.id === activeTabId;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    type="button"
                    className={`relative w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 text-left ${
                      isActive
                        ? 'text-white font-bold bg-teal-500/20 border border-teal-400/50 shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 transition-colors ${
                          isActive ? 'text-teal-400' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{tab.title}</span>
                    </div>

                    {tab.badge && (
                      <span
                        className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                          isActive
                            ? 'bg-teal-400 text-slate-900 font-bold'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}

                    {/* Active tab progress countdown bar */}
                    {isActive && (
                      <div className="absolute bottom-0 left-2.5 right-2.5 h-[2px] bg-slate-700/80 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-400 to-cyan-300 transition-all duration-75"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Member Profile Card: Priya Kumar */}
          <div className="pt-2 mt-2 border-t border-slate-800/80">
            <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                  PK
                </span>
                <div className="truncate">
                  <p className="font-bold text-white text-[11px] truncate">Priya Kumar</p>
                  <p className="text-[9px] text-slate-400 truncate">Invictus Tec · 46 Tasks</p>
                </div>
              </div>
              <a
                href="/login"
                className="text-[10px] text-teal-400 font-bold hover:text-teal-300 flex items-center gap-0.5 ml-1"
                title="Open Member Portal"
              >
                Go <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: SCREEN DISPLAY WINDOW (NO DUPLICATE INNER MENU) */}
        {/* ============================================================ */}
        <div className="w-full lg:w-3/4 xl:w-[77%] flex-1">
          <div className="rounded-2xl border border-slate-200/90 shadow-2xl bg-white overflow-hidden flex flex-col h-[520px] sm:h-[590px]">
            {/* Top Sleek Chrome / Browser Frame */}
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
              {/* Traffic light dots */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 mr-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/90 border border-slate-700/60 text-[11px] text-slate-300 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  <span>https://limberlithe.app/member/{activeTab.urlPath}</span>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center gap-2">
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Cloud Sync Active
                </span>

                {/* Pause / Resume Button */}
                <button
                  type="button"
                  onClick={() => setIsPaused((p) => !p)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title={isPaused ? 'Resume auto-play' : 'Pause auto-play'}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 text-teal-400" /> : <Pause className="w-3.5 h-3.5" />}
                </button>

                {/* Fullscreen / Zoom Button */}
                <button
                  type="button"
                  onClick={() => setIsZoomed(true)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Expand to Fullscreen View"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Main Screen Content with Cropped Screen (NO duplicate sidebar) */}
            <div className="relative flex-1 bg-[#f4f6f9] overflow-y-auto overflow-x-hidden group">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab.id}
                  initial={{ opacity: 0, scale: 0.995 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.995 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="w-full h-full flex flex-col justify-between"
                >
                  <div
                    className="w-full flex-1 overflow-hidden relative cursor-zoom-in bg-[#f4f6f9]"
                    onClick={() => setIsZoomed(true)}
                  >
                    <img
                      src={activeTab.image}
                      alt={activeTab.title}
                      className="w-full h-auto object-cover object-left-top select-none transition-transform duration-500 group-hover:scale-[1.008]"
                      loading="eager"
                    />
                    
                    {/* Hover Hint Overlay */}
                    <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg border border-white/10">
                        <Maximize2 className="w-3.5 h-3.5 text-teal-400" /> Click to expand full screen
                      </span>
                    </div>
                  </div>

                  {/* Contextual Bottom Info Banner */}
                  <div className="px-4 py-2.5 bg-slate-900/95 border-t border-slate-800 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-2 flex-shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30">
                        {activeTab.category}
                      </span>
                      <p className="text-xs text-slate-300 truncate">
                        <strong className="text-white font-semibold">{activeTab.title}:</strong> {activeTab.description}
                      </p>
                    </div>

                    <a
                      href="/login"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-400 hover:text-teal-300 flex-shrink-0"
                    >
                      Explore live <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* FULLSCREEN LIGHTBOX MODAL FOR HIGH-RES INSPECTION            */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
            onClick={() => setIsZoomed(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-6xl w-full max-h-[92vh] bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-teal-400">{activeTab.title}</span>
                  <span className="text-xs text-slate-400">· {activeTab.category} Screen</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsZoomed(false)}
                  className="p-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* High-res Image Scroll Container */}
              <div className="p-2 overflow-auto max-h-[calc(92vh-60px)] bg-[#f4f6f9] flex items-center justify-center">
                <img
                  src={activeTab.image}
                  alt={activeTab.title}
                  className="w-full h-auto rounded-lg shadow-md"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClickUpProductShowcase;
