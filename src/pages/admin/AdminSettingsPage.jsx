
import React, { useState } from 'react';
import { toast } from 'sonner';

import {
  Bell,
  Building2,
  CalendarRange,
  FolderKanban,
  ListChecks,
  Lock,
  RotateCcw,
  ScrollText,
  Settings2,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
} from 'lucide-react';

import { useAuthStore } from '../../store/authStore';
import {
  useAdminSettingsStore,
  useOrganizationBranding,
} from '../../store/adminSettingsStore';

import { ConfirmDialog } from '../../components/common/ConfirmDialog';

import { GeneralSection } from './settings/GeneralSection';
import { ProjectDefaultsSection } from './settings/ProjectDefaultsSection';
import { WorkItemsSection } from './settings/WorkItemsSection';
import { IterationsSection } from './settings/IterationsSection';
import { SecuritySection } from './settings/SecuritySection';
import { NotificationsSection } from './settings/NotificationsSection';
import { AuditSection } from './settings/AuditSection';


const SECTIONS = [
  {
    key: 'general',
    label: 'General',
    icon: Building2,
    description: 'Organization name, logo, time zone & schedule',
  },
  {
    key: 'projectDefaults',
    label: 'Project Defaults',
    icon: FolderKanban,
    description: 'Template, workflow, priority & issue types',
  },
  {
    key: 'workItems',
    label: 'Work Items',
    icon: ListChecks,
    description: 'Custom fields, statuses, priorities, labels',
  },
  {
    key: 'iterations',
    label: 'Iterations',
    icon: CalendarRange,
    description: 'Duration, naming pattern & rules',
  },
  {
    key: 'security',
    label: 'Security',
    icon: ShieldCheck,
    description: 'Session, login & permission policies',
  },
  {
    key: 'notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'Email, in-app, assignment & due dates',
  },
  {
    key: 'audit',
    label: 'Audit',
    icon: ScrollText,
    description: 'Activity, changes & log exports',
  },
];

const SECTIONS_WITH_DRAFTS = SECTIONS.filter(
  (s) => s.key !== 'audit'
);


export const AdminSettingsPage = () => {

  const currentUser = useAuthStore((s) => s.currentUser);
  const branding = useOrganizationBranding();

  const drafts = useAdminSettingsStore((s) => s.drafts);
  const resetAll = useAdminSettingsStore((s) => s.resetAll);

  const [activeKey, setActiveKey] = useState('general');
  const [resetAllOpen, setResetAllOpen] = useState(false);

  // Sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);


  if (!currentUser) return null;

  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="card p-8 max-w-lg mx-auto text-center space-y-3 animate-fade-in">

        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>

        <h1 className="text-lg font-bold text-slate-900">
          Admin Settings is restricted
        </h1>

        <p className="text-sm text-slate-500">
          System-level organization settings are available to Administrators only.
        </p>

      </div>
    );
  }


  const unsavedSections = SECTIONS_WITH_DRAFTS.filter(
    (s) => drafts[s.key] !== undefined
  );

  const activeMeta = SECTIONS.find(
    (s) => s.key === activeKey
  );


  const renderSection = () => {
    switch (activeKey) {

      case 'general':
        return <GeneralSection />;

      case 'projectDefaults':
        return <ProjectDefaultsSection />;

      case 'workItems':
        return <WorkItemsSection />;

      case 'iterations':
        return <IterationsSection />;

      case 'security':
        return <SecuritySection />;

      case 'notifications':
        return <NotificationsSection />;

      case 'audit':
      default:
        return <AuditSection />;
    }
  };


  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">

        <div>
          <h1 className="page-title inline-flex items-center gap-2.5">

            <span className="w-9 h-9 rounded-xl bg-[#f0fdfa] border border-[#ccfbf1] text-[#0d9488] flex items-center justify-center">
              <Settings2 className="w-5 h-5" />
            </span>

            Admin Settings
          </h1>

          <p className="page-subtitle">
            Organization-wide configuration for {branding.name} — General, Projects, Work Items, Iterations, Security,
            Notifications and Audit.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start">

          {unsavedSections.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-700">

              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />

              {unsavedSections.length} unsaved section
              {unsavedSections.length === 1 ? '' : 's'}

            </span>
          )}

          <button
            type="button"
            className="btn-ghost btn-sm text-slate-500"
            onClick={() => setResetAllOpen(true)}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All
          </button>

        </div>
      </div>


      {/* Main Layout */}
      <div
        className={`
          grid grid-cols-1 gap-6 items-start min-w-0
          ${
            sidebarCollapsed
              ? 'lg:grid-cols-[72px_minmax(0,1fr)]'
              : 'lg:grid-cols-[260px_minmax(0,1fr)]'
          }
        `}
      >

        {/* Settings Sidebar */}
       <nav
  className={`
    settings-scrollbar
    min-w-0 w-full
    flex flex-col gap-2
    lg:sticky lg:top-6
    lg:max-h-[calc(100vh-3rem)]
    lg:overflow-y-auto lg:overflow-x-hidden
    lg:overscroll-contain
    bg-white border border-slate-200
    rounded-2xl shadow-sm p-3
    transition-all duration-300
  `}
  aria-label="Settings sections"
