import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getDashboardPath } from '../utils/roleUtils';
import { isTrialUser, TRIAL_HOME_PATH } from '../utils/trialAccess';

const TRIAL_ROUTE_PREFIXES = ['/dashboard', '/projects', '/tasks', '/iterations', '/reports', '/help', '/upgrade'];

export const isPlanTrialRoute = (pathname = '') =>
  TRIAL_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

export const getPlanHomePath = (user, plan) => {
  if (!user) return '/login';
  if (isTrialUser(user)) return TRIAL_HOME_PATH;
  return plan === 'TRIAL' ? '/dashboard' : getDashboardPath(user.role);
};

export const usePlanStore = create()(
  persist(
    (set, get) => ({
      currentPlan: 'PRO',
      setPlan: (plan) => set({ currentPlan: plan }),
      togglePlan: () =>
      set((state) => ({ currentPlan: state.currentPlan === 'PRO' ? 'TRIAL' : 'PRO' })),
      isTrial: () => get().currentPlan === 'TRIAL',
      isPro: () => get().currentPlan === 'PRO'
    }),
    {
      name: 'flowexec-plan-mode'
    }
  )
);