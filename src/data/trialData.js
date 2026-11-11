


























export const TRIAL_STATS = {
  daysTotal: 7,
  daysLeft: 4,
  startedOn: 'Oct 26, 2026',
  expiresOn: 'Oct 30, 2026',
  projectsAllowed: 2,
  projectsUsed: 1,
  totalTasks: 12,
  completedTasks: 5,
  inProgressTasks: 4,
  todoTasks: 2,
  blockedTasks: 1
};

export const TRIAL_STATUS_BREAKDOWN = [
{ name: 'Completed', count: 5, pct: 42, color: '#10b981' },
{ name: 'In Progress', count: 4, pct: 33, color: '#3b82f6' },
{ name: 'To Do', count: 2, pct: 17, color: '#94a3b8' },
{ name: 'Blocked', count: 1, pct: 8, color: '#ef4444' }];


export const TRIAL_TREND_DATA = [
{ date: 'Oct 20', inProgress: 0, completed: 0, created: 0 },
{ date: 'Oct 21', inProgress: 2, completed: 1, created: 1 },
{ date: 'Oct 22', inProgress: 3, completed: 1, created: 1 },
{ date: 'Oct 23', inProgress: 5, completed: 2, created: 1 },
{ date: 'Oct 24', inProgress: 7, completed: 2, created: 2 },
{ date: 'Oct 25', inProgress: 9, completed: 3, created: 2 },
{ date: 'Oct 26', inProgress: 10, completed: 4, created: 3 }];


export const TRIAL_WORK_ITEMS = [
{
  id: 't-101',
  key: 'ECOM-101',
  keyColor: 'blue',
  title: 'Implement product search',
  status: 'Done',
  priority: 'High',
  assigneeName: 'John Doe',
  assigneeInitials: 'JD',
  assigneeColor: '#2563eb',
  updated: 'Oct 26'
},
{
  id: 't-102',
  key: 'ECOM-102',
  keyColor: 'purple',
  title: 'Add to cart functionality',
  status: 'In Progress',
  priority: 'Medium',
  assigneeName: 'John Doe',
  assigneeInitials: 'JD',
  assigneeColor: '#2563eb',
  updated: 'Oct 25'
},
{
  id: 't-103',
  key: 'ECOM-103',
  keyColor: 'rose',
  title: 'Checkout page UI',
  status: 'To Do',
  priority: 'High',
  assigneeName: null,
  assigneeInitials: null,
  updated: 'Oct 24'
},
{
  id: 't-104',
  key: 'ECOM-104',
  keyColor: 'cyan',
  title: 'Payment integration (Demo)',
  status: 'In Progress',
  priority: 'Medium',
  assigneeName: 'Alex Smith',
  assigneeInitials: 'AS',
  assigneeColor: '#7c3aed',
  updated: 'Oct 24'
},
{
  id: 't-105',
  key: 'ECOM-105',
  keyColor: 'amber',
  title: 'Order confirmation email',
  status: 'Blocked',
  priority: 'High',
  assigneeName: 'John Doe',
  assigneeInitials: 'JD',
  assigneeColor: '#2563eb',
  updated: 'Oct 23'
},
{
  id: 't-106',
  key: 'ECOM-106',
  keyColor: 'blue',
  title: 'User authentication & password reset',
  status: 'Done',
  priority: 'High',
  assigneeName: 'Alex Smith',
  assigneeInitials: 'AS',
  assigneeColor: '#7c3aed',
  updated: 'Oct 22'
},
{
  id: 't-107',
  key: 'ECOM-107',
  keyColor: 'purple',
  title: 'Product catalog filtering & sorting',
  status: 'Done',
  priority: 'Medium',
  assigneeName: 'John Doe',
  assigneeInitials: 'JD',
  assigneeColor: '#2563eb',
  updated: 'Oct 21'
},
{
  id: 't-108',
  key: 'ECOM-108',
  keyColor: 'cyan',
  title: 'Mobile responsive navigation header',
  status: 'Done',
  priority: 'Low',
  assigneeName: 'Alex Smith',
  assigneeInitials: 'AS',
  assigneeColor: '#7c3aed',
  updated: 'Oct 20'
},
{
  id: 't-109',
  key: 'ECOM-109',
  keyColor: 'amber',
  title: 'Order status webhook listener',
  status: 'Done',
  priority: 'Medium',
  assigneeName: 'John Doe',
  assigneeInitials: 'JD',
  assigneeColor: '#2563eb',
  updated: 'Oct 19'
},
{
  id: 't-110',
  key: 'ECOM-110',
  keyColor: 'purple',
  title: 'Persistent shopping cart session storage',
  status: 'In Progress',
  priority: 'High',
  assigneeName: 'John Doe',
  assigneeInitials: 'JD',
  assigneeColor: '#2563eb',
  updated: 'Oct 25'
},
{
  id: 't-111',
  key: 'ECOM-111',
  keyColor: 'blue',
  title: 'Stripe test payment verification',
  status: 'In Progress',
  priority: 'High',
  assigneeName: 'Alex Smith',
  assigneeInitials: 'AS',
  assigneeColor: '#7c3aed',
  updated: 'Oct 26'
},
{
  id: 't-112',
  key: 'ECOM-112',
  keyColor: 'rose',
  title: 'Wishlist sync with backend',
  status: 'To Do',
  priority: 'Low',
  assigneeName: null,
  assigneeInitials: null,
  updated: 'Oct 24'
}];











