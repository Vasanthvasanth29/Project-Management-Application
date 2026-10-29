import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FolderKanban, Network, ListTodo, Bell, Settings, ClipboardList, CalendarRange, Bug, Activity, UsersRound, Layers, CheckSquare, PanelLeftClose, PanelLeftOpen, HeartPulse, Flag, X, ShieldCheck, Settings2, Compass, Hourglass, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { useOrganizationBranding } from '../../store/adminSettingsStore';
import { getRoleLabel, getDashboardPath } from '../../utils/roleUtils';
import { getProjectUrl } from '../../utils/idUtils';
import { isTrialUser, getTrialProjects, TRIAL_HOME_PATH } from '../../utils/trialAccess';
import { Avatar } from '../common/Avatar';
import { SIDEBAR_DEFAULT_WIDTH, SIDEBAR_ICON_ONLY_BELOW, SIDEBAR_MAX_WIDTH, SIDEBAR_MIN_WIDTH, } from './sidebarWidth';
const getNavItems = (role, unreadCount, flaggedCount) => {
    const shared = [
        { label: 'Flagged Tasks', path: '/flagged-tasks', icon: Flag, badge: flaggedCount },
        { label: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
        { label: 'My Todo', path: '/my-todo', icon: ListTodo },
        { label: 'Settings', path: '/settings', icon: Settings },
    ];
    switch (role) {
        case 'ADMIN':
            // Full-access administrator: system + organization + project surfaces.
            return [
                { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
                { label: 'Users', path: '/admin/users', icon: Users },
                { label: 'Roles & Permissions', path: '/admin/roles', icon: ShieldCheck },
                { label: 'Admin Settings', path: '/admin/settings', icon: Settings2 },
                { label: 'Projects', path: '/admin/projects', icon: FolderKanban },
                { label: 'Teams', path: '/tl/team', icon: UsersRound },
                { label: 'Work Queue', path: '/tl/tasks', icon: ClipboardList },
                { label: 'Bugs', path: '/tl/bugs', icon: Bug },
                { label: 'Health & Risks', path: '/pm/project-health', icon: HeartPulse },
                { label: 'Initiatives', path: '/pm/initiatives', icon: Compass },
                { label: 'Roadmap', path: '/pm/roadmap', icon: Network },
                { label: 'Activity', path: '/admin/activity', icon: Activity },
                ...shared,
            ];
        case 'PROJECT_MANAGER':
            // Organization-wide visibility + project management scope.
            return [
                { label: 'Dashboard', path: '/pm', icon: LayoutDashboard },
                { label: 'Users', path: '/admin/users', icon: Users },
                { label: 'My Projects', path: '/pm/projects', icon: FolderKanban },
                { label: 'Teams', path: '/tl/team', icon: UsersRound },
                { label: 'Work Queue', path: '/tl/tasks', icon: ClipboardList },
                { label: 'Bugs', path: '/tl/bugs', icon: Bug },
                { label: 'Health & Risks', path: '/pm/project-health', icon: HeartPulse },
                { label: 'Initiatives', path: '/pm/initiatives', icon: Compass },
                { label: 'Roadmap', path: '/pm/roadmap', icon: Network },
                { label: 'Activity', path: '/pm/activity', icon: Activity },
                ...shared,
            ];
        case 'TEAM_LEADER':
            // Project / team scope: no user administration, no system pages.
            return [
                { label: 'Dashboard', path: '/tl', icon: LayoutDashboard },
                { label: 'My Projects', path: '/tl/projects', icon: FolderKanban },
                { label: 'My Team', path: '/tl/team', icon: UsersRound },
                { label: 'Work Queue', path: '/tl/tasks', icon: ClipboardList },
                { label: 'Bugs', path: '/tl/bugs', icon: Bug },
                { label: 'Health & Risks', path: '/pm/project-health', icon: HeartPulse },
                { label: 'Initiatives', path: '/pm/initiatives', icon: Compass },
                { label: 'Roadmap', path: '/pm/roadmap', icon: Network },
                { label: 'Activity', path: '/tl/activity', icon: Activity },
                ...shared,
            ];
        case 'MEMBER':
            // Assigned-work scope: personal work pages only, no administration.
            return [
                { label: 'Dashboard', path: '/member', icon: LayoutDashboard },
                { label: 'My Projects', path: '/member/projects', icon: FolderKanban },
                { label: 'My Tasks', path: '/member/tasks', icon: CheckSquare },
                { label: 'My Iteration', path: '/member/sprint', icon: CalendarRange },
                { label: 'Initiatives', path: '/pm/initiatives', icon: Compass },
                { label: 'Work Queue', path: '/tl/tasks', icon: ClipboardList },
                { label: 'Bugs', path: '/member/bugs', icon: Bug },
                { label: 'Activity', path: '/member/activity', icon: Activity },
                ...shared,
            ];
        default:
            return shared;
    }
};
/** 7-Day Limited Trial accounts: trial workspace, the sample project, personal pages. */
const getTrialNavItems = (user, projects, unreadCount) => [
    { label: 'Trial Dashboard', path: TRIAL_HOME_PATH, icon: Hourglass },
    ...getTrialProjects(user, projects).map((project) => ({
        label: project.name,
        path: getProjectUrl(project, 'MEMBER'),
        icon: FolderKanban,
    })),
    { label: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
    { label: 'My Todo', path: '/my-todo', icon: ListTodo },
    { label: 'Settings', path: '/settings', icon: Settings },
    { label: 'View Plans', path: '/pricing', icon: Sparkles },
];
export const Sidebar = ({ width = SIDEBAR_DEFAULT_WIDTH, resizing = false, onToggleCollapse, onResizeStart, onClose, }) => {
    const { currentUser } = useAuthStore();
    const { notifications, projects, tasks } = useAppStore();
    const branding = useOrganizationBranding();
    const location = useLocation();
    const navigate = useNavigate();
    if (!currentUser)
        return null;
    // Below the icon-only threshold the sidebar collapses to centered icons
    // with tooltips; above it, labels truncate with ellipsis as width shrinks.
    const iconOnly = width <= SIDEBAR_ICON_ONLY_BELOW;
    const unreadCount = notifications.filter((n) => n.userId === currentUser.id && !n.read).length;
    const flaggedCount = tasks.filter((t) => t.isFlagged).length;
    const navItems = isTrialUser(currentUser)
        ? getTrialNavItems(currentUser, projects, unreadCount)
        : getNavItems(currentUser.role, unreadCount, flaggedCount);
    // Trial accounts only count the projects their trial can open.
    const footerProjects = isTrialUser(currentUser)
        ? getTrialProjects(currentUser, projects)
        : projects.filter((p) => !p.isArchived);
    const footerTaskCount = isTrialUser(currentUser)
        ? tasks.filter((t) => footerProjects.some((p) => p.id === t.projectId)).length
        : tasks.length;
    return (<aside className={`flex flex-col h-full relative flex-shrink-0 ${resizing ? 'transition-none' : 'transition-[width] duration-300 ease-in-out'}`} style={{ background: '#0f172a', width: `${width}px` }}>
      {/* Logo & Navigation Collapse */}
      <div className={`p-3 flex-shrink-0 ${iconOnly ? 'px-2' : 'px-3'}`}>
        {!iconOnly ? (<div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2.5 min-w-0 cursor-pointer group flex-1" onClick={() => navigate(getDashboardPath(currentUser.role))}>
              {branding.logoUrl ? (<img src={branding.logoUrl} alt={branding.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-white/15 group-hover:scale-105 transition-transform"/>) : (<div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform" style={{ background: 'linear-gradient(135deg, #0d9488, #06b6d4)' }}>
                  <Layers className="w-4 h-4 text-white"/>
                </div>)}
              <div className="min-w-0">
                <span className="text-sm font-bold text-white tracking-tight font-display block truncate">FlowExec</span>
                <span className="text-[10px] text-teal-400 font-medium truncate block">{getRoleLabel(currentUser.role)}</span>
              </div>
            </div>

            {/* Collapse button inside navigation bar */}
            {onToggleCollapse && (<button type="button" onClick={onToggleCollapse} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0" title="Collapse sidebar" aria-label="Collapse sidebar">
                <PanelLeftClose className="w-4 h-4"/>
              </button>)}

            {/* Mobile close button */}
            {onClose && (<button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0 lg:hidden" title="Close menu" aria-label="Close menu">
                <X className="w-4 h-4"/>
              </button>)}
          </div>) : (<div className="flex flex-col items-center py-1 gap-2">
            {branding.logoUrl ? (<img src={branding.logoUrl} alt={branding.name} title="FlowExec Dashboard" className="w-10 h-10 rounded-xl object-cover cursor-pointer hover:scale-105 transition-transform border border-white/15" onClick={() => navigate(getDashboardPath(currentUser.role))}/>) : (<div className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer hover:scale-105 transition-transform" style={{ background: 'linear-gradient(135deg, #0d9488, #06b6d4)' }} title="FlowExec Dashboard" onClick={() => navigate(getDashboardPath(currentUser.role))}>
                <Layers className="w-5 h-5 text-white"/>
              </div>)}

            {/* Expand button inside navigation bar when iconOnly */}
            {onToggleCollapse && (<button type="button" onClick={onToggleCollapse} className="w-10 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer" title="Expand sidebar" aria-label="Expand sidebar">
                <PanelLeftOpen className="w-4 h-4"/>
              </button>)}
          </div>)}
      </div>

      {/* Status Indicator */}
      {!iconOnly && (<div className="mx-3 mb-2 px-3 py-2 rounded-lg bg-white/5 border border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"/>
            <span className="text-[10px] font-medium text-slate-400 truncate">Cloud Sync Active</span>
          </div>
        </div>)}

      {/* Navigation Links */}
      <nav className={`flex-1 overflow-y-auto no-scrollbar py-2 space-y-0.5 ${iconOnly ? 'px-2' : 'px-3'}`}>
        {!iconOnly && (<div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-3 py-2 mb-1">
            Navigation
          </div>)}
        {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/admin' || item.path === '/pm' || item.path === '/tl' || item.path === '/member'
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
            return (<NavLink key={item.path} to={item.path} onClick={onClose} title={iconOnly ? `${item.label}${item.badge ? ` (${item.badge})` : ''}` : undefined} className={`relative flex items-center transition-all duration-200 ${iconOnly
                    ? `justify-center w-11 h-11 mx-auto rounded-xl ${isActive
                        ? 'bg-[#0d9488]/20 text-[#2dd4bf]'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'}`
                    : `${isActive ? 'nav-item-active' : 'nav-item'}`}`}>
              <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-[#2dd4bf]' : 'text-slate-400'}`}/>

              {!iconOnly && (<>
                  <span className="flex-1 truncate text-[13px] font-medium ml-2.5">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (<span className={`ml-auto flex-shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold ${isActive ? 'bg-[#0d9488] text-white' : 'bg-[#0d9488]/20 text-[#2dd4bf]'}`}>
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>)}
                </>)}

              {/* Badge dot for iconOnly state */}
              {iconOnly && item.badge !== undefined && item.badge > 0 && (<span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#ef4444] ring-2 ring-[#0f172a]"/>)}
            </NavLink>);
        })}
      </nav>

      {/* Bottom Section */}
      <div className={`flex-shrink-0 border-t border-white/10 ${iconOnly ? 'px-2 py-3' : 'px-3 py-3'}`}>
        {!iconOnly ? (<div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2.5 mb-2">
              <Avatar name={currentUser.name} color={currentUser.avatarColor} size="sm" className="w-8 h-8 rounded-lg"/>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{branding.name}</div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500 mt-2 pt-2 border-t border-white/5">
              <span className="truncate">{footerProjects.length} Projects</span>
              <span className="truncate flex-shrink-0 text-[#2dd4bf] font-semibold">{footerTaskCount} Tasks</span>
            </div>
          </div>) : (<div className="flex flex-col items-center gap-2">
            <button onClick={() => navigate('/settings')} title="Settings" className="cursor-pointer hover:ring-2 hover:ring-white/20 rounded-lg transition-all">
              <Avatar name={currentUser.name} color={currentUser.avatarColor} size="sm" className="w-9 h-9 rounded-lg"/>
            </button>
          </div>)}
      </div>

      {/* Drag-to-resize handle on the right edge (desktop only). Visible on
            hover/focus; continuous width updates come from AppShell's pointer
            listeners so release outside the handle still ends the drag. */}
      {onResizeStart && (<div role="separator" aria-orientation="vertical" aria-label="Resize sidebar" aria-valuemin={SIDEBAR_MIN_WIDTH} aria-valuemax={SIDEBAR_MAX_WIDTH} aria-valuenow={width} title="Drag to resize sidebar" tabIndex={0} onPointerDown={onResizeStart} className={`hidden lg:block absolute inset-y-0 right-0 w-2 z-40 cursor-col-resize rounded-r-sm transition-colors ${resizing
                ? 'opacity-100 bg-[#2dd4bf]/70'
                : 'opacity-0 bg-transparent hover:opacity-100 hover:bg-[#2dd4bf]/50 focus-visible:opacity-100 focus-visible:bg-[#2dd4bf]/50 focus:outline-none'}`}/>)}
    </aside>);
};
