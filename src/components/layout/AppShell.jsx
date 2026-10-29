import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ArrowUp, Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { SIDEBAR_DEFAULT_WIDTH, SIDEBAR_ICON_ONLY_BELOW, SIDEBAR_MIN_WIDTH, clampSidebarWidth, readSidebarWidth, storeSidebarWidth, } from './sidebarWidth';
export const AppShell = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(readSidebarWidth);
    const [sidebarResizing, setSidebarResizing] = useState(false);
    const sidebarWidthRef = useRef(sidebarWidth);
    sidebarWidthRef.current = sidebarWidth;
    const lastExpandedWidthRef = useRef(sidebarWidth > SIDEBAR_ICON_ONLY_BELOW ? sidebarWidth : SIDEBAR_DEFAULT_WIDTH);
    const mainRef = useRef(null);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const location = useLocation();
    const normalizedPath = location.pathname.replace(/\/+$/, '');
    // Topbar (global search, notifications, profile) renders ONLY on the
    // Home page (the role-based dashboard). Every other authenticated route
    // renders its own page header (breadcrumb, module tabs, actions) and
    // must not show the global header. The auth flow (login / sso) also
    // runs without it.
    const HOME_ROUTES = ['/admin', '/pm', '/tl', '/member'];
    const isHomeRoute = HOME_ROUTES.includes(normalizedPath);
    const showTopbar = isHomeRoute;
    const toggleCollapse = () => {
        setSidebarWidth((prev) => {
            let next;
            if (prev > SIDEBAR_ICON_ONLY_BELOW) {
                // Remember the user's expanded width so re-expanding restores it,
                // then collapse down to the icon-only rail.
                lastExpandedWidthRef.current = prev;
                next = SIDEBAR_MIN_WIDTH;
            }
            else {
                next = clampSidebarWidth(lastExpandedWidthRef.current || SIDEBAR_DEFAULT_WIDTH);
            }
            storeSidebarWidth(next);
            return next;
        });
    };
    // Continuous drag-resize of the sidebar width. Pointer listeners live on
    // window so releasing outside the handle still ends the drag cleanly.
    const handleSidebarResizeStart = useCallback((e) => {
        e.preventDefault();
        const handle = e.currentTarget;
        try {
            handle.setPointerCapture(e.pointerId);
        }
        catch {
            /* synthetic pointers (tests) cannot be captured — window listeners still work */
        }
        const startX = e.clientX;
        const startWidth = sidebarWidthRef.current;
        let latest = startWidth;
        setSidebarResizing(true);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        const onMove = (ev) => {
            latest = clampSidebarWidth(startWidth + (ev.clientX - startX));
            setSidebarWidth(latest);
        };
        const onEnd = () => {
            setSidebarResizing(false);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onEnd);
            window.removeEventListener('pointercancel', onEnd);
            if (latest > SIDEBAR_ICON_ONLY_BELOW)
                lastExpandedWidthRef.current = latest;
            storeSidebarWidth(latest);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onEnd);
        window.addEventListener('pointercancel', onEnd);
    }, []);
    // Reset scroll on route change
    useEffect(() => {
        if (mainRef.current) {
            mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
        }
        window.scrollTo({ top: 0, behavior: 'instant' });
        setShowScrollTop(false);
    }, [location.pathname]);
    // Floating "Top" button: shown once the page scroller (`main`, or the
    // window as a fallback) has scrolled past 180px.
    const handleScroll = () => {
        const mainEl = mainRef.current;
        setShowScrollTop(mainEl ? mainEl.scrollTop > 180 : window.scrollY > 180);
    };
    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    const scrollToTop = () => {
        mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    return (<div className="flex h-screen overflow-hidden bg-[#f4f6f9]">
      {/* Desktop sidebar */}
      <div className={`hidden lg:flex flex-shrink-0 ${sidebarResizing ? 'transition-none' : 'transition-all duration-300'}`}>
        <Sidebar width={sidebarWidth} resizing={sidebarResizing} onToggleCollapse={toggleCollapse} onResizeStart={handleSidebarResizeStart}/>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (<div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}/>
          <div className="absolute left-0 top-0 h-full z-50 shadow-modal">
            <Sidebar width={sidebarWidth} onClose={() => setSidebarOpen(false)}/>
          </div>
        </div>)}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col bg-[#f4f6f9]">
        {showTopbar && (<Topbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen}/>)}
        {!showTopbar && (<button type="button" className="lg:hidden fixed top-3 left-3 z-30 p-2 rounded-xl bg-white/90 backdrop-blur-sm shadow-md border border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer" onClick={() => setSidebarOpen(true)} aria-label="Open mobile menu">
            <Menu className="w-5 h-5"/>
          </button>)}
        <main ref={mainRef} onScroll={handleScroll} className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden scrollbar-thin relative z-0 scroll-smooth">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-8 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating Scroll to Top Button */}
      {showScrollTop && (<button type="button" onClick={scrollToTop} className="fixed bottom-20 right-6 z-40 flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-semibold shadow-xl hover:shadow-2xl border border-slate-700/60 backdrop-blur-md transition-all duration-200 hover:-translate-y-1 active:translate-y-0 group cursor-pointer animate-fade-in" title="Scroll back to top" aria-label="Scroll back to top">
          <ArrowUp className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5 text-teal-400"/>
          <span className="hidden sm:inline">Top</span>
        </button>)}
    </div>);
};
