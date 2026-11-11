import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Crown, Zap } from 'lucide-react';
import { usePlanStore, isPlanTrialRoute } from '../../store/planStore';
import { useAuthStore } from '../../store/authStore';
import { getDashboardPath } from '../../utils/roleUtils';
import { toast } from 'sonner';

export const PlanToggle = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuthStore();
  const { currentPlan, setPlan } = usePlanStore();

  const handleSelect = (plan) => {
    if (plan === currentPlan) return;
    setPlan(plan);
    toast.success(
      plan === 'PRO'
        ? 'Switched to Pro Pack (Full Enterprise Access)'
        : 'Switched to Free Trial Pack (Limber Lithe)'
    );

    const onTrialRoute = isPlanTrialRoute(location.pathname);
    if (plan === 'TRIAL' && !onTrialRoute) {
      navigate('/dashboard');
    } else if (plan === 'PRO' && onTrialRoute) {
      navigate(getDashboardPath(currentUser?.role));
    }
  };

  return (
    <div className="flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200/90 shadow-inner">
      <button
        type="button"
        onClick={() => handleSelect('TRIAL')}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          currentPlan === 'TRIAL'
            ? 'bg-white text-teal-700 shadow-xs border border-teal-200/60 font-black'
            : 'text-slate-500 hover:text-slate-800'
        }`}
        title="Switch to Free Trial Demo Mode"
      >
        <Zap className="w-3.5 h-3.5 text-teal-600 fill-teal-600/30" />
        <span>Free Trial</span>
      </button>

      <button
        type="button"
        onClick={() => handleSelect('PRO')}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          currentPlan === 'PRO'
            ? 'bg-slate-900 text-white shadow-xs font-black'
            : 'text-slate-500 hover:text-slate-800'
        }`}
        title="Switch to Pro Enterprise Mode"
      >
        <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400/40" />
        <span>Pro Pack</span>
      </button>
    </div>
  );
};