>

          {/* Sidebar Header + Collapse Button */}
          <div
            className={`
              hidden lg:flex items-center
              ${sidebarCollapsed
                ? 'justify-center'
                : 'justify-between px-2'
              }
            `}
          >

            {!sidebarCollapsed && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                  Configuration
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  Manage your workspace
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                setSidebarCollapsed((prev) => !prev)
              }
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              title={
                sidebarCollapsed
                  ? 'Expand sidebar'
                  : 'Collapse sidebar'
              }
              aria-label={
                sidebarCollapsed
                  ? 'Expand settings sidebar'
                  : 'Collapse settings sidebar'
              }
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>

          </div>


          {/* Navigation Items */}
          <div
            className={`
              flex gap-2
              ${sidebarCollapsed
                ? 'lg:flex-col'
                : 'lg:flex-col'
              }
            `}
          >

            {SECTIONS.map((section) => {

              const Icon = section.icon;
              const isActive = activeKey === section.key;

              const hasDraft =
                section.key !== 'audit' &&
                drafts[section.key] !== undefined;

              return (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => setActiveKey(section.key)}
                  aria-current={isActive ? 'page' : undefined}
                  title={
                    sidebarCollapsed
                      ? section.label
                      : undefined
                  }
                  className={`
                    group relative flex items-center
                    rounded-xl transition-all duration-200
                    shrink-0 lg:shrink lg:w-full

                    ${
                      sidebarCollapsed
                        ? 'justify-center p-2.5'
                        : 'gap-3 px-3 py-3 text-left'
                    }

                    ${
                      isActive
                        ? 'bg-[#f0fdfa] border border-[#99f6e4] shadow-sm'
                        : 'bg-white border border-transparent hover:bg-slate-50 hover:border-slate-200'
                    }
                  `}
                >

                  {/* Active Indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-[#0d9488]" />
                  )}


                  {/* Icon */}
                  <span
                    className={`
                      w-9 h-9 rounded-xl
                      flex items-center justify-center
                      flex-shrink-0 transition-colors

                      ${
                        isActive
                          ? 'bg-[#0d9488] text-white shadow-sm'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                      }
                    `}
                  >
                    <Icon className="w-[17px] h-[17px]" />
                  </span>


                  {/* Label + Description */}
                  {!sidebarCollapsed && (
                    <span className="min-w-0 flex-1">

                      <span
                        className={`
                          block text-xs font-bold
                          ${
                            isActive
                              ? 'text-[#0f766e]'
                              : 'text-slate-700 group-hover:text-slate-900'
                          }
                        `}
                      >
                        {section.label}
                      </span>

                      <span
                        className={`
                          hidden lg:block text-[10px]
                          leading-[15px] mt-1
                          ${
                            isActive
                              ? 'text-[#0f766e]/75'
                              : 'text-slate-400'
                          }
                        `}
                      >
                        {section.description}
                      </span>

                    </span>
                  )}


                  {/* Unsaved Draft Indicator */}
                  {hasDraft && (
                    <span
                      className={`
                        w-2 h-2 rounded-full
                        bg-amber-500 flex-shrink-0
                        ${sidebarCollapsed
                          ? 'absolute top-2 right-2'
                          : ''
                        }
                      `}
                      title="Unsaved changes"
                    />
                  )}


                  {/* Active Arrow */}
                  {isActive && !sidebarCollapsed && (
                    <ChevronRight className="hidden lg:block w-4 h-4 text-[#0d9488]" />
                  )}

                </button>
              );
            })}

          </div>


          {/* Sidebar Footer */}
          {!sidebarCollapsed && (
            <div className="hidden lg:block mt-2 pt-3 border-t border-slate-100 px-3">

              <div className="flex items-center gap-2">

                <span className="w-2 h-2 rounded-full bg-emerald-500" />

                <span className="text-[10px] font-medium text-slate-500">
                  Organization Settings
                </span>

              </div>

            </div>
          )}

        </nav>


        {/* Main Information Panel */}
        <div key={activeKey} className="min-w-0">

          {/* Section Heading */}
          <div className="flex items-center gap-2 mb-4 px-1">

            <activeMeta.icon className="w-4 h-4 text-[#0d9488]" />

            <h2 className="text-base font-bold text-slate-900 font-display">
              {activeMeta.label}
            </h2>

            <span className="text-xs text-slate-400 hidden sm:inline">
              — {activeMeta.description}
            </span>

          </div>


          {/* Selected Section */}
          {renderSection()}


          {/* Footer */}
          <p className="text-[11px] text-slate-400 mt-4 px-1">
            Frontend-only configuration — settings persist in this browser.
            The persistence layer can be swapped for a backend API later
            without any UI redesign.
          </p>

        </div>

      </div>


      {/* Reset All Confirmation */}
      <ConfirmDialog
        isOpen={resetAllOpen}
        onClose={() => setResetAllOpen(false)}
        onConfirm={() => {
          resetAll();
          setResetAllOpen(false);
          toast.success('All settings restored to factory defaults.');
        }}
        title="Reset all settings to default?"
        message="Every section (General, Project Defaults, Work Items, Iterations, Security, Notifications) will return to its factory default. The audit log is preserved."
        confirmLabel="Reset Everything"
        danger
      />

    </div>
  );
};
