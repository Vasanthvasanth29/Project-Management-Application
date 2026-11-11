import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, Check, Crown, Zap, Shield, Sparkles } from 'lucide-react';
import { usePlanStore, isPlanTrialRoute } from '../../store/planStore';
import { useAuthStore } from '../../store/authStore';
import { getDashboardPath } from '../../utils/roleUtils';
import { toast } from 'sonner';

export const UpgradeModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [upgraded, setUpgraded] = useState(false);
  const { setPlan } = usePlanStore();

  const handleActivate = () => {
    setUpgraded(true);
    setPlan('PRO');
    toast.success('Welcome to Pro Pack! All enterprise features are unlocked.');
  };

  const handleContinue = () => {
    setUpgraded(false);
    onClose();
    if (isPlanTrialRoute(location.pathname)) {
      navigate(getDashboardPath(currentUser?.role));
    }
  };

  if (!isOpen) return null;

  return /*#__PURE__*/createPortal(/*#__PURE__*/
    React.createElement("div", {
      className: "fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200",
      onClick: onClose }, /*#__PURE__*/

    React.createElement("div", {
      className: "relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200",
      onClick: (e) => e.stopPropagation() }, /*#__PURE__*/


    React.createElement("div", { className: "flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/70 shrink-0" }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2.5" }, /*#__PURE__*/
    React.createElement("div", { className: "w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-2xs" }, /*#__PURE__*/
    React.createElement(Crown, { className: "w-5 h-5 fill-amber-500/30" })
    ), /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("h2", { className: "text-lg font-black text-slate-900 tracking-tight font-display" }, "Upgrade Your Limber Lithe Plan"), /*#__PURE__*/
    React.createElement("p", { className: "text-xs text-slate-500 mt-0.5" }, "Unlock unlimited projects, team members, custom fields & analytics.")
    )
    ), /*#__PURE__*/
    React.createElement("button", {
      onClick: onClose,
      className: "p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer",
      "aria-label": "Close upgrade modal" }, /*#__PURE__*/

    React.createElement(X, { className: "w-5 h-5" })
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "p-6 space-y-6 overflow-y-auto flex-1 scrollbar-thin" },
    upgraded ? /*#__PURE__*/
    React.createElement("div", { className: "text-center py-8 space-y-3" }, /*#__PURE__*/
    React.createElement("div", { className: "w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center" }, /*#__PURE__*/
    React.createElement(Check, { className: "w-8 h-8" })
    ), /*#__PURE__*/
    React.createElement("h3", { className: "text-xl font-black text-slate-900" }, "Welcome to Limber Lithe Pro!"), /*#__PURE__*/
    React.createElement("p", { className: "text-sm text-slate-600 max-w-md mx-auto" }, "Your trial has been upgraded to the Pro Pack. Unlimited projects, custom fields, and team features are now active."

    ), /*#__PURE__*/
    React.createElement("button", {
      onClick: handleContinue,
      className: "mt-4 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm cursor-pointer shadow-md" },
    "Continue to Dashboard"

    )
    ) : /*#__PURE__*/

    React.createElement(React.Fragment, null, /*#__PURE__*/

    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" }, /*#__PURE__*/

    React.createElement("div", {
      onClick: () => setSelectedPlan('pro'),
      className: `relative p-5 rounded-2xl border-2 transition-all cursor-pointer ${
      selectedPlan === 'pro' ?
      'border-teal-500 bg-teal-50/20 shadow-md ring-2 ring-teal-500/20' :
      'border-slate-200 hover:border-slate-300 bg-white'}` }, /*#__PURE__*/


    React.createElement("div", { className: "absolute top-4 right-4" }, /*#__PURE__*/
    React.createElement("span", { className: "bg-teal-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider" }, "Popular"

    )
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-2 mb-2" }, /*#__PURE__*/
    React.createElement(Zap, { className: "w-5 h-5 text-teal-600" }), /*#__PURE__*/
    React.createElement("h3", { className: "text-base font-black text-slate-900" }, "Pro Pack")
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex items-baseline gap-1 my-3" }, /*#__PURE__*/
    React.createElement("span", { className: "text-3xl font-black text-slate-900" }, "$12"), /*#__PURE__*/
    React.createElement("span", { className: "text-xs text-slate-500 font-semibold" }, "/ user / month")
    ), /*#__PURE__*/
    React.createElement("p", { className: "text-xs text-slate-600 mb-4" }, "Best for growing engineering teams and product managers who need full agile flow."

    ), /*#__PURE__*/
    React.createElement("ul", { className: "space-y-2 text-xs text-slate-700" }, /*#__PURE__*/
    React.createElement("li", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement(Check, { className: "w-4 h-4 text-emerald-600 shrink-0" }), /*#__PURE__*/
    React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Unlimited"), " projects & tasks")
    ), /*#__PURE__*/
    React.createElement("li", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement(Check, { className: "w-4 h-4 text-emerald-600 shrink-0" }), /*#__PURE__*/
    React.createElement("span", null, "Custom Fields & Form builder")
    ), /*#__PURE__*/
    React.createElement("li", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement(Check, { className: "w-4 h-4 text-emerald-600 shrink-0" }), /*#__PURE__*/
    React.createElement("span", null, "Full Sprints, Backlogs & Velocity")
    ), /*#__PURE__*/
    React.createElement("li", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement(Check, { className: "w-4 h-4 text-emerald-600 shrink-0" }), /*#__PURE__*/
    React.createElement("span", null, "Portfolio Initiatives & Roadmaps")
    ), /*#__PURE__*/
    React.createElement("li", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement(Check, { className: "w-4 h-4 text-emerald-600 shrink-0" }), /*#__PURE__*/
    React.createElement("span", null, "Export reports (PDF & CSV)")
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", {
      onClick: () => setSelectedPlan('enterprise'),
      className: `relative p-5 rounded-2xl border-2 transition-all cursor-pointer ${
      selectedPlan === 'enterprise' ?
      'border-indigo-600 bg-indigo-50/20 shadow-md ring-2 ring-indigo-500/20' :
      'border-slate-200 hover:border-slate-300 bg-white'}` }, /*#__PURE__*/


    React.createElement("div", { className: "flex items-center gap-2 mb-2" }, /*#__PURE__*/
    React.createElement(Shield, { className: "w-5 h-5 text-indigo-600" }), /*#__PURE__*/
    React.createElement("h3", { className: "text-base font-black text-slate-900" }, "Enterprise")
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex items-baseline gap-1 my-3" }, /*#__PURE__*/
    React.createElement("span", { className: "text-3xl font-black text-slate-900" }, "$29"), /*#__PURE__*/
    React.createElement("span", { className: "text-xs text-slate-500 font-semibold" }, "/ user / month")
    ), /*#__PURE__*/
    React.createElement("p", { className: "text-xs text-slate-600 mb-4" }, "For multi-team organizations requiring enterprise security, SSO, and audit compliance."

    ), /*#__PURE__*/
    React.createElement("ul", { className: "space-y-2 text-xs text-slate-700" }, /*#__PURE__*/
    React.createElement("li", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement(Check, { className: "w-4 h-4 text-indigo-600 shrink-0" }), /*#__PURE__*/
    React.createElement("span", null, "Everything in Pro Pack")
    ), /*#__PURE__*/
    React.createElement("li", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement(Check, { className: "w-4 h-4 text-indigo-600 shrink-0" }), /*#__PURE__*/
    React.createElement("span", null, "SSO / SAML / Okta & Active Directory")
    ), /*#__PURE__*/
    React.createElement("li", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement(Check, { className: "w-4 h-4 text-indigo-600 shrink-0" }), /*#__PURE__*/
    React.createElement("span", null, "Jenkins & GitLab CI/CD Webhooks")
    ), /*#__PURE__*/
    React.createElement("li", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement(Check, { className: "w-4 h-4 text-indigo-600 shrink-0" }), /*#__PURE__*/
    React.createElement("span", null, "Audit Logs & Compliance exports")
    ), /*#__PURE__*/
    React.createElement("li", { className: "flex items-center gap-2" }, /*#__PURE__*/
    React.createElement(Check, { className: "w-4 h-4 text-indigo-600 shrink-0" }), /*#__PURE__*/
    React.createElement("span", null, "Dedicated Account Manager & 99.9% SLA")
    )
    )
    )
    ), /*#__PURE__*/


    React.createElement("div", { className: "flex items-center justify-between pt-4 border-t border-slate-100" }, /*#__PURE__*/
    React.createElement("button", {
      onClick: onClose,
      className: "px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer" },
    "Cancel"

    ), /*#__PURE__*/
    React.createElement("button", {
      onClick: handleActivate,
      className: "px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs transition-all flex items-center gap-2 shadow-sm cursor-pointer" }, /*#__PURE__*/

    React.createElement(Sparkles, { className: "w-4 h-4" }), /*#__PURE__*/
    React.createElement("span", null, "Activate ", selectedPlan === 'pro' ? 'Pro Pack' : 'Enterprise Pack', " Now")
    )
    )
    )

    )
    )
    ),
    document.body
  );
};