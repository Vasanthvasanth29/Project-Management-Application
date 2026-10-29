import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Sparkles } from 'lucide-react';
/** Upgrade prompt shown in place of a premium feature for 7-Day Limited Trial accounts. */
export const TrialLockedPanel = ({ feature }) => (<div className="card p-8 sm:p-10 text-center">
    <div className="w-14 h-14 mx-auto rounded-2xl bg-[#fef3c7] border border-[#fcd34d] flex items-center justify-center">
      <Lock className="w-6 h-6 text-[#b45309]" aria-hidden="true"/>
    </div>
    <h2 className="mt-4 text-lg font-bold text-[#1a1d23]">
      {feature ? `${feature} is a premium feature` : 'This is a premium feature'}
    </h2>
    <p className="mt-2 text-sm text-[#6b7280] max-w-md mx-auto">
      It isn't included in the 7-Day Limited Trial. Compare plans to see what unlocks it.
    </p>
    <Link to="/pricing" className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#0d9488] hover:bg-[#0f766e] transition-colors">
      <Sparkles className="w-4 h-4" aria-hidden="true"/>
      View Plans
    </Link>
  </div>);
export default TrialLockedPanel;
