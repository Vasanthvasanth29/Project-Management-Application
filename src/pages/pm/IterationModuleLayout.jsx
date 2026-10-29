import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import { ArrowLeft, ChevronDown, History, Layers, LayoutDashboard, BarChart3 } from 'lucide-react';
// Base module URL + back-to-project URL, derived from the current path so every
// role/param pattern (pm/:key, pm/:key/:name, admin, tl, member) resolves correctly.
export const resolveIterationPaths = (pathname) => {
    const idx = pathname.indexOf('/iterations');
    return {
        basePath: idx >= 0 ? pathname.substring(0, idx) + '/iterations' : '/iterations',
        backUrl: idx > 0 ? pathname.substring(0, idx) : '/',
        // Project → Product Increments (where PIs are created). Outside the
        // module (e.g. the workspace's embedded overview) the current path IS
        // the project workspace.
        productIncrementsUrl: `${idx > 0 ? pathname.substring(0, idx) : pathname.replace(/\/+$/, '')}?tab=product-increments`,
    };
};
export const resolveIterationNavId = (pathname) => {
    const p = pathname.replace(/\/+$/, '');
    if (p.endsWith('/completed'))
        return 'completed';
    if (p.endsWith('/live-iteration') || p.endsWith('/active-sprint'))
        return 'live-iteration';
    if (p.endsWith('/iteration-board'))
        return 'iteration-board';
    if (p.endsWith('/reports'))
        return 'reports';
    return 'iterations';
};
export const useIterationPaths = () => {
    const location = useLocation();
    return useMemo(() => resolveIterationPaths(location.pathname), [location.pathname]);
};
// Slot for page-level header actions (the Iterations toolbar: Collapse All,
// + Create ▾). The owning page registers its existing toolbar node here so it
// renders in row 2, on the same horizontal line right after the tab strip —
// same compact header area, same components and handlers, no duplicate
// buttons and no duplicated state.
export const IterationHeaderActionsContext = React.createContext(null);
// Navigation destinations — the module tab row in the required header order:
// Iterations | Live Iteration | Reports | Completed Iterations. Every
// destination is a real routed view (`.../iterations`, `/live-iteration`,
// `/reports`, `/completed`). Board was removed from the header entirely.
const buildIterationNavItems = (basePath) => [
    { id: 'iterations', label: 'Iterations', icon: Layers, to: basePath },
    { id: 'live-iteration', label: 'Live Iteration', icon: LayoutDashboard, to: `${basePath}/live-iteration` },
    { id: 'reports', label: 'Reports', icon: BarChart3, to: `${basePath}/reports` },
    { id: 'completed', label: 'Completed Iterations', icon: History, to: `${basePath}/completed` },
];
export const IterationModuleLayout = ({ project, children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { backUrl } = useIterationPaths();
    const activeId = resolveIterationNavId(location.pathname);
    const navItems = useMemo(() => buildIterationNavItems(resolveIterationPaths(location.pathname).basePath), [location.pathname]);
    // The compact module header: row 1 = breadcrumb only (Back to Project |
    // <Project Name> | Iterations ⌄), row 2 = tab strip + page action buttons
    // registered through IterationHeaderActionsContext on the same horizontal
    // line. Tabs are visible by default (reference layout); the chevron beside
    // the title collapses/expands the tab strip in place without hiding the
    // routes — only the chevron toggles it, so a stray click elsewhere can
    // never hide the module navigation.
    const [navOpen, setNavOpen] = useState(true);
    const [headerActions, setHeaderActions] = useState(null);
    return (<IterationHeaderActionsContext.Provider value={setHeaderActions}>
    <div className="min-w-0 -mt-2 flex flex-col">
      {/* Row 1 — breadcrumb only: Back to Project | <Project Name> |
            Iterations ⌄. Page action buttons live in row 2 (right of the tab
            strip); this row carries no actions so its items stay on one
            horizontal line without wrapping. */}
      <div className="flex-shrink-0 flex items-center justify-between gap-x-3 gap-y-1 flex-wrap min-w-0 pb-0.5">
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <button onClick={() => navigate(backUrl)} className="flex items-center gap-1.5 text-xs font-medium text-[#5f6368] hover:text-[#1a73e8] transition-colors flex-shrink-0">
            <ArrowLeft className="w-3.5 h-3.5"/>
            Back to Project
          </button>

          <div className="w-px h-4 bg-slate-300 flex-shrink-0"/>

          <span className="text-sm font-medium text-[#5f6368] truncate max-w-[220px] flex-shrink-0">
            {project.name}
          </span>

          <div className="w-px h-4 bg-slate-300 flex-shrink-0"/>

          <h1 className="sr-only">Iterations</h1>

          <span className="text-sm font-bold text-[#172b4d] flex-shrink-0" aria-hidden="true">
            Iterations
          </span>

          {/* Chevron toggle: expands/collapses the tab strip below. */}
          <button type="button" onClick={() => setNavOpen((o) => !o)} aria-expanded={navOpen} aria-controls="iteration-module-nav" aria-label={navOpen ? 'Collapse iteration navigation' : 'Expand iteration navigation'} title={navOpen ? 'Hide navigation' : 'Show navigation'} className="p-1 -m-0.5 rounded-md text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#f0f7ff] transition-colors cursor-pointer flex-shrink-0">
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${navOpen ? 'rotate-180' : ''}`}/>
          </button>
        </div>
      </div>

      {/* Row 2 — module tabs then page actions on ONE horizontal line, in the
            required order: Iterations | Live Iteration | Reports | Completed
            Iterations | Collapse All | Create. Tabs sit in a rounded, light
            segmented container; the registered action buttons follow on the
            same line (right-aligned). The chevron collapses/expands only the
            tab strip — the actions stay available — with a subtle height +
            fade transition. */}
      <div className="flex items-center gap-2 flex-wrap min-w-0 mb-1">
        <nav id="iteration-module-nav" aria-label="Iteration module navigation" className={`grid transition-all duration-200 ease-out ${navOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
          <div className="overflow-hidden min-h-0">
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 flex-wrap">
              {navItems.map((item) => {
            const isActive = activeId === item.id;
            return (<NavLink key={item.id} to={item.to} className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${isActive
                    ? 'bg-white shadow-xs text-[#1a73e8]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'}`}>
                    <item.icon className="w-3.5 h-3.5"/>
                    <span>{item.label}</span>
                  </NavLink>);
        })}
            </div>
          </div>
        </nav>

        {headerActions && (<div data-testid="iteration-header-actions" className="ml-auto flex items-center gap-2 flex-wrap min-w-0">
            {headerActions}
          </div>)}
      </div>

      {children}
    </div>
    </IterationHeaderActionsContext.Provider>);
};