export const TRIAL_VS_PRO_FEATURES = [
{ name: 'Projects', category: 'core', icon: 'folder', trial: 'Up to 2 Projects', pro: 'Unlimited', isUnlockedInTrial: true },
{ name: 'Tasks & Bugs', category: 'core', icon: 'edit', trial: 'Basic', pro: 'Unlimited', isUnlockedInTrial: true },
{ name: 'Iterations & Sprints', category: 'agile', icon: 'git-branch', trial: '1 Sprint', pro: 'Multi-Sprint', isUnlockedInTrial: true },
{ name: 'Reports & Velocity', category: 'agile', icon: 'bar-chart', trial: '7-Day', pro: 'Full Velocity', isUnlockedInTrial: true },
{ name: 'Kanban Board', category: 'agile', icon: 'layout', trial: 'Standard', pro: 'Custom WIP', isUnlockedInTrial: true },
{ name: 'Multiple Workspaces', category: 'core', icon: 'folder-plus', trial: false, pro: 'Included', isUnlockedInTrial: false },
{ name: 'Custom Fields', category: 'enterprise', icon: 'settings', trial: false, pro: 'Unlimited', isUnlockedInTrial: false },
{ name: 'User Roles (Admin, PM)', category: 'enterprise', icon: 'users', trial: false, pro: 'Full Access', isUnlockedInTrial: false },
{ name: 'Roadmap & Timeline', category: 'agile', icon: 'calendar', trial: false, pro: 'Included', isUnlockedInTrial: false },
{ name: 'Project Health & Score', category: 'agile', icon: 'sparkles', trial: false, pro: 'Real-time', isUnlockedInTrial: false },
{ name: 'Roles & Permissions', category: 'enterprise', icon: 'shield', trial: false, pro: 'Granular', isUnlockedInTrial: false },
{ name: 'Webhooks & Pipelines', category: 'enterprise', icon: 'plug', trial: false, pro: 'Included', isUnlockedInTrial: false }];


export const TRIAL_FEATURE_ACCESS = [
{ name: 'View projects and tasks', allowed: true, icon: 'folder' },
{ name: 'Create and edit tasks', allowed: true, icon: 'edit' },
{ name: 'Use Iterations & Sprints', allowed: true, icon: 'git-branch' },
{ name: 'Basic reports', allowed: true, icon: 'bar-chart' },
{ name: 'Create multiple projects', allowed: false, icon: 'folder-plus' },
{ name: 'Custom fields & screens', allowed: false, icon: 'settings' },
{ name: 'Advanced reports & CFD', allowed: false, icon: 'file-text' },
{ name: 'Team management & Roles', allowed: false, icon: 'users' },
{ name: 'Cross-project roadmaps', allowed: false, icon: 'calendar' },
{ name: 'Roles & permissions (RBAC)', allowed: false, icon: 'shield' },
{ name: 'CI/CD Webhooks & Pipelines', allowed: false, icon: 'plug' }];