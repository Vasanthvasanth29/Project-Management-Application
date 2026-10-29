import React, { useEffect, useId, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Construction, Minus, Plus, Users } from 'lucide-react';
import { site, memberLimits, memberPresets, clampMembers, normalizeMembers, estimateMembership, formatAmount, payments, } from '../../config/siteConfig';
export const MemberPricingSection = ({ id = 'pricing', heading = 'Pricing that scales with your team', supportingText = 'Tell us how many members you need — the estimated total updates instantly. The price is always the per-member rate multiplied by your seat count.', }) => {
    const uid = useId().replace(/:/g, '');
    const [searchParams, setSearchParams] = useSearchParams();
    const [members, setMembers] = useState(() => normalizeMembers(searchParams.get('members')));
    const [memberInput, setMemberInput] = useState(() => String(members));
    const [inputError, setInputError] = useState(null);
    const estimate = estimateMembership(members);
    const confirmed = estimate.confirmed;
    // Keep the selection in the URL (replace, no history spam) so the chosen
    // member count survives navigation to checkout and page reloads.
    useEffect(() => {
        if (searchParams.get('members') === String(members))
            return;
        const next = new URLSearchParams(searchParams);
        next.set('members', String(members));
        setSearchParams(next, { replace: true });
    }, [members, searchParams, setSearchParams]);
    const applyMembers = (value) => {
        const clamped = clampMembers(value);
        setMembers(clamped);
        setMemberInput(String(clamped));
        setInputError(null);
    };
    const handleInput = (raw) => {
        setMemberInput(raw);
        if (raw.trim() === '') {
            setInputError(`Enter the number of team members (${memberLimits.min}–${memberLimits.max}).`);
            return;
        }
        const parsed = Number.parseInt(raw, 10);
        if (Number.isNaN(parsed)) {
            setInputError('Enter a valid number of members.');
            return;
        }
        if (parsed < memberLimits.min) {
            setInputError(`Minimum is ${memberLimits.min.toLocaleString('en-US')} members.`);
            return;
        }
        if (parsed > memberLimits.max) {
            setInputError(`Maximum is ${memberLimits.max.toLocaleString('en-US')} members.`);
            return;
        }
        setInputError(null);
        setMembers(parsed);
    };
    const handleBlur = () => {
        const parsed = Number.parseInt(memberInput, 10);
        applyMembers(Number.isNaN(parsed) ? members : parsed);
    };
    const checkoutHref = `/checkout?members=${members}`;
    return (<section id={id} className="py-16 sm:py-24 scroll-mt-20 bg-[#f8fafc] border-y border-[#e2e5ea]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0d9488]">
            Pricing
          </span>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight">
            {heading}
          </h2>
          <p className="mt-3 text-[#4b5563] leading-relaxed">{supportingText}</p>
        </div>

        {!confirmed && (<div className="mb-8 max-w-3xl mx-auto flex items-start gap-3 rounded-2xl border border-[#fde68a] bg-[#fffbeb] px-4 py-3.5 text-left" role="status">
            <Construction className="w-5 h-5 text-[#b45309] flex-shrink-0 mt-0.5" aria-hidden="true"/>
            <p className="text-sm text-[#92400e] leading-relaxed">
              <span className="font-bold">Preview pricing — not an approved offer.</span> The
              per-member rate below is a placeholder pending business confirmation. Final prices
              are published here once they are approved.
            </p>
          </div>)}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* ---------------- Member count selector ---------------- */}
          <div className="lg:col-span-3 card p-5 sm:p-7">
            <div>
              <label htmlFor={`${uid}-members`} className="block text-base font-bold text-[#1a1d23] tracking-tight">
                How many team members do you need?
              </label>
              <p className="mt-1 text-sm text-[#4b5563]">
                Choose between {memberLimits.min.toLocaleString('en-US')} and{' '}
                {memberLimits.max.toLocaleString('en-US')} members — the estimate updates as you
                type or drag.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <button type="button" className="w-10 h-10 rounded-xl border border-[#e2e5ea] bg-white text-[#4b5563] hover:border-[#0d9488] hover:text-[#0f766e] inline-flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30" aria-label="Remove one member" onClick={() => applyMembers(members - 1)} disabled={members <= memberLimits.min}>
                    <Minus className="w-4 h-4"/>
                  </button>
                  <input id={`${uid}-members`} type="number" inputMode="numeric" min={memberLimits.min} max={memberLimits.max} step={1} value={memberInput} onChange={(event) => handleInput(event.target.value)} onBlur={handleBlur} aria-describedby={inputError ? `${uid}-members-error` : `${uid}-members-help`} aria-invalid={inputError ? true : undefined} className="input w-28 text-center text-lg font-extrabold py-2.5"/>
                  <button type="button" className="w-10 h-10 rounded-xl border border-[#e2e5ea] bg-white text-[#4b5563] hover:border-[#0d9488] hover:text-[#0f766e] inline-flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30" aria-label="Add one member" onClick={() => applyMembers(members + 1)} disabled={members >= memberLimits.max}>
                    <Plus className="w-4 h-4"/>
                  </button>
                  <span className="text-sm font-semibold text-[#4b5563]">members</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {memberPresets.map((preset) => (<button key={preset} type="button" aria-pressed={members === preset} onClick={() => applyMembers(preset)} className={`btn-xs border transition-colors ${members === preset
                ? 'border-[#0d9488] bg-[#ccfbf1] text-[#0f766e] font-bold'
                : 'border-[#e2e5ea] bg-white text-[#4b5563] hover:border-[#cbd5e1]'}`}>
                      {preset}
                    </button>))}
                </div>
              </div>

              {inputError ? (<p id={`${uid}-members-error`} role="alert" className="mt-2.5 text-sm font-semibold text-[#b91c1c]">
                  {inputError}
                </p>) : null}

              <input type="range" min={memberLimits.min} max={memberLimits.max} step={1} value={members} onChange={(event) => applyMembers(Number(event.target.value))} aria-label="Number of team members" aria-valuemin={memberLimits.min} aria-valuemax={memberLimits.max} aria-valuenow={members} aria-valuetext={`${members} members`} className="mt-5 w-full accent-[#0d9488] cursor-pointer"/>
              <div className="mt-1.5 flex items-center justify-between text-xs text-[#9ca3af]">
                <span>{memberLimits.min.toLocaleString('en-US')} members</span>
                <span>{memberLimits.max.toLocaleString('en-US')} members</span>
              </div>
              <p id={`${uid}-members-help`} className="sr-only">
                Enter the number of members to include in your workspace, from{' '}
                {memberLimits.min} to {memberLimits.max}.
              </p>
            </div>

            <div className="divider"/>

            {/* ---------------- Billing period ---------------- */}
            <div>
              <span className="input-label">Billing period</span>
              <p className="text-sm text-[#4b5563]">
                <span className="font-semibold text-[#1a1d23]">Monthly billing.</span> Annual
                billing will be offered here once both billing periods are confirmed by the
                business — no annual price is shown before then.
              </p>
            </div>

            <div className="divider"/>

            <div className="rounded-xl border border-[#e2e5ea] bg-[#f8fafc] px-4 py-3.5">
              <p className="text-sm text-[#4b5563] leading-relaxed">
                <span className="font-bold text-[#1a1d23]">Seat limits:</span> the calculator
                supports {memberLimits.min.toLocaleString('en-US')}–
                {memberLimits.max.toLocaleString('en-US')} members. Project, storage and support
                limits are confirmed with the business before launch.
              </p>
            </div>
          </div>

          {/* ---------------- Live estimate summary ---------------- */}
          <aside className="lg:col-span-2" aria-labelledby={`${uid}-summary-heading`}>
            <div className="rounded-2xl border border-[#1e293b] p-5 sm:p-6 lg:sticky lg:top-24 shadow-fe-xl" style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)' }}>
              <div className="flex items-center justify-between gap-3">
                <h3 id={`${uid}-summary-heading`} className="text-xs font-bold uppercase tracking-wider text-[#5eead4]">
                  Estimated monthly total
                </h3>
                <span className={`badge text-[10px] ${confirmed ? 'badge-green' : 'badge-amber'}`}>
                  {confirmed ? 'Approved price' : 'Preview estimate'}
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-2 flex-wrap">
                <span className="text-4xl font-extrabold tracking-tight text-white">
                  {formatAmount(estimate.monthlyTotal)}
                </span>
                <span className="text-sm font-semibold text-slate-300">/ month</span>
              </div>
              <p className="mt-1.5 text-sm text-slate-400">
                {formatAmount(estimate.pricePerMemberMonthly)} per member / month ×{' '}
                {estimate.members} members
              </p>

              <dl className="mt-5 space-y-2.5 text-sm border-t border-white/10 pt-4">
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-slate-400">Members</dt>
                  <dd className="font-semibold text-white text-right">{estimate.members}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-slate-400">Price per member</dt>
                  <dd className="font-semibold text-white text-right">
                    {formatAmount(estimate.pricePerMemberMonthly)} / month
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-slate-400">Billing</dt>
                  <dd className="font-semibold text-white text-right">Billed monthly</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-slate-400">Annual billing</dt>
                  <dd className="font-semibold text-white text-right">Not yet available</dd>
                </div>
              </dl>

              <div className="mt-4 rounded-xl bg-white/5 border border-white/10 px-3.5 py-3 flex items-start gap-2.5">
                <Users className="w-4 h-4 text-[#5eead4] flex-shrink-0 mt-0.5" aria-hidden="true"/>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {site.name} pricing is member-based — change the seat count and this total
                  recalculates immediately.
                </p>
              </div>

              <Link to={checkoutHref} className="btn-lg w-full mt-5 justify-center bg-[#0d9488] text-white hover:bg-[#0f766e] font-bold inline-flex items-center gap-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#2dd4bf] focus:ring-offset-2 focus:ring-offset-[#0f172a]">
                Continue
                <ArrowRight className="w-4 h-4"/>
              </Link>

              <p className="mt-3 text-xs text-slate-400 leading-relaxed text-center">
                {confirmed
            ? 'No payment is taken until checkout is activated.'
            : 'Estimated from a preview rate — not a confirmed commercial price.'}
              </p>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed text-center">
                {payments.notice}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>);
};
export default MemberPricingSection;